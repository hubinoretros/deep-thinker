import {
  Strategy,
  ThoughtType,
  EdgeType,
  ThoughtNode,
} from "./types.js";
import { createNode, addEdge } from "./node.js";
import { ThoughtGraph } from "./graph.js";

export interface StrategyContext {
  graph: ThoughtGraph;
  currentStrategy: Strategy;
  problem: string;
  parentNodeId: string | null;
  branch: string;
  tags: string[];
}

export interface StrategyResult {
  nodes: ThoughtNode[];
  edgeTypes: Array<{ from: string; to: string; type: EdgeType }>;
  strategy: Strategy;
  nextSuggestedStrategy: Strategy | null;
  reasoning: string;
}

export function applySequential(ctx: StrategyContext, thought: string, type: ThoughtType, confidence: number): StrategyResult {
  const node = createNode({
    content: thought,
    type,
    strategy: "sequential",
    confidence,
    parentId: ctx.parentNodeId,
    branch: ctx.branch,
    tags: ctx.tags,
  });

  const edges: Array<{ from: string; to: string; type: EdgeType }> = [];
  if (ctx.parentNodeId) {
    edges.push({ from: node.id, to: ctx.parentNodeId, type: "derives_from" });
  }

  return {
    nodes: [node],
    edgeTypes: edges,
    strategy: "sequential",
    nextSuggestedStrategy: null,
    reasoning: "Sequential: building linear chain of reasoning",
  };
}

export function applyDialectic(
  ctx: StrategyContext,
  thesis: string,
  antithesis: string | null,
  synthesis: string | null,
  confidence: number
): StrategyResult {
  const nodes: ThoughtNode[] = [];
  const edges: Array<{ from: string; to: string; type: EdgeType }> = [];

  const thesisNode = createNode({
    content: thesis,
    type: "hypothesis",
    strategy: "dialectic",
    confidence,
    parentId: ctx.parentNodeId,
    branch: ctx.branch,
    tags: [...ctx.tags, "dialectic-thesis"],
  });
  nodes.push(thesisNode);

  if (ctx.parentNodeId) {
    edges.push({ from: thesisNode.id, to: ctx.parentNodeId, type: "derives_from" });
  }

  if (antithesis) {
    const antithesisNode = createNode({
      content: antithesis,
      type: "critique",
      strategy: "dialectic",
      confidence: Math.max(0.1, confidence - 0.1),
      parentId: thesisNode.id,
      branch: `${ctx.branch}-antithesis`,
      tags: [...ctx.tags, "dialectic-antithesis"],
    });
    nodes.push(antithesisNode);
    edges.push({ from: antithesisNode.id, to: thesisNode.id, type: "contradicts" });

    if (synthesis) {
      const synthesisNode = createNode({
        content: synthesis,
        type: "synthesis",
        strategy: "dialectic",
        confidence: Math.min(1, confidence + 0.1),
        parentId: antithesisNode.id,
        branch: ctx.branch,
        tags: [...ctx.tags, "dialectic-synthesis"],
      });
      nodes.push(synthesisNode);
      edges.push({ from: synthesisNode.id, to: thesisNode.id, type: "synthesizes" });
      edges.push({ from: synthesisNode.id, to: antithesisNode.id, type: "synthesizes" });
    }
  }

  return {
    nodes,
    edgeTypes: edges,
    strategy: "dialectic",
    nextSuggestedStrategy: !synthesis ? "dialectic" : null,
    reasoning: antithesis
      ? synthesis
        ? "Dialectic: thesis → antithesis → synthesis complete"
        : "Dialectic: thesis → antithesis established, synthesis pending"
      : "Dialectic: thesis established, awaiting antithesis",
  };
}

export function applyParallel(
  ctx: StrategyContext,
  thoughts: Array<{ content: string; type: ThoughtType; confidence: number }>
): StrategyResult {
  const nodes: ThoughtNode[] = [];
  const edges: Array<{ from: string; to: string; type: EdgeType }> = [];

  for (let i = 0; i < thoughts.length; i++) {
    const t = thoughts[i];
    const branchName = `${ctx.branch}-parallel-${i}`;
    const node = createNode({
      content: t.content,
      type: t.type,
      strategy: "parallel",
      confidence: t.confidence,
      parentId: ctx.parentNodeId,
      branch: branchName,
      tags: [...ctx.tags, `parallel-${i}`],
    });
    nodes.push(node);

    if (ctx.parentNodeId) {
      edges.push({ from: node.id, to: ctx.parentNodeId, type: "parallels" });
    }

    // Cross-link parallel branches
    if (i > 0) {
      edges.push({
        from: node.id,
        to: nodes[0].id,
        type: "parallels",
      });
    }
  }

  return {
    nodes,
    edgeTypes: edges,
    strategy: "parallel",
    nextSuggestedStrategy: null,
    reasoning: `Parallel: exploring ${thoughts.length} independent branches`,
  };
}

