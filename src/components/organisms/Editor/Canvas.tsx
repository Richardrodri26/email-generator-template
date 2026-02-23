"use client";

import { useState, useCallback } from "react";
import { useEditorStore } from "@/application/useEditorStore";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
        position: "relative",
      }}
      {...(node.type !== "ROOT" ? attributes : {})}
      {...(node.type !== "ROOT" ? listeners : {})}
    >
      {/* ── Selection chrome ── */}
      {isSelected && node.type !== "ROOT" && (
        <>
          {/* Label badge */}
          <div className="absolute -top-6 left-0 flex items-center gap-1.5 z-20 pointer-events-none">
            <span className="bg-primary text-primary-foreground text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-t-md">
              {node.type}
            </span>
            {widthLabel && (
              <span className="bg-muted text-muted-foreground text-[10px] font-mono px-1.5 py-0.5 rounded-sm">
                {widthLabel}
              </span>
            )}
          </div>

          {/* Resize handles */}
          <div
            className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full cursor-e-resize z-20 shadow border border-background"
            onPointerDown={(e) => startResize(e, "h")}
          />
          <div
            className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-primary rounded-full cursor-s-resize z-20 shadow border border-background"
            onPointerDown={(e) => startResize(e, "v")}
          />
          <div
            className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-primary rounded-full cursor-se-resize z-20 shadow border border-background"
            onPointerDown={(e) => startResize(e, "both")}
          />
        </>
      )}

      {children}

      {/* Empty container placeholder */}
      {isContainer && node.children.length === 0 && (
        <div className="text-muted-foreground/60 text-sm text-center py-8 w-full flex items-center justify-center font-medium border-2 border-dashed border-muted-foreground/20 rounded-md pointer-events-none select-none">
          Drop block here
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
          {node.props.content || "Empty Text"}
        </div>,
      );

    /* ── Button (shadcn-like) ── */
    case "BUTTON":
      return wrapWithSelection(
        <a
          href={node.props.href || "#"}
          onClick={(e) => e.preventDefault()}
          style={merged}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 no-underline transition-colors"
        >
          {node.props.content || "Button"}
        </a>,
      );

    /* ── Image ── */
    case "IMAGE":
      return wrapWithSelection(
        <img
          src={node.props.src || "https://placehold.co/600x400?text=Image"}
          alt={node.props.alt || "Image"}
          style={{ maxWidth: "100%", display: "block", ...merged }}
        />,
      );

    /* ── Divider (shadcn border token) ── */
    case "DIVIDER":
      return wrapWithSelection(
        <hr
          className="w-full border-t border-border"
          style={merged}
        />,
      );

    /* ── Spacer ── */
    case "SPACER":
      return wrapWithSelection(
        <div
          style={{
            width: "100%",
            ...merged,
            height: merged.height || node.props.height || "40px",
          }}
        />,
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
    case "SOCIAL":
      return wrapWithSelection(
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            padding: "10px",
            ...merged,
          }}
        >
          <div className="bg-[#3b5998] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
            f
          </div>
          <div className="bg-[#1da1f2] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
            t
          </div>
          <div className="bg-[#2867B2] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
            in
          </div>
        </div>,
      );

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
