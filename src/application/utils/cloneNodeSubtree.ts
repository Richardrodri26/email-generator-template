import { v4 as uuidv4 } from "uuid";
import { EditorNode } from "@/domain/models/Template";

/**
 * Deep-clones a node subtree, assigning new UUIDs to all nodes.
 * Returns the new root ID and a flat array of all cloned nodes (root first).
 * Use with addNode(parentId, clonedNodes[0], insertIndex, clonedNodes.slice(1)).
 */
export function cloneNodeSubtree(
  nodeId: string,
  nodes: Record<string, EditorNode>
): { rootId: string; clonedNodes: EditorNode[] } {
  const idMap = new Map<string, string>();
  const clonedNodes: EditorNode[] = [];

  function cloneRecursive(currentId: string): string | null {
    const original = nodes[currentId];
    if (!original) return null;

    const newId = uuidv4();
    idMap.set(currentId, newId);

    const newChildIds: string[] = [];
    for (const childId of original.children) {
      const clonedChildId = cloneRecursive(childId);
      if (clonedChildId) newChildIds.push(clonedChildId);
    }

    const clonedNode: EditorNode = {
      id: newId,
      type: original.type,
      props: JSON.parse(JSON.stringify(original.props)),
      children: newChildIds,
    };

    clonedNodes.push(clonedNode);
    return newId;
  }

  const rootId = cloneRecursive(nodeId);
  if (!rootId) return { rootId: nodeId, clonedNodes: [] };

  // Re-order so root is first (cloneRecursive pushes children before parent)
  const rootIndex = clonedNodes.findIndex((n) => n.id === rootId);
  if (rootIndex > 0) {
    const [root] = clonedNodes.splice(rootIndex, 1);
    clonedNodes.unshift(root);
  }

  return { rootId, clonedNodes };
}
