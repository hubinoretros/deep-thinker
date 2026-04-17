import {
  ThoughtNode,
  ThoughtEdge,
  ThoughtMetadata,
  EdgeType,
  ThoughtType,
  Strategy,
  NodeStatus,
  Critique,
  KnowledgeReference,
  GraphStats,
} from "./types.js";

let nodeCounter = 0;

export function resetCounter(): void {
  nodeCounter = 0;
}

export function generateNodeId(): string {
  nodeCounter++;
  return `thought_${nodeCounter}`;
}

export function createNode(params: {
  content: string;
  type: ThoughtType;
  strategy: Strategy;
  confidence: number;
  parentId?: string | null;
  branch?: string;
  tags?: string[];
  revisionOf?: string | null;
}): ThoughtNode {
  return {
    id: generateNodeId(),
    content: params.content,
    type: params.type,
    strategy: params.strategy,
    confidence: Math.max(0, Math.min(1, params.confidence)),
    parentId: params.parentId ?? null,
    childIds: [],
    edges: [],
    metadata: {
      createdAt: Date.now(),
      depth: 0,
      branch: params.branch ?? "main",
      tags: params.tags ?? [],
      revisionOf: params.revisionOf ?? null,
    },
    status: "active",
    critique: null,
    knowledge: [],
  };
}

export function addEdge(
  node: ThoughtNode,
  targetId: string,
  type: EdgeType,
  weight: number = 1.0
): void {
  if (node.edges.some((e) => e.targetId === targetId && e.type === type)) {
    return;
  }
  node.edges.push({ targetId, type, weight: Math.max(0, Math.min(1, weight)) });
}

export function setCritique(
  node: ThoughtNode,
  critique: Critique
): void {
  node.critique = critique;
  node.confidence = Math.max(0, Math.min(1, node.confidence + critique.confidenceDelta));
}

export function addKnowledge(
  node: ThoughtNode,
  knowledge: KnowledgeReference
): void {
  node.knowledge.push(knowledge);
}

export function updateStatus(node: ThoughtNode, status: NodeStatus): void {
  node.status = status;
}

export function addTag(node: ThoughtNode, tag: string): void {
  if (!node.metadata.tags.includes(tag)) {
    node.metadata.tags.push(tag);
  }
}

export function nodeToSummary(node: ThoughtNode): string {
  const critiqueStr = node.critique
    ? `\n  Critique: [${node.critique.severity}] ${node.critique.content}`
    : "";
  const knowledgeStr = node.knowledge.length > 0
    ? `\n  Knowledge: ${node.knowledge.map((k) => `[${k.source}] ${k.content}`).join("; ")}`
    : "";
  const edgeStr = node.edges.length > 0
    ? `\n  Edges: ${node.edges.map((e) => `${e.type}→${e.targetId}(${e.weight.toFixed(2)})`).join(", ")}`
    : "";

  return [
    `ID: ${node.id}`,
    `Type: ${node.type} | Strategy: ${node.strategy} | Confidence: ${node.confidence.toFixed(2)} | Status: ${node.status}`,
    `Content: ${node.content}`,
    `Branch: ${node.metadata.branch} | Depth: ${node.metadata.depth} | Tags: [${node.metadata.tags.join(", ")}]`,
    `Parent: ${node.parentId ?? "root"} | Children: [${node.childIds.join(", ")}]`,
    edgeStr,
    critiqueStr,
    knowledgeStr,
  ].filter(Boolean).join("\n");
}
