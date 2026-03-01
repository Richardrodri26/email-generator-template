"use client";

import { useState, useCallback, createContext, useContext, Fragment } from "react";
import { useEditorStore } from "@/application/useEditorStore";
import { useEmailDarkModeStore } from "@/application/useEmailDarkModeStore";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

// ─── Drag State Context ───────────────────────────────────────────────
interface DragState {
  overNodeId: string | null;
  dropAbove: boolean;
  activeDragId: string | null;
}

export const EditorDragContext = createContext<DragState>({
  overNodeId: null,
  dropAbove: true,
  activeDragId: null,
});

// ─── Drop Indicator ───────────────────────────────────────────────────
function DropIndicator() {
  return (
    <div
      data-testid="drop-indicator"
      className="pointer-events-none relative h-0.5 bg-primary rounded-full mx-1 my-0.5 z-30"
    >
      <div className="absolute -left-1 -top-[5px] w-3 h-3 rounded-full bg-primary border-2 border-background shadow" />
    </div>
  );
}
import { Plus, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// ─── 12-Column Grid Helpers ──────────────────────────────────────────
const GRID_COLS = 12;
const COL_PCT = 100 / GRID_COLS; // 8.333…

function snapToGrid(pxWidth: number, containerWidth: number): string {
  const pct = (pxWidth / containerWidth) * 100;
  const cols = Math.max(1, Math.min(GRID_COLS, Math.round(pct / COL_PCT)));
  return `${((cols / GRID_COLS) * 100).toFixed(4)}%`;
}

function colLabel(width?: string): string | null {
  if (!width || !width.endsWith("%")) return null;
  const pct = parseFloat(width);
  const cols = Math.round((pct / 100) * GRID_COLS);
  return `${cols}/${GRID_COLS}`;
}

// ─── Container Children with Drop Indicators ─────────────────────────
function ContainerChildren({ childIds, nodeId: _parentId }: { childIds: string[]; nodeId: string }) {
  const { overNodeId, dropAbove, activeDragId } = useContext(EditorDragContext);

  return (
    <>
      {childIds.map((cid) => {
        const isActive = cid === activeDragId;
        const isOver = cid === overNodeId && !isActive;
        return (
          <Fragment key={cid}>
            {isOver && dropAbove && <DropIndicator />}
            <NodeRenderer nodeId={cid} />
            {isOver && !dropAbove && <DropIndicator />}
          </Fragment>
        );
      })}
    </>
  );
}

// ─── Node Renderer ───────────────────────────────────────────────────
interface NodeRendererProps {
  nodeId: string;
}

function NodeRenderer({ nodeId }: NodeRendererProps) {
  const node = useEditorStore((s) => s.data.nodes[nodeId]);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const selectNode = useEditorStore((s) => s.selectNode);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);

  const { previewDark } = useEmailDarkModeStore();

  const [localSize, setLocalSize] = useState<{
    width?: string;
    height?: string;
  } | null>(null);
  const [localPosition, setLocalPosition] = useState<{ left: string; top: string } | null>(null);

  if (!node) return null;

  const isSelected = selectedNodeId === nodeId;
  const isContainer =
    node.type === "ROOT" ||
    node.type === "CONTAINER" ||
    node.type === "CARD";

  const isAbsolute = node.props.style?.position === "absolute";

  const {
    setNodeRef,
    isOver,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: nodeId,
    data: {
      type: node.type,
      nodeId,
      acceptsChildren: isContainer,
    },
    disabled: node.type === "ROOT" || isAbsolute,
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(nodeId);
  };

  // ── Resize via pointer events ────
  const startResize = useCallback(
    (e: React.PointerEvent, dir: "h" | "v" | "both") => {
      e.stopPropagation();
      e.preventDefault();

      const el = document.getElementById(`node-${nodeId}`);
      if (!el) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = el.offsetWidth;
      const startH = el.offsetHeight;
      const parentW = el.parentElement?.clientWidth || 600;

      const move = (ev: PointerEvent) => {
        ev.preventDefault();
        const s: Record<string, string> = {};
        if (dir !== "v") s.width = snapToGrid(startW + (ev.clientX - startX), parentW);
        if (dir !== "h") s.height = `${Math.max(20, startH + (ev.clientY - startY))}px`;
        setLocalSize(s);
      };

      const up = (ev: PointerEvent) => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);

        const s: Record<string, string> = {};
        if (dir !== "v") s.width = snapToGrid(startW + (ev.clientX - startX), parentW);
        if (dir !== "h") s.height = `${Math.max(20, startH + (ev.clientY - startY))}px`;

        updateNodeProps(nodeId, {
          style: { ...node.props.style, ...s },
        });
        setLocalSize(null);
      };

      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [nodeId, node.props.style, updateNodeProps],
  );

  // ── Drag overlay elements ────
  const startDragPosition = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = parseFloat(node.props.style?.left ?? "") || 0;
      const startTop = parseFloat(node.props.style?.top ?? "") || 0;

      const move = (ev: PointerEvent) => {
        ev.preventDefault();
        setLocalPosition({
          left: `${startLeft + (ev.clientX - startX)}px`,
          top: `${startTop + (ev.clientY - startY)}px`,
        });
      };

      const up = (ev: PointerEvent) => {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        const newLeft = `${startLeft + (ev.clientX - startX)}px`;
        const newTop = `${startTop + (ev.clientY - startY)}px`;
        updateNodeProps(nodeId, {
          style: { ...node.props.style, left: newLeft, top: newTop },
        });
        setLocalPosition(null);
      };

      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    },
    [nodeId, node.props.style, updateNodeProps],
  );

  // ── Computed styles ────
  const draggingStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const merged: Record<string, string | undefined> = {
    ...node.props.style,
    ...(previewDark && node.props.darkStyle ? node.props.darkStyle : {}),
    ...localSize,
    ...(localPosition ?? {}),
  };

  const widthLabel = colLabel(merged.width);

  // ── Per-type border-radius class (so ring follows node shape) ────
  const nodeRoundedClass =
    node.type === "BUTTON" ? "rounded-md" :
    node.type === "CARD" ? "rounded-xl" :
    node.type === "IMAGE" ? "rounded-[var(--radius)]" :
    "";

  // ── Wrapper ────
  const wrapWithSelection = (children: React.ReactNode) => (
    <div
      id={`node-${nodeId}`}
      ref={setNodeRef}
      onClick={handleClick}
      className={[
        "relative group/node transition-shadow",
        nodeRoundedClass,
        isSelected
          ? "ring-2 ring-primary ring-offset-2 z-10"
          : "hover:ring-1 hover:ring-muted-foreground/30",
        isOver && isContainer
          ? "outline-2 outline-dashed outline-primary bg-primary/5"
          : "",
        node.type === "ROOT"
          ? "flex flex-col flex-1 w-full"
          : "",
        isAbsolute ? "cursor-move" : "",
      ].join(" ")}
      style={{
        ...merged,
        ...draggingStyle,
        minHeight:
          node.type === "ROOT"
            ? "100%"
            : isContainer && node.children.length === 0
              ? "60px"
              : undefined,
        position: isAbsolute ? "absolute" : "relative",
        ...(isAbsolute ? {
          touchAction: "none",
          left: merged.left || "0px",
          top: merged.top || "0px",
          zIndex: Number(merged.zIndex) || 10,
        } : {}),
      }}
      {...(node.type !== "ROOT" && !isAbsolute ? attributes : {})}
      {...(node.type !== "ROOT" && !isAbsolute ? listeners : {})}
      onPointerDown={isAbsolute ? startDragPosition : undefined}
    >
      {/* ── Label (visible on hover + selection) ── */}
      {node.type !== "ROOT" && (
        <div className={cn(
          "absolute -top-6 left-0 flex items-center gap-1.5 z-20 pointer-events-none",
          "opacity-0 group-hover/node:opacity-100 transition-opacity",
          isSelected && "opacity-100"
        )}>
          <span className={cn(
            "text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-t-md",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground border border-border"
          )}>
            {node.type}
          </span>
          {isSelected && widthLabel && (
            <span className="bg-muted text-muted-foreground text-[10px] font-mono px-1.5 py-0.5 rounded-sm">
              {widthLabel}
            </span>
          )}
          {isAbsolute && (
            <span className="text-[9px] font-mono bg-yellow-100 text-yellow-700 border border-yellow-300 px-1 py-0.5 rounded ml-1">
              floating
            </span>
          )}
        </div>
      )}

      {/* ── Resize handles (pill-shaped, visible on selection) ── */}
      {isSelected && node.type !== "ROOT" && (
        <>
          {/* Right handle — pill vertical */}
          <div
            className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-7 bg-primary rounded-full cursor-e-resize z-20 shadow border-2 border-background"
            onPointerDown={(e) => startResize(e, "h")}
          />
          {/* Bottom handle — pill horizontal */}
          <div
            className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-7 h-2.5 bg-primary rounded-full cursor-s-resize z-20 shadow border-2 border-background"
            onPointerDown={(e) => startResize(e, "v")}
          />
          {/* Corner handle */}
          <div
            className="absolute -right-2 -bottom-2 w-4 h-4 bg-primary rounded-full cursor-se-resize z-20 shadow border-2 border-background"
            onPointerDown={(e) => startResize(e, "both")}
          />
        </>
      )}

      {children}

      {/* Empty container placeholder */}
      {isContainer && node.children.length === 0 && (
        <div className="text-muted-foreground/60 text-sm text-center py-10 w-full flex flex-col items-center gap-2 border-2 border-dashed border-muted-foreground/20 rounded-md pointer-events-none select-none">
          <Plus className="h-5 w-5 text-muted-foreground/30" />
          <span>Drag a block here</span>
        </div>
      )}
    </div>
  );

  // ── Per-type rendering ─────────────────────────────────────────────
  switch (node.type) {
    /* ── Text ── */
    case "TEXT":
      return wrapWithSelection(
        <div style={merged} className="text-foreground">
          {node.props.content || (
            <span className="italic text-muted-foreground/50 text-sm select-none">
              Edit text in the properties panel →
            </span>
          )}
        </div>,
      );

    /* ── Button ── */
    case "BUTTON": {
      // Only pass inline overrides when the user has set a custom value
      // (i.e. not the Shadcn CSS-variable defaults). This lets Shadcn's
      // own Tailwind classes (hover, focus, etc.) work normally.
      const SHADCN_DEFAULTS = ["var(--primary)", "var(--primary-foreground)"];
      const customBg = merged.backgroundColor && !SHADCN_DEFAULTS.includes(merged.backgroundColor)
        ? merged.backgroundColor : undefined;
      const customColor = merged.color && !SHADCN_DEFAULTS.includes(merged.color)
        ? merged.color : undefined;

      return wrapWithSelection(
        <Button
          style={{
            backgroundColor: customBg,
            color: customColor,
            width: merged.width || undefined,
          }}
          className="pointer-events-none"
        >
          {node.props.content || "Button"}
        </Button>,
      );
    }

    /* ── Image ── */
    case "IMAGE": {
      const isPlaceholder =
        !node.props.src || node.props.src.includes("placehold.co");
      return wrapWithSelection(
        isPlaceholder ? (
          <div
            style={{ width: merged.width || "100%" }}
            className="flex flex-col items-center justify-center gap-3 bg-muted/50 border border-dashed border-border rounded-[var(--radius)] text-muted-foreground py-14"
          >
            <ImageIcon className="h-10 w-10 opacity-25" />
            <span className="text-xs text-muted-foreground/60 select-none">
              Set an image URL in the properties panel →
            </span>
          </div>
        ) : (
          <img
            src={node.props.src}
            alt={node.props.alt || "Image"}
            style={{ maxWidth: "100%", display: "block", ...merged }}
          />
        ),
      );
    }

    /* ── Divider ── */
    case "DIVIDER":
      return wrapWithSelection(<Separator style={merged} />);

    /* ── Spacer ── */
    case "SPACER":
      return wrapWithSelection(
        <div
          style={{
            width: "100%",
            ...merged,
            height: merged.height || node.props.height || "40px",
          }}
          className="relative"
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/node:opacity-100 pointer-events-none transition-opacity">
            <Badge variant="outline" className="text-[10px] font-mono tabular-nums">
              {merged.height || node.props.height || "40px"}
            </Badge>
          </div>
        </div>,
      );

    /* ── Columns ── */
    case "COLUMNS":
      return wrapWithSelection(
        <SortableContext
          items={node.children}
          strategy={verticalListSortingStrategy}
        >
          <div
            style={{
              display: "flex",
              gap: "16px",
              width: "100%",
              ...merged,
            }}
          >
            <ContainerChildren nodeId={nodeId} childIds={node.children} />
          </div>
        </SortableContext>,
      );

    /* ── Social ── */
    case "SOCIAL": {
      const socialLinks = [
        { label: "f", bg: "#1877F2", title: "Facebook" },
        { label: "𝕏", bg: "#000000", title: "X (Twitter)" },
        { label: "in", bg: "#0A66C2", title: "LinkedIn" },
        { label: "ig", bg: "#E1306C", title: "Instagram" },
      ];
      return wrapWithSelection(
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            padding: "12px",
            ...merged,
          }}
        >
          {socialLinks.map(({ label, bg, title }) => (
            <div
              key={title}
              title={title}
              style={{ backgroundColor: bg }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ring-1 ring-black/10"
            >
              {label}
            </div>
          ))}
        </div>,
      );
    }

    /* ── Card (shadcn card) ── */
    case "CARD": {
      const customCardBg = merged.backgroundColor ?? undefined;
      return wrapWithSelection(
        <SortableContext items={node.children} strategy={verticalListSortingStrategy}>
          <Card style={{ width: "100%", backgroundColor: customCardBg }}>
            {(node.props.cardTitle || node.props.cardDescription) && (
              <CardHeader>
                {node.props.cardTitle && <CardTitle>{node.props.cardTitle}</CardTitle>}
                {node.props.cardDescription && (
                  <CardDescription>{node.props.cardDescription}</CardDescription>
                )}
              </CardHeader>
            )}
            <CardContent>
              <ContainerChildren nodeId={nodeId} childIds={node.children} />
            </CardContent>
          </Card>
        </SortableContext>,
      );
    }

    /* ── Table (shadcn table) ── */
    case "TABLE": {
      const headers = node.props.headers || ["Header 1", "Header 2", "Header 3"];
      const rows = node.props.rows || [
        ["Cell 1", "Cell 2", "Cell 3"],
        ["Cell 4", "Cell 5", "Cell 6"],
      ];
      return wrapWithSelection(
        <div className="rounded-md border w-full">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((h: string, i: number) => (
                  <TableHead key={i}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row: string[], ri: number) => (
                <TableRow key={ri}>
                  {row.map((cell: string, ci: number) => (
                    <TableCell key={ci}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>,
      );
    }

    /* ── Badge ── */
    case "BADGE": {
      const variantMap: Record<string, string> = {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-input text-foreground",
        destructive: "bg-destructive text-white",
      };
      const v = node.props.variant || "default";
      return wrapWithSelection(
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
            variantMap[v] || variantMap.default
          )}
          style={node.props.style}
        >
          {node.props.content || "Badge"}
        </span>
      );
    }

    /* ── Chart ── */
    case "CHART": {
      const chartData = node.props.data || [
        { name: "A", value: 4000 },
        { name: "B", value: 3000 },
        { name: "C", value: 5000 },
      ];
      const colors = node.props.colors || ["#f97316", "#60a5fa", "#34d399", "#f59e0b"];
      const chartType = node.props.chartType || "bar";

      const chartStyle = {
        width: "100%",
        height: 260,
        ...node.props.style,
      };

      let chartEl: React.ReactNode;
      if (chartType === "line") {
        chartEl = (
          <ResponsiveContainer width="100%" height={chartStyle.height as number}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
      } else if (chartType === "pie") {
        chartEl = (
          <ResponsiveContainer width="100%" height={chartStyle.height as number}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {chartData.map((_: any, i: number) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      } else {
        chartEl = (
          <ResponsiveContainer width="100%" height={chartStyle.height as number}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value">
                {chartData.map((_: any, i: number) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      }

      return wrapWithSelection(
        <div style={{ width: "100%", padding: "8px 0" }}>
          {node.props.chartTitle && (
            <p className="text-sm font-semibold text-foreground mb-2 px-1">{node.props.chartTitle}</p>
          )}
          {chartEl}
        </div>
      );
    }

    /* ── Root / Container ── */
    case "ROOT":
    case "CONTAINER":
      return wrapWithSelection(
        <SortableContext
          items={node.children}
          strategy={verticalListSortingStrategy}
        >
          <ContainerChildren nodeId={nodeId} childIds={node.children} />
        </SortableContext>,
      );

    default:
      return null;
  }
}

// ─── Canvas Shell ────────────────────────────────────────────────────
interface EditorCanvasProps {
  themeCSS?: string;
  overNodeId?: string | null;
  dropAbove?: boolean;
  activeDragId?: string | null;
}

export function EditorCanvas({ themeCSS, overNodeId = null, dropAbove = true, activeDragId = null }: EditorCanvasProps) {
  const rootNodeId = useEditorStore((s) => s.data.rootNodeId);
  const selectNode = useEditorStore((s) => s.selectNode);
  const { previewDark } = useEmailDarkModeStore();

  const scopedCSS = themeCSS
    ? themeCSS
        .replace(/:root/g, ".email-editor-preview")
        .replace(/\.dark/g, ".email-editor-preview.dark")
    : "";

  return (
    <EditorDragContext.Provider value={{ overNodeId, dropAbove, activeDragId }}>
      <div
        className="flex-1 bg-muted/40 overflow-y-auto p-8 flex justify-center items-start"
        onClick={() => selectNode(null)}
      >
        <style>{scopedCSS}</style>

        {/* 12-col grid overlay guide (visible only while hovering canvas) */}
        <div
          className={cn(
            "w-full max-w-150 min-h-200 bg-background shadow-xl rounded-sm email-editor-preview flex flex-col relative group/canvas",
            previewDark && "dark"
          )}
        >
          {/* Grid guide lines */}
          <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-300 z-0">
            <div className="h-full w-full flex">
              {Array.from({ length: GRID_COLS }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 border-r border-primary/4 last:border-r-0"
                />
              ))}
            </div>
          </div>

          {/* Actual content */}
          <div className="relative z-1 flex-1 flex flex-col">
            <NodeRenderer nodeId={rootNodeId} />
          </div>
        </div>
      </div>
    </EditorDragContext.Provider>
  );
}
