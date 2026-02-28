"use client";

import { useState, useCallback } from "react";
import { useEditorStore } from "@/application/useEditorStore";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Plus, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

// ─── Node Renderer ───────────────────────────────────────────────────
interface NodeRendererProps {
  nodeId: string;
}

function NodeRenderer({ nodeId }: NodeRendererProps) {
  const node = useEditorStore((s) => s.data.nodes[nodeId]);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const selectNode = useEditorStore((s) => s.selectNode);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);

  const [localSize, setLocalSize] = useState<{
    width?: string;
    height?: string;
  } | null>(null);

  if (!node) return null;

  const isSelected = selectedNodeId === nodeId;
  const isContainer =
    node.type === "ROOT" ||
    node.type === "CONTAINER" ||
    node.type === "CARD";

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
    disabled: node.type === "ROOT",
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

  // ── Computed styles ────
  const draggingStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const merged: Record<string, string | undefined> = {
    ...node.props.style,
    ...localSize,
  };

  const widthLabel = colLabel(merged.width);
  const isAbsolute = node.props.style?.position === "absolute";

  // ── Wrapper ────
  const wrapWithSelection = (children: React.ReactNode) => (
    <div
      id={`node-${nodeId}`}
      ref={setNodeRef}
      onClick={handleClick}
      className={[
        "relative group/node transition-shadow",
        isSelected
          ? "ring-2 ring-primary ring-offset-2 z-10"
          : "hover:ring-1 hover:ring-muted-foreground/30",
        isOver && isContainer
          ? "outline-2 outline-dashed outline-primary bg-primary/5"
          : "",
        node.type === "ROOT"
          ? "flex flex-col min-h-full w-full"
          : "",
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
          left: merged.left || "0px",
          top: merged.top || "0px",
          zIndex: Number(merged.zIndex) || 10,
        } : {}),
      }}
      {...(node.type !== "ROOT" ? attributes : {})}
      {...(node.type !== "ROOT" ? listeners : {})}
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
            {node.children.map((cid) => (
              <NodeRenderer key={cid} nodeId={cid} />
            ))}
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
    case "CARD":
      return wrapWithSelection(
        <SortableContext
          items={node.children}
          strategy={verticalListSortingStrategy}
        >
          <div
            style={{ width: "100%", ...merged }}
            className="flex flex-col gap-2 bg-card text-card-foreground shadow-sm border border-border rounded-lg overflow-hidden"
          >
            {node.props.cardTitle && (
              <div className="px-6 pt-6 pb-0">
                <h3 className="text-base font-semibold leading-none tracking-tight">
                  {node.props.cardTitle}
                </h3>
                {node.props.cardDescription && (
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {node.props.cardDescription}
                  </p>
                )}
              </div>
            )}
            <div className="px-6 py-4 flex flex-col gap-2">
              {node.children.map((cid) => (
                <NodeRenderer key={cid} nodeId={cid} />
              ))}
              {node.children.length === 0 && (
                <div className="text-muted-foreground text-sm py-4 w-full text-center">
                  Add content to card
                </div>
              )}
            </div>
          </div>
        </SortableContext>,
      );

    /* ── Table (shadcn table) ── */
    case "TABLE": {
      const headers = node.props.headers || ["Header 1", "Header 2", "Header 3"];
      const rows = node.props.rows || [
        ["Cell 1", "Cell 2", "Cell 3"],
        ["Cell 4", "Cell 5", "Cell 6"],
      ];
      return wrapWithSelection(
        <div
          className="w-full overflow-x-auto rounded-md border border-border"
          style={merged}
        >
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                {headers.map((h: string, i: number) => (
                  <th
                    key={i}
                    className="h-10 px-4 text-left align-middle font-medium text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: string[], ri: number) => (
                <tr
                  key={ri}
                  className="border-b border-border transition-colors hover:bg-muted/50"
                >
                  {row.map((cell: string, ci: number) => (
                    <td key={ci} className="p-4 align-middle">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
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
          {node.children.map((cid) => (
            <NodeRenderer key={cid} nodeId={cid} />
          ))}
        </SortableContext>,
      );

    default:
      return null;
  }
}

// ─── Canvas Shell ────────────────────────────────────────────────────
export function EditorCanvas({ themeCSS }: { themeCSS?: string }) {
  const rootNodeId = useEditorStore((s) => s.data.rootNodeId);
  const selectNode = useEditorStore((s) => s.selectNode);

  const scopedCSS = themeCSS
    ? themeCSS
        .replace(/:root/g, ".email-editor-preview")
        .replace(/\.dark/g, ".email-editor-preview.dark")
    : "";

  return (
    <div
      className="flex-1 bg-muted/40 overflow-y-auto p-8 flex justify-center items-start"
      onClick={() => selectNode(null)}
    >
      <style>{scopedCSS}</style>

      {/* 12-col grid overlay guide (visible only while hovering canvas) */}
      <div className="w-full max-w-150 min-h-200 bg-background shadow-xl rounded-sm email-editor-preview flex flex-col relative group/canvas">
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
  );
}
