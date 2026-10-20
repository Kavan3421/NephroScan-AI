import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return "N/A";
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function getClassColor(className: string): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  switch (className?.toLowerCase()) {
    case "normal":
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-500",
        border: "border-emerald-500/30",
        badge: "emerald",
      };
    case "cyst":
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-500",
        border: "border-amber-500/30",
        badge: "gold",
      };
    case "stone":
      return {
        bg: "bg-purple-500/10",
        text: "text-purple-500",
        border: "border-purple-500/30",
        badge: "purple",
      };
    case "tumor":
      return {
        bg: "bg-rose-500/10",
        text: "text-rose-500",
        border: "border-rose-500/30",
        badge: "red",
      };
    case "hydronephrosis":
      return {
        bg: "bg-cyan-500/10",
        text: "text-cyan-400",
        border: "border-cyan-500/30",
        badge: "teal",
      };
    case "polycystic disease":
    case "pkd":
      return {
        bg: "bg-indigo-500/10",
        text: "text-indigo-400",
        border: "border-indigo-500/30",
        badge: "purple",
      };
    case "pyelonephritis":
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/30",
        badge: "amber",
      };
    case "renal atrophy":
    case "atrophy":
      return {
        bg: "bg-stone-500/10",
        text: "text-stone-400",
        border: "border-stone-500/30",
        badge: "default",
      };
    default:
      return {
        bg: "bg-slate-500/10",
        text: "text-slate-400",
        border: "border-slate-500/30",
        badge: "default",
      };
  }
}
