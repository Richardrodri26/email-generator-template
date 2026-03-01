"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePreviewStore, DEVICE_WIDTHS } from "@/application/usePreviewStore";
import { useEditorStore } from "@/application/useEditorStore";
import { generateHtmlExport } from "@/application/useExportBuilder";
import { Monitor, Tablet, Smartphone } from "lucide-react";

const DEVICE_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
const DEVICE_LABELS = { desktop: "Desktop — 600px", tablet: "Tablet — 480px", mobile: "Mobile — 375px" };

interface PreviewModalProps {
  themeCSS: string;
}

export function PreviewModal({ themeCSS }: PreviewModalProps) {
  const { modalOpen, setModalOpen, device, setDevice } = usePreviewStore();
  const data = useEditorStore((s) => s.data);
  const width = DEVICE_WIDTHS[device];

  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    if (!modalOpen) return;
    generateHtmlExport(data, themeCSS).then(setHtmlContent);
  }, [modalOpen, data, themeCSS]);

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Email Preview</DialogTitle>
            <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-muted/40">
              {(["desktop", "tablet", "mobile"] as const).map((d) => {
                const Icon = DEVICE_ICONS[d];
                return (
                  <button
                    key={d}
                    title={DEVICE_LABELS[d]}
                    onClick={() => setDevice(d)}
                    className={
                      device === d
                        ? "bg-background text-foreground shadow-xs rounded px-2 py-1"
                        : "text-muted-foreground hover:text-foreground px-2 py-1 rounded"
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{DEVICE_LABELS[device]}</p>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex items-start justify-center bg-muted/30 rounded-md p-6">
          <div
            style={{ width, transition: "width 300ms ease" }}
            className="bg-white shadow-xl rounded-sm overflow-hidden min-h-40"
          >
            <iframe
              srcDoc={htmlContent}
              className="w-full border-0"
              style={{ minHeight: "400px", height: "70vh" }}
              title="Email Preview"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