export function applyAnalogical(
  ctx: StrategyContext,
  sourceDomain: string,
  mapping: string,
  projectedConclusion: string,
  confidence: number
): StrategyResult {
  const nodes: ThoughtNode[] = [];
  const edges: Array<{ from: string; to: string; type: EdgeType }> = [];

  const sourceNode = createNode({
    content: `Source: ${sourceDomain}`,
    type: "observation",
    strategy: "analogical",
    confidence: 0.8,
    parentId: ctx.parentNodeId,
    branch: `${ctx.branch}-analogy-source`,
    tags: [...ctx.tags, "analogical-source"],
  });
  nodes.push(sourceNode);

  if (ctx.parentNodeId) {
    edges.push({ from: sourceNode.id, to: ctx.parentNodeId, type: "derives_from" });
  }

  const mappingNode = createNode({
    content: `Mapping: ${mapping}`,
    type: "analysis",
    strategy: "analogical",
    confidence: 0.7,
    parentId: sourceNode.id,
    branch: `${ctx.branch}-analogy-mapping`,
    tags: [...ctx.tags, "analogical-mapping"],
  });
  nodes.push(mappingNode);
  edges.push({ from: mappingNode.id, to: sourceNode.id, type: "derives_from" });

  const conclusionNode = createNode({
    content: `Projected: ${projectedConclusion}`,
    type: "hypothesis",
    strategy: "analogical",
    confidence,
    parentId: mappingNode.id,
    branch: `${ctx.branch}-analogy-projection`,
    tags: [...ctx.tags, "analogical-projection"],
  });
  nodes.push(conclusionNode);
  edges.push({ from: conclusionNode.id, to: mappingNode.id, type: "derives_from" });
  edges.push({ from: conclusionNode.id, to: sourceNode.id, type: "abstracts" });

  return {
    nodes,
    edgeTypes: edges,
    strategy: "analogical",
    nextSuggestedStrategy: null,
    reasoning: "Analogical: source → mapping → projection",
  };
}

export function applyAbductive(
  ctx: StrategyContext,
  observation: string,
  explanations: Array<{ content: string; plausibility: number }>,
  bestExplanation: string | null,
  confidence: number
): StrategyResult {
  const nodes: ThoughtNode[] = [];
  const edges: Array<{ from: string; to: string; type: EdgeType }> = [];

  const obsNode = createNode({
    content: observation,
    type: "observation",
    strategy: "abductive",
    confidence: 0.9,
    parentId: ctx.parentNodeId,
    branch: ctx.branch,
    tags: [...ctx.tags, "abductive-observation"],
  });
  nodes.push(obsNode);

  if (ctx.parentNodeId) {
    edges.push({ from: obsNode.id, to: ctx.parentNodeId, type: "derives_from" });
  }

  for (let i = 0; i < explanations.length; i++) {
    const exp = explanations[i];
    const expNode = createNode({
      content: exp.content,
      type: "hypothesis",
      strategy: "abductive",
      confidence: exp.plausibility,
      parentId: obsNode.id,
      branch: `${ctx.branch}-abductive-exp-${i}`,
      tags: [...ctx.tags, `abductive-explanation-${i}`],
    });
    nodes.push(expNode);
    edges.push({ from: expNode.id, to: obsNode.id, type: "instantiates" });
  }

  if (bestExplanation) {
    const bestNode = createNode({
      content: `Best explanation: ${bestExplanation}`,
      type: "conclusion",
      strategy: "abductive",
      confidence,
      parentId: obsNode.id,
      branch: ctx.branch,
      tags: [...ctx.tags, "abductive-best"],
    });
    nodes.push(bestNode);
    edges.push({ from: bestNode.id, to: obsNode.id, type: "derives_from" });

    for (const expNode of nodes.filter(
      (n) => n.type === "hypothesis" && n.metadata.tags.includes("abductive-explanation")
    )) {
      if (bestExplanation.toLowerCase().includes(expNode.content.toLowerCase().substring(0, 20))) {
        edges.push({ from: bestNode.id, to: expNode.id, type: "supports" });
      }
    }
  }

  return {
    nodes,
    edgeTypes: edges,
    strategy: "abductive",
    nextSuggestedStrategy: bestExplanation ? null : "abductive",
    reasoning: bestExplanation
      ? "Abductive: observation → hypotheses → best explanation selected"
      : "Abductive: observation → hypotheses generated, best explanation pending",
  };
}
