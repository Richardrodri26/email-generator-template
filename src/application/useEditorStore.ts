import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { EditorNode, TemplateData } from "@/domain/models/Template";
import { arrayMove } from "@dnd-kit/sortable";

interface EditorState {
  data: TemplateData;
  selectedNodeId: string | null;
  history: TemplateData[];
  historyIndex: number;

  // Actions
  initialize: (data: TemplateData) => void;
  selectNode: (id: string | null) => void;
  addNode: (parentId: string, node: EditorNode, index?: number) => void;
  moveNode: (id: string, newParentId: string, newIndex: number) => void;
  reorderNode: (parentId: string, activeId: string, overId: string, insertBefore?: boolean) => void;
  updateNodeProps: (id: string, props: Record<string, any>) => void;
  removeNode: (id: string) => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    data: {
      rootNodeId: "root",
      nodes: {
        root: {
          id: "root",
          type: "ROOT",
          props: { style: { backgroundColor: "#ffffff", padding: "20px" } },
          children: [],
        },
      },
    },
    selectedNodeId: null,
    history: [],
    historyIndex: -1,

    initialize: (data) =>
      set((state) => {
        state.data = data;
        state.history = [JSON.parse(JSON.stringify(data))];
        state.historyIndex = 0;
        state.selectedNodeId = null;
      }),

    selectNode: (id) =>
      set((state) => {
        state.selectedNodeId = id;
      }),

    addNode: (parentId, node, index) =>
      set((state) => {
        // Add the node to the dictionary
        state.data.nodes[node.id] = node;

        const parent = state.data.nodes[parentId];
        if (parent) {
          if (index !== undefined) {
            parent.children.splice(index, 0, node.id);
          } else {
            parent.children.push(node.id);
          }
        }

        // Save to history
        const currentData = JSON.parse(JSON.stringify(state.data));
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(currentData);
        state.historyIndex++;
      }),

    moveNode: (id, newParentId, newIndex) =>
      set((state) => {
        if (id === "root" || id === newParentId) return;

        // Find current parent
        let currentParentId = null;
        for (const [nodeId, node] of Object.entries(state.data.nodes)) {
          if (node.children.includes(id)) {
            currentParentId = nodeId;
            break;
          }
        }

        if (currentParentId) {
          // Remove from old parent
          const oldParent = state.data.nodes[currentParentId];
          oldParent.children = oldParent.children.filter(
            (childId) => childId !== id,
          );
        }

        // Add to new parent
        const newParent = state.data.nodes[newParentId];
        if (newParent) {
          const insertIndex = newIndex ?? newParent.children.length;
          newParent.children.splice(insertIndex, 0, id);
        }

        // Save to history
        const currentData = JSON.parse(JSON.stringify(state.data));
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(currentData);
        state.historyIndex++;
      }),

    reorderNode: (parentId, activeId, overId, insertBefore = true) =>
      set((state) => {
        const parent = state.data.nodes[parentId];
        if (!parent) return;

        const oldIndex = parent.children.indexOf(activeId);
        const overIndex = parent.children.indexOf(overId);

        if (oldIndex === -1 || overIndex === -1 || oldIndex === overIndex) return;

        // Remove active from current position
        const next = [...parent.children];
        next.splice(oldIndex, 1);

        // Find over's new index after removal, then insert before or after
        const newOverIndex = next.indexOf(overId);
        const insertAt = insertBefore ? newOverIndex : newOverIndex + 1;
        next.splice(insertAt, 0, activeId);

        parent.children = next;

        // Save to history
        const currentData = JSON.parse(JSON.stringify(state.data));
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(currentData);
        state.historyIndex++;
      }),

    updateNodeProps: (id, props) =>
      set((state) => {
        const node = state.data.nodes[id];
        if (node) {
          node.props = { ...node.props, ...props };

          // Save to history
          const currentData = JSON.parse(JSON.stringify(state.data));
          state.history = state.history.slice(0, state.historyIndex + 1);
          state.history.push(currentData);
          state.historyIndex++;
        }
      }),

    removeNode: (id) =>
      set((state) => {
        if (id === "root") return;

        const removeRecursively = (nodeId: string) => {
          const node = state.data.nodes[nodeId];
          if (!node) return;

          // Remove children
          node.children.forEach(removeRecursively);

          // Delete self
          delete state.data.nodes[nodeId];
        };

        // Remove from parent's children list
        for (const parent of Object.values(state.data.nodes)) {
          if (parent.children.includes(id)) {
            parent.children = parent.children.filter(
              (childId) => childId !== id,
            );
            break;
          }
        }

        removeRecursively(id);

        if (state.selectedNodeId === id) {
          state.selectedNodeId = null;
        }

        // Save to history
        const currentData = JSON.parse(JSON.stringify(state.data));
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(currentData);
        state.historyIndex++;
      }),

    undo: () =>
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          state.data = JSON.parse(
            JSON.stringify(state.history[state.historyIndex]),
          );
        }
      }),

    redo: () =>
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          state.data = JSON.parse(
            JSON.stringify(state.history[state.historyIndex]),
          );
        }
      }),
  })),
);
