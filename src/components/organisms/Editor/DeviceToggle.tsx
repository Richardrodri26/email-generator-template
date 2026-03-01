"use client";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { usePreviewStore, PreviewDevice } from "@/application/usePreviewStore";

const DEVICES: { id: PreviewDevice; icon: React.ElementType; label: string }[] = [
  { id: "desktop", icon: Monitor, label: "Desktop (600px)" },
  { id: "tablet", icon: Tablet, label: "Tablet (480px)" },
  { id: "mobile", icon: Smartphone, label: "Mobile (375px)" },
];

export function DeviceToggle() {
  const { device, setDevice } = usePreviewStore();
  return (
    <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-muted/40">
      {DEVICES.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          title={label}
          onClick={() => setDevice(id)}
          className={
            device === id
              ? "bg-background text-foreground shadow-xs rounded px-2 py-1"
              : "text-muted-foreground hover:text-foreground px-2 py-1 rounded"
          }
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
