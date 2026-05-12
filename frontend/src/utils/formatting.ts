export function formatPercentage(decimal: number | null | undefined): string {
  if (decimal == null || !Number.isFinite(decimal) || Number.isNaN(decimal)) {
    return "—";
  }
  return `${(decimal * 100).toFixed(0)}%`;
}

export function getStoryMatchLabel(decimal: number | null | undefined): string {
  if (decimal == null || !Number.isFinite(decimal) || Number.isNaN(decimal)) {
    return "Unknown";
  }
  if (decimal >= 0.9) return "Very Strong Match";
  if (decimal >= 0.75) return "Strong Match";
  if (decimal >= 0.5) return "Moderate Match";
  return "Weak Match";
}

export function formatStoryMatch(decimal: number | null | undefined): string {
  if (decimal == null || !Number.isFinite(decimal) || Number.isNaN(decimal)) {
    return "—";
  }
  return `${formatPercentage(decimal)} — ${getStoryMatchLabel(decimal)}`;
}

/** Generate a human-readable coverage description based on source count and diversity. */
export function getCoverageDescription(sourceCount: number, avgSim: number | null): string {
  const sim = avgSim ?? 0.5;
  
  if (sourceCount >= 6) {
    if (sim >= 0.85) return "Broad consensus across major outlets";
    if (sim >= 0.7) return "Wide coverage with framing variation";
    return "Extensive coverage, divergent narratives";
  }
  if (sourceCount >= 3) {
    if (sim >= 0.85) return "Strong cross-outlet alignment";
    if (sim >= 0.7) return "Multi-source with moderate variation";
    return "Mixed editorial perspectives";
  }
  if (sourceCount >= 2) {
    if (sim >= 0.85) return "Consistent dual-source framing";
    return "Limited cross-reference data";
  }
  return "Single source — verification pending";
}

/** Simple coverage breadth indicator. */
export function getCoverageBreadth(sourceCount: number): string {
  if (sourceCount >= 6) return "Wide Coverage";
  if (sourceCount >= 3) return "Multi-Source";
  if (sourceCount >= 2) return "Dual-Source";
  return "Single Source";
}

export function getAlignmentLabel(decimal: number | null | undefined): string {
  if (decimal == null || !Number.isFinite(decimal) || Number.isNaN(decimal)) {
    return "Insufficient data";
  }
  if (decimal >= 0.9) return "Coverage Match";
  if (decimal >= 0.85) return "Narrative Agreement";
  if (decimal >= 0.75) return "Cross-source Alignment";
  if (decimal >= 0.65) return "Mixed Alignment";
  if (decimal >= 0.5) return "Divergent Framing";
  return "Low Alignment";
}
