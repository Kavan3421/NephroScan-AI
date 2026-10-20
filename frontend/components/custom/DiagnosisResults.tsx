"use client";

import React from "react";
import { AlertCircle, CheckCircle, ShieldAlert, Clock, Cpu, Printer, Sparkles, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PredictionResult } from "@/lib/api";
import { getClassColor } from "@/lib/utils";

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
  if (isLoading) {
    return (
      <Card className="border-slate-800 bg-slate-900/70 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
          <Activity className="h-6 w-6 text-teal-400 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Neural Network Active</h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Running 224x224 tensor normalization, feature extraction, and 4-class softmax probability distribution...
          </p>
        </div>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center p-12 text-center border-dashed">
        <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">No Scan Evaluated Yet</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Upload a renal CT slice or pick one of the quick presets on the left to view real-time AI classification.
        </p>
      </Card>
    );
  }

  const colorMeta = getClassColor(result.predicted_class);
  const classesList = result.probabilities && Object.keys(result.probabilities).length > 0
    ? Object.keys(result.probabilities)
    : ["Cyst", "Normal", "Stone", "Tumor"];

  return (
    <Card className={`border ${colorMeta.border} bg-slate-900/80 backdrop-blur-md shadow-2xl relative overflow-hidden transition-all duration-300`}>
      {/* Top Banner with Verdict */}
      <CardHeader className="pb-4 border-b border-slate-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
                Primary Diagnostic Classification
              </span>
              <Badge variant={result.predicted_class === "Normal" ? "emerald" : result.predicted_class === "Tumor" ? "rose" : "amber"}>
                {result.risk_level}
              </Badge>
            </div>
            <h2 className={`text-3xl font-extrabold tracking-tight ${colorMeta.text}`}>
              {result.predicted_class}
            </h2>
          </div>

          <div className="flex sm:flex-col sm:items-end justify-between items-center bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400">Confidence Score</span>
            <span className="text-2xl font-bold font-mono text-white">
              {result.confidence}%
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Multiclass Probability Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Multiclass Probability Breakdown (Softmax)
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">Sum: 100.0%</span>
          </div>

          <div className="space-y-2.5">
            {classesList.map((cls) => {
              const score = result.probabilities ? result.probabilities[cls] || 0 : 0;
              const isWinner = cls === result.predicted_class;
              const barColor =
                cls === "Normal"
                  ? "bg-emerald-500"
                  : cls === "Cyst"
                  ? "bg-amber-500"
                  : cls === "Stone"
                  ? "bg-purple-500"
                  : cls === "Tumor"
                  ? "bg-rose-500"
                  : cls === "Hydronephrosis"
                  ? "bg-cyan-500"
                  : cls === "Polycystic Disease"
                  ? "bg-indigo-500"
                  : cls === "Pyelonephritis"
                  ? "bg-orange-500"
                  : cls === "Renal Atrophy"
                  ? "bg-stone-500"
                  : "bg-teal-500";

              return (
                <div key={cls} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${isWinner ? "text-white flex items-center gap-1" : "text-slate-400"}`}>
                      {cls}
                      {isWinner && <CheckCircle className="h-3 w-3 text-teal-400" />}
                    </span>
                    <span className="font-mono text-xs text-slate-300">{score.toFixed(2)}%</span>
                  </div>
                  <Progress value={score} indicatorColor={barColor} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinical Recommendation Box */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <ShieldAlert className="h-4 w-4 text-teal-400" />
            <span>Clinical Impression &amp; Next Steps</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            {result.clinical_recommendation}
          </p>
        </div>

        {/* Scan Telemetry Footnote */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
          <div>
            <span className="block text-slate-500">Scan ID</span>
            <span className="font-mono text-slate-300 font-medium truncate">{result.scan_id}</span>
          </div>
          <div>
            <span className="block text-slate-500">Inference Latency</span>
            <span className="font-mono text-teal-400 font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" /> {result.inference_time_ms} ms
            </span>
          </div>
          <div>
            <span className="block text-slate-500">Input Matrix</span>
            <span className="font-mono text-slate-300">224×224 RGB</span>
          </div>
          <div>
            <span className="block text-slate-500">Model Core</span>
            <span className="font-mono text-slate-300 truncate">{result.model_version || "VGG16"}</span>
          </div>
        </div>

        {/* Report Button */}
        <Button
          onClick={onOpenReport}
          variant="outline"
          className="w-full text-xs font-medium border-slate-700 hover:bg-slate-800 hover:text-white"
        >
          <Printer className="h-3.5 w-3.5 mr-2 text-teal-400" />
          View Formal Medical Diagnostic Report (PDF / Print)
        </Button>
      </CardContent>
    </Card>
  );
}
