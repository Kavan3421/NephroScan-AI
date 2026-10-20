"use client";

import React from "react";
import { Activity, ShieldCheck, AlertCircle, Disc, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardStats } from "@/lib/api";

interface MetricsOverviewProps {
  stats: DashboardStats;
}

export default function MetricsOverview({ stats }: MetricsOverviewProps) {
  const metrics = [
    {
      label: "Total CT Scans",
      value: stats.total_scans.toLocaleString(),
      subtext: "Processed across all classes",
      icon: Layers,
      color: "text-teal-400",
      border: "border-teal-500/20",
      glow: "hover:border-teal-500/40",
    },
    {
      label: "Normal Scans",
      value: stats.normal_count.toLocaleString(),
      subtext: "Unremarkable renal anatomy",
      icon: ShieldCheck,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
      glow: "hover:border-emerald-500/40",
    },
    {
      label: "Cyst Detections",
      value: stats.cyst_count.toLocaleString(),
      subtext: "Fluid-filled renal lesions",
      icon: Disc,
      color: "text-amber-400",
      border: "border-amber-500/20",
      glow: "hover:border-amber-500/40",
    },
    {
      label: "Calculi (Stone)",
      value: stats.stone_count.toLocaleString(),
      subtext: "Nephrolithiasis instances",
      icon: Activity,
      color: "text-purple-400",
      border: "border-purple-500/20",
      glow: "hover:border-purple-500/40",
    },
    {
      label: "Tumor Detections",
      value: stats.tumor_count.toLocaleString(),
      subtext: "Cortical masses / neoplasms",
      icon: AlertCircle,
      color: "text-rose-400",
      border: "border-rose-500/20",
      glow: "hover:border-rose-500/40",
    },
    {
      label: "Hydronephrosis",
      value: (stats.hydronephrosis_count || 0).toLocaleString(),
      subtext: "Pelvicalyceal dilation / obstruction",
      icon: Activity,
      color: "text-cyan-400",
      border: "border-cyan-500/20",
      glow: "hover:border-cyan-500/40",
    },
    {
      label: "Polycystic (PKD)",
      value: (stats.pkd_count || 0).toLocaleString(),
      subtext: "Diffuse bilateral cystic spaces",
      icon: Disc,
      color: "text-indigo-400",
      border: "border-indigo-500/20",
      glow: "hover:border-indigo-500/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-8">
      {metrics.map((m, idx) => {
        const Icon = m.icon;
        return (
          <Card
            key={idx}
            className={`border ${m.border} ${m.glow} bg-slate-900/60 transition-all duration-300 hover:-translate-y-0.5`}
          >
            <CardContent className="p-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-slate-400 truncate">{m.label}</span>
                <Icon className={`h-3.5 w-3.5 ${m.color}`} />
              </div>
              <div className="text-xl font-bold tracking-tight text-white mb-0.5">
                {m.value}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{m.subtext}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
