"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/application/useAuth";
import { useTemplates } from "@/application/useTemplates";
import { useEditorStore } from "@/application/useEditorStore";
import { DndContext, DragEndEvent, closestCenter, DragStartEvent, DragOverlay } from "@dnd-kit/core";
import { EditorSidebar } from "@/components/organisms/Editor/Sidebar";
import { EditorCanvas } from "@/components/organisms/Editor/Canvas";
import { EditorPropertiesPanel } from "@/components/organisms/Editor/PropertiesPanel";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Download } from "lucide-react";
import { LocalStorageTemplateRepository } from "@/infrastructure/repositories/LocalStorageTemplateRepository";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { EditorNodeType } from "@/domain/models/Template";
import { generateHtmlExport } from "@/application/useExportBuilder";
import { ThemeInjector } from "@/components/organisms/Editor/ThemeInjector";

const repo = new LocalStorageTemplateRepository();

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user, isLoading: authLoading } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [themeCSS, setThemeCSS] = useState("");

  // Editor Store actions
  const initialize = useEditorStore((state) => state.initialize);
  const addNode = useEditorStore((state) => state.addNode);
  const moveNode = useEditorStore((state) => state.moveNode);
  const reorderNode = useEditorStore((state) => state.reorderNode);
  const currentData = useEditorStore((state) => state.data);

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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const isNew = active.data.current?.isNew;
    setActiveDragId(active.id as string);
    if (isNew) {
      setActiveDragType(active.data.current?.type);
    } else {
      // Existing node being dragged
      const draggedNode = currentData?.nodes[active.id as string];
      setActiveDragType(draggedNode?.type || null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragType(null);
    setActiveDragId(null);
    const { active, over } = event;
    
    if (!over) return;
    
    const isNew = active.data.current?.isNew;
    const overId = over.id as string;
    const overNode = currentData?.nodes[overId];
    // Determine the actual parent. If we are dragging over a container, the parent is the container. If we are dragging over an item, the parent is the item's parent.
    const isOverContainer = overNode?.type === "ROOT" || overNode?.type === "CONTAINER" || overNode?.type === "COLUMNS" || overNode?.type === "CARD";
    
    let parentId = overId;
    let insertIndex = undefined;

    if (!isOverContainer) {
      // Find parent of the over node
      for (const [nodeId, node] of Object.entries(currentData!.nodes)) {
        const idx = node.children.indexOf(overId);
        if (idx !== -1) {
          parentId = nodeId;
          insertIndex = idx;
          break;
        }
      }
    }

    if (isNew) {
      const type = active.data.current?.type as EditorNodeType;
      // Add new node
      const newNodeId = uuidv4();
      addNode(parentId, {
        id: newNodeId,
        type,
        props: getDefaultProps(type),
        children: []
      }, insertIndex);
    } else {
      // It's an existing node
      if (active.id !== over.id) {
        if (parentId === overId && isOverContainer) {
          // Moved into a new container
          moveNode(active.id as string, parentId, 0);
        } else {
          // Sort/Reorder within the same parent or moving to a specific index in a different parent
          // To keep it robust, let's check if they belong to the same parent first
          const activeParentId = Object.keys(currentData!.nodes).find(key => currentData!.nodes[key].children.includes(active.id as string));
          
          if (activeParentId === parentId) {
            // Reorder inside the same sequence
            reorderNode(parentId, active.id as string, over.id as string);
          } else {
            // Move across containers
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

  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-white z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200"></div>
          <span className="font-medium text-sm text-slate-900 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
            Editing Template
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeInjector onThemeChange={setThemeCSS} />
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleExport} 
            disabled={isExporting}
            className="border-slate-200"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export HTML"}
          </Button>

          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-orange-500 hover:bg-orange-600 border-0 text-white shadow-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </header>

      {/* Editor Main */}
      <DndContext 
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
          <EditorSidebar />
          <EditorCanvas themeCSS={themeCSS} />
          <EditorPropertiesPanel />
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeDragType ? (
            <div className="px-4 py-3 rounded-lg border-2 border-primary bg-primary/10 text-primary font-semibold shadow-2xl backdrop-blur-sm text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {activeDragType}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function getDefaultProps(type: EditorNodeType) {
  switch (type) {
    case 'TEXT': return { content: 'Add your text here...', style: { color: 'var(--foreground)' } };
    case 'BUTTON': return { content: 'Click Here', href: '#', style: {} };
    case 'IMAGE': return { src: 'https://placehold.co/600x400', alt: 'Placeholder', style: { width: '100%', borderRadius: 'var(--radius)' } };
    case 'CONTAINER': return { style: { padding: '20px', backgroundColor: 'transparent' } };
    case 'DIVIDER': return { style: { width: '100%' } };
    case 'SPACER': return { height: '40px', style: {} };
    case 'COLUMNS': return { style: { display: 'flex', gap: '20px', flexDirection: 'row', width: '100%' } };
    case 'SOCIAL': return { style: { display: 'flex', gap: '10px', justifyContent: 'center', padding: '10px' } };
    case 'CARD': return { cardTitle: 'Card Title', cardDescription: 'Short description here', style: { width: '100%' } };
    case 'TABLE': return {
      headers: ['Name', 'Status', 'Amount'],
      rows: [
        ['Project Alpha', 'Active', '$2,500'],
        ['Project Beta', 'Pending', '$1,200'],
      ],
      style: { width: '100%' },
    };
    default: return {};
  }
}

