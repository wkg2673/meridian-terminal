export interface ChartTheme {
  up: string;
  down: string;
  brand: string;
  text: string;
  grid: string;
  border: string;
  crosshair: string;
  volumeUp: string;
  volumeDown: string;
  rsi: string;
  macd: string;
  macdSignal: string;
  bb: string;
  areaTop: string;
  areaBottom: string;
  surface: string;
}

export function getChartTheme(theme: "dark" | "light"): ChartTheme {
  if (theme === "light") {
    return {
      up: "#0d9f6e",
      down: "#dc2f3f",
      brand: "#3563e9",
      text: "#59626f",
      grid: "rgba(15, 23, 42, 0.06)",
      border: "#e2e6ec",
      crosshair: "rgba(15, 23, 42, 0.35)",
      volumeUp: "rgba(13, 159, 110, 0.35)",
      volumeDown: "rgba(220, 47, 63, 0.32)",
      rsi: "#0891b2",
      macd: "#2563eb",
      macdSignal: "#d97706",
      bb: "rgba(71, 85, 105, 0.55)",
      areaTop: "rgba(53, 99, 233, 0.22)",
      areaBottom: "rgba(53, 99, 233, 0)",
      surface: "#ffffff",
    };
  }

  return {
    up: "#1fc77f",
    down: "#f6465d",
    brand: "#5b8cff",
    text: "#7c8695",
    grid: "rgba(255, 255, 255, 0.045)",
    border: "#22272f",
    crosshair: "rgba(255, 255, 255, 0.3)",
    volumeUp: "rgba(31, 199, 127, 0.35)",
    volumeDown: "rgba(246, 70, 93, 0.32)",
    rsi: "#22d3ee",
    macd: "#38bdf8",
    macdSignal: "#f59e0b",
    bb: "rgba(148, 163, 184, 0.55)",
    areaTop: "rgba(91, 140, 255, 0.24)",
    areaBottom: "rgba(91, 140, 255, 0)",
    surface: "#0f1115",
  };
}

export const DRAWING_COLORS = ["#5b8cff", "#1fc77f", "#f6465d", "#f0b90b", "#a78bfa", "#e2e8f0"];
