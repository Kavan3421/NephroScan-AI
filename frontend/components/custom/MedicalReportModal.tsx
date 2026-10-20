"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, Activity, CheckCircle, Shield } from "lucide-react";
import { PredictionResult } from "@/lib/api";
import { formatDateTime, getClassColor } from "@/lib/utils";

interface MedicalReportModalProps {
  record: PredictionResult | null;
  open: boolean;
  onClose: () => void;
}

export default function MedicalReportModal({
  record,
  open,
  onClose,
}: MedicalReportModalProps) {
  if (!record) return null;

  const colorMeta = getClassColor(record.predicted_class);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-800" onClose={onClose}>
        <div className="space-y-4 print:p-0 print:m-0 print:bg-white print:text-black">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-teal-400" />
            <h3 className="text-base font-bold text-white print:text-black">
              Clinical Diagnostic Report
            </h3>
          </div>
          <Badge variant={record.predicted_class === "Normal" ? "emerald" : "rose"}>
            {record.risk_level}
          </Badge>
        </div>

        {/* Printable Paper Content */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 text-xs print:bg-white print:border-none print:p-0">
          {/* Metadata Block */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-slate-400 block text-[11px]">Patient MRN</span>
              <span className="font-semibold text-white font-mono">{record.patient_id || "ANONYMOUS"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Scan Identifier</span>
              <span className="font-semibold text-white font-mono">{record.scan_id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Date / Time</span>
              <span className="font-semibold text-white">{formatDateTime(record.created_at)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">File Source</span>
              <span className="text-slate-300 truncate block">{record.filename}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Core Architecture</span>
              <span className="text-slate-300">{record.model_version || "VGG16 Transfer Learning"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Inference Time</span>
              <span className="text-teal-400 font-mono">{record.inference_time_ms} ms</span>
            </div>
          </div>

          {/* Primary Finding */}
          <div className="rounded-lg border border-slate-800 p-3 bg-slate-900/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-semibold">
                Evaluated Pathology
              </span>
              <h4 className={`text-xl font-bold ${colorMeta.text}`}>
                {record.predicted_class}
              </h4>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Certainty Score</span>
              <span className="text-xl font-bold font-mono text-white">{record.confidence}%</span>
            </div>
          </div>

          {/* Probability Distribution */}
          <div>
            <h5 className="font-semibold text-slate-300 mb-2">Softmax Probability Distribution</h5>
            <div className="grid grid-cols-4 gap-2 text-center">
              {Object.entries(record.probabilities || {}).map(([key, val]) => (
                <div key={key} className="bg-slate-900/90 border border-slate-800 rounded p-2">
                  <div className="text-[10px] text-slate-400">{key}</div>
                  <div className="text-xs font-mono font-bold text-white mt-0.5">{val}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Recommendations */}
          <div className="space-y-1">
            <h5 className="font-semibold text-slate-300">Clinical Recommendation &amp; Follow-up</h5>
            <p className="text-slate-400 leading-relaxed text-[11px] bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
              {record.clinical_recommendation}
            </p>
          </div>

          {/* Clinical Disclaimer */}
          <div className="flex items-start gap-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
            <Shield className="h-3.5 w-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
            <p>
              This computer-aided diagnostic (CAD) evaluation is generated by an automated deep learning transfer learning model (VGG16) trained on the Kaggle CT Kidney Dataset. For medical portfolio &amp; research demonstration. Correlate clinically with a board-certified radiologist.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose} className="border-slate-700 text-slate-300">
            Close
          </Button>
          <Button variant="medical" size="sm" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Print Report
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
}
