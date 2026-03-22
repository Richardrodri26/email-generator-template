"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/application/useAuth";
import { useTemplates } from "@/application/useTemplates";
import { useEditorStore } from "@/application/useEditorStore";
import { DndContext, DragEndEvent, DragOverEvent, closestCenter, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { EditorSidebar } from "@/components/organisms/Editor/Sidebar";
import { EditorCanvas } from "@/components/organisms/Editor/Canvas";
import { EditorPropertiesPanel } from "@/components/organisms/Editor/PropertiesPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Download, CheckCircle2, Type, MousePointerClick, Image as ImageIcon, LayoutTemplate, Minus, Space, Columns2, Share2, Table2, PanelTop, Tag, BarChart2, Moon, Eye, FileText, Maximize2, AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useTemplateDefaultsStore } from "@/application/useTemplateDefaultsStore";
import { DeviceToggle } from "@/components/organisms/Editor/DeviceToggle";
import { PreviewModal } from "@/components/organisms/Editor/PreviewModal";
import { usePreviewStore } from "@/application/usePreviewStore";
import { useEmailDarkModeStore } from "@/application/useEmailDarkModeStore";
import { LocalStorageTemplateRepository } from "@/infrastructure/repositories/LocalStorageTemplateRepository";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { EditorNodeType } from "@/domain/models/Template";
import { generateHtmlExport } from "@/application/useExportBuilder";
import { TestEmailDialog } from "@/components/organisms/Editor/TestEmailDialog";
import { ThemeInjector } from "@/components/organisms/Editor/ThemeInjector";
import { useVariablesStore } from "@/application/useVariablesStore";
import { substituteAllNodes } from "@/application/utils/templateVars";


const repo = new LocalStorageTemplateRepository();

const NODE_ICONS: Record<string, React.ElementType> = {
  TEXT: Type,
  BUTTON: MousePointerClick,
  IMAGE: ImageIcon,
  CONTAINER: LayoutTemplate,
  DIVIDER: Minus,
  SPACER: Space,
  COLUMNS: Columns2,
  SOCIAL: Share2,
  CARD: PanelTop,
  TABLE: Table2,
  BADGE: Tag,
  CHART: BarChart2,
};

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, isLoading: authLoading } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [customWidth, setCustomWidth] = useState("");
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overNodeId, setOverNodeId] = useState<string | null>(null);
  const overNodeIdRef = useRef<string | null>(null);
  const [dropAbove, setDropAbove] = useState(true);
  const dropAboveRef = useRef(true);
  const [themeCSS, setThemeCSS] = useState("");
  const mouseYRef = useRef(0);
  const { previewDark, togglePreviewDark } = useEmailDarkModeStore();
  const { data: varData } = useVariablesStore();

  // Editor Store actions
  const initialize = useEditorStore((state) => state.initialize);
  const addNode = useEditorStore((state) => state.addNode);
  const moveNode = useEditorStore((state) => state.moveNode);
  const reorderNode = useEditorStore((state) => state.reorderNode);
  const updateNodeProps = useEditorStore((state) => state.updateNodeProps);
  const currentData = useEditorStore((state) => state.data);
  const rootNodeId = useEditorStore((state) => state.data.rootNodeId);
  const rootNode = useEditorStore((state) => state.data.nodes[state.data.rootNodeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Keyboard shortcuts + mouse tracking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = navigator.platform.includes("Mac") ? e.metaKey : e.ctrlKey;
      if (!ctrl) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.getState().undo();
      }
      if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        useEditorStore.getState().redo();
      }
    };
    const handlePointerMove = (e: PointerEvent) => {
      mouseYRef.current = e.clientY;
      // Update visual indicator in real time when over a node
      const currentOver = overNodeIdRef.current;
      if (!currentOver) return;
      const overEl = document.getElementById(`node-${currentOver}`);
      if (!overEl) return;
      const rect = overEl.getBoundingClientRect();
      const above = e.clientY < rect.top + rect.height / 2;
      if (above !== dropAboveRef.current) {
        dropAboveRef.current = above;
        setDropAbove(above);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  // Load Template
  useEffect(() => {
    if (authLoading || !user) return;
    
    // Quick and dirty fetch logic for deep page load
    repo.getTemplateById(id).then((tmpl) => {
      if (!tmpl) {
        router.push("/dashboard");
        return;
      }
      initialize(tmpl.data);
    });
  }, [id, user, authLoading, router, initialize]);

  if (authLoading || !currentData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const CONTAINER_TYPES = new Set(["ROOT", "CONTAINER", "COLUMNS", "CARD"]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const isNew = active.data.current?.isNew;
    setActiveDragId(active.id as string);
    overNodeIdRef.current = null;
    setOverNodeId(null);
    dropAboveRef.current = true;
    if (isNew) {
      setActiveDragType(active.data.current?.type);
    } else {
      const draggedNode = currentData?.nodes[active.id as string];
      setActiveDragType(draggedNode?.type || null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverNodeId(null);
      return;
    }

    const overId = over.id as string;
    const overNode = currentData?.nodes[overId];

    // Don't show indicator when hovering a container (drop goes inside it)
    if (!overNode || CONTAINER_TYPES.has(overNode.type)) {
      overNodeIdRef.current = null;
      setOverNodeId(null);
      return;
    }

    overNodeIdRef.current = overId;
    setOverNodeId(overId);

    const overEl = document.getElementById(`node-${overId}`);
    if (overEl) {
      const rect = overEl.getBoundingClientRect();
      const above = mouseYRef.current < rect.top + rect.height / 2;
      dropAboveRef.current = above;
      setDropAbove(above);
    }

  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragType(null);
    setActiveDragId(null);
    overNodeIdRef.current = null;
    setOverNodeId(null);

    const { active, over } = event;
    if (!over) return;

    const isNew = active.data.current?.isNew;
    const overId = over.id as string;

    // ── Handle edge drop zones (drop-before / drop-after container nodes) ──
    if (overId.startsWith("drop-before-") || overId.startsWith("drop-after-")) {
      const isBefore = overId.startsWith("drop-before-");
      const targetNodeId = isBefore
        ? overId.slice("drop-before-".length)
        : overId.slice("drop-after-".length);

      // Find the parent node that contains targetNodeId as a child
      const parentEntry = Object.entries(currentData!.nodes).find(
        ([, node]) => node.children.includes(targetNodeId)
      );
      if (!parentEntry) return;
      const [parentId, parentNode] = parentEntry;
      const targetIndex = parentNode.children.indexOf(targetNodeId);
      const edgeInsertIndex = isBefore ? targetIndex : targetIndex + 1;

      if (isNew) {
        const type = active.data.current?.type as EditorNodeType;
        const presetProps = active.data.current?.presetProps;
        addNode(parentId, {
          id: uuidv4(),
          type,
          props: presetProps ?? getDefaultProps(type),
          children: [],
        }, edgeInsertIndex);
      } else {
        if (active.id !== targetNodeId) {
          moveNode(active.id as string, parentId, edgeInsertIndex);
        }
      }
      return;
    }

    const overNode = currentData?.nodes[overId];
    const isOverContainer = overNode ? CONTAINER_TYPES.has(overNode.type) : false;

    // Compute dropAbove fresh at drop time — avoids onDragOver timing gap (onDragOver only fires on target change)
    let capturedDropAbove = true;
    if (!isOverContainer) {
      const overEl = document.getElementById(`node-${overId}`);
      if (overEl) {
        const rect = overEl.getBoundingClientRect();
        capturedDropAbove = mouseYRef.current < rect.top + rect.height / 2;
      }
    }

    let parentId = overId;
    let insertIndex: number | undefined;

    if (!isOverContainer) {
      for (const [nodeId, node] of Object.entries(currentData!.nodes)) {
        const idx = node.children.indexOf(overId);
        if (idx !== -1) {
          parentId = nodeId;
          insertIndex = capturedDropAbove ? idx : idx + 1;
          break;
        }
      }
    }

    if (isNew) {
      const type = active.data.current?.type as EditorNodeType;
      const presetProps = active.data.current?.presetProps;

      if (type === 'COLUMNS' && !presetProps) {
        // Auto-create 2 empty column containers so the user has immediate drop zones
        const columnsId = uuidv4();
        const col1Id = uuidv4();
        const col2Id = uuidv4();
        const colProps = {
          style: {
            flex: '1',
            minHeight: '80px',
            paddingTop: '12px',
            paddingRight: '12px',
            paddingBottom: '12px',
            paddingLeft: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0px',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
          },
        };
        addNode(parentId, {
          id: columnsId,
          type,
          props: getDefaultProps(type),
          children: [col1Id, col2Id],
        }, insertIndex, [
          { id: col1Id, type: 'CONTAINER', props: colProps, children: [] },
          { id: col2Id, type: 'CONTAINER', props: colProps, children: [] },
        ]);
      } else {
        addNode(parentId, {
          id: uuidv4(),
          type,
          props: presetProps ?? getDefaultProps(type),
          children: [],
        }, insertIndex);
      }
    } else {
      if (active.id !== over.id) {
        if (isOverContainer) {
          // Drop directly into container — append at end (was incorrectly hardcoded to 0)
          moveNode(active.id as string, parentId, overNode!.children.length);
        } else {
          const activeParentId = Object.keys(currentData!.nodes).find(
            (key) => currentData!.nodes[key].children.includes(active.id as string)
          );
          if (activeParentId === parentId) {
            reorderNode(parentId, active.id as string, over.id as string, capturedDropAbove);
          } else {
            moveNode(active.id as string, parentId, insertIndex ?? 0);
          }
        }
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const tmpl = await repo.getTemplateById(id);
    if (tmpl) {
      tmpl.data = currentData;
      await repo.saveTemplate(tmpl);
    }
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const htmlString = await generateHtmlExport(currentData, themeCSS);
      // Create a blob and trigger download
      const blob = new Blob([htmlString], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template-${id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export Failed", e);
      alert("Failed to export HTML.");
    }
    setIsExporting(false);
  };

  const handleExportRendered = async () => {
    setIsExporting(true);
    try {
      const renderedData = substituteAllNodes(currentData, varData);
      const htmlString = await generateHtmlExport(renderedData, themeCSS);
      const blob = new Blob([htmlString], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template-${id}-rendered.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export Rendered Failed", e);
      alert("Failed to export rendered HTML.");
    }
    setIsExporting(false);
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const htmlString = await generateHtmlExport(currentData, themeCSS);
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: htmlString, filename: `template-${id}.pdf` }),
      });
      if (!response.ok) throw new Error(await response.text());
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "PDF export failed";
      alert(message);
    }
    setIsExportingPdf(false);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div className="h-4 w-px bg-border"></div>
          <span className="font-medium text-sm text-foreground bg-muted px-2.5 py-1 rounded-md border border-border flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Editing Template
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeInjector onThemeChange={setThemeCSS} />

          <Button
            size="sm"
            variant={previewDark ? "default" : "outline"}
            onClick={togglePreviewDark}
            title="Toggle email dark mode preview"
          >
            <Moon className="h-4 w-4 mr-2" />
            {previewDark ? "Dark" : "Light"}
          </Button>

          <DeviceToggle />

          {(() => {
            const currentMaxWidth = rootNode?.props.style?.maxWidth || "600px";
            const PRESETS = [
              { label: "Narrow", value: "480px" },
              { label: "Standard", value: "600px" },
              { label: "Wide", value: "640px" },
            ];
            const applyWidth = (width: string) => {
              updateNodeProps(rootNodeId, {
                style: { ...rootNode?.props.style, maxWidth: width },
              });
            };
            const widthNum = parseInt(currentMaxWidth, 10);
            const showWarning = !isNaN(widthNum) && widthNum > 700;
            return (
              <Popover onOpenChange={(open) => { if (open) setCustomWidth(currentMaxWidth); }}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" title="Canvas Width">
                    <Maximize2 className="h-4 w-4 mr-2" />
                    {currentMaxWidth}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="end">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Canvas Width</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PRESETS.map((p) => (
                        <Button
                          key={p.value}
                          size="sm"
                          variant={currentMaxWidth === p.value ? "default" : "outline"}
                          className="flex flex-col h-auto py-1.5 text-xs gap-0"
                          onClick={() => applyWidth(p.value)}
                        >
                          <span>{p.value}</span>
                          <span className="text-[10px] font-normal opacity-70">{p.label}</span>
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(e.target.value)}
                        placeholder="e.g. 560px"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none placeholder:text-muted-foreground"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const val = customWidth.trim();
                          const normalized = /^\d+$/.test(val) ? val + "px" : val;
                          if (/^\d+(px)?$/.test(val)) {
                            applyWidth(normalized);
                          }
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                    {(showWarning || parseInt(customWidth) > 700) && (
                      <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Widths above 700px may clip in some email clients
                      </p>
                    )}
                    <Separator />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs"
                      onClick={() =>
                        useTemplateDefaultsStore.getState().setDefaultMaxWidth(currentMaxWidth)
                      }
                    >
                      Save as default
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })()}

          <Button
            size="sm"
            variant="outline"
            onClick={() => usePreviewStore.getState().setModalOpen(true)}
          >
            <Eye className="h-4 w-4 mr-2" /> Preview
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export Template"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportRendered}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Rendered
          </Button>

          <Button size="sm" variant="outline" onClick={handleExportPdf} disabled={isExportingPdf}>
            <FileText className="h-4 w-4 mr-2" />
            {isExportingPdf ? "Generating PDF..." : "Export PDF"}
          </Button>

          <TestEmailDialog
            getHtml={async () => generateHtmlExport(currentData, themeCSS)}
          />

          <Button
            size="sm"
            variant="default"
            onClick={handleSave}
            disabled={isSaving}
            className={saveSuccess ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {saveSuccess ? (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Template"}
          </Button>
        </div>
      </header>

      {/* Editor Main */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
          <EditorSidebar />
          <EditorCanvas
            themeCSS={themeCSS}
            overNodeId={overNodeId}
            dropAbove={dropAbove}
            activeDragId={activeDragId}
          />
          <EditorPropertiesPanel />
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeDragType ? (() => {
            const Icon = NODE_ICONS[activeDragType] || Type;
            return (
              <div className="px-4 py-3 rounded-lg border-2 border-primary bg-primary/10 text-primary font-semibold shadow-2xl backdrop-blur-sm text-sm flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {activeDragType}
              </div>
            );
          })() : null}
        </DragOverlay>
      </DndContext>

      <PreviewModal themeCSS={themeCSS} />
    </div>
  );
}

function getDefaultProps(type: EditorNodeType) {
  switch (type) {
    case 'TEXT': return { content: 'Add your text here...', style: { color: 'var(--foreground)', fontSize: '16px', fontWeight: '400', lineHeight: '1.6', textAlign: 'left' } };
    case 'BUTTON': return { content: 'Click Here', href: '#', style: { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', width: '100%', textAlign: 'center' } };
    case 'IMAGE': return { src: 'https://placehold.co/600x400', alt: 'Placeholder', style: { width: '100%', borderRadius: 'var(--radius)' } };
    case 'CONTAINER': return { style: { paddingTop: '20px', paddingRight: '20px', paddingBottom: '20px', paddingLeft: '20px', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', gap: '0px', alignItems: 'stretch', justifyContent: 'flex-start' } };
    case 'DIVIDER': return { style: { width: '100%' } };
    case 'SPACER': return { height: '40px', style: {} };
    case 'COLUMNS': return { style: { display: 'flex', gap: '20px', flexDirection: 'row', width: '100%' } };
    case 'SOCIAL': return { style: { display: 'flex', gap: '10px', justifyContent: 'center', paddingTop: '10px', paddingRight: '10px', paddingBottom: '10px', paddingLeft: '10px' } };
    case 'CARD': return { cardTitle: 'Card Title', cardDescription: 'Short description here', style: { width: '100%' } };
    case 'TABLE': return {
      headers: ['Name', 'Status', 'Amount'],
      rows: [
        ['Project Alpha', 'Active', '$2,500'],
        ['Project Beta', 'Pending', '$1,200'],
      ],
      style: { width: '100%' },
    };
    case 'BADGE': return {
      content: 'New',
      variant: 'default',
      style: {},
    };
    case 'CHART': return {
      chartType: 'bar',
      chartTitle: 'Monthly Sales',
      data: [
        { name: 'Jan', value: 4000 },
        { name: 'Feb', value: 3000 },
        { name: 'Mar', value: 5000 },
        { name: 'Apr', value: 4500 },
      ],
      colors: ['#f97316', '#60a5fa', '#34d399', '#f59e0b'],
      style: { width: '100%' },
    };
    default: return {};
  }
}

