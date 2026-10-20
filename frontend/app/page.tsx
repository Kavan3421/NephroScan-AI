"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Activity,
  Upload,
  Download,
  Copy,
  Check,
  ChevronDown,
  Loader2,
  FileText,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  RefreshCw,
  AlertCircle,
  Inbox,
} from "lucide-react";
import {
  predictCTScan,
  getPredictionHistory,
  deleteHistoryItem,
  batchDeleteHistoryItems,
  clearAllHistory,
  PredictionResult,
} from "@/lib/api";

type PathologyClass = "Normal" | "Cyst" | "Stone" | "Tumor";

interface SessionAuditRecord {
  id: string;
  timestamp: string;
  filename: string;
  finding: PathologyClass;
  findingLabel: string;
  confidence: number;
  imageUrl: string;
  status: "Verified" | "Archived" | "Pending Review";
}

const SAMPLE_PRESETS: Record<
  PathologyClass,
  {
    name: string;
    label: string;
    image: string;
    filename: string;
    defaultConfidence: number;
    probabilities: Record<PathologyClass, number>;
    impression: string;
  }
> = {
  Stone: {
    name: "Nephrolithiasis",
    label: "Nephrolithiasis (Kidney Stone)",
    image: "/samples/sample_stone.jpg",
    filename: "CT_AXIAL_CALCULUS_082.DCM",
    defaultConfidence: 98.4,
    probabilities: {
      Normal: 0.6,
      Cyst: 0.8,
      Stone: 98.4,
      Tumor: 0.2,
    },
    impression:
      "Well-defined hyperdense calculus identified in the middle renal collecting system. No secondary hydronephrosis or perinephric stranding observed on this single axial slice. Recommend clinical correlation with renal colic symptoms.",
  },
  Normal: {
    name: "Normal Renal Anatomy",
    label: "Normal Kidney Parenchyma",
    image: "/samples/sample_normal.jpg",
    filename: "CT_AXIAL_HEALTHY_014.DCM",
    defaultConfidence: 99.1,
    probabilities: {
      Normal: 99.1,
      Cyst: 0.4,
      Stone: 0.3,
      Tumor: 0.2,
    },
    impression:
      "Bilateral renal parenchyma demonstrates uniform cortical thickness, smooth contours, and normal attenuation. No calculi, focal parenchymal lesions, or hydronephrosis identified. Unremarkable diagnostic screening.",
  },
  Cyst: {
    name: "Renal Cyst",
    label: "Benign Renal Cyst",
    image: "/samples/sample_cyst.jpg",
    filename: "CT_AXIAL_CYST_053.DCM",
    defaultConfidence: 96.7,
    probabilities: {
      Normal: 1.8,
      Cyst: 96.7,
      Stone: 0.9,
      Tumor: 0.6,
    },
    impression:
      "Circumscribed thin-walled hypodense lesion (attenuation < 15 HU) in the renal cortex adhering to Bosniak Category I benign criteria. No septations, mural nodularity, or calcifications present.",
  },
  Tumor: {
    name: "Renal Cell Carcinoma",
    label: "Renal Cell Carcinoma (Tumor)",
    image: "/samples/sample_tumor.jpg",
    filename: "CT_AXIAL_MASS_099.DCM",
    defaultConfidence: 97.8,
    probabilities: {
      Normal: 0.8,
      Cyst: 1.1,
      Stone: 0.3,
      Tumor: 97.8,
    },
    impression:
      "Heterogeneously attenuating exophytic cortical mass with irregular contours identified. Suggestive of primary renal cell carcinoma. Multiphase contrast-enhanced abdominal CT and multidisciplinary urologic oncology staging recommended.",
  },
};

