"use client";

import React, { useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  Maximize2,
  Layers,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Share2,
  Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PredictionResult } from "@/lib/api";
import DICOMViewportModal from "@/components/custom/DICOMViewportModal";

interface DiagnosisResultsProps {
  result: PredictionResult | null;
  onOpenReport: () => void;
  isLoading: boolean;
}

export default function DiagnosisResults({
  result,
  onOpenReport,
  isLoading,
}: DiagnosisResultsProps) {
  const [isDicomOpen, setIsDicomOpen] = useState(false);

  // Fallback empty state
  if (!result && !isLoading) {
    return (
      <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden h-full flex flex-col justify-center items-center p-8 text-center border-dashed">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-500 border border-slate-700 mb-4">
          <Activity className="h-8 w-8 text-slate-500" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">Awaiting Diagnostic Input</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
          Upload an axial CT scan or select a benchmark preset to generate an automated radiologic classification with multiclass probability distributions.
        </p>
        <div className="flex items-center gap-2 text-[11px] text-teal-400 font-mono bg-teal-500/10 px-3 py-1.5 rounded-full border border-teal-500/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>VGG16 Transfer Learning Ready (FP32)</span>
        </div>
      </Card>
    );
  }

  // Loading skeleton state
  if (isLoading) {
    return (
      <Card className="border-teal-500/30 bg-slate-900/80 backdrop-blur-2xl shadow-2xl p-6 space-y-6 animate-pulse">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-slate-800 rounded" />
            <div className="h-7 w-48 bg-slate-700 rounded" />
          </div>
          <div className="h-8 w-24 bg-slate-800 rounded-full" />
        </div>
        <div className="space-y-3">
          <div className="h-3 w-40 bg-slate-800 rounded" />
          <div className="h-5 w-full bg-slate-800 rounded-full" />
          <div className="h-5 w-full bg-slate-800 rounded-full" />
          <div className="h-5 w-full bg-slate-800 rounded-full" />
          <div className="h-5 w-full bg-slate-800 rounded-full" />
        </div>
      </Card>
    );
  }

  if (!result) return null;

  const getVerdictTheme = (cls: string) => {
    switch (cls) {
      case "Normal":
        return {
          text: "text-emerald-400",
          border: "border-emerald-500/40",
          bg: "bg-emerald-500/10",
          badge: "emerald",
          icon: ShieldCheck,
          accent: "from-emerald-500 to-teal-600",
        };
      case "Cyst":
        return {
          text: "text-amber-400",
          border: "border-amber-500/40",
          bg: "bg-amber-500/10",
          badge: "amber",
          icon: AlertTriangle,
          accent: "from-amber-500 to-orange-600",
        };
      case "Stone":
        return {
          text: "text-purple-400",
          border: "border-purple-500/40",
          bg: "bg-purple-500/10",
          badge: "purple",
          icon: Activity,
          accent: "from-purple-500 to-indigo-600",
        };
      case "Tumor":
      default:
        return {
          text: "text-rose-400",
          border: "border-rose-500/40",
          bg: "bg-rose-500/10",
          badge: "rose",
          icon: ShieldAlert,
          accent: "from-rose-500 to-red-600",
        };
    }
  };

  const theme = getVerdictTheme(result.predicted_class);
  const VerdictIcon = theme.icon;

  // The 4 core trained classes
  const coreClasses = ["Normal", "Cyst", "Stone", "Tumor"] as const;

  const currentScanImage =
    result.image_base64_thumbnail ||
    result.thumbnail_b64 ||
    (result.predicted_class === "Normal"
      ? "/samples/sample_normal.jpg"
      : result.predicted_class === "Cyst"
      ? "/samples/sample_cyst.jpg"
      : result.predicted_class === "Stone"
      ? "/samples/sample_stone.jpg"
      : "/samples/sample_tumor.jpg");

  return (
    <>
      <Card
        className={`border ${theme.border} bg-slate-900/70 backdrop-blur-2xl shadow-2xl relative overflow-hidden transition-all duration-300`}
      >
        {/* Top Verdict Header */}
        <CardHeader className="pb-4 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                  Primary Radiologic Classification
                </span>
                <Badge variant={theme.badge as any} className="text-[10px] uppercase font-bold">
                  {result.risk_level}
                </Badge>
              </div>

              <div className="flex items-center gap-2.5">
                <VerdictIcon className={`h-7 w-7 ${theme.text}`} />
                <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.text}`}>
                  {result.predicted_class}
                </h2>
              </div>
            </div>

            {/* Confidence & Latency Metric Block */}
            <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-mono">
                  Confidence
                </span>
                <span className="font-mono text-xl font-black text-white">
                  {result.confidence.toFixed(1)}%
                </span>
              </div>
              <div className="h-7 w-[1px] bg-slate-800" />
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-mono">Latency</span>
                <span className="font-mono text-sm font-semibold text-teal-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {result.inference_time_ms}ms
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* Side-by-Side CT Viewport & Multiclass Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Left: CT Scan Slice with Quick Viewport Launcher (5 Cols) */}
            <div className="md:col-span-5 space-y-2.5">
              <div className="relative aspect-square rounded-xl bg-black border border-slate-800 overflow-hidden group shadow-xl">
                <img
                  src={currentScanImage}
                  alt="Current CT Slice"
                  className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                />

                {/* DICOM Studio Launcher Hover Overlay */}
                <div
                  onClick={() => setIsDicomOpen(true)}
                  className="cursor-pointer absolute inset-0 bg-slate-950/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-center p-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-slate-950 font-bold shadow-lg shadow-teal-500/30">
                    <Maximize2 className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-white">Open in DICOM Viewport</span>
                  <span className="text-[10px] text-slate-300">
                    Zoom, Pan, Windowing &amp; Contrast
                  </span>
                </div>

                <div className="pointer-events-none absolute bottom-2 left-2 text-[10px] font-mono text-teal-400 bg-slate-950/80 px-2 py-0.5 rounded border border-teal-500/20">
                  {result.image_dimensions || "224x224"}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDicomOpen(true)}
                className="w-full h-8 text-xs border-slate-700 bg-slate-950/60 hover:bg-slate-800 text-slate-300 flex items-center justify-center gap-1.5"
              >
                <Maximize2 className="h-3.5 w-3.5 text-teal-400" />
                <span>Interactive DICOM Studio</span>
              </Button>
            </div>

            {/* Right: Multiclass Confidence Progress Meters (7 Cols) */}
            <div className="md:col-span-7 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-teal-400" />
                  Multiclass Softmax Distribution
                </span>
                <span className="text-[10px] font-mono text-slate-500">Sum: 100.0%</span>
              </div>

              <div className="space-y-2.5">
                {coreClasses.map((cls) => {
                  const score = result.probabilities?.[cls] ?? 0;
                  const isWinner = cls === result.predicted_class;

                  const barColors: Record<string, string> = {
                    Normal: "bg-emerald-500",
                    Cyst: "bg-amber-500",
                    Stone: "bg-purple-500",
                    Tumor: "bg-rose-500",
                  };

                  return (
                    <div key={cls} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-semibold flex items-center gap-1.5 ${
                            isWinner ? "text-white" : "text-slate-400"
                          }`}
                        >
                          {cls}
                          {isWinner && <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />}
                        </span>
                        <span className="font-mono text-xs text-slate-200">{score.toFixed(1)}%</span>
                      </div>

                      {/* Progress Track */}
                      <div className="h-2 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            barColors[cls] || "bg-teal-500"
                          }`}
                          style={{ width: `${Math.max(score, 1)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clinical Impression Callout */}
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <Stethoscope className="h-3.5 w-3.5 text-teal-400" />
                  <span>Clinical Impression &amp; Recommendation</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.clinical_recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            <div className="text-xs text-slate-500 font-mono">
              Scan ID: <span className="text-slate-300">{result.scan_id}</span> • Patient:{" "}
              <span className="text-slate-300">{result.patient_id || "ANONYMOUS"}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenReport}
                className="h-8 border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs flex items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>View Full Medical Report</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Linked DICOM High-Res Viewport Modal */}
      <DICOMViewportModal
        open={isDicomOpen}
        onClose={() => setIsDicomOpen(false)}
        imageUrl={currentScanImage}
        record={result}
      />
    </>
  );
}
