import { ThoughtNode, KnowledgeReference } from "./types.js";
import { ThoughtGraph } from "./graph.js";
import { addKnowledge } from "./node.js";

export interface KnowledgeSource {
  name: string;
  type: "fact" | "principle" | "constraint" | "context";
  reliability: number;
}

export function integrateKnowledge(
  node: ThoughtNode,
  source: string,
  content: string,
  relevance: number,
  type: "fact" | "principle" | "constraint" | "context" = "fact"
): KnowledgeReference {
  const ref: KnowledgeReference = {
    source,
    content,
    relevance: Math.max(0, Math.min(1, relevance)),
    integratedAt: Date.now(),
  };

  addKnowledge(node, ref);
  return ref;
}

export function getKnowledgeConfidenceBoost(node: ThoughtNode): number {
  if (node.knowledge.length === 0) return 0;

  const totalRelevance = node.knowledge.reduce((sum, k) => sum + k.relevance, 0);
  const avgRelevance = totalRelevance / node.knowledge.length;
  const countBoost = Math.min(node.knowledge.length * 0.03, 0.12);

  return avgRelevance * countBoost;
}

export function findKnowledgeGaps(graph: ThoughtGraph): Array<{
  nodeId: string;
  nodeType: string;
  missingType: "fact" | "principle" | "constraint" | "context";
  description: string;
}> {
  const gaps: Array<{
    nodeId: string;
    nodeType: string;
    missingType: "fact" | "principle" | "constraint" | "context";
    description: string;
  }> = [];

  for (const node of graph.getActiveNodes()) {
    if (node.type === "hypothesis" && node.knowledge.filter((k) => k.relevance > 0.7).length === 0) {
      gaps.push({
        nodeId: node.id,
        nodeType: node.type,
        missingType: "fact",
        description: `Hypothesis "${node.content.substring(0, 40)}..." lacks factual support`,
      });
    }

    if (node.type === "conclusion" && !node.knowledge.some((k) => k.source === "principle")) {
      gaps.push({
        nodeId: node.id,
        nodeType: node.type,
        missingType: "principle",
        description: `Conclusion "${node.content.substring(0, 40)}..." lacks principled justification`,
      });
    }

    if (node.type === "assumption" && !node.knowledge.some((k) => k.source === "constraint")) {
      gaps.push({
        nodeId: node.id,
        nodeType: node.type,
        missingType: "constraint",
        description: `Assumption "${node.content.substring(0, 40)}..." needs constraint validation`,
      });
    }
  }

  return gaps;
}

export function validateKnowledgeConsistency(
  graph: ThoughtGraph
): Array<{ node1: string; node2: string; conflict: string }> {
  const conflicts: Array<{ node1: string; node2: string; conflict: string }> = [];

  const allNodes = graph.getActiveNodes().filter((n) => n.knowledge.length > 0);

  for (let i = 0; i < allNodes.length; i++) {
    for (let j = i + 1; j < allNodes.length; j++) {
      const n1 = allNodes[i];
      const n2 = allNodes[j];

      for (const k1 of n1.knowledge) {
        for (const k2 of n2.knowledge) {
          if (k1.source === k2.source && _isContradictory(k1.content, k2.content)) {
            conflicts.push({
              node1: n1.id,
              node2: n2.id,
              conflict: `Same source "${k1.source}" provides contradictory info: "${k1.content.substring(0, 30)}" vs "${k2.content.substring(0, 30)}"`,
            });
          }
        }
      }
    }
  }

  return conflicts;
}

function _isContradictory(a: string, b: string): boolean {
  const negations = ["not", "never", "impossible", "cannot", "no"];
  const wordsA = a.toLowerCase().split(/\s+/);
  const wordsB = b.toLowerCase().split(/\s+/);

  const aHasNegation = wordsA.some((w) => negations.includes(w));
  const bHasNegation = wordsB.some((w) => negations.includes(w));

  if (aHasNegation !== bHasNegation) {
    const commonWords = wordsA.filter((w) => wordsB.includes(w) && w.length > 3);
    if (commonWords.length >= 2) return true;
  }

  return false;
}
