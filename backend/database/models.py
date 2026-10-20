import datetime
import json
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from .database import Base


class PredictionRecord(Base):
    """Database model for storing CT scan AI inference logs and clinical metadata."""
    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scan_id = Column(String(64), unique=True, index=True, nullable=False)
    filename = Column(String(255), nullable=False)
    patient_id = Column(String(64), nullable=True, index=True)
    notes = Column(Text, nullable=True)

    # Diagnostic Outcomes
    predicted_class = Column(String(32), nullable=False, index=True)  # Cyst, Normal, Stone, Tumor
    confidence = Column(Float, nullable=False)                         # e.g., 98.45
    probabilities_json = Column(Text, nullable=False)                 # JSON string with all 4 classes
    risk_level = Column(String(32), nullable=False)                   # Normal, Low Risk, Moderate Risk, High Risk
    clinical_recommendation = Column(Text, nullable=True)

    # Metrics & Visual Assets
    inference_time_ms = Column(Float, nullable=False, default=0.0)
    image_base64_thumbnail = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    @property
    def probabilities(self) -> dict:
        try:
            return json.loads(self.probabilities_json)
        except Exception:
            return {}

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "scan_id": self.scan_id,
            "filename": self.filename,
            "patient_id": self.patient_id or "ANONYMOUS",
            "notes": self.notes or "",
            "predicted_class": self.predicted_class,
            "confidence": round(self.confidence, 2),
            "probabilities": self.probabilities,
            "risk_level": self.risk_level,
            "clinical_recommendation": self.clinical_recommendation or "",
            "inference_time_ms": round(self.inference_time_ms, 2),
            "image_base64_thumbnail": self.image_base64_thumbnail,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
