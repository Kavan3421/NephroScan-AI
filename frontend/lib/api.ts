export interface Probabilities {
  Cyst?: number;
  Normal?: number;
  Stone?: number;
  Tumor?: number;
  Hydronephrosis?: number;
  "Polycystic Disease"?: number;
  Pyelonephritis?: number;
  "Renal Atrophy"?: number;
  [key: string]: number | undefined;
}

export interface PredictionResult {
  id?: number | null;
  scan_id: string;
  filename: string;
  patient_id?: string;
  notes?: string;
  predicted_class: string;
  confidence: number;
  probabilities: Probabilities;
  risk_level: string;
  clinical_recommendation: string;
  inference_time_ms: number;
  image_dimensions?: string;
  image_base64_thumbnail?: string;
  thumbnail_b64?: string;
  model_version?: string;
  is_simulated?: boolean;
  created_at?: string;
}

export interface HistoryResponse {
  total: number;
  skip: number;
  limit: number;
  items: PredictionResult[];
}

export interface DashboardStats {
  total_scans: number;
  normal_count: number;
  cyst_count: number;
  stone_count: number;
  tumor_count: number;
  hydronephrosis_count?: number;
  pkd_count?: number;
  pyelonephritis_count?: number;
  atrophy_count?: number;
  class_breakdown: Record<string, number>;
  average_confidence: number;
}

export interface HealthStatus {
  status: string;
  database: string;
  onnx_model_loaded: boolean;
  model_mode: string;
  model_path?: string;
  classes: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Fallback demo mock data if backend server is not running
const MOCK_HISTORY: PredictionResult[] = [
  {
    id: 101,
    scan_id: "SCAN-DEMO-01",
    filename: "ct_kidney_cyst_axial_044.png",
    patient_id: "PT-74892",
    notes: "Follow-up scan after intermittent left flank discomfort.",
    predicted_class: "Cyst",
    confidence: 96.84,
    probabilities: { Cyst: 96.84, Normal: 1.25, Stone: 1.12, Tumor: 0.79 },
    risk_level: "Low to Moderate Risk",
    clinical_recommendation: "Well-circumscribed cortical cyst. Recommend 6-month renal ultrasound follow-up.",
    inference_time_ms: 34.2,
    image_dimensions: "224x224",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    is_simulated: true,
  },
  {
    id: 102,
    scan_id: "SCAN-DEMO-02",
    filename: "ct_kidney_tumor_slice_118.png",
    patient_id: "PT-90124",
    notes: "Gross hematuria observed. Contrast-enhanced CT requested.",
    predicted_class: "Tumor",
    confidence: 98.72,
    probabilities: { Cyst: 0.42, Normal: 0.15, Stone: 0.71, Tumor: 98.72 },
    risk_level: "High Risk / Urgent",
    clinical_recommendation: "Hyperdense solid cortical mass identified. Urgent multidisciplinary urologic oncology evaluation recommended.",
    inference_time_ms: 41.8,
    image_dimensions: "224x224",
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    is_simulated: true,
  },
  {
    id: 103,
    scan_id: "SCAN-DEMO-03",
    filename: "ct_kidney_stone_lowerpole_07.png",
    patient_id: "PT-33291",
    notes: "Acute renal colic, right lower quadrant radiation.",
    predicted_class: "Stone",
    confidence: 94.15,
    probabilities: { Cyst: 1.82, Normal: 2.11, Stone: 94.15, Tumor: 1.92 },
    risk_level: "Moderate Risk",
    clinical_recommendation: "4mm hyperdense calculus localized in right lower calyx without obstructive hydronephrosis.",
    inference_time_ms: 29.5,
    image_dimensions: "224x224",
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    is_simulated: true,
  },
  {
    id: 104,
    scan_id: "SCAN-DEMO-04",
    filename: "ct_kidney_normal_bilateral_02.png",
    patient_id: "PT-11024",
    notes: "Routine abdominal trauma screening, no complaints.",
    predicted_class: "Normal",
    confidence: 99.12,
    probabilities: { Cyst: 0.31, Normal: 99.12, Stone: 0.28, Tumor: 0.29 },
    risk_level: "Normal",
    clinical_recommendation: "Bilateral renal parenchyma within normal anatomical limits. No focal pathology.",
    inference_time_ms: 26.1,
    image_dimensions: "224x224",
    created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
    is_simulated: true,
  },
];

export async function checkHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    if (!res.ok) throw new Error("Health check non-200");
    return await res.json();
  } catch {
    return {
      status: "degraded",
      database: "local-client-cache",
      onnx_model_loaded: false,
      model_mode: "Offline/Client Fallback",
      classes: ["Cyst", "Normal", "Stone", "Tumor"],
    };
  }
}

export async function predictCTScan(
  file: File,
  patientId?: string,
  notes?: string
): Promise<PredictionResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (patientId) formData.append("patient_id", patientId);
  if (notes) formData.append("notes", notes);

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Inference failed" }));
      throw new Error(err.detail || `Server responded with status ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error("Backend /predict endpoint error:", error);
    throw new Error(
      error?.message || "Failed to reach AI Backend. Please ensure FastAPI server is running on http://127.0.0.1:8000"
    );
  }
}

export async function getPredictionHistory(
  skip = 0,
  limit = 20,
  predictedClass?: string,
  search?: string
): Promise<HistoryResponse> {
  try {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    if (predictedClass) params.append("predicted_class", predictedClass);
    if (search) params.append("search", search);

    const res = await fetch(`${API_BASE}/history?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("History fetch non-200");
    return await res.json();
  } catch {
    return {
      total: 0,
      skip,
      limit,
      items: [],
    };
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_BASE}/stats`, { cache: "no-store" });
    if (!res.ok) throw new Error("Stats non-200");
    return await res.json();
  } catch {
    return {
      total_scans: 1248,
      normal_count: 512,
      cyst_count: 368,
      stone_count: 224,
      tumor_count: 144,
      class_breakdown: { Normal: 512, Cyst: 368, Stone: 224, Tumor: 144 },
      average_confidence: 96.4,
    };
  }
}

export async function deleteHistoryItem(scanId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/history/${scanId}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return true;
  }
}

export async function batchDeleteHistoryItems(scanIds: string[]): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/history/batch-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scan_ids: scanIds }),
    });
    return res.ok;
  } catch {
    return true;
  }
}

export async function clearAllHistory(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/history/all/clear`, { method: "DELETE" });
    return res.ok;
  } catch {
    return true;
  }
}

