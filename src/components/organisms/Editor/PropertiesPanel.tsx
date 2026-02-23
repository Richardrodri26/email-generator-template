"use client";

import { useEditorStore } from "@/application/useEditorStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function EditorPropertiesPanel() {
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const node = useEditorStore((state) => 
    selectedNodeId ? state.data.nodes[selectedNodeId] : null
  );
  const updateNodeProps = useEditorStore((state) => state.updateNodeProps);
  const removeNode = useEditorStore((state) => state.removeNode);

  if (!selectedNodeId || !node) {
    return (
      <div className="w-80 bg-slate-50 border-l border-slate-200 p-6 flex items-center justify-center text-center">
        <p className="text-sm text-slate-500">Select an element on the canvas to edit its properties.</p>
      </div>
    );
  }

  const handleChange = (key: string, value: any) => {
    updateNodeProps(selectedNodeId, { [key]: value });
  };

  const handleStyleChange = (key: string, value: any) => {
    const newStyle = { ...node.props.style, [key]: value };
    updateNodeProps(selectedNodeId, { style: newStyle });
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 capitalize">{node.type.toLowerCase()} Properties</h2>
        {node.id !== "root" && (
          <Button variant="ghost" size="icon" onClick={() => removeNode(node.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {/* TEXT specific props */}
        {node.type === "TEXT" && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Content</Label>
              <Input 
                value={node.props.content || ""} 
                onChange={(e) => handleChange("content", e.target.value)}
                placeholder="Enter text..."
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  value={node.props.style?.color || "#000000"} 
                  onChange={(e) => handleStyleChange("color", e.target.value)}
                  className="w-12 p-1 h-9"
                />
                <Input 
                  type="text" 
                  value={node.props.style?.color || "#000000"} 
                  onChange={(e) => handleStyleChange("color", e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* BUTTON specific props */}
        {node.type === "BUTTON" && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Button Text</Label>
              <Input 
                value={node.props.content || "Click Me"} 
                onChange={(e) => handleChange("content", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">URL Link</Label>
              <Input 
                value={node.props.href || "#"} 
                onChange={(e) => handleChange("href", e.target.value)}
                placeholder="https://"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Background Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  value={node.props.style?.backgroundColor || "#f97316"} 
                  onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
                  className="w-12 p-1 h-9"
                />
                <Input 
                  type="text" 
                  value={node.props.style?.backgroundColor || "#f97316"} 
                  onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* IMAGE specific props */}
        {node.type === "IMAGE" && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Image URL</Label>
              <Input 
                value={node.props.src || ""} 
                onChange={(e) => handleChange("src", e.target.value)}
                placeholder="https://example.com/image.png"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Alt Text</Label>
              <Input 
                value={node.props.alt || ""} 
                onChange={(e) => handleChange("alt", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Generic Padding (applicable to containers and root) */}
        {(node.type === "ROOT" || node.type === "CONTAINER") && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Background Color</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  value={node.props.style?.backgroundColor || "#ffffff"} 
                  onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
                  className="w-12 p-1 h-9"
                />
                <Input 
                  type="text" 
                  value={node.props.style?.backgroundColor || "#ffffff"} 
                  onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Padding</Label>
              <Input 
                value={node.props.style?.padding || "0px"} 
                onChange={(e) => handleStyleChange("padding", e.target.value)}
                placeholder="e.g. 20px"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
