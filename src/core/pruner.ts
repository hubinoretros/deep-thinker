import { ThoughtNode, PruneResult } from "./types.js";
import { ThoughtGraph } from "./graph.js";

const DEAD_END_CONFIDENCE_THRESHOLD = 0.2;
const PRUNE_MAX_DEPTH_RELATIVE = 2;
const REDUNDANCY_SIMILARITY_THRESHOLD = 0.7;

export function detectDeadEnds(graph: ThoughtGraph): ThoughtNode[] {
  const leaves = graph.getLeaves();
  return leaves.filter(
    (leaf) =>
      leaf.confidence < DEAD_END_CONFIDENCE_THRESHOLD &&
      leaf.edges.filter((e) => e.type === "supports").length === 0 &&
      leaf.knowledge.length === 0
  );
}

export function detectRedundantBranches(graph: ThoughtGraph): Array<{
  keep: string;
  prune: string[];
  reason: string;
}> {
  const activeNodes = graph.getActiveNodes();
  const branches = graph.getBranches();
  const redundancyGroups: Array<{
    keep: string;
    prune: string[];
    reason: string;
  }> = [];

  for (const branch of branches) {
    const branchNodes = graph.getBranch(branch);
    if (branchNodes.length === 0) continue;

    const visited = new Set<string>();

    for (const node of branchNodes) {
      if (visited.has(node.id)) continue;
      visited.add(node.id);

      const similar = activeNodes.filter(
        (other) =>
          other.id !== node.id &&
          !visited.has(other.id) &&
          other.type === node.type &&
          _similarity(other.content, node.content) > REDUNDANCY_SIMILARITY_THRESHOLD
      );

      if (similar.length > 0) {
        const allSimilar = [node, ...similar].sort(
          (a, b) => b.confidence - a.confidence
        );
        const keep = allSimilar[0];
        const prune = allSimilar.slice(1);

        for (const p of prune) {
          visited.add(p.id);
        }

        redundancyGroups.push({
          keep: keep.id,
          prune: prune.map((p) => p.id),
          reason: `Redundant ${node.type} thoughts — keeping highest confidence (${keep.confidence.toFixed(2)})`,
        });
      }
    }
  }

  return redundancyGroups;
}

export function detectDeepUnproductiveBranches(graph: ThoughtGraph): ThoughtNode[] {
  const stats = graph.getStats();
  const avgConfidence = stats.avgConfidence;
  const leaves = graph.getLeaves();

  return leaves.filter((leaf) => {
    if (leaf.metadata.depth <= stats.maxDepth - PRUNE_MAX_DEPTH_RELATIVE) return false;
    const branchNodes = graph.getBranch(leaf.metadata.branch);
    const branchAvgConf =
      branchNodes.length > 0
        ? branchNodes.reduce((sum, n) => sum + n.confidence, 0) / branchNodes.length
        : 0;
    return branchAvgConf < avgConfidence * 0.5;
  });
}

export function pruneGraph(graph: ThoughtGraph): PruneResult[] {
  const results: PruneResult[] = [];

  const deadEnds = detectDeadEnds(graph);
  for (const deadEnd of deadEnds) {
    const result = graph.pruneNode(
      deadEnd.id,
      `Dead end: confidence ${deadEnd.confidence.toFixed(2)} below threshold, no supporting evidence`
    );
    results.push(result);
  }

  const redundantBranches = detectRedundantBranches(graph);
  for (const group of redundantBranches) {
    for (const pruneId of group.prune) {
      const result = graph.pruneNode(pruneId, group.reason);
      results.push(result);
    }
  }

  const deepUnproductive = detectDeepUnproductiveBranches(graph);
  for (const node of deepUnproductive) {
    const result = graph.pruneNode(
      node.id,
      `Deep unproductive branch: avg confidence well below graph average`
    );
    results.push(result);
  }

  return results;
}

export function optimizePath(graph: ThoughtGraph): {
  originalLength: number;
  optimizedLength: number;
  removedNodes: string[];
} {
  const bestPath = graph.getBestPath();
  const removedNodes: string[] = [];

  for (const node of bestPath) {
    if (node.confidence < DEAD_END_CONFIDENCE_THRESHOLD && node.childIds.length === 0) {
      const result = graph.pruneNode(node.id, "Path optimization: removing very low confidence node");
      if (result.prunedNodeIds.length > 0) {
        removedNodes.push(...result.prunedNodeIds);
      }
    }
  }

  const newBestPath = graph.getBestPath();

  return {
    originalLength: bestPath.length,
    optimizedLength: newBestPath.length,
    removedNodes,
  };
}

export function prunerReport(graph: ThoughtGraph): string {
  const deadEnds = detectDeadEnds(graph);
  const redundant = detectRedundantBranches(graph);
  const deepUnproductive = detectDeepUnproductiveBranches(graph);
  const stats = graph.getStats();

  const lines: string[] = [
    "=== Pruning Analysis Report ===",
    `Graph: ${stats.totalNodes} total nodes, ${stats.activeNodes} active`,
    "",
    `Dead Ends: ${deadEnds.length}`,
    ...deadEnds.map((d) => `  [${d.id}] confidence=${d.confidence.toFixed(2)}: ${d.content.substring(0, 50)}`),
    "",
    `Redundant Branch Groups: ${redundant.length}`,
    ...redundant.map((r) => `  Keep [${r.keep}], prune [${r.prune.join(", ")}]: ${r.reason}`),
    "",
    `Deep Unproductive Branches: ${deepUnproductive.length}`,
    ...deepUnproductive.map((d) => `  [${d.id}] depth=${d.metadata.depth} conf=${d.confidence.toFixed(2)}`),
  ];

  const totalPrunable = deadEnds.length + redundant.reduce((sum, r) => sum + r.prune.length, 0) + deepUnproductive.length;
  lines.push("");
  lines.push(`Total prunable: ${totalPrunable} node(s)`);

  return lines.join("\n");
}

function _similarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}