export default function RadiologyWorkstation() {
  // Empty initial state without mock defaults
  const [activePreset, setActivePreset] = useState<string>("");
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Findings State (starts empty until analysis or preset selection)
  const [finding, setFinding] = useState<PathologyClass | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [probabilities, setProbabilities] = useState<Record<PathologyClass, number>>({
    Normal: 0,
    Cyst: 0,
    Stone: 0,
    Tumor: 0,
  });
  const [impression, setImpression] = useState<string>(
    "Awaiting CT scan slice input. Upload an axial CT image or select a benchmark demo to execute deep learning diagnostic inference."
  );

  // Bottom Session Audit Log Records (starts empty, only loads real database scans)
  const [auditRecords, setAuditRecords] = useState<SessionAuditRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  // Fetch persisted history from backend
  const fetchPersistedHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const res = await getPredictionHistory(0, 50);
      if (res && Array.isArray(res.items)) {
        const mapped: SessionAuditRecord[] = res.items.map((item) => ({
          id: item.scan_id,
          timestamp: item.created_at ? item.created_at.substring(11, 19) : "12:00:00",
          filename: item.filename || "SCAN_SLICE.DCM",
          finding: (item.predicted_class as PathologyClass) || "Normal",
          findingLabel:
            item.predicted_class === "Normal"
              ? "Normal Kidney Parenchyma"
              : item.predicted_class === "Cyst"
              ? "Benign Renal Cyst"
              : item.predicted_class === "Stone"
              ? "Nephrolithiasis (Kidney Stone)"
              : "Renal Cell Carcinoma (Tumor)",
          confidence: Number(item.confidence.toFixed(1)),
          imageUrl:
            item.image_base64_thumbnail ||
            item.thumbnail_b64 ||
            (item.predicted_class === "Normal"
              ? "/samples/sample_normal.jpg"
              : item.predicted_class === "Cyst"
              ? "/samples/sample_cyst.jpg"
              : item.predicted_class === "Stone"
              ? "/samples/sample_stone.jpg"
              : "/samples/sample_tumor.jpg"),
          status: item.predicted_class === "Tumor" ? "Pending Review" : "Verified",
        }));
        setAuditRecords(mapped);
      } else {
        setAuditRecords([]);
      }
    } catch (e) {
      console.warn("Could not load backend history:", e);
      setAuditRecords([]);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersistedHistory();
  }, [fetchPersistedHistory]);

  // Selection Handlers ("select" / "select all")
  const isAllSelected = auditRecords.length > 0 && selectedIds.length === auditRecords.length;

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(auditRecords.map((r) => r.id));
    }
  };

  // Delete Handlers
  const handleDeleteSingle = async (id: string) => {
    await deleteHistoryItem(id);
    setAuditRecords((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    await batchDeleteHistoryItems(selectedIds);
    setAuditRecords((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
    setSelectedIds([]);
  };

  const handleClearAll = async () => {
    if (confirm("Are you sure you want to delete all historical session records?")) {
      await clearAllHistory();
      setAuditRecords([]);
      setSelectedIds([]);
    }
  };

  // Handle Preset Dropdown Selection
  const handleSelectPreset = (key: string) => {
    setActivePreset(key);
    if (!key) {
      setCurrentImage(null);
      setCurrentFilename("");
      setUploadedFile(null);
      setFinding(null);
      setConfidence(0);
      setProbabilities({ Normal: 0, Cyst: 0, Stone: 0, Tumor: 0 });
      setImpression("Awaiting CT scan slice input. Upload an axial CT image or select a benchmark demo.");
      return;
    }

    const cls = key as PathologyClass;
    const target = SAMPLE_PRESETS[cls];
    if (target) {
      setCurrentImage(target.image);
      setCurrentFilename(target.filename);
      setUploadedFile(null);
      setFinding(cls);
      setConfidence(target.defaultConfidence);
      setProbabilities(target.probabilities);
      setImpression(target.impression);
      setLatencyMs(180);
    }
  };

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setCurrentFilename(file.name);
      setActivePreset("");
      setCurrentImage(URL.createObjectURL(file));
      // Reset findings to awaiting state until user runs inference
      setFinding(null);
      setConfidence(0);
      setProbabilities({ Normal: 0, Cyst: 0, Stone: 0, Tumor: 0 });
      setImpression("Slice loaded. Click 'Run Diagnostic Analysis' to execute neural inference.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file);
      setCurrentFilename(file.name);
      setActivePreset("");
      setCurrentImage(URL.createObjectURL(file));
      setFinding(null);
      setConfidence(0);
      setProbabilities({ Normal: 0, Cyst: 0, Stone: 0, Tumor: 0 });
      setImpression("Slice loaded. Click 'Run Diagnostic Analysis' to execute neural inference.");
    }
  };

  // Execute Neural Diagnostic Inference
  const handleRunInference = async () => {
    if (!currentImage) return;
    setIsAnalyzing(true);
    const startTime = performance.now();

    try {
      let fileToSend = uploadedFile;

      // If preset selected without custom file, fetch preset blob
      if (!fileToSend) {
        const res = await fetch(currentImage);
        const blob = await res.blob();
        fileToSend = new File([blob], currentFilename || "scan.jpg", { type: "image/jpeg" });
      }

      const result: PredictionResult = await predictCTScan(fileToSend);
      const measuredLatency = Math.round(performance.now() - startTime);
      setLatencyMs(result.inference_time_ms || measuredLatency);

      const predictedClass = (result.predicted_class as PathologyClass) || "Normal";
      setFinding(predictedClass);
      setConfidence(Number(result.confidence.toFixed(1)));

      const probs = result.probabilities || {};
      setProbabilities({
        Normal: Number((probs.Normal ?? 0).toFixed(1)),
        Cyst: Number((probs.Cyst ?? 0).toFixed(1)),
        Stone: Number((probs.Stone ?? 0).toFixed(1)),
        Tumor: Number((probs.Tumor ?? 0).toFixed(1)),
      });

      if (result.clinical_recommendation) {
        setImpression(result.clinical_recommendation);
      }

      // Add to session audit log
      const nowStr = new Date().toTimeString().split(" ")[0];
      const newRecord: SessionAuditRecord = {
        id: result.scan_id || `RAD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        timestamp: nowStr,
        filename: currentFilename || "SCAN_SLICE.DCM",
        finding: predictedClass,
        findingLabel:
          predictedClass === "Normal"
            ? "Normal Kidney Parenchyma"
            : predictedClass === "Cyst"
            ? "Benign Renal Cyst"
            : predictedClass === "Stone"
            ? "Nephrolithiasis (Kidney Stone)"
            : "Renal Cell Carcinoma (Tumor)",
        confidence: Number(result.confidence.toFixed(1)),
        imageUrl: currentImage,
        status: predictedClass === "Tumor" ? "Pending Review" : "Verified",
      };

      setAuditRecords((prev) => [newRecord, ...prev.slice(0, 49)]);
    } catch (err) {
      console.warn("Backend API unavailable:", err);
      const measuredLatency = Math.round(performance.now() - startTime);
      setLatencyMs(measuredLatency > 0 ? measuredLatency : 180);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy Report Action
  const handleCopyReport = () => {
    if (!finding) return;
    const text =
      `NEPHROSCAN AI - RADIOLOGIC REPORT\n` +
      `Scan: ${currentFilename}\n` +
      `Finding: ${finding} (${confidence}% confidence)\n` +
      `Impression: ${impression}\n` +
      `Runtime: ONNX FP32 CPU (~${latencyMs}ms)`;
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Badge Styling Helper
  const getSeverityBadge = (cls: PathologyClass | null) => {
    if (!cls) {
      return {
        pill: "bg-slate-800 text-slate-400 border border-white/10",
        barColor: "bg-slate-700",
        heading: "Awaiting CT Scan",
      };
    }

    switch (cls) {
      case "Normal":
        return {
          pill: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
          barColor: "bg-emerald-400",
          heading: "Normal Renal Architecture",
        };
      case "Cyst":
        return {
          pill: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
          barColor: "bg-amber-400",
          heading: "Renal Cyst Present",
        };
      case "Stone":
        return {
          pill: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
          barColor: "bg-amber-400",
          heading: "Nephrolithiasis Detected",
        };
      case "Tumor":
      default:
        return {
          pill: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
          barColor: "bg-rose-400",
          heading: "Renal Cell Carcinoma Suspected",
        };
    }
  };

  const severity = getSeverityBadge(finding);

  return (
    <div className="min-h-screen bg-[#0A0C10] text-slate-100 flex flex-col font-sans selection:bg-white selection:text-black overflow-x-hidden">
      {/* A. Header Bar */}
      <header className="border-b border-white/10 bg-[#0A0C10] px-3.5 sm:px-6 py-2.5 sm:py-0 sm:h-14 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-white text-black font-bold shrink-0">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                NephroScan AI
                <span className="hidden md:inline text-xs font-normal text-slate-400">
                  — Computed Tomography Diagnostic Engine
                </span>
              </h1>
            </div>
          </div>

          {/* Compact Engine Status on Small Mobile */}
          <div className="flex sm:hidden items-center gap-1.5 rounded-full border border-white/10 bg-[#12151D] px-2 py-0.5 text-[10px] text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-white">ONNX FP32</span>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
          {/* Runtime Status Pill (Visible sm+) */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-[#12151D] px-3 py-1 text-xs text-slate-300 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-400">
              Engine: <span className="text-white">ONNX FP32</span> • Latency:{" "}
              {latencyMs ? `~${latencyMs}ms` : "Ready"}
            </span>
          </div>

          {/* Integrated Sample Selector Dropdown */}
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <select
              value={activePreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full appearance-none bg-[#12151D] border border-white/10 text-xs text-white rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-white/30 cursor-pointer font-medium truncate"
            >
              <option value="">Select Demo CT Scan...</option>
              <option value="Stone">Demo: Nephrolithiasis (Stone)</option>
              <option value="Normal">Demo: Normal Kidney</option>
              <option value="Cyst">Demo: Renal Cyst</option>
              <option value="Tumor">Demo: Renal Cell Carcinoma</option>
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-3 sm:p-5 lg:p-6 flex flex-col gap-4 sm:gap-5 max-w-[1600px] w-full mx-auto">
        {/* 60/40 Split 2-Column Main Analytical Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          {/* B. Left Column: Radiologic CT Viewport (60% width -> 7 cols on 12-col grid) */}
          <div className="lg:col-span-7 bg-[#12151D] border border-white/10 rounded-xl p-3.5 sm:p-5 flex flex-col justify-between space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-500 uppercase truncate">
                AXIAL RADIOLOGIC VIEWPORT // DICOM
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 truncate max-w-[150px] sm:max-w-[280px]">
                {currentFilename || "NO SLICE SELECTED"}
              </span>
            </div>

            {/* Edge-to-Edge Pure Black Viewport Container */}
            <div className="bg-black rounded-xl border border-white/10 relative overflow-hidden flex items-center justify-center min-h-[260px] sm:min-h-[360px] lg:min-h-[440px] flex-1">
              {/* Four HUD Corner Overlays */}
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 text-[9px] sm:text-[10px] font-mono tracking-wider text-white/70 bg-black/60 px-1.5 sm:px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none z-10 max-w-[45%] truncate">
                {currentImage ? "AXIAL CT // LOADED" : "SERIES // STANDBY"}
              </div>
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 text-[9px] sm:text-[10px] font-mono tracking-wider text-white/70 bg-black/60 px-1.5 sm:px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none z-10 max-w-[45%] truncate text-right">
                {currentImage ? "W:400 L:50 // 32/64" : "STATUS: IDLE"}
              </div>
              <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 text-[9px] sm:text-[10px] font-mono tracking-wider text-white/70 bg-black/60 px-1.5 sm:px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none z-10">
                {currentImage ? "FOV: 224x224 mm" : "FOV: ---"}
              </div>
              <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-[9px] sm:text-[10px] font-mono tracking-wider text-white/70 bg-black/60 px-1.5 sm:px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none z-10">
                ZOOM: 100%
              </div>

              {/* CT Slice Canvas or Clean Standby Placeholder */}
              {currentImage ? (
                <img
                  src={currentImage}
                  alt="CT Slice"
                  className="max-h-[240px] sm:max-h-[340px] lg:max-h-[420px] max-w-full object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2.5 sm:gap-3 p-6 sm:p-8 text-center text-slate-500">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-slate-400">
                    <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-300">NO CT SLICE LOADED</div>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 max-w-xs">
                      Drop an axial CT image slice below or pick a demo benchmark from the header.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Input Controls */}
            <div className="space-y-2.5 sm:space-y-3">
              {/* Discreet Drag & Drop Target */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-lg py-2 sm:py-2.5 px-3 sm:px-4 text-center cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="flex items-center gap-2 truncate">
                  <Upload className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {currentFilename
                      ? `Selected: ${currentFilename}`
                      : "Drop CT slice or click to browse local file"}
                  </span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase self-end sm:self-auto shrink-0">
                  Matrix: 224x224 Native
                </span>
              </div>

              {/* Solid White Action Trigger Button */}
              <button
                type="button"
                onClick={handleRunInference}
                disabled={!currentImage || isAnalyzing}
                className="w-full bg-white text-black hover:bg-slate-200 font-semibold py-2.5 sm:py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs tracking-wider uppercase disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    <span>Processing Neural Inference...</span>
                  </>
                ) : !currentImage ? (
                  <>
                    <span>Load a CT Slice to Run Analysis</span>
                  </>
                ) : (
                  <>
                    <span>Run Diagnostic Analysis</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* C. Right Column: Clinical Differential & Findings Panel (40% width -> 5 cols on 12-col grid) */}
          <div className="lg:col-span-5 bg-[#12151D] border border-white/10 rounded-xl p-3.5 sm:p-5 flex flex-col justify-between space-y-4 sm:space-y-5">
            {/* Primary Assessment Card */}
            <div className="space-y-2.5 sm:space-y-3 border-b border-white/10 pb-3.5 sm:pb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                  PRIMARY RADIOLOGIC ASSESSMENT
                </span>
                <span className={`text-[10px] sm:text-[11px] font-semibold uppercase px-2 py-0.5 rounded shrink-0 ${severity.pill}`}>
                  {finding ? finding : "STANDBY"}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                  {severity.heading}
                </h2>
                <div className="text-right shrink-0">
                  <span className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-white">
                    {confidence > 0 ? `${confidence.toFixed(1)}%` : "---%"}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 block uppercase font-mono">
                    Certainty
                  </span>
                </div>
              </div>
            </div>

            {/* Differential Probability Spectrum */}
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                <span>DIFFERENTIAL PROBABILITY SPECTRUM</span>
                <span className="font-mono text-slate-500">4-CLASS SOFTMAX</span>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                {/* 1. Normal Kidney Parenchyma */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">1. Normal Kidney Parenchyma</span>
                    <span className="font-mono text-slate-400">
                      {probabilities.Normal > 0 ? `${probabilities.Normal.toFixed(1)}%` : "0.0%"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${probabilities.Normal}%` }}
                    />
                  </div>
                </div>

                {/* 2. Benign Renal Cyst */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">2. Benign Renal Cyst</span>
                    <span className="font-mono text-slate-400">
                      {probabilities.Cyst > 0 ? `${probabilities.Cyst.toFixed(1)}%` : "0.0%"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${probabilities.Cyst}%` }}
                    />
                  </div>
                </div>

                {/* 3. Nephrolithiasis (Kidney Stone) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">3. Nephrolithiasis (Kidney Stone)</span>
                    <span className="font-mono text-slate-400">
                      {probabilities.Stone > 0 ? `${probabilities.Stone.toFixed(1)}%` : "0.0%"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${probabilities.Stone}%` }}
                    />
                  </div>
                </div>

                {/* 4. Renal Cell Carcinoma (Tumor) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">4. Renal Cell Carcinoma (Tumor)</span>
                    <span className="font-mono text-slate-400">
                      {probabilities.Tumor > 0 ? `${probabilities.Tumor.toFixed(1)}%` : "0.0%"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded-full transition-all duration-500"
                      style={{ width: `${probabilities.Tumor}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Impression & Recommendations Box */}
            <div className="rounded-lg border border-white/10 bg-[#0A0C10] p-3 sm:p-4 space-y-1.5">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-500 uppercase block">
                CLINICAL IMPRESSION &amp; RECOMMENDATION
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {impression}
              </p>
            </div>

            {/* Reporting Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => window.print()}
                disabled={!finding}
                className="w-full border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 hover:text-white py-2 sm:py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Export PDF Summary</span>
              </button>

              <button
                type="button"
                onClick={handleCopyReport}
                disabled={!finding}
                className="w-full border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 hover:text-white py-2 sm:py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {copiedReport ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>Copy Report Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* D. Bottom Tray: Session Audit Log with Select, Select All, and Delete Controls */}
        <div className="bg-[#12151D] border border-white/10 rounded-xl p-3 sm:p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                SESSION AUDIT LOG
              </span>
              <span className="hidden sm:inline text-slate-600">// RECENT CT ACQUISITIONS</span>
              <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                {auditRecords.length} Sessions
              </span>
              {selectedIds.length > 0 && (
                <span className="text-[10px] sm:text-[11px] text-white font-mono bg-white/10 px-2 py-0.5 rounded border border-white/10">
                  {selectedIds.length} of {auditRecords.length} selected
                </span>
              )}
            </div>

            {/* Batch Action Toolbar: Select All, Delete Selected, Clear All */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                disabled={auditRecords.length === 0}
                className="text-[11px] sm:text-xs text-slate-300 hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] px-2 sm:px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                title={isAllSelected ? "Deselect all rows" : "Select all rows"}
              >
                {isAllSelected ? (
                  <>
                    <CheckSquare className="h-3.5 w-3.5 text-white" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <Square className="h-3.5 w-3.5 text-slate-400" />
                    <span>Select All</span>
                  </>
                )}
              </button>

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="text-[11px] sm:text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 px-2 sm:px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                  title="Delete all selected scans"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete ({selectedIds.length})</span>
                </button>
              )}

              {auditRecords.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] sm:text-xs text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 bg-white/[0.02] hover:bg-rose-500/10 px-2 sm:px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Wipe entire history"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              )}

              <button
                type="button"
                onClick={fetchPersistedHistory}
                disabled={isHistoryLoading}
                className="text-[11px] sm:text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] p-1.5 rounded transition-colors cursor-pointer"
                title="Refresh History from Database"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isHistoryLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Swipe indicator for mobile */}
          {auditRecords.length > 0 && (
            <div className="text-[10px] text-slate-500 sm:hidden flex items-center justify-between pb-1 font-mono">
              <span>← SWIPE TABLE HORIZONTALLY →</span>
              <span>{auditRecords.length} ROWS</span>
            </div>
          )}

          {/* Records Table with smooth horizontal scrolling inside container */}
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            {auditRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No session audit records found. Execute an inference to log diagnostic findings.
              </div>
            ) : (
              <table className="w-full min-w-[650px] text-left text-xs text-slate-300">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-mono uppercase text-slate-500 whitespace-nowrap">
                    <th className="py-2 px-2.5 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        className="rounded bg-black/50 border-white/20 text-white focus:ring-0 cursor-pointer h-3.5 w-3.5 accent-white"
                        title="Select/Deselect all rows"
                      />
                    </th>
                    <th className="py-2 px-2.5">Scan Identifier</th>
                    <th className="py-2 px-2.5">Acquisition Time</th>
                    <th className="py-2 px-2.5">Pathology Finding</th>
                    <th className="py-2 px-2.5">Certainty Score</th>
                    <th className="py-2 px-2.5">Session Status</th>
                    <th className="py-2 px-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditRecords.map((record) => {
                    const badge = getSeverityBadge(record.finding);
                    const isSelected = selectedIds.includes(record.id);

                    return (
                      <tr
                        key={record.id}
                        className={`transition-colors ${
                          isSelected ? "bg-white/[0.05]" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 px-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(record.id)}
                            className="rounded bg-black/50 border-white/20 text-white focus:ring-0 cursor-pointer h-3.5 w-3.5 accent-white"
                            title={`Select ${record.id}`}
                          />
                        </td>

                        {/* Scan ID & Thumbnail */}
                        <td className="py-2.5 px-2.5 font-mono text-white flex items-center gap-2">
                          <img
                            src={record.imageUrl}
                            alt="Thumbnail"
                            className="h-6 w-6 rounded object-cover border border-white/10 shrink-0"
                          />
                          <span className="truncate">{record.id}</span>
                        </td>

                        {/* Acquisition Time */}
                        <td className="py-2.5 px-2.5 font-mono text-slate-400">{record.timestamp}</td>

                        {/* Pathology Finding */}
                        <td className="py-2.5 px-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase inline-block whitespace-nowrap ${badge.pill}`}>
                            {record.findingLabel}
                          </span>
                        </td>

                        {/* Certainty Score */}
                        <td className="py-2.5 px-2.5 font-mono text-slate-200 font-semibold">
                          {record.confidence.toFixed(1)}%
                        </td>

                        {/* Session Status */}
                        <td className="py-2.5 px-2.5">
                          <span className="text-[10px] font-mono text-slate-400 border border-white/10 px-1.5 py-0.5 rounded bg-white/[0.02] inline-block whitespace-nowrap">
                            {record.status}
                          </span>
                        </td>

                        {/* Actions: Inspect & Delete Single */}
                        <td className="py-2.5 px-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentImage(record.imageUrl);
                                setCurrentFilename(record.filename);
                                setFinding(record.finding);
                                setConfidence(record.confidence);
                                const preset = SAMPLE_PRESETS[record.finding];
                                if (preset) {
                                  setProbabilities(preset.probabilities);
                                  setImpression(preset.impression);
                                }
                              }}
                              className="text-[11px] text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 p-1 rounded hover:bg-white/5 cursor-pointer"
                              title="Inspect slice in main viewport"
                            >
                              <Eye className="h-3 w-3" />
                              <span>Inspect</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSingle(record.id)}
                              className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors p-1 rounded hover:bg-white/5 cursor-pointer"
                              title={`Delete ${record.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
