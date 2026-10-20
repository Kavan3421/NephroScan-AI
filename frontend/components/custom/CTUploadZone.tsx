"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Sparkles, RefreshCw, User, FileText, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CTUploadZoneProps {
  onAnalyze: (file: File, patientId?: string, notes?: string) => Promise<void>;
  isLoading: boolean;
}

// Generate realistic synthetic medical CT scan canvas data URLs for 1-click portfolio testing
function createMedicalSampleScanDataUrl(
  type:
    | "Normal"
    | "Cyst"
    | "Stone"
    | "Tumor"
    | "Hydronephrosis"
    | "Polycystic Disease"
    | "Pyelonephritis"
    | "Renal Atrophy"
): string {
  if (typeof window === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 224;
  canvas.height = 224;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Background deep black CT void
  ctx.fillStyle = "#030712";
  ctx.fillRect(0, 0, 224, 224);

  // Abdominal cavity soft tissue ring
  const grad = ctx.createRadialGradient(112, 112, 30, 112, 112, 95);
  grad.addColorStop(0, "#1f2937");
  grad.addColorStop(0.7, "#111827");
  grad.addColorStop(1, "#030712");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(112, 112, 90, 75, 0, 0, Math.PI * 2);
  ctx.fill();

  // Spine bone structure at posterior
  ctx.fillStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.arc(112, 160, 14, 0, Math.PI * 2);
  ctx.fill();

  // Left & Right Kidneys
  const isAtrophy = type === "Renal Atrophy";
  const isPKD = type === "Polycystic Disease";

  // Left Kidney
  ctx.fillStyle = "#4b5563";
  ctx.beginPath();
  ctx.ellipse(65, 115, isAtrophy ? 16 : isPKD ? 34 : 26, isAtrophy ? 28 : isPKD ? 52 : 42, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Right Kidney
  ctx.fillStyle = "#4b5563";
  ctx.beginPath();
  ctx.ellipse(159, 115, isAtrophy ? 16 : isPKD ? 34 : 26, isAtrophy ? 28 : isPKD ? 52 : 42, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Pathology Specific Markings
  if (type === "Cyst") {
    // Hypodense well-defined fluid circular cyst in left upper pole
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(62, 95, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (type === "Stone") {
    // Hyperdense bright calcified stone in right lower pole renal pelvis
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(155, 125, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (type === "Tumor") {
    // Irregular heterogeneous hyperdense mass distorting renal contour
    ctx.fillStyle = "#9ca3af";
    ctx.beginPath();
    ctx.ellipse(60, 115, 20, 24, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#374151";
    ctx.beginPath();
    ctx.arc(63, 118, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === "Hydronephrosis") {
    // Distended pelvicalyceal branching fluid system
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(65, 115, 12, 22, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (type === "Polycystic Disease") {
    // Innumerable bilateral cystic spaces
    ctx.fillStyle = "#0f172a";
    const cysts = [
      [55, 95, 6], [72, 105, 8], [60, 125, 7], [70, 135, 6],
      [150, 95, 7], [165, 108, 9], [155, 126, 6], [168, 135, 7]
    ];
    cysts.forEach(([x, y, r]) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  } else if (type === "Pyelonephritis") {
    // Striated hypoattenuating wedge-like edema
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.moveTo(65, 115);
    ctx.lineTo(45, 95);
    ctx.lineTo(48, 135);
    ctx.closePath();
    ctx.fill();
  } else if (type === "Renal Atrophy") {
    // Irregular thinned cortical outline with parenchymal scarring
    ctx.strokeStyle = "#78716c";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Crosshair medical annotations
  ctx.strokeStyle = "rgba(20, 184, 166, 0.4)";
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(112, 5);
  ctx.lineTo(112, 15);
  ctx.moveTo(112, 209);
  ctx.lineTo(112, 219);
  ctx.moveTo(5, 112);
  ctx.lineTo(15, 112);
  ctx.moveTo(209, 112);
  ctx.lineTo(219, 112);
  ctx.stroke();

  // Text watermark
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.font = "9px monospace";
  ctx.fillText(`KAG-CT ${type.toUpperCase()}`, 10, 20);
  ctx.fillText("5mm Slice", 165, 20);

  return canvas.toDataURL("image/png");
}

export default function CTUploadZone({ onAnalyze, isLoading }: CTUploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string>("");
  const [clinicalNotes, setClinicalNotes] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handlePresetSelect = async (
    presetType:
      | "Normal"
      | "Cyst"
      | "Stone"
      | "Tumor"
      | "Hydronephrosis"
      | "Polycystic Disease"
      | "Pyelonephritis"
      | "Renal Atrophy"
  ) => {
    const realSampleMap: Record<string, string> = {
      Normal: "/samples/sample_normal.jpg",
      Cyst: "/samples/sample_cyst.jpg",
      Stone: "/samples/sample_stone.jpg",
      Tumor: "/samples/sample_tumor.jpg",
    };

    if (realSampleMap[presetType]) {
      const sampleUrl = realSampleMap[presetType];
      try {
        const res = await fetch(sampleUrl);
        if (!res.ok) throw new Error("Fallback to canvas");
        const blob = await res.blob();
        const realFile = new File([blob], `dataset_${presetType.toLowerCase()}_ct.jpg`, {
          type: "image/jpeg",
        });
        setSelectedFile(realFile);
        setPreviewUrl(sampleUrl);
      } catch {
        const dataUrl = createMedicalSampleScanDataUrl(presetType);
        setPreviewUrl(dataUrl);
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const mockFile = new File([blob], `sample_${presetType.toLowerCase()}_slice.png`, {
          type: "image/png",
        });
        setSelectedFile(mockFile);
      }
    } else {
      const dataUrl = createMedicalSampleScanDataUrl(presetType);
      setPreviewUrl(dataUrl);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const mockFile = new File(
        [blob],
        `sample_${presetType.toLowerCase().replace(/\s+/g, "_")}_ct.png`,
        { type: "image/png" }
      );
      setSelectedFile(mockFile);
    }

    if (presetType === "Tumor") {
      setPatientId("PT-8834-ONC");
      setClinicalNotes("Hematuria reported. Evaluation of solid renal cortical mass.");
    } else if (presetType === "Cyst") {
      setPatientId("PT-5120-CYST");
      setClinicalNotes("Well-defined hypodense fluid lesion detected on screening.");
    } else if (presetType === "Stone") {
      setPatientId("PT-9941-URO");
      setClinicalNotes("Severe acute left flank pain, suspected nephrolithiasis calculus.");
    } else if (presetType === "Hydronephrosis") {
      setPatientId("PT-4412-HYDRO");
      setClinicalNotes("Obstructive uropathy, marked pelvicalyceal dilation and caliectasis.");
    } else if (presetType === "Polycystic Disease") {
      setPatientId("PT-3091-PKD");
      setClinicalNotes("Autosomal dominant polycystic kidney disease (ADPKD), bilateral innumerable parenchymal cysts.");
    } else if (presetType === "Pyelonephritis") {
      setPatientId("PT-7119-INFECT");
      setClinicalNotes("Acute bacterial pyelonephritis, striated nephrogram and inflammatory fat stranding.");
    } else if (presetType === "Renal Atrophy") {
      setPatientId("PT-2280-CKD");
      setClinicalNotes("End-stage chronic kidney disease, severe cortical thinning and renal parenchymal scarring.");
    } else {
      setPatientId("PT-1002-NORM");
      setClinicalNotes("Standard baseline nephrology evaluation. Unremarkable scan.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    await onAnalyze(selectedFile, patientId, clinicalNotes);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPatientId("");
    setClinicalNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-slate-800 bg-slate-900/70 backdrop-blur-md shadow-2xl relative overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-white">
                CT Scan Upload &amp; Patient Metadata
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Supports DICOM slices, PNG, JPG, WEBP (Auto-resized to 224x224 for VGG16)
              </CardDescription>
            </div>
          </div>
          {previewUrl && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs text-slate-400 hover:text-white">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Preset Sample Gallery for All 8 Categories */}
        <div className="rounded-xl border border-teal-500/20 bg-teal-950/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-300">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              <span>Full Clinical Spectrum Presets (All 8 Categories):</span>
            </div>
            <span className="text-[11px] text-teal-400/80">Click any category to test AI</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handlePresetSelect("Normal")}
              className="px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 text-xs font-semibold transition-all text-left flex items-center justify-between shadow-sm"
            >
              <span>Normal Kidney</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("Cyst")}
              className="px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 text-xs font-semibold transition-all text-left flex items-center justify-between shadow-sm"
            >
              <span>Renal Cyst</span>
              <span className="h-2 w-2 rounded-full bg-amber-400" />
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("Stone")}
              className="px-3 py-2 rounded-lg border border-purple-500/30 bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 text-xs font-semibold transition-all text-left flex items-center justify-between shadow-sm"
            >
              <span>Kidney Stone</span>
              <span className="h-2 w-2 rounded-full bg-purple-400" />
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("Tumor")}
              className="px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 text-xs font-semibold transition-all text-left flex items-center justify-between shadow-sm"
            >
              <span>Renal Tumor</span>
              <span className="h-2 w-2 rounded-full bg-rose-400" />
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("Hydronephrosis")}
              className="px-3 py-2 rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-semibold transition-all text-left flex items-center justify-between shadow-sm"
            >
              <span>Hydronephrosis</span>
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("Polycystic Disease")}
              className="px-3 py-2 rounded-lg border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-900/50 text-xs font-semibold transition-all text-left flex items-center justify-between shadow-sm"
            >
              <span>Polycystic (PKD)</span>
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("Pyelonephritis")}
              className="px-3 py-2 rounded-lg border border-orange-500/30 bg-orange-950/40 text-orange-300 hover:bg-orange-900/50 text-xs font-semibold transition-all text-left flex items-center justify-between shadow-sm"
            >
              <span>Pyelonephritis</span>
              <span className="h-2 w-2 rounded-full bg-orange-400" />
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("Renal Atrophy")}
              className="px-3 py-2 rounded-lg border border-stone-500/30 bg-stone-950/40 text-stone-300 hover:bg-stone-900/50 text-xs font-semibold transition-all text-left flex items-center justify-between shadow-sm"
            >
              <span>Atrophy (CKD)</span>
              <span className="h-2 w-2 rounded-full bg-stone-400" />
            </button>
          </div>
        </div>

        {/* Drag & Drop Upload Container */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all duration-200 cursor-pointer ${
            isDragOver
              ? "border-teal-400 bg-teal-500/10 scale-[1.01]"
              : previewUrl
              ? "border-teal-500/40 bg-slate-950/60"
              : "border-slate-700 bg-slate-950/40 hover:border-teal-500/50 hover:bg-slate-950/60"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {previewUrl ? (
            <div className="relative group w-full flex flex-col items-center">
              <div className="relative rounded-lg overflow-hidden border border-teal-500/30 bg-black shadow-inner">
                {/* Visual scanline effect */}
                <div className="absolute inset-0 pointer-events-none ct-scan-overlay" />
                <img
                  src={previewUrl}
                  alt="CT Scan Preview"
                  className="h-56 w-56 object-contain filter contrast-125"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="teal" className="text-[10px] bg-slate-950/80 backdrop-blur-sm">
                    224×224 Matrix
                  </Badge>
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-300 truncate max-w-xs">
                {selectedFile?.name || "ct_scan_slice.png"}
              </p>
              <p className="text-[11px] text-teal-400">Click or drop to replace scan</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-14 w-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-teal-400 transition-colors">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-slate-200">
                  Drag &amp; drop renal CT slice or <span className="text-teal-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-500">Supports PNG, JPG, or DICOM exports up to 20MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Clinical Patient Metadata Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <User className="h-3 w-3 text-teal-400" /> Patient MRN / Identifier
            </label>
            <input
              type="text"
              placeholder="e.g. PT-89104"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-teal-400" /> Clinical Indication / Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Flank pain, macroscopic hematuria"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Action Button */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedFile || isLoading}
          variant="medical"
          className="w-full py-2.5 text-sm font-semibold tracking-wide"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Executing VGG16 ONNX Inference...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Run AI Diagnostic Inference</span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
