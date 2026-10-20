"use client";

import React, { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import MedicalHeader from "@/components/custom/MedicalHeader";
import MetricsOverview from "@/components/custom/MetricsOverview";
import CTUploadZone from "@/components/custom/CTUploadZone";
import DiagnosisResults from "@/components/custom/DiagnosisResults";
import PredictionHistoryTable from "@/components/custom/PredictionHistoryTable";
import MedicalReportModal from "@/components/custom/MedicalReportModal";
import {
  predictCTScan,
  getPredictionHistory,
  getDashboardStats,
  deleteHistoryItem,
  batchDeleteHistoryItems,
  clearAllHistory,
  checkHealth,
  PredictionResult,
  DashboardStats,
  HealthStatus,
} from "@/lib/api";
import { Activity, ShieldCheck, Database, GitBranch, Terminal, AlertCircle, Info } from "lucide-react";

export default function DiagnosticDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_scans: 0,
    normal_count: 0,
    cyst_count: 0,
    stone_count: 0,
    tumor_count: 0,
    class_breakdown: {},
    average_confidence: 0,
  });

  const [health, setHealth] = useState<HealthStatus>({
    status: "checking",
    database: "connecting",
    onnx_model_loaded: false,
    model_mode: "Initializing...",
    classes: [
      "Cyst",
      "Normal",
      "Stone",
      "Tumor",
      "Hydronephrosis",
      "Polycystic Disease",
      "Pyelonephritis",
      "Renal Atrophy"
    ],
  });

  const [currentResult, setCurrentResult] = useState<PredictionResult | null>(null);
  const [historyItems, setHistoryItems] = useState<PredictionResult[]>([]);
  const [historyTotal, setHistoryTotal] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  // Modal Report State
  const [reportRecord, setReportRecord] = useState<PredictionResult | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Initial Data Load
  const fetchTelemetry = useCallback(async () => {
    try {
      const [healthData, statsData] = await Promise.all([
        checkHealth(),
        getDashboardStats(),
      ]);
      setHealth(healthData);
      setStats(statsData);
    } catch (err) {
      console.warn("Failed to retrieve system telemetry:", err);
    }
  }, []);

  const fetchHistory = useCallback(
    async (category?: string, query?: string) => {
      setIsHistoryLoading(true);
      try {
        const res = await getPredictionHistory(0, 20, category, query);
        setHistoryItems(res.items);
        setHistoryTotal(res.total);
      } catch (err) {
        console.warn("Failed to fetch history:", err);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchTelemetry();
    fetchHistory();
  }, [fetchTelemetry, fetchHistory]);

  // Execute CT Scan Analysis
  const handleAnalyze = async (file: File, patientId?: string, notes?: string) => {
    setIsAnalyzing(true);
    try {
      const result = await predictCTScan(file, patientId, notes);
      setCurrentResult(result);
      message.success(`Analysis Complete: ${result.predicted_class} detected (${result.confidence}%)`);

      // Refresh table and counters
      await Promise.all([fetchHistory(), fetchTelemetry()]);
    } catch (error: any) {
      message.error(error.message || "Failed to process CT scan.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Delete Record
  const handleDelete = async (scanId: string) => {
    await deleteHistoryItem(scanId);
    setHistoryItems((prev) => prev.filter((item) => item.scan_id !== scanId));
    setHistoryTotal((prev) => Math.max(0, prev - 1));
    fetchTelemetry();
  };

  // Batch Delete Selected Records
  const handleDeleteBatch = async (scanIds: string[]) => {
    await batchDeleteHistoryItems(scanIds);
    setHistoryItems((prev) => prev.filter((item) => !scanIds.includes(item.scan_id)));
    setHistoryTotal((prev) => Math.max(0, prev - scanIds.length));
    fetchTelemetry();
  };

  // Wipe All History
  const handleClearAll = async () => {
    await clearAllHistory();
    setHistoryItems([]);
    setHistoryTotal(0);
    fetchTelemetry();
  };

  // View Detailed Report Modal
  const handleOpenReport = (record?: PredictionResult) => {
    setReportRecord(record || currentResult);
    setIsReportOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 medical-grid-bg selection:bg-teal-500 selection:text-white">
      {/* Top Telemetry Header */}
      <MedicalHeader
        isBackendHealthy={health.status === "healthy"}
        isOnnxLoaded={health.onnx_model_loaded}
        totalScans={stats.total_scans}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Banner Section */}
        <div className="relative rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-950/40 via-slate-900/60 to-slate-950 p-6 shadow-2xl overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-0.5 text-xs font-semibold text-teal-300">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                <span>Production Portfolio Architecture</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Medical Deep Learning Diagnostic Console
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                Trained on the 12,446 Kaggle CT Kidney dataset with VGG16 Transfer Learning.
                Engineered with single-threaded ONNX Runtime consuming &lt;100MB RAM to eliminate Out-Of-Memory crashes on cloud micro-tiers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2">
                <span className="block text-slate-500 text-[10px]">CLASSES (8 SPECTRUM)</span>
                <span className="font-semibold text-white">Normal, Cyst, Stone, Tumor, Hydronephrosis, PKD, Pyelo, Atrophy</span>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2">
                <span className="block text-slate-500 text-[10px]">DEPLOYMENT</span>
                <span className="font-semibold text-teal-400">FastAPI (Render) + Next.js (Vercel)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Metrics Overview Cards */}
        <MetricsOverview stats={stats} />

        {/* Clinical Scope & Imaging Modality Advisory Banner */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-md p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-bold text-amber-200 flex items-center gap-2">
                  Clinical Scope &amp; Imaging Modality Advisory
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-mono font-medium text-amber-300 border border-amber-500/30">
                  Validated Modality: Axial Abdominal CT Slices Only
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                This deep learning engine is benchmarked specifically on <strong className="text-white">Axial (Transverse) Abdominal CT scans</strong> for the 4 core radiological patterns: <strong className="text-emerald-400">Normal Parenchyma</strong>, <strong className="text-amber-400">Renal Cysts</strong>, <strong className="text-purple-400">Nephrolithiasis (Kidney Stones)</strong>, and <strong className="text-rose-400">Solid Renal Masses (Tumors)</strong>.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300 border-t border-amber-500/20">
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold shrink-0">⚠️ Modality Prerequisite:</span>
                  <span>Ultrasound (sonograms), MRI, and Coronal/Sagittal planes are incompatible with axial CT spatial kernels and will produce distorted classifications.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold shrink-0">ℹ️ Atypical / Non-Trained Pathologies:</span>
                  <span>Diseases outside the 4-class training domain (ADPKD, Infarction, Angiomyolipoma, Horseshoe Kidney, Pyelonephritis) exhibit overlapping Hounsfield unit attenuation (fat/infarctions mimicking cysts, gas/bone mimicking stones) and require manual radiologist contrast review.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Diagnostic Workspace: 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Upload Zone & Presets (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <CTUploadZone onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
          </div>

          {/* Right Column: Real-time Analysis Outcome (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <DiagnosisResults
              result={currentResult}
              onOpenReport={() => handleOpenReport(currentResult!)}
              isLoading={isAnalyzing}
            />
          </div>
        </div>

        {/* Diagnostic History Table (Ant Design Table) */}
        <PredictionHistoryTable
          data={historyItems}
          total={historyTotal}
          loading={isHistoryLoading}
          onRefresh={() => fetchHistory()}
          onSelectRecord={(rec) => handleOpenReport(rec)}
          onDeleteRecord={handleDelete}
          onDeleteBatch={handleDeleteBatch}
          onClearAll={handleClearAll}
          onFilterChange={(cat, q) => fetchHistory(cat, q)}
        />
      </main>

      {/* Formal Medical Report Modal */}
      <MedicalReportModal
        record={reportRecord}
        open={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Clinical Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            NephroScan AI • Built for Healthcare Deep Learning Portfolio • VGG16 Transfer Learning to ONNX
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <Database className="h-3 w-3 text-teal-400" /> SQLite / PostgreSQL
            </span>
            <span className="flex items-center gap-1">
              <Terminal className="h-3 w-3 text-teal-400" /> FastAPI + ONNX CPU
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
