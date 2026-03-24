"use client";

import { useState } from "react";
import { useEditorStore } from "@/application/useEditorStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, BarChart2, TrendingUp, PieChart, Plus, Link2, Link2Off, Bookmark, ArrowRight, ArrowDown, AlertTriangle } from "lucide-react";
import { usePresetsStore } from "@/application/usePresetsStore";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface SpacingControlProps {
  label: string;
  topKey: string;
  rightKey: string;
  bottomKey: string;
  leftKey: string;
  style: Record<string, any>;
  onChange: (key: string, value: string) => void;
  onBatchChange: (updates: Record<string, string>) => void;
}

function SpacingControl({ label, topKey, rightKey, bottomKey, leftKey, style, onChange, onBatchChange }: SpacingControlProps) {
  const [linked, setLinked] = useState(true);

  const handleChange = (key: string, value: string) => {
    if (linked) {
      onBatchChange({ [topKey]: value, [rightKey]: value, [bottomKey]: value, [leftKey]: value });
    } else {
      onChange(key, value);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <button
          onClick={() => setLinked(!linked)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title={linked ? "Unlink sides" : "Link sides"}
        >
          {linked ? <Link2 className="h-3.5 w-3.5" /> : <Link2Off className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div>
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">Top</Label>
          <Input value={style[topKey] || "0px"} onChange={(e) => handleChange(topKey, e.target.value)} placeholder="0px" className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">Right</Label>
          <Input value={style[rightKey] || "0px"} onChange={(e) => handleChange(rightKey, e.target.value)} placeholder="0px" className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">Bottom</Label>
          <Input value={style[bottomKey] || "0px"} onChange={(e) => handleChange(bottomKey, e.target.value)} placeholder="0px" className="h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[10px] text-muted-foreground mb-0.5 block">Left</Label>
          <Input value={style[leftKey] || "0px"} onChange={(e) => handleChange(leftKey, e.target.value)} placeholder="0px" className="h-7 text-xs" />
        </div>
      </div>
    </div>
  );
}

export function EditorPropertiesPanel() {
  const selectedNodeId = useEditorStore((state) => state.selectedNodeId);
  const node = useEditorStore((state) =>
    selectedNodeId ? state.data.nodes[selectedNodeId] : null
  );
  const nodes = useEditorStore((state) => state.data.nodes);
  const updateNodeProps = useEditorStore((state) => state.updateNodeProps);
  const removeNode = useEditorStore((state) => state.removeNode);

  // Detect if the selected node is a direct child of a COLUMNS node
  const parentNode = selectedNodeId
    ? Object.values(nodes).find((n) => n.children.includes(selectedNodeId)) ?? null
    : null;
  const isInsideColumns = parentNode?.type === "COLUMNS";

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

  const handleBatchStyleChange = (updates: Record<string, string>) => {
    updateNodeProps(selectedNodeId, { style: { ...node.props.style, ...updates } });
  };

  // ── Column flex width ─────────────────────────────────────────────
  // Compute current percentage of this node relative to all siblings in the COLUMNS parent.
  const columnFlexPct: number = (() => {
    if (!isInsideColumns || !parentNode || !node) return 100;
    const totalFlex = parentNode.children.reduce(
      (sum, cid) => sum + (parseFloat(nodes[cid]?.props.style?.flex || "1") || 1),
      0,
    );
    const selfFlex = parseFloat(node.props.style?.flex || "1") || 1;
    return (selfFlex / totalFlex) * 100;
  })();

  // Find the nearest predefined grid option (in %) for display.
  const GRID_OPTIONS = [100, 91.6667, 83.3333, 75, 66.6667, 58.3333, 50, 41.6667, 33.3333, 25, 16.6667, 8.3333];
  const nearestGridPct = GRID_OPTIONS.reduce((prev, cur) =>
    Math.abs(cur - columnFlexPct) < Math.abs(prev - columnFlexPct) ? cur : prev,
  );

  // Set this column's flex % and adjust the last sibling so the total stays at 100%.
  const handleColumnWidthChange = (newPctStr: string) => {
    if (!isInsideColumns || !parentNode || !node || !selectedNodeId) return;
    const newPct = parseFloat(newPctStr);
    const children = parentNode.children;
    const totalFlex = children.reduce(
      (sum, cid) => sum + (parseFloat(nodes[cid]?.props.style?.flex || "1") || 1),
      0,
    );

    // Normalize all siblings to their current % first (keeps the unit system consistent).
    const currentPcts: Record<string, number> = {};
    children.forEach((cid) => {
      currentPcts[cid] = ((parseFloat(nodes[cid]?.props.style?.flex || "1") || 1) / totalFlex) * 100;
    });

    const lastSibId = [...children].reverse().find((cid) => cid !== selectedNodeId);
    const otherPct = children.reduce((sum, cid) => {
      if (cid === selectedNodeId || cid === lastSibId) return sum;
      return sum + currentPcts[cid];
    }, 0);

    const minColPct = 10;
    const clampedPct = Math.max(minColPct, Math.min(100 - otherPct - minColPct, newPct));
    const lastPct = Math.max(minColPct, 100 - clampedPct - otherPct);

    // Update "other" (middle) siblings normalized to %.
    children.forEach((cid) => {
      if (cid === selectedNodeId || cid === lastSibId) return;
      const sibNode = nodes[cid];
      if (sibNode) updateNodeProps(cid, { style: { ...sibNode.props.style, flex: String(+currentPcts[cid].toFixed(1)), width: undefined } });
    });

    updateNodeProps(selectedNodeId, { style: { ...node.props.style, flex: String(+clampedPct.toFixed(1)), width: undefined } });

    if (lastSibId) {
      const lastSib = nodes[lastSibId];
      if (lastSib) updateNodeProps(lastSibId, { style: { ...lastSib.props.style, flex: String(+lastPct.toFixed(1)), width: undefined } });
    }
  };

  // ── Column height ─────────────────────────────────────────────────
  // When a node inside COLUMNS sets an explicit height, it must opt-out of "stretch"
  // (which ignores height) by adding alignSelf: flex-start.
  const handleColumnHeightChange = (value: string) => {
    if (!isInsideColumns || !node || !selectedNodeId) return;
    const isAuto = value === "auto" || value === "";
    updateNodeProps(selectedNodeId, {
      style: {
        ...node.props.style,
        // Use minHeight so content can still expand beyond the configured value.
        // Clear height to avoid overriding minHeight.
        height: undefined,
        minHeight: isAuto ? undefined : value,
        alignSelf: isAuto ? undefined : "flex-start",
      },
    });
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-foreground capitalize">{node.type.toLowerCase()} Properties</h2>
        {node.id !== "root" && (
          <div className="flex items-center gap-1">
            {node.type !== "ROOT" && (
              <Button
                variant="ghost"
                size="icon"
                title="Save as preset"
                onClick={() => {
                  const name = window.prompt("Preset name:", `${node.type} preset`);
                  if (!name) return;
                  usePresetsStore.getState().save({
                    id: crypto.randomUUID(),
                    name,
                    nodeType: node.type,
                    props: { ...node.props },
                    createdAt: new Date().toISOString(),
                  });
                }}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => removeNode(node.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {/* ── Overlay Mode (all non-ROOT elements) ── */}
        {node.type !== "ROOT" && (
          <div className="space-y-3 border-b border-border pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold">Overlay Mode</p>
                <p className="text-xs text-muted-foreground">Float element over others</p>
              </div>
              <Switch
                checked={node.props.style?.position === "absolute"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    updateNodeProps(node.id, {
                      style: {
                        ...node.props.style,
                        position: "absolute",
                        left: "0px",
                        top: "0px",
                        zIndex: "10",
                      },
                    });
                  } else {
                    const newStyle = { ...node.props.style };
                    delete newStyle.position;
                    delete newStyle.left;
                    delete newStyle.top;
                    delete newStyle.zIndex;
                    updateNodeProps(node.id, { style: newStyle });
                  }
                }}
              />
            </div>

            {node.props.style?.position === "absolute" && (
              <div className="space-y-2 border border-border rounded-md p-3 bg-muted/20">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">X (left)</Label>
                    <Input
                      value={node.props.style?.left || "0px"}
                      onChange={(e) => updateNodeProps(node.id, { style: { ...node.props.style, left: e.target.value } })}
                      placeholder="0px"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Y (top)</Label>
                    <Input
                      value={node.props.style?.top || "0px"}
                      onChange={(e) => updateNodeProps(node.id, { style: { ...node.props.style, top: e.target.value } })}
                      placeholder="0px"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Z-Index</Label>
                  <Input
                    type="number"
                    value={node.props.style?.zIndex || "10"}
                    onChange={(e) => updateNodeProps(node.id, { style: { ...node.props.style, zIndex: e.target.value } })}
                    placeholder="10"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="flex gap-2 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    <span className="font-semibold">Outlook Desktop</span> no soporta posicionamiento absoluto — el elemento aparecerá en el flujo normal del email.{" "}
                    <span className="opacity-80">Gmail, Apple Mail e iOS Mail sí lo soportan. La coordenada X se convierte a % al exportar para ser responsive.</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Size / Width (all non-ROOT elements) ── */}
        {node.type !== "ROOT" && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Size</h3>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                {isInsideColumns ? "Column Width" : "Width"}
              </Label>
              {isInsideColumns ? (
                <select
                  value={`${nearestGridPct}%`}
                  onChange={(e) => handleColumnWidthChange(e.target.value)}
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
              ) : (
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
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                {isInsideColumns ? "Min Height" : "Height"}
              </Label>
              <Input
                value={
                  isInsideColumns
                    ? (node.props.style?.minHeight || "auto")
                    : (node.props.style?.height || "auto")
                }
                onChange={(e) =>
                  isInsideColumns
                    ? handleColumnHeightChange(e.target.value)
                    : handleStyleChange("height", e.target.value)
                }
                placeholder="auto"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {isInsideColumns
                  ? "auto = stretch to tallest column"
                  : "auto = shrink to content"}
              </p>
            </div>
          </div>
        )}

        {/* ── Spacing (all non-ROOT, non-CONTAINER) ── */}
        {node.type !== "ROOT" && node.type !== "CONTAINER" && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spacing</h3>
            <SpacingControl
              label="Padding"
              topKey="paddingTop" rightKey="paddingRight" bottomKey="paddingBottom" leftKey="paddingLeft"
              style={node.props.style || {}}
              onChange={handleStyleChange}
              onBatchChange={handleBatchStyleChange}
            />
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

            <div className="space-y-3 border-t border-border pt-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dark Mode Colors</h3>
              <p className="text-[10px] text-muted-foreground -mt-1">Leave empty to use theme defaults</p>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Dark Background</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={node.props.darkStyle?.backgroundColor || "#000000"}
                    onChange={(e) => updateNodeProps(node.id, { darkStyle: { ...node.props.darkStyle, backgroundColor: e.target.value } })}
                    className="w-12 p-1 h-9"
                  />
                  <Input
                    type="text"
                    value={node.props.darkStyle?.backgroundColor || ""}
                    onChange={(e) => updateNodeProps(node.id, { darkStyle: { ...node.props.darkStyle, backgroundColor: e.target.value } })}
                    placeholder="var(--background)"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Dark Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={node.props.darkStyle?.color || "#ffffff"}
                    onChange={(e) => updateNodeProps(node.id, { darkStyle: { ...node.props.darkStyle, color: e.target.value } })}
                    className="w-12 p-1 h-9"
                  />
                  <Input
                    type="text"
                    value={node.props.darkStyle?.color || ""}
                    onChange={(e) => updateNodeProps(node.id, { darkStyle: { ...node.props.darkStyle, color: e.target.value } })}
                    placeholder="var(--foreground)"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
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

            <div className="space-y-3 border-t border-border pt-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dark Mode Colors</h3>
              <p className="text-[10px] text-muted-foreground -mt-1">Leave empty to use theme defaults</p>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Dark Background</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={node.props.darkStyle?.backgroundColor || "#000000"}
                    onChange={(e) => updateNodeProps(node.id, { darkStyle: { ...node.props.darkStyle, backgroundColor: e.target.value } })}
                    className="w-12 p-1 h-9"
                  />
                  <Input
                    type="text"
                    value={node.props.darkStyle?.backgroundColor || ""}
                    onChange={(e) => updateNodeProps(node.id, { darkStyle: { ...node.props.darkStyle, backgroundColor: e.target.value } })}
                    placeholder="var(--primary)"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Dark Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={node.props.darkStyle?.color || "#ffffff"}
                    onChange={(e) => updateNodeProps(node.id, { darkStyle: { ...node.props.darkStyle, color: e.target.value } })}
                    className="w-12 p-1 h-9"
                  />
                  <Input
                    type="text"
                    value={node.props.darkStyle?.color || ""}
                    onChange={(e) => updateNodeProps(node.id, { darkStyle: { ...node.props.darkStyle, color: e.target.value } })}
                    placeholder="var(--primary-foreground)"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
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
            {/* Size */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Width</Label>
                <Input
                  value={node.props.style?.width || ""}
                  placeholder="e.g. 100% or 600px"
                  onChange={(e) =>
                    handleStyleChange("width", e.target.value)
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Height</Label>
                <Input
                  value={node.props.style?.height || ""}
                  placeholder="e.g. 200px"
                  onChange={(e) =>
                    handleStyleChange("height", e.target.value)
                  }
                />
              </div>
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

            <div className="space-y-3 border-t border-border pt-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dark Mode Colors</h3>
              <p className="text-[10px] text-muted-foreground -mt-1">Leave empty to use theme defaults</p>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Dark Background</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={node.props.darkStyle?.backgroundColor || "#000000"}
                    onChange={(e) => updateNodeProps(node.id, { darkStyle: { ...node.props.darkStyle, backgroundColor: e.target.value } })}
                    className="w-12 p-1 h-9"
                  />
                  <Input
                    type="text"
                    value={node.props.darkStyle?.backgroundColor || ""}
                    onChange={(e) => updateNodeProps(node.id, { darkStyle: { ...node.props.darkStyle, backgroundColor: e.target.value } })}
                    placeholder="var(--card)"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TABLE ── */}
        {node.type === "TABLE" && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Table</h3>

            {/* Headers */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground block">Headers</Label>
              {(node.props.headers || []).map((h: string, hi: number) => (
                <div key={hi} className="flex gap-1 items-center">
                  <Input
                    value={h}
                    onChange={(e) => {
                      const newHeaders = [...(node.props.headers || [])];
                      newHeaders[hi] = e.target.value;
                      handleChange("headers", newHeaders);
                    }}
                    className="flex-1 text-xs"
                    placeholder={`Column ${hi + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-600 shrink-0"
                    onClick={() => {
                      const newHeaders = (node.props.headers || []).filter((_: string, i: number) => i !== hi);
                      const newRows = (node.props.rows || []).map((row: string[]) =>
                        row.filter((_: string, i: number) => i !== hi)
                      );
                      handleChange("headers", newHeaders);
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
                  handleChange("headers", [...(node.props.headers || []), `Column ${(node.props.headers || []).length + 1}`]);
                  const newRows = (node.props.rows || []).map((row: string[]) => [...row, "—"]);
                  handleChange("rows", newRows);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Column
              </Button>
            </div>

            {/* Rows */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground block">Rows</Label>
              {(node.props.rows || []).map((row: string[], ri: number) => (
                <div key={ri} className="flex gap-1 items-start">
                  <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${(node.props.headers || []).length || 1}, 1fr)` }}>
                    {row.map((cell: string, ci: number) => (
                      <Input
                        key={ci}
                        value={cell}
                        onChange={(e) => {
                          const newRows = (node.props.rows || []).map((r: string[], i: number) =>
                            i === ri ? r.map((c: string, j: number) => (j === ci ? e.target.value : c)) : r
                          );
                          handleChange("rows", newRows);
                        }}
                        className="text-xs"
                        placeholder="—"
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-600 shrink-0"
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
                  handleChange("rows", [...(node.props.rows || []), Array(colCount).fill("—")]);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Row
              </Button>
            </div>
          </div>
        )}

        {/* ── BADGE ── */}
        {node.type === "BADGE" && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Badge</h3>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Text</Label>
              <Input
                value={node.props.content || ""}
                onChange={(e) => handleChange("content", e.target.value)}
                placeholder="Badge text..."
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Variant</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["default", "secondary", "outline", "destructive"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => handleChange("variant", v)}
                    className={cn(
                      "h-8 rounded-md border text-xs font-medium capitalize transition-colors",
                      (node.props.variant || "default") === v
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CHART ── */}
        {node.type === "CHART" && (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chart</h3>

            {/* Chart type */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
              <div className="flex gap-1.5">
                {([
                  { value: "bar", icon: BarChart2, label: "Bar" },
                  { value: "line", icon: TrendingUp, label: "Line" },
                  { value: "pie", icon: PieChart, label: "Pie" },
                ] as const).map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => handleChange("chartType", value)}
                    className={cn(
                      "flex-1 h-10 rounded-md border text-xs font-medium flex flex-col items-center justify-center gap-0.5 transition-colors",
                      (node.props.chartType || "bar") === value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Title</Label>
              <Input
                value={node.props.chartTitle || ""}
                onChange={(e) => handleChange("chartTitle", e.target.value)}
                placeholder="Chart title..."
              />
            </div>

            {/* Colors */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Colors</Label>
              <div className="flex gap-1 flex-wrap">
                {(node.props.colors || ["#f97316", "#60a5fa", "#34d399", "#f59e0b"]).map((color: string, ci: number) => (
                  <input
                    key={ci}
                    type="color"
                    value={color.startsWith("var(") ? "#f97316" : color}
                    onChange={(e) => {
                      const newColors = [...(node.props.colors || [])];
                      newColors[ci] = e.target.value;
                      handleChange("colors", newColors);
                    }}
                    className="w-8 h-8 rounded cursor-pointer border border-input p-0.5"
                    title={`Color ${ci + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Data points */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground block">Data</Label>
              <div className="grid grid-cols-[1fr_80px_32px] gap-1 text-[10px] text-muted-foreground px-0.5">
                <span>Label</span><span>Value</span><span />
              </div>
              {(node.props.data || []).map((point: { name: string; value: number }, di: number) => (
                <div key={di} className="grid grid-cols-[1fr_80px_32px] gap-1 items-center">
                  <Input
                    value={point.name}
                    onChange={(e) => {
                      const newData = (node.props.data || []).map((p: { name: string; value: number }, i: number) =>
                        i === di ? { ...p, name: e.target.value } : p
                      );
                      handleChange("data", newData);
                    }}
                    className="text-xs"
                    placeholder="Label"
                  />
                  <Input
                    type="number"
                    value={point.value}
                    onChange={(e) => {
                      const newData = (node.props.data || []).map((p: { name: string; value: number }, i: number) =>
                        i === di ? { ...p, value: Number(e.target.value) } : p
                      );
                      handleChange("data", newData);
                    }}
                    className="text-xs"
                    placeholder="0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:text-red-600"
                    onClick={() => {
                      const newData = (node.props.data || []).filter((_: any, i: number) => i !== di);
                      handleChange("data", newData);
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
                  handleChange("data", [...(node.props.data || []), { name: "New", value: 0 }]);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Data Point
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
            {node.type === "CONTAINER" ? (
              <>
                <SpacingControl
                  label="Padding"
                  topKey="paddingTop" rightKey="paddingRight" bottomKey="paddingBottom" leftKey="paddingLeft"
                  style={node.props.style || {}}
                  onChange={handleStyleChange}
                  onBatchChange={handleBatchStyleChange}
                />
              </>
            ) : (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Padding</Label>
                <Input
                  value={node.props.style?.padding || "0px"}
                  onChange={(e) => handleStyleChange("padding", e.target.value)}
                  placeholder="e.g. 20px"
                />
              </div>
            )}
            {node.type === "ROOT" && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Canvas Width</Label>
                <Input
                  value={node.props.style?.maxWidth || "600px"}
                  onChange={(e) => handleStyleChange("maxWidth", e.target.value)}
                  placeholder="600px"
                />
              </div>
            )}
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

            <div className="space-y-3 border-t border-border pt-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dark Mode Colors</h3>
              <p className="text-[10px] text-muted-foreground -mt-1">Leave empty to use theme defaults</p>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Dark Background</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={node.props.darkStyle?.backgroundColor || "#000000"}
                    onChange={(e) => updateNodeProps(node.id, { darkStyle: { ...node.props.darkStyle, backgroundColor: e.target.value } })}
                    className="w-12 p-1 h-9"
                  />
                  <Input
                    type="text"
                    value={node.props.darkStyle?.backgroundColor || ""}
                    onChange={(e) => updateNodeProps(node.id, { darkStyle: { ...node.props.darkStyle, backgroundColor: e.target.value } })}
                    placeholder="var(--background)"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COLUMNS / CONTAINER Layout ── */}
        {(node.type === "COLUMNS" || node.type === "CONTAINER") && (
          <div className="space-y-3 border-t border-border pt-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Layout
            </h3>

            {/* Direction */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Direction</Label>
              <div className="flex gap-1">
                {(["row", "column"] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => updateNodeProps(node.id, { style: { ...node.props.style, flexDirection: dir } })}
                    className={`flex-1 h-9 rounded-md border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      (node.props.style?.flexDirection || "row") === dir
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {dir === "row"
                      ? <><ArrowRight className="h-3.5 w-3.5" /> Horizontal</>
                      : <><ArrowDown className="h-3.5 w-3.5" /> Vertical</>
                    }
                  </button>
                ))}
              </div>
            </div>

            {/* Gap */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Gap</Label>
              <select
                value={node.props.style?.gap || "0px"}
                onChange={(e) => updateNodeProps(node.id, { style: { ...node.props.style, gap: e.target.value } })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {["0px","4px","8px","12px","16px","20px","24px","32px","40px","48px"].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Align Items */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Align Items</Label>
              <select
                value={node.props.style?.alignItems || "stretch"}
                onChange={(e) => updateNodeProps(node.id, { style: { ...node.props.style, alignItems: e.target.value } })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {["stretch","flex-start","center","flex-end","baseline"].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Justify Content */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Justify Content</Label>
              <select
                value={node.props.style?.justifyContent || "flex-start"}
                onChange={(e) => updateNodeProps(node.id, { style: { ...node.props.style, justifyContent: e.target.value } })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {["flex-start","center","flex-end","space-between","space-around","space-evenly"].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
