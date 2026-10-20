import os
import uuid
import json
import logging
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query, status
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from database.database import init_db, get_db
from database.models import PredictionRecord
from services.inference import inference_service, CLASSES

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("kidney_ai.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("Initializing Kidney Disease Detection AI Backend...")
    init_db()
    logger.info("Database schema initialized.")
    yield
    logger.info("Shutting down Kidney AI service.")


app = FastAPI(
    title="Kidney Disease AI Diagnostic API",
    description="Production-grade ONNX-powered ML backend for CT Kidney Scan classification (Normal, Cyst, Stone, Tumor).",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
frontend_url = os.getenv("FRONTEND_URL", "*")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://kidney-ai-platform.vercel.app",
]
if frontend_url != "*" and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if frontend_url == "*" else allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
def root_status():
    active_cls = getattr(inference_service, "active_classes", CLASSES)
    return {
        "service": "Kidney Disease AI Diagnostic API",
        "status": "online",
        "docs_url": "/docs",
        "model_loaded": inference_service.is_loaded,
        "classes": active_cls
    }


@app.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint monitored by Render, Docker, and frontend status indicators."""
    db_ok = True
    try:
        db.execute(func.now())
    except Exception:
        db_ok = False

    active_cls = getattr(inference_service, "active_classes", CLASSES)

    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "onnx_model_loaded": inference_service.is_loaded,
        "model_mode": "Production ONNX" if inference_service.is_loaded else "Simulated Development Fallback",
        "model_path": inference_service.model_path,
        "classes": active_cls,
        "runtime_ram_target": "<100MB"
    }


@app.post("/predict", tags=["Diagnostic Inference"])
async def predict_ct_scan(
    file: UploadFile = File(..., description="CT Scan slice image (JPEG/PNG/WEBP/DICOM slice)"),
    patient_id: Optional[str] = Form(None, description="Optional Patient MRN or Identifier"),
    notes: Optional[str] = Form(None, description="Optional clinical observations or user notes"),
    db: Session = Depends(get_db)
):
    """
    Accepts a CT scan image, executes ONNX inference, returns 4-class classification
    with confidence percentages, and saves prediction metadata to the database.
    """
    # 1. Validate file extension / MIME
    allowed_exts = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_exts and not (file.content_type and file.content_type.startswith("image/")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type '{file.content_type}'. Please upload an image file (PNG, JPG, JPEG, WEBP)."
        )

    # 2. Read image bytes
    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}"
        )

    # 3. Execute ONNX inference
    try:
        diagnosis = inference_service.predict(
            image_bytes,
            filename=file.filename or "",
            clinical_notes=notes or ""
        )
    except Exception as e:
        logger.error(f"Inference error on file '{file.filename}': {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference pipeline error: {str(e)}"
        )

    # 4. Generate unique scan identifier
    scan_id = f"SCAN-{uuid.uuid4().hex[:8].upper()}"

    # 5. Save to database
    try:
        record = PredictionRecord(
            scan_id=scan_id,
            filename=file.filename or "uploaded_scan.png",
            patient_id=patient_id.strip() if patient_id else None,
            notes=notes.strip() if notes else None,
            predicted_class=diagnosis["predicted_class"],
            confidence=diagnosis["confidence"],
            probabilities_json=json.dumps(diagnosis["probabilities"]),
            risk_level=diagnosis["risk_level"],
            clinical_recommendation=diagnosis["clinical_recommendation"],
            inference_time_ms=diagnosis["inference_time_ms"],
            image_base64_thumbnail=diagnosis.get("thumbnail_b64")
        )
        db.add(record)
        db.commit()
        db.refresh(record)
    except Exception as e:
        logger.error(f"Database logging failed: {str(e)}")
        db.rollback()
        # Non-fatal: still return prediction result even if DB write failed
        record = None

    response_payload = {
        "id": record.id if record else None,
        "scan_id": scan_id,
        "filename": file.filename,
        "patient_id": patient_id or "ANONYMOUS",
        "notes": notes or "",
        "predicted_class": diagnosis["predicted_class"],
        "confidence": diagnosis["confidence"],
        "probabilities": diagnosis["probabilities"],
        "risk_level": diagnosis["risk_level"],
        "clinical_recommendation": diagnosis["clinical_recommendation"],
        "inference_time_ms": diagnosis["inference_time_ms"],
        "image_dimensions": diagnosis.get("image_dimensions", "224x224"),
        "model_version": diagnosis.get("model_version"),
        "is_simulated": diagnosis.get("is_simulated", False),
        "created_at": record.created_at.isoformat() if record and record.created_at else None,
    }

    return JSONResponse(status_code=status.HTTP_200_OK, content=response_payload)


@app.get("/history", tags=["History"])
def get_prediction_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    predicted_class: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Fetches paginated list of historical CT scan diagnoses with optional filtering."""
    query = db.query(PredictionRecord)

    if predicted_class and predicted_class in CLASSES:
        query = query.filter(PredictionRecord.predicted_class == predicted_class)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (PredictionRecord.patient_id.ilike(search_filter)) |
            (PredictionRecord.scan_id.ilike(search_filter)) |
            (PredictionRecord.filename.ilike(search_filter)) |
            (PredictionRecord.notes.ilike(search_filter))
        )

    total_count = query.count()
    records = query.order_by(desc(PredictionRecord.created_at)).offset(skip).limit(limit).all()

    return {
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "items": [r.to_dict() for r in records]
    }


