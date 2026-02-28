"use client";

import { useEditorStore } from "@/application/useEditorStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function EditorPropertiesPanel() {
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const node = useEditorStore((state) => 
    selectedNodeId ? state.data.nodes[selectedNodeId] : null
  );
  const updateNodeProps = useEditorStore((state) => state.updateNodeProps);
  const removeNode = useEditorStore((state) => state.removeNode);

  if (!selectedNodeId || !node) {
    return (
      <div className="w-80 bg-muted/40 border-l border-border p-6 flex items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">Select an element on the canvas to edit its properties.</p>
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
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground capitalize">{node.type.toLowerCase()} Properties</h2>
        {node.id !== "root" && (
          <Button variant="ghost" size="icon" onClick={() => removeNode(node.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {/* ── Size / Width (all non-ROOT elements) ── */}
        {node.type !== "ROOT" && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</h3>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Width</Label>
              <select
                value={node.props.style?.width || "100%"}
                onChange={(e) => handleStyleChange("width", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                <option value="100%">12/12 — Full</option>
                <option value="91.6667%">11/12</option>
                <option value="83.3333%">10/12</option>
                <option value="75%">9/12 — Three Quarter</option>
                <option value="66.6667%">8/12 — Two Third</option>
                <option value="58.3333%">7/12</option>
                <option value="50%">6/12 — Half</option>
                <option value="41.6667%">5/12</option>
                <option value="33.3333%">4/12 — One Third</option>
                <option value="25%">3/12 — Quarter</option>
                <option value="16.6667%">2/12</option>
                <option value="8.3333%">1/12</option>
              </select>
            </div>
            {node.props.style?.height && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Height</Label>
                <Input
                  value={node.props.style?.height || "auto"}
                  onChange={(e) => handleStyleChange("height", e.target.value)}
                  placeholder="e.g. 200px"
                />
              </div>
            )}
          </div>
        )}

        {/* ── TEXT ── */}
        {node.type === "TEXT" && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content</h3>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Text</Label>
              <Input
                value={node.props.content || ""}
                onChange={(e) => handleChange("content", e.target.value)}
                placeholder="Enter text..."
              />
            </div>

            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">Typography</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Font Size</Label>
                <select
                  value={node.props.style?.fontSize || "16px"}
                  onChange={(e) => handleStyleChange("fontSize", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  {["12px","14px","16px","18px","20px","24px","28px","32px","36px","48px","64px"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Weight</Label>
                <select
                  value={node.props.style?.fontWeight || "400"}
                  onChange={(e) => handleStyleChange("fontWeight", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="300">Light</option>
                  <option value="400">Regular</option>
                  <option value="500">Medium</option>
                  <option value="600">Semibold</option>
                  <option value="700">Bold</option>
                  <option value="800">Extrabold</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Line Height</Label>
                <select
                  value={node.props.style?.lineHeight || "1.6"}
                  onChange={(e) => handleStyleChange("lineHeight", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  {["1","1.2","1.4","1.5","1.6","1.8","2"].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Align</Label>
                <div className="flex gap-1">
                  {(["left","center","right"] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => handleStyleChange("textAlign", align)}
                      className={cn(
                        "flex-1 h-9 rounded-md border text-xs font-medium transition-colors",
                        (node.props.style?.textAlign || "left") === align
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {align[0].toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Color</Label>
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

        {/* ── BUTTON ── */}
        {node.type === "BUTTON" && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Button</h3>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Button Text</Label>
              <Input 
                value={node.props.content || "Click Me"} 
                onChange={(e) => handleChange("content", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">URL Link</Label>
              <Input 
                value={node.props.href || "#"} 
                onChange={(e) => handleChange("href", e.target.value)}
                placeholder="https://"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Background Color</Label>
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
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={node.props.style?.color || "#ffffff"}
                  onChange={(e) => handleStyleChange("color", e.target.value)}
                  className="w-12 p-1 h-9"
                />
                <Input
                  type="text"
                  value={node.props.style?.color || "#ffffff"}
                  onChange={(e) => handleStyleChange("color", e.target.value)}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── IMAGE ── */}
        {node.type === "IMAGE" && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image</h3>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Image URL</Label>
              <Input 
                value={node.props.src || ""} 
                onChange={(e) => handleChange("src", e.target.value)}
                placeholder="https://example.com/image.png"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Alt Text</Label>
              <Input 
                value={node.props.alt || ""} 
                onChange={(e) => handleChange("alt", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── CARD ── */}
        {node.type === "CARD" && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Card</h3>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Title</Label>
              <Input
                value={node.props.cardTitle || ""}
                onChange={(e) => handleChange("cardTitle", e.target.value)}
                placeholder="Card title..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
              <Input
                value={node.props.cardDescription || ""}
                onChange={(e) => handleChange("cardDescription", e.target.value)}
                placeholder="Short description..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Background Color</Label>
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
          </div>
        )}

        {/* ── TABLE ── */}
        {node.type === "TABLE" && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Table</h3>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Headers (comma-separated)</Label>
              <Input
                value={(node.props.headers || []).join(", ")}
                onChange={(e) =>
                  handleChange(
                    "headers",
                    e.target.value.split(",").map((s: string) => s.trim()),
                  )
                }
                placeholder="Col 1, Col 2, Col 3"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground mb-1 block">Rows</Label>
              {(node.props.rows || []).map((row: string[], ri: number) => (
                <div key={ri} className="flex gap-1 items-center">
                  <Input
                    value={row.join(", ")}
                    onChange={(e) => {
                      const newRows = [...(node.props.rows || [])];
                      newRows[ri] = e.target.value.split(",").map((s: string) => s.trim());
                      handleChange("rows", newRows);
                    }}
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-600"
                    onClick={() => {
                      const newRows = (node.props.rows || []).filter((_: string[], i: number) => i !== ri);
                      handleChange("rows", newRows);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  const colCount = (node.props.headers || []).length || 3;
                  const newRow = Array(colCount).fill("—");
                  handleChange("rows", [...(node.props.rows || []), newRow]);
                }}
              >
                + Add Row
              </Button>
            </div>
          </div>
        )}

        {/* ── ROOT / CONTAINER ── */}
        {(node.type === "ROOT" || node.type === "CONTAINER") && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Container</h3>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Background Color</Label>
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
              <Label className="text-xs text-muted-foreground mb-1 block">Padding</Label>
              <Input
                value={node.props.style?.padding || "0px"}
                onChange={(e) => handleStyleChange("padding", e.target.value)}
                placeholder="e.g. 20px"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Border Radius</Label>
              <select
                value={node.props.style?.borderRadius || "0px"}
                onChange={(e) => handleStyleChange("borderRadius", e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                {["0px","4px","8px","12px","16px","24px","9999px"].map(r => (
                  <option key={r} value={r}>{r === "9999px" ? "Full" : r}</option>
                ))}
              </select>
            </div>
            {node.type === "CONTAINER" && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Border Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={node.props.style?.borderColor || "#e2e8f0"}
                    onChange={(e) => handleStyleChange("borderColor", e.target.value)}
                    className="w-12 p-1 h-9"
                  />
                  <Input
                    type="text"
                    value={node.props.style?.borderColor || "#e2e8f0"}
                    onChange={(e) => handleStyleChange("borderColor", e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
