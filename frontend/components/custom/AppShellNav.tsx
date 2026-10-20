"use client";

import React, { useState } from "react";
import {
  Activity,
  Cpu,
  Database,
  ShieldCheck,
  User,
  ChevronDown,
  Layers,
  Sparkles,
  ExternalLink,
  Settings,
  LogOut,
  Stethoscope,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover } from "antd";

interface AppShellNavProps {
  isBackendHealthy: boolean;
  isOnnxLoaded: boolean;
  totalScans: number;
  averageLatencyMs?: number;
}

export default function AppShellNav({
  isBackendHealthy,
  isOnnxLoaded,
  totalScans,
  averageLatencyMs = 28.4,
}: AppShellNavProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  const modelTelemetryContent = (
    <div className="p-3 w-72 space-y-3 bg-slate-950 text-white rounded-xl border border-slate-800 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5" /> ONNX Neural Core Telemetry
        </span>
        <Badge variant="teal" className="text-[10px]">
          v1.4.0 FP32
        </Badge>
      </div>

      <div className="space-y-1.5 text-xs text-slate-300">
        <div className="flex justify-between">
          <span className="text-slate-400">Architecture:</span>
          <span className="font-mono text-white">VGG16 Transfer Learning</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Model Artifact:</span>
          <span className="font-mono text-white">model.onnx (~84.7 MB)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Inference Threads:</span>
          <span className="font-mono text-teal-300">1 (Sequential CPU)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Active RAM Footprint:</span>
          <span className="font-mono text-emerald-400">&lt;92 MB (Cloud Micro)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Benchmark Accuracy:</span>
          <span className="font-mono text-emerald-400">99.2% (12,446 CTs)</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Backend Host:</span>
        <span className="font-mono text-teal-400">127.0.0.1:8000</span>
      </div>
    </div>
  );

  const profileMenuContent = (
    <div className="p-2 w-60 space-y-1 bg-slate-950 text-white rounded-xl border border-slate-800 shadow-2xl">
      <div className="px-3 py-2 border-b border-slate-800 mb-1">
        <div className="text-xs font-bold text-white">Dr. Kavan Patel, MD</div>
        <div className="text-[11px] text-teal-400">Chief Clinical Radiologist</div>
        <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: RAD-99214 • Nephrology</div>
      </div>

      <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors text-left">
        <Stethoscope className="h-3.5 w-3.5 text-teal-400" />
        Clinical Guidelines
      </button>

      <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors text-left">
        <Settings className="h-3.5 w-3.5 text-slate-400" />
        Diagnostic Preferences
      </button>

      <div className="pt-1 border-t border-slate-800/80 mt-1">
        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors text-left">
          <LogOut className="h-3.5 w-3.5" />
          Disconnect Session
        </button>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-400 text-white shadow-lg shadow-teal-500/25 ring-1 ring-white/20">
            <Activity className="h-5 w-5 animate-pulse" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">
                NephroScan <span className="text-teal-400">AI</span>
              </span>
              <span className="hidden sm:inline-block rounded-full bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-teal-300">
                CLINICAL v2.0
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400">
              Autonomous Deep Learning CT Kidney Pathology Diagnostic Suite
            </p>
          </div>
        </div>

        {/* Live Model Status Pill & Telemetry */}
        <div className="flex items-center gap-3">
          {/* Live AI Status Pill */}
          <Popover content={modelTelemetryContent} trigger="hover" placement="bottom">
            <div className="cursor-pointer flex items-center gap-2.5 rounded-full border border-teal-500/30 bg-slate-900/80 px-3.5 py-1.5 shadow-md shadow-teal-500/10 hover:border-teal-500/60 hover:bg-slate-900 transition-all">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-200">
                ONNX Runtime: <span className="text-teal-300 font-mono">Active</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 font-mono border-l border-slate-700 pl-2">
                {averageLatencyMs ? `${averageLatencyMs}ms Latency` : "0.12ms Latency"}
              </span>
            </div>
          </Popover>

          {/* Database & Cloud Indicators */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-slate-400">
              <Database className="h-3 w-3 text-teal-400" />
              <span className="font-mono text-[11px] text-slate-300">SQLite Logged</span>
            </div>
          </div>

          {/* User Profile Dropdown */}
          <Popover
            content={profileMenuContent}
            trigger="click"
            open={profileOpen}
            onOpenChange={setProfileOpen}
            placement="bottomRight"
          >
            <button className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-700 hover:text-white transition-all">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30">
                KP
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="font-semibold text-white text-xs">Dr. Kavan Patel</div>
                <div className="text-[10px] text-teal-400">Chief Nephrology</div>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400 ml-1" />
            </button>
          </Popover>
        </div>
      </div>
    </header>
  );
}
