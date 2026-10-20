"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  Contrast,
  Crosshair,
  Maximize2,
  FileDown,
  Activity,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";
import { PredictionResult } from "@/lib/api";

interface DICOMViewportModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  record: PredictionResult | null;
}

export default function DICOMViewportModal({
  open,
  onClose,
  imageUrl,
  record,
}: DICOMViewportModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [invert, setInvert] = useState(false);
  const [showCrosshairs, setShowCrosshairs] = useState(true);
  const [windowPreset, setWindowPreset] = useState<"standard" | "bone" | "soft">("standard");

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setInvert(false);
    setShowCrosshairs(true);
    setWindowPreset("standard");
  };

  const applyPreset = (preset: "standard" | "bone" | "soft") => {
    setWindowPreset(preset);
    if (preset === "standard") {
      setBrightness(100);
      setContrast(100);
    } else if (preset === "bone") {
      setBrightness(130);
      setContrast(170);
    } else if (preset === "soft") {
      setBrightness(95);
      setContrast(120);
    }
  };

  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-5xl border-slate-800 bg-slate-950/95 p-0 text-white backdrop-blur-2xl shadow-2xl overflow-hidden rounded-2xl">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                DICOM High-Resolution Studio Viewport
                <Badge variant="teal" className="text-[10px] tracking-wider uppercase font-mono">
                  Axial Matrix 224x224
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Interactive radiology viewport with windowing controls, crosshair measurements, and pan/zoom.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 border-slate-700 bg-slate-800/60 text-xs hover:bg-slate-700 text-slate-300"
            >
              Reset View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Viewport Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
          {/* Main CT Canvas / Viewport (8 Cols) */}
          <div className="lg:col-span-8 relative bg-black flex items-center justify-center overflow-hidden p-6 border-b lg:border-b-0 lg:border-r border-slate-800">
            {/* Medical Orientation HUD Markers */}
            <div className="pointer-events-none absolute top-4 left-4 z-20 text-[11px] font-mono text-teal-400/80 bg-slate-950/80 px-2 py-1 rounded border border-teal-500/20 backdrop-blur-md">
              <div>SL: 5.0mm • THK: 0.75mm</div>
              <div>FOV: 350mm • KV: 120</div>
            </div>

            <div className="pointer-events-none absolute top-4 right-4 z-20 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 backdrop-blur-md">
              <div>WL: {brightness} • WW: {contrast}</div>
              <div>ZOOM: {(zoom * 100).toFixed(0)}%</div>
            </div>

            <div className="pointer-events-none absolute bottom-4 left-4 z-20 text-[11px] font-mono text-teal-300 font-semibold bg-slate-950/80 px-2 py-1 rounded border border-teal-500/30">
              R (PATIENT RIGHT)
            </div>

            <div className="pointer-events-none absolute bottom-4 right-4 z-20 text-[11px] font-mono text-teal-300 font-semibold bg-slate-950/80 px-2 py-1 rounded border border-teal-500/30">
              L (PATIENT LEFT)
            </div>

            {/* Crosshair Overlay */}
            {showCrosshairs && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <div className="h-full w-[1px] bg-teal-500/25 border-dashed border-teal-500/40" />
                <div className="w-full h-[1px] bg-teal-500/25 border-dashed border-teal-500/40 absolute" />
                <div className="h-10 w-10 rounded-full border border-teal-500/30 absolute" />
              </div>
            )}

            {/* CT Scan Render Container */}
            <div
              className="transition-transform duration-100 ease-out flex items-center justify-center"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                filter: `brightness(${brightness}%) contrast(${contrast}%) ${invert ? "invert(1)" : ""}`,
              }}
            >
              <img
                src={imageUrl}
                alt="High-Res CT Slice"
                className="max-h-[440px] max-w-full rounded-lg object-contain shadow-2xl border border-slate-800"
              />
            </div>
          </div>

          {/* Right Controls & Radiologic Insights Panel (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-900/50 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Tool Controls */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-teal-400" /> Viewport Adjustments
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                    className="h-8 border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    <ZoomIn className="h-3.5 w-3.5 mr-1" /> Zoom In
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                    className="h-8 border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    <ZoomOut className="h-3.5 w-3.5 mr-1" /> Zoom Out
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="h-8 border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    <RotateCw className="h-3.5 w-3.5 mr-1" /> Rotate 90°
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCrosshairs((c) => !c)}
                    className={`h-8 border-slate-700 text-xs ${
                      showCrosshairs ? "bg-teal-500/20 text-teal-300 border-teal-500/40" : "bg-slate-800 text-slate-200"
                    }`}
                  >
                    <Crosshair className="h-3.5 w-3.5 mr-1" /> Crosshair
                  </Button>
                </div>
              </div>

              {/* Hounsfield Window Presets */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Window Presets (Hounsfield Scale)
                </h4>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["standard", "soft", "bone"] as const).map((preset) => (
                    <Button
                      key={preset}
                      variant="ghost"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className={`h-7 text-xs capitalize ${
                        windowPreset === preset
                          ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {preset}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Sun className="h-3 w-3 text-amber-400" /> Brightness (WL)
                    </span>
                    <span className="font-mono text-white">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-teal-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Contrast className="h-3 w-3 text-cyan-400" /> Contrast (WW)
                    </span>
                    <span className="font-mono text-white">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-teal-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Invert Grayscale Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInvert((inv) => !inv)}
                className={`w-full h-8 text-xs border-slate-700 ${
                  invert ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-slate-800 text-slate-300"
                }`}
              >
                Invert Contrast (Positive/Negative)
              </Button>
            </div>

            {/* Linked Inference Summary */}
            {record && (
              <div className="p-3.5 rounded-xl border border-teal-500/20 bg-teal-950/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                    Diagnostic Finding
                  </span>
                  <Badge variant="teal" className="text-[10px]">
                    {record.confidence.toFixed(1)}% Conf
                  </Badge>
                </div>
                <div className="text-sm font-extrabold text-white">{record.predicted_class}</div>
                <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                  {record.clinical_recommendation}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
