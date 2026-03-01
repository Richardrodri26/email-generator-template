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
      <DialogContent
        style={{ maxWidth: width + 80, transition: "max-width 300ms ease" }}
        className="w-full h-[90vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
        </DialogHeader>

        {/* Device toggle centrado, conectado visualmente al preview */}
        <div className="flex justify-center">
          <div className="flex items-center gap-0.5 border border-border rounded-lg p-1 bg-muted/40">
            {(["desktop", "tablet", "mobile"] as const).map((d) => {
              const Icon = DEVICE_ICONS[d];
              const active = device === d;
              return (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  className={
                    active
                      ? "flex items-center gap-1.5 bg-background text-foreground shadow-sm rounded-md px-3 py-1.5 text-sm font-medium transition-all"
                      : "flex items-center gap-1.5 text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md text-sm transition-all"
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span className={active ? "inline" : "hidden sm:inline"}>{DEVICE_LABELS[d]}</span>
                </button>
              );
            })}
          </div>
        </div>

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
