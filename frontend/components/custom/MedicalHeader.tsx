"use client";

import React from "react";
import { Activity, Cpu, ShieldCheck, Database, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MedicalHeaderProps {
  isBackendHealthy: boolean;
  isOnnxLoaded: boolean;
  totalScans: number;
}

export default function MedicalHeader({
  isBackendHealthy,
  isOnnxLoaded,
  totalScans,
}: MedicalHeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & System Title */}
          <div className="flex items-center space-x-3.5">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-teal-500/20">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
                <Activity className="h-6 w-6 text-teal-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Nephro<span className="text-teal-400">Scan</span> AI
                </h1>
                <Badge variant="teal" className="text-[10px] tracking-wider uppercase">
                  Clinical v1.0
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Automated 4-Class CT Kidney Diagnostic System • Kaggle CT Dataset (12,446 Scans)
              </p>
            </div>
          </div>

          {/* System Hardware & Status Telemetry */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* ONNX Engine Status */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300">
              <Cpu className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-slate-400">Core:</span>
              <span className="font-semibold text-slate-200">
                {isOnnxLoaded ? "ONNX FP32 (VGG16)" : "Simulated Dev Engine"}
              </span>
              <span className="inline-block h-2 w-2 rounded-full bg-teal-400 animate-ping" />
            </div>

            {/* RAM Footprint Badge */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-300">
              <Database className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400">RAM:</span>
              <span className="font-mono text-emerald-400">&lt;100 MB</span>
            </div>

            {/* API Health */}
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isBackendHealthy ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span className="text-slate-400">FastAPI:</span>
              <span className={isBackendHealthy ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                {isBackendHealthy ? "Online" : "Mock Sync"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
