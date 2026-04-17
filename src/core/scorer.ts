import { ThoughtNode, Critique } from "./types.js";
import { ThoughtGraph } from "./graph.js";

export interface ScoreResult {
  confidence: number;
  factors: ScoreFactor[];
  recommendation: string;
}

export interface ScoreFactor {
  name: string;
  contribution: number;
  description: string;
}

export function calculateConfidence(
  node: ThoughtNode,
  graph: ThoughtGraph,
  existingNodes: ThoughtNode[]
): ScoreResult {
  const factors: ScoreFactor[] = [];

  const baseConfidence = node.confidence;
  factors.push({
    name: "base_confidence",
    contribution: baseConfidence,
    description: "Initial confidence assigned to the thought",
  });

  const ancestors = graph.getAncestors(node.id);
  const ancestorSupport = ancestors.reduce(
    (sum, a) => sum + a.edges.filter((e) => e.type === "supports" && e.targetId === node.id).length,
    0
  );
  const supportFactor = Math.min(0.15, ancestorSupport * 0.05);
  factors.push({
    name: "support",
    contribution: supportFactor,
    description: `Supported by ${ancestorSupport} ancestor node(s)`,
  });

  const contradictAncestors = ancestors.reduce(
    (sum, a) => sum + a.edges.filter((e) => e.type === "contradicts" && e.targetId === node.id).length,
    0
  );
  const contradictFactor = -Math.min(0.2, contradictAncestors * 0.1);
  factors.push({
    name: "contradictions",
    contribution: contradictFactor,
    description: `Contradicted by ${contradictAncestors} node(s)`,
  });

  const similarNodes = existingNodes.filter(
    (n) =>
      n.id !== node.id &&
      n.type === node.type &&
      n.content.length > 0 &&
      _similarity(n.content, node.content) > 0.5
  );
  const redundancyFactor = similarNodes.length > 0 ? -0.05 * similarNodes.length : 0;
  factors.push({
    name: "redundancy",
    contribution: redundancyFactor,
    description: similarNodes.length > 0
      ? `${similarNodes.length} similar thought(s) detected`
      : "No redundancy detected",
  });

  const depthPenalty = -node.metadata.depth * 0.01;
  factors.push({
    name: "depth_penalty",
    contribution: depthPenalty,
    description: `Reasoning depth: ${node.metadata.depth}`,
  });

  const knowledgeBoost = node.knowledge.length * 0.05;
  factors.push({
    name: "knowledge_integration",
    contribution: Math.min(0.15, knowledgeBoost),
    description: `Integrated ${node.knowledge.length} external knowledge reference(s)`,
  });

  const totalConfidence = factors.reduce((sum, f) => sum + f.contribution, 0);
  const clampedConfidence = Math.max(0, Math.min(1, totalConfidence));

  let recommendation: string;
  if (clampedConfidence < 0.3) {
    recommendation = "Low confidence — consider revising assumptions or seeking more evidence";
  } else if (clampedConfidence < 0.6) {
    recommendation = "Moderate confidence — explore supporting or contradicting evidence";
  } else if (clampedConfidence < 0.8) {
    recommendation = "Good confidence — consider synthesis or moving toward conclusion";
  } else {
    recommendation = "High confidence — suitable for building conclusions upon";
  }

  return { confidence: clampedConfidence, factors, recommendation };
}

export function generateCritique(
  node: ThoughtNode,
  graph: ThoughtGraph
): Critique {
  const issues: string[] = [];
  let severity: "low" | "medium" | "high" = "low";
  let confidenceDelta = 0;

  if (node.type === "assumption" && node.confidence > 0.7) {
    issues.push("Assumptions with high confidence should be validated");
    severity = "medium";
    confidenceDelta = -0.1;
  }

  if (node.type === "conclusion" && node.metadata.depth < 2) {
    issues.push("Conclusion reached with insufficient reasoning depth");
    severity = "high";
    confidenceDelta = -0.15;
  }

  const contradictEdges = node.edges.filter((e) => e.type === "contradicts");
  if (contradictEdges.length > 0) {
    issues.push(`${contradictEdges.length} contradiction(s) detected`);
    severity = "high";
    confidenceDelta -= 0.1 * contradictEdges.length;
  }

  const descendants = graph.getDescendants(node.id);
  const supportFromChildren = descendants.filter(
    (d) => d.edges.some((e) => e.type === "supports" && e.targetId === node.id)
  );
  if (node.type === "hypothesis" && supportFromChildren.length === 0) {
    issues.push("Hypothesis lacks supporting evidence in subsequent thoughts");
    severity = "medium";
    confidenceDelta -= 0.05;
  }

  if (issues.length === 0) {
    return {
      content: "No significant issues detected. Thought appears well-founded.",
      severity: "low",
      addressed: false,
      confidenceDelta: 0,
    };
  }

  return {
    content: issues.join("; "),
    severity,
    addressed: false,
    confidenceDelta: Math.max(-0.3, confidenceDelta),
  };
}

export function evaluateGraphConfidence(graph: ThoughtGraph): {
  overallConfidence: number;
  weakSpots: Array<{ nodeId: string; confidence: number; issue: string }>;
  strongPaths: Array<{ nodeIds: string[]; avgConfidence: number }>;
} {
  const activeNodes = graph.getActiveNodes();
  const overallConfidence =
    activeNodes.length > 0
      ? activeNodes.reduce((sum, n) => sum + n.confidence, 0) / activeNodes.length
      : 0;

  const weakSpots = activeNodes
    .filter((n) => n.confidence < 0.4)
    .map((n) => ({
      nodeId: n.id,
      confidence: n.confidence,
      issue: n.critique?.content ?? "Low confidence without specific critique",
    }));

  const leaves = graph.getLeaves();
  const strongPaths = leaves
    .filter((l) => l.confidence > 0.7)
    .map((leaf) => {
      const path = [leaf, ...graph.getAncestors(leaf.id)];
      const avgConf =
        path.reduce((sum, n) => sum + n.confidence, 0) / path.length;
      return {
        nodeIds: path.map((n) => n.id),
        avgConfidence: avgConf,
      };
    })
    .sort((a, b) => b.avgConfidence - a.avgConfidence)
    .slice(0, 5);

  return { overallConfidence, weakSpots, strongPaths };
}

function _similarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}
