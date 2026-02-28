"use client";

import { useEffect, useState } from "react";
import { useEditorStore } from "@/application/useEditorStore";
import { usePresetsStore } from "@/application/usePresetsStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Type, MousePointerClick, Image as ImageIcon, LayoutTemplate, Minus, Space, Columns2, Share2, Table2, PanelTop, Undo2, Redo2, Tag, BarChart2, BookmarkIcon, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import type { ElementPreset } from "@/domain/models/Preset";

const BLOCKS = [
  { type: "TEXT", label: "Text Block", icon: Type },
  { type: "BUTTON", label: "Button", icon: MousePointerClick },
  { type: "IMAGE", label: "Image", icon: ImageIcon },
  { type: "CONTAINER", label: "Container", icon: LayoutTemplate },
  { type: "DIVIDER", label: "Divider", icon: Minus },
  { type: "SPACER", label: "Spacer", icon: Space },
  { type: "COLUMNS", label: "Columns", icon: Columns2 },
  { type: "SOCIAL", label: "Social", icon: Share2 },
  { type: "CARD", label: "Card", icon: PanelTop },
  { type: "TABLE", label: "Table", icon: Table2 },
  { type: "BADGE", label: "Badge", icon: Tag },
  { type: "CHART", label: "Chart", icon: BarChart2 },
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
      className={cn(
        "group flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border bg-card hover:border-primary/60 hover:bg-primary/5 transition-colors cursor-grab active:cursor-grabbing",
        isDragging ? "opacity-50" : "opacity-100"
      )}
    >
      <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}

function DraggablePresetBlock({ preset }: { preset: ElementPreset }) {
  const remove = usePresetsStore((s) => s.remove);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `preset-${preset.id}`,
    data: { type: preset.nodeType, isNew: true, presetProps: preset.props },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="relative group flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border bg-card hover:border-primary/60 cursor-grab"
    >
      <BookmarkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm truncate flex-1">{preset.name}</span>
      <button
        className="absolute right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
        onPointerDown={(e) => { e.stopPropagation(); remove(preset.id); }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function EditorSidebar() {
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const historyIndex = useEditorStore((state) => state.historyIndex);
  const history = useEditorStore((state) => state.history);

  const presets = usePresetsStore((s) => s.presets);
  const loadPresets = usePresetsStore((s) => s.load);
  const [presetsOpen, setPresetsOpen] = useState(true);

  useEffect(() => { loadPresets(); }, [loadPresets]);

  return (
    <div className="w-72 bg-card border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Email Elements</h2>
        <p className="text-xs text-muted-foreground mt-1">Drag and drop to add to your email.</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 grid grid-cols-2 gap-3">
          {BLOCKS.map((block) => (
            <DraggableBlock key={block.type} {...block} />
          ))}
        </div>

        {/* My Presets section */}
        <div className="border-t border-border">
          <button
            onClick={() => setPresetsOpen((o) => !o)}
            className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-muted/40"
          >
            <span className="flex items-center gap-2">
              <BookmarkIcon className="h-4 w-4" />
              My Presets
              {presets.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                  {presets.length}
                </span>
              )}
            </span>
            {presetsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {presetsOpen && (
            <div className="px-4 pb-4 space-y-2">
              {presets.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">
                  Save element styles as presets using the bookmark icon in the properties panel.
                </p>
              ) : (
                presets.map((preset) => (
                  <DraggablePresetBlock key={preset.id} preset={preset} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border bg-card flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={historyIndex <= 0}
          className="flex-1 gap-1.5"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-3.5 w-3.5" />
          Undo
          <kbd className="ml-auto text-[10px] font-mono bg-muted text-muted-foreground px-1 py-0.5 rounded border border-border leading-none">⌘Z</kbd>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="flex-1 gap-1.5"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-3.5 w-3.5" />
          Redo
          <kbd className="ml-auto text-[10px] font-mono bg-muted text-muted-foreground px-1 py-0.5 rounded border border-border leading-none">⇧⌘Z</kbd>
        </Button>
      </div>
    </div>
  );
}
