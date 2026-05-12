import { leaningBadgeClasses, leaningBadgeLight } from "../../utils/leaning";
import { useTheme } from "../../context/ThemeContext";

export function LeaningPill({ leaning }: { leaning: string | null | undefined }) {
  const { theme } = useTheme();
  const label = leaning || "unknown";
  const lightExtra = theme === "light" ? leaningBadgeLight(label) : "";
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${leaningBadgeClasses(label)} ${lightExtra}`}
    >
      {label}
    </span>
  );
}