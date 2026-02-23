"use client";

import { useEditorStore } from "@/application/useEditorStore";
import { Button } from "@/components/ui/button";
import { Type, Square, Image as ImageIcon, Layout as LayoutIcon, Trash2 } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";

const BLOCKS = [
  { type: "TEXT", label: "Text Block", icon: Type },
  { type: "BUTTON", label: "Button", icon: Square },
  { type: "IMAGE", label: "Image", icon: ImageIcon },
  { type: "CONTAINER", label: "Container", icon: LayoutIcon },
];

function DraggableBlock({ type, label, icon: Icon }: any) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-${type}`,
    data: {
      type,
      isNew: true,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-200 bg-white hover:border-orange-400 hover:bg-orange-50 transition-colors cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <Icon className="h-6 w-6 text-slate-500 mb-2" />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </div>
  );
}

export function EditorSidebar() {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const historyIndex = useEditorStore((state) => state.historyIndex);
  const history = useEditorStore((state) => state.history);

  return (
    <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-semibold text-slate-900">Email Elements</h2>
        <p className="text-xs text-slate-500 mt-1">Drag and drop to add to your email.</p>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-3 flex-1 overflow-y-auto">
        {BLOCKS.map((block) => (
          <DraggableBlock key={block.type} {...block} />
        ))}
      </div>

      <div className="p-4 border-t border-slate-200 bg-white flex justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={undo}
          disabled={historyIndex <= 0}
        >
          Undo
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
        >
          Redo
        </Button>
      </div>
    </div>
  );
}
