"use client";

import { useEditorStore } from "@/application/useEditorStore";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

  const { setNodeRef, isOver, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: nodeId,
    data: { 
      type: node.type,
      nodeId,
      acceptsChildren: isContainer 
    },
    disabled: node.type === "ROOT", // Root cannot be moved
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(nodeId);
  };

  const draggingStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const wrapWithSelection = (children: React.ReactNode) => (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      className={`relative transition-all ${
        isSelected ? "ring-2 ring-orange-500 ring-offset-2 z-10" : "hover:ring-1 hover:ring-slate-300"
      } ${isOver && isContainer ? "bg-orange-50/50 outline outline-2 outline-orange-400 outline-dashed" : ""}`}
      style={{
        ...node.props.style,
        ...draggingStyle,
        minHeight: isContainer && node.children.length === 0 ? "50px" : "auto",
        position: "relative",
      }}
      {...(node.type !== "ROOT" ? attributes : {})}
      {...(node.type !== "ROOT" ? listeners : {})}
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
    case "DIVIDER":
      return wrapWithSelection(
        <hr style={{ width: "100%", borderTop: "1px solid #e5e7eb", borderBottom: "none", borderLeft: "none", borderRight: "none", margin: "20px 0", ...node.props.style }} />
      );
    case "SPACER":
      return wrapWithSelection(
        <div style={{ height: node.props.height || "40px", width: "100%", ...node.props.style }}></div>
      );
    case "COLUMNS":
      return wrapWithSelection(
        <SortableContext items={node.children} strategy={verticalListSortingStrategy}>
          <div style={{ display: "flex", gap: "20px", flexDirection: "row", width: "100%", ...node.props.style }}>
            {node.children.map((childId) => (
              <NodeRenderer key={childId} nodeId={childId} />
            ))}
          </div>
        </SortableContext>
      );
    case "SOCIAL":
      return wrapWithSelection(
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", padding: "10px", ...node.props.style }}>
          <div style={{ width: 32, height: 32, backgroundColor: "#3b5998", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: "bold", textDecoration: "none" }}>f</div>
          <div style={{ width: 32, height: 32, backgroundColor: "#1da1f2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: "bold", textDecoration: "none" }}>t</div>
          <div style={{ width: 32, height: 32, backgroundColor: "#2867B2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: "bold", textDecoration: "none" }}>in</div>
        </div>
      );
    case "ROOT":
    case "CONTAINER":
      return wrapWithSelection(
        <SortableContext items={node.children} strategy={verticalListSortingStrategy}>
          {node.children.map((childId) => (
            <NodeRenderer key={childId} nodeId={childId} />
          ))}
        </SortableContext>
      );
    default:
      return null;
  }
}

export function EditorCanvas({ themeCSS }: { themeCSS?: string }) {
  const rootNodeId = useEditorStore((state) => state.data.rootNodeId);
  const selectNode = useEditorStore((state) => state.selectNode);

  // Scope the CSS to the editor preview area
  const scopedCSS = themeCSS 
    ? themeCSS.replace(/:root/g, '.email-editor-preview').replace(/\.dark/g, '.email-editor-preview.dark') 
    : "";

  return (
    <div 
      className="flex-1 bg-slate-200/50 overflow-y-auto p-8 flex justify-center items-start"
      onClick={() => selectNode(null)}
    >
      <style>{scopedCSS}</style>
      {/* Email dimensions wrapper */}
      <div className="w-full max-w-[600px] min-h-[800px] bg-white shadow-xl rounded-sm email-editor-preview">
        <NodeRenderer nodeId={rootNodeId} />
      </div>
    </div>
  );
}
