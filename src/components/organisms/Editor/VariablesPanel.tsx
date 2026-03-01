"use client";
import { useEditorStore } from "@/application/useEditorStore";
import { useVariablesStore } from "@/application/useVariablesStore";
import { extractAllVars } from "@/application/utils/templateVars";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function VariablesPanel() {
  const data = useEditorStore((s) => s.data);
  const { jsonData, setJsonData, previewSubstitution, togglePreviewSubstitution } = useVariablesStore();
  const vars = extractAllVars(data);

  return (
    <div className="p-4 space-y-4 flex-1 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Detected Variables
        </h3>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Preview</Label>
          <Switch checked={previewSubstitution} onCheckedChange={togglePreviewSubstitution} />
        </div>
      </div>

      {vars.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Add {`{{variableName}}`} in any Text element to detect variables here.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {vars.map((v) => (
            <span key={v} className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
              {`{{${v}}}`}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">JSON Preview Data</Label>
        <textarea
          className="w-full h-40 p-3 text-xs font-mono border border-input rounded-md bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder={'{\n  "firstName": "John",\n  "product": "Pro Plan"\n}'}
        />
      </div>
    </div>
  );
}
