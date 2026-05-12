/** Map backend leaning labels to UI accent classes (Tailwind). */
export function leaningBadgeClasses(leaning: string | null | undefined): string {
  const key = (leaning || "unknown").toLowerCase().replace("_", "-");
  if (key === "left") {
    return "bg-sky-500/20 text-sky-400 border-sky-500/40";
  }
  if (key === "center-left") {
    return "bg-sky-500/10 text-sky-500 border-sky-400/30";
  }
  if (key === "center" || key === "mixed") {
    return "bg-zinc-500/20 text-zinc-400 border-zinc-500/40";
  }
  if (key === "center-right") {
    return "bg-amber-500/20 text-amber-400 border-amber-500/40";
  }
  if (key === "right") {
    return "bg-orange-500/20 text-orange-400 border-orange-500/40";
  }
  return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
}

/** Light-mode overrides — must produce readable dark text on light backgrounds */
export function leaningBadgeLight(leaning: string): string {
  const key = leaning.toLowerCase().replace("_", "-");
  if (key === "left") return "!bg-sky-100 !text-sky-700 !border-sky-300";
  if (key === "center-left") return "!bg-sky-50 !text-sky-600 !border-sky-200";
  if (key === "center" || key === "mixed") return "!bg-zinc-100 !text-zinc-600 !border-zinc-300";
  if (key === "center-right") return "!bg-amber-50 !text-amber-700 !border-amber-300";
  if (key === "right") return "!bg-orange-100 !text-orange-700 !border-orange-300";
  return "!bg-zinc-100 !text-zinc-600 !border-zinc-300";
}

export function leaningPieColor(leaning: string): string {
  const k = leaning.toLowerCase();
  if (k.includes("left") && !k.includes("right")) return "#38bdf8";
  if (k === "center" || k === "mixed") return "#a1a1aa";
  if (k.includes("center-right")) return "#fb923c";
  if (k.includes("right")) return "#ea580c";
  return "#71717a";
}
