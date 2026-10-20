"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  User,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
  ArrowRight,
  Shield,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CTUploadZoneProps {
  onAnalyze: (file: File, patientId?: string, notes?: string) => Promise<void>;
  isLoading: boolean;
}

export default function CTUploadZone({ onAnalyze, isLoading }: CTUploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string>("PT-9042-NEPH");
  const [clinicalNotes, setClinicalNotes] = useState<string>("Routine axial CT screening. Evaluation of renal parenchyma.");
  const [isDragOver, setIsDragOver] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setActivePreset(null);
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

  const handlePresetSelect = async (presetType: "Normal" | "Cyst" | "Stone" | "Tumor") => {
    setActivePreset(presetType);
    const realSampleMap: Record<string, string> = {
      Normal: "/samples/sample_normal.jpg",
      Cyst: "/samples/sample_cyst.jpg",
      Stone: "/samples/sample_stone.jpg",
      Tumor: "/samples/sample_tumor.jpg",
    };

    const sampleUrl = realSampleMap[presetType];
    try {
      const res = await fetch(sampleUrl);
      if (!res.ok) throw new Error("Sample file missing");
      const blob = await res.blob();
      const realFile = new File([blob], `benchmark_${presetType.toLowerCase()}_ct.jpg`, {
        type: "image/jpeg",
      });
      setSelectedFile(realFile);
      setPreviewUrl(sampleUrl);
    } catch (e) {
      console.warn("Could not load sample file:", e);
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
    setActivePreset(null);
    setPatientId("PT-9042-NEPH");
    setClinicalNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700/80">
      {/* Top Header */}
      <CardHeader className="pb-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                CT Scan Upload &amp; Patient Metadata
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Supports DICOM slices, PNG, JPG, WEBP (Native 224x224 input)
              </CardDescription>
            </div>
          </div>
          {previewUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* 1-Click Clinical Benchmark Presets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              1-Click Benchmark Datasets
            </label>
            <span className="text-[11px] font-mono text-teal-400/80">Kaggle Verified Scans</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { label: "Normal Kidney", type: "Normal", color: "hover:border-emerald-500/50 hover:bg-emerald-500/10" },
                { label: "Renal Cyst", type: "Cyst", color: "hover:border-amber-500/50 hover:bg-amber-500/10" },
                { label: "Kidney Stone", type: "Stone", color: "hover:border-purple-500/50 hover:bg-purple-500/10" },
                { label: "Renal Tumor", type: "Tumor", color: "hover:border-rose-500/50 hover:bg-rose-500/10" },
              ] as const
            ).map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => handlePresetSelect(item.type)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  activePreset === item.type
                    ? "border-teal-500 bg-teal-500/15 shadow-md shadow-teal-500/10"
                    : "border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-slate-300"
                } ${item.color}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white">{item.label}</span>
                  {activePreset === item.type && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">100% Real CT</div>
              </button>
            ))}
          </div>
        </div>

        {/* Drag-and-Drop Dropzone / Image Preview */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept=".dcm,.png,.jpg,.jpeg,.webp"
            className="hidden"
          />

          {!previewUrl ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                isDragOver
                  ? "border-teal-400 bg-teal-500/10 shadow-lg shadow-teal-500/20 scale-[1.01]"
                  : "border-slate-800 hover:border-teal-500/50 hover:bg-slate-950/40 bg-slate-950/30"
              }`}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all border border-teal-500/20">
                <UploadCloud className="h-7 w-7" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-white">
                Drag &amp; drop renal CT slice or <span className="text-teal-400 underline">browse</span>
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                Supports PNG, JPG, or DICOM exports up to 20MB
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
                  Axial Slices Only
                </span>
                <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
                  Single Frame
                </span>
                <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700">
                  Auto-Normalized
                </span>
              </div>
            </div>
          ) : (
            <div className="relative rounded-2xl border border-slate-800 bg-black overflow-hidden group">
              <div className="relative aspect-square max-h-64 mx-auto flex items-center justify-center p-3">
                <img
                  src={previewUrl}
                  alt="CT Preview"
                  className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                />

                {/* Animated CT Scanner Laser Beam Effect */}
                {isLoading && (
                  <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_#2dd4bf] animate-scan z-30" />
                )}

                {/* Crosshairs Overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
                  <div className="h-full w-[1px] border-l border-teal-500" />
                  <div className="w-full h-[1px] border-t border-teal-500 absolute" />
                </div>
              </div>

              {/* Bottom Metadata Ribbon */}
              <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/80 px-4 py-2 text-xs">
                <div className="truncate font-mono text-slate-300 text-[11px] max-w-[200px]">
                  {selectedFile?.name || "ct_scan_slice.jpg"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-teal-400 font-mono">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "224x224"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-6 text-[11px] text-slate-400 hover:text-white px-2"
                  >
                    Change File
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Patient Metadata Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <User className="h-3 w-3 text-teal-400" /> Patient MRN / Identifier
            </label>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="e.g. PT-89104"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <FileText className="h-3 w-3 text-teal-400" /> Clinical Indication / Notes
            </label>
            <input
              type="text"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="e.g. Flank pain, macroscopic hematuria"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-white placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all"
            />
          </div>
        </div>

        {/* Glowing Primary Execution Button */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedFile || isLoading}
          className={`w-full h-12 rounded-xl text-sm font-extrabold tracking-wide transition-all ${
            !selectedFile || isLoading
              ? "bg-slate-800 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.01] active:scale-[0.99]"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
              <span>Executing VGG16 Neural Inference...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Activity className="h-4 w-4 text-teal-200" />
              <span>Run AI Diagnostic Inference</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
