"use client";

import { useEditorStore } from "@/application/useEditorStore";
import { useDroppable } from "@dnd-kit/core";
import { EditorNode } from "@/domain/models/Template";

interface NodeRendererProps {
  nodeId: string;
}

function NodeRenderer({ nodeId }: NodeRendererProps) {
  const node = useEditorStore((state) => state.data.nodes[nodeId]);
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const selectNode = useEditorStore((state) => state.selectNode);

  if (!node) return null;

  const isSelected = selectedNodeId === nodeId;
  const isContainer = node.type === "ROOT" || node.type === "CONTAINER";

  // Base Dropzone for containers
  const { setNodeRef, isOver } = useDroppable({
    id: nodeId,
    disabled: !isContainer,
    data: { acceptsChildren: isContainer },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(nodeId);
  };

  const wrapWithSelection = (children: React.ReactNode) => (
    <div
      ref={isContainer ? setNodeRef : null}
      onClick={handleClick}
      className={`relative transition-all ${
        isSelected ? "ring-2 ring-orange-500 ring-offset-2 z-10" : "hover:ring-1 hover:ring-slate-300"
      } ${isOver ? "bg-orange-50/50 outline outline-2 outline-orange-400 outline-dashed" : ""}`}
      style={{
        ...node.props.style,
        minHeight: isContainer && node.children.length === 0 ? "50px" : "auto",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {isSelected && node.type !== "ROOT" && (
        <div className="absolute -top-6 left-0 bg-orange-500 text-white text-xs px-2 py-1 rounded-t-md font-medium z-20">
          {node.type}
        </div>
      )}
      {children}
      {isContainer && node.children.length === 0 && (
        <div className="text-slate-400 text-sm text-center py-4 flex-1 flex items-center justify-center font-medium border-2 border-dashed border-transparent">
          Drop block here
        </div>
      )}
    </div>
  );

  switch (node.type) {
    case "TEXT":
      return wrapWithSelection(
        <div style={node.props.style}>
          {node.props.content || "Empty Text"}
        </div>
      );
    case "BUTTON":
      return wrapWithSelection(
        <a 
          href={node.props.href || "#"}
          onClick={(e) => e.preventDefault()} // prevent navigation in editor
          style={{
            display: "inline-block",
            padding: "12px 24px",
            backgroundColor: node.props.style?.backgroundColor || "#f97316",
            color: node.props.style?.color || "#ffffff",
            textDecoration: "none",
            borderRadius: "6px",
            textAlign: "center",
            fontWeight: "bold",
            ...node.props.style
          }}
        >
          {node.props.content || "Button"}
        </a>
      );
    case "IMAGE":
      return wrapWithSelection(
        <img 
          src={node.props.src || "https://placehold.co/600x400?text=Placeholder+Image"} 
          alt={node.props.alt || "Image"} 
          style={{
            maxWidth: "100%",
            height: "auto",
            display: "block",
            ...node.props.style
          }} 
        />
      );
    case "ROOT":
    case "CONTAINER":
      return wrapWithSelection(
        <>
          {node.children.map((childId) => (
            <NodeRenderer key={childId} nodeId={childId} />
          ))}
        </>
      );
    default:
      return null;
  }
}

export function EditorCanvas() {
  const rootNodeId = useEditorStore((state) => state.data.rootNodeId);
  const selectNode = useEditorStore((state) => state.selectNode);

  return (
    <div 
      className="flex-1 bg-slate-200/50 overflow-y-auto p-8 flex justify-center items-start"
      onClick={() => selectNode(null)}
    >
      {/* Email dimensions wrapper */}
      <div className="w-full max-w-[600px] min-h-[800px] bg-white shadow-xl rounded-sm">
        <NodeRenderer nodeId={rootNodeId} />
      </div>
    </div>
  );
}