@app.get("/history/{scan_id}", tags=["History"])
def get_single_prediction(scan_id: str, db: Session = Depends(get_db)):
    """Retrieves full details for a specific diagnosis record."""
    record = db.query(PredictionRecord).filter(
        (PredictionRecord.scan_id == scan_id) | (PredictionRecord.id == int(scan_id) if scan_id.isdigit() else False)
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Prediction record not found.")

    return record.to_dict()


class BatchDeleteRequest(BaseModel):
    scan_ids: List[str]


@app.post("/history/batch-delete", tags=["History"])
def batch_delete_predictions(payload: BatchDeleteRequest, db: Session = Depends(get_db)):
    """Deletes multiple selected historical diagnosis records."""
    if not payload.scan_ids:
        return {"deleted": 0, "message": "No scan IDs provided."}

    count = db.query(PredictionRecord).filter(
        PredictionRecord.scan_id.in_(payload.scan_ids)
    ).delete(synchronize_session=False)
    db.commit()
    return {"deleted": count, "message": f"Successfully deleted {count} records."}


@app.delete("/history/all/clear", tags=["History"])
def clear_all_history(db: Session = Depends(get_db)):
    """Permanently deletes ALL historical diagnosis records."""
    count = db.query(PredictionRecord).delete(synchronize_session=False)
    db.commit()
    return {"deleted": count, "message": f"Successfully cleared all {count} records."}


@app.delete("/history/{scan_id}", tags=["History"])
def delete_prediction(scan_id: str, db: Session = Depends(get_db)):
    """Deletes a historical diagnosis record."""
    record = db.query(PredictionRecord).filter(
        (PredictionRecord.scan_id == scan_id) | (PredictionRecord.id == int(scan_id) if scan_id.isdigit() else False)
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Prediction record not found.")

    db.delete(record)
    db.commit()
    return {"message": f"Record {scan_id} successfully deleted."}


@app.get("/stats", tags=["Analytics"])
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Returns aggregated clinical metrics for dashboard overview cards."""
    total_scans = db.query(PredictionRecord).count()
    active_cls = getattr(inference_service, "active_classes", CLASSES)

    # Breakdown counts
    class_counts = {c: 0 for c in active_cls}
    rows = db.query(PredictionRecord.predicted_class, func.count(PredictionRecord.id)).group_by(
        PredictionRecord.predicted_class
    ).all()
    for class_name, cnt in rows:
        if class_name in class_counts:
            class_counts[class_name] = cnt

    # Average confidence
    avg_conf = db.query(func.avg(PredictionRecord.confidence)).scalar() or 0.0

    return {
        "total_scans": total_scans,
        "normal_count": class_counts.get("Normal", 0),
        "cyst_count": class_counts.get("Cyst", 0),
        "stone_count": class_counts.get("Stone", 0),
        "tumor_count": class_counts.get("Tumor", 0),
        "hydronephrosis_count": class_counts.get("Hydronephrosis", 0),
        "pkd_count": class_counts.get("Polycystic Disease", 0),
        "pyelonephritis_count": class_counts.get("Pyelonephritis", 0),
        "atrophy_count": class_counts.get("Renal Atrophy", 0),
        "class_breakdown": class_counts,
        "average_confidence": round(float(avg_conf), 2)
    }
