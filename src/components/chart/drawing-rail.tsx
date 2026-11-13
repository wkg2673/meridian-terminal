"use client";

import { useMemo } from "react";
import {
  Eraser,
  Layers,
  Minus,
  MousePointer2,
  MoveVertical,
  Palette,
  Ruler,
  Square,
  Trash2,
  TrendingUp,
  Type,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateLabel, formatPrice } from "@/lib/format";
import { getAsset } from "@/lib/market/assets";
import { getTimeframe } from "@/lib/market/types";
import {
  useDrawingsForSymbol,
  useTerminal,
  type DrawingTool,
  type DrawingType,
} from "@/stores/terminal-store";
import { cn } from "@/lib/utils";

const TOOLS: Array<{ id: DrawingTool; label: string; icon: LucideIcon; hotkey?: string }> = [
  { id: "cursor", label: "Cursor", icon: MousePointer2, hotkey: "V" },
  { id: "trendline", label: "Trend line", icon: TrendingUp, hotkey: "T" },
  { id: "horizontal", label: "Horizontal line", icon: Minus, hotkey: "H" },
  { id: "vertical", label: "Vertical line", icon: MoveVertical },
  { id: "rectangle", label: "Rectangle", icon: Square, hotkey: "R" },
  { id: "text", label: "Text note", icon: Type },
  { id: "fib", label: "Fibonacci retracement", icon: Ruler, hotkey: "F" },
];

const COLORS = ["#5b8cff", "#1fc77f", "#f6465d", "#f0b90b", "#a78bfa", "#e2e8f0"];

const SHAPE_LABEL: Record<DrawingType, string> = {
  trendline: "Trend line",
  horizontal: "Horizontal",
  vertical: "Vertical",
  rectangle: "Rectangle",
  text: "Text",
  fib: "Fibonacci",
};

export function DrawingRail() {
  const activeTool = useTerminal((state) => state.activeTool);
  const setActiveTool = useTerminal((state) => state.setActiveTool);
  const drawingColor = useTerminal((state) => state.drawingColor);
  const setDrawingColor = useTerminal((state) => state.setDrawingColor);
  const selectedDrawingId = useTerminal((state) => state.selectedDrawingId);
  const selectDrawing = useTerminal((state) => state.selectDrawing);
  const removeDrawing = useTerminal((state) => state.removeDrawing);
  const clearDrawings = useTerminal((state) => state.clearDrawings);
  const symbol = useTerminal((state) => state.symbol);
  const timeframe = useTerminal((state) => state.timeframe);
  const objectPanelOpen = useTerminal((state) => state.objectPanelOpen);
  const setObjectPanelOpen = useTerminal((state) => state.setObjectPanelOpen);
  const drawings = useDrawingsForSymbol();
  const asset = getAsset(symbol);

  const groups = useMemo(() => {
    const counts: Partial<Record<DrawingType, number>> = {};
    for (const drawing of drawings) counts[drawing.type] = (counts[drawing.type] ?? 0) + 1;
    return counts;
  }, [drawings]);

  return (
    <aside
      className="hidden w-11 shrink-0 flex-col items-center gap-0.5 border-r border-border bg-surface py-2 lg:flex"
      aria-label="Drawing tools"
    >
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const active = activeTool === tool.id;
        const count = tool.id === "cursor" ? 0 : (groups[tool.id as DrawingType] ?? 0);
        return (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setActiveTool(tool.id)}
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  active
                    ? "bg-brand/15 text-brand"
                    : "text-subtle hover:bg-foreground/[0.055] hover:text-foreground",
                )}
                aria-pressed={active}
                aria-label={tool.label}
              >
                <Icon className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-brand/95 px-0.5 text-[8px] font-semibold text-white">
                    {count}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {tool.label}
              {tool.hotkey && <span className="ml-1.5 font-mono text-3xs text-subtle">{tool.hotkey}</span>}
            </TooltipContent>
          </Tooltip>
        );
      })}

      <span className="my-1.5 h-px w-5 bg-border" />

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md text-subtle transition-colors hover:bg-foreground/[0.055] hover:text-foreground"
            aria-label="Drawing color"
          >
            <span className="relative flex h-4 w-4 items-center justify-center">
              <Palette className="absolute h-3.5 w-3.5" />
              <span
                className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-surface"
                style={{ background: drawingColor }}
              />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-auto p-2">
          <p className="px-1 pb-2 text-2xs font-medium text-muted">Drawing color</p>
          <div className="flex items-center gap-1.5">
            {COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setDrawingColor(color)}
                className={cn(
                  "h-5 w-5 rounded-full border-2 transition-transform hover:scale-110",
                  drawingColor === color ? "border-foreground" : "border-transparent",
                )}
                style={{ background: color }}
                aria-label={`Use color ${color}`}
                aria-pressed={drawingColor === color}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={objectPanelOpen} onOpenChange={setObjectPanelOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative flex h-8 w-8 items-center justify-center rounded-md text-subtle transition-colors hover:bg-foreground/[0.055] hover:text-foreground"
            aria-label={`Chart objects (${drawings.length})`}
          >
            <Layers className="h-4 w-4" />
            {drawings.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-foreground px-0.5 text-[8px] font-semibold text-background">
                {drawings.length}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="w-64 p-0">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-2xs font-medium text-foreground">Chart objects</p>
            <span className="font-mono text-3xs text-subtle">{drawings.length}</span>
          </div>
          {drawings.length === 0 ? (
            <p className="px-3 py-6 text-center text-2xs leading-relaxed text-subtle">
              No drawings yet. Pick a tool from the rail and click the chart to place one.
            </p>
          ) : (
            <>
              <ScrollArea className="max-h-64">
                <ul className="p-1">
                  {drawings.map((drawing) => (
                    <li key={drawing.id}>
                      <div
                        className={cn(
                          "group flex items-center gap-2 rounded-md px-2 py-1.5 text-2xs transition-colors",
                          selectedDrawingId === drawing.id ? "bg-foreground/[0.06]" : "hover:bg-foreground/[0.04]",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            selectDrawing(drawing.id);
                            setObjectPanelOpen(false);
                          }}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: drawing.color }} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-foreground">
                              {SHAPE_LABEL[drawing.type]}
                              {drawing.text ? `: ${drawing.text}` : ""}
                            </span>
                            <span className="block truncate text-3xs text-subtle">
                              {formatDateLabel(drawing.points[0]?.time ?? 0, getTimeframe(timeframe).intraday)}
                              {drawing.points[0] && ` · ${formatPrice(drawing.points[0].price, asset)}`}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDrawing(drawing.id)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-subtle opacity-0 transition-opacity hover:bg-bearish/10 hover:text-bearish group-hover:opacity-100"
                          aria-label="Delete drawing"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
              <div className="border-t border-border p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    clearDrawings();
                    setObjectPanelOpen(false);
                    toast.message("All drawings removed from this chart");
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-2xs text-muted transition-colors hover:bg-bearish/10 hover:text-bearish"
                >
                  <Eraser className="h-3 w-3" />
                  Clear all drawings
                </button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    </aside>
  );
}
