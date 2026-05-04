import {
  ThoughtNode,
  GraphStats,
  Strategy,
  ThoughtType,
  NodeStatus,
  PruneResult,
} from "./types.js";
import { createNode, addEdge, updateStatus, nodeToSummary } from "./node.js";

export class ThoughtGraph {
  private nodes: Map<string, ThoughtNode> = new Map();
  private rootIds: string[] = [];
  private branches: Set<string> = new Set(["main"]);

  addNode(node: ThoughtNode): void {
    this.nodes.set(node.id, node);
    this.branches.add(node.metadata.branch);

    if (node.parentId === null) {
      if (!this.rootIds.includes(node.id)) {
        this.rootIds.push(node.id);
      }
    } else {
      const parent = this.nodes.get(node.parentId);
      if (parent && !parent.childIds.includes(node.id)) {
        parent.childIds.push(node.id);
      }
      node.metadata.depth = parent ? parent.metadata.depth + 1 : 0;
    }

    for (const edge of node.edges) {
      const target = this.nodes.get(edge.targetId);
      if (target && !target.childIds.includes(node.id)) {
        if (edge.type === "derives_from" || edge.type === "refines" || edge.type === "synthesizes") {
          // These are forward-flowing edges
        }
      }
    }
  }

  getNode(id: string): ThoughtNode | undefined {
    return this.nodes.get(id);
  }

  getRoots(): ThoughtNode[] {
    return this.rootIds.map((id) => this.nodes.get(id)).filter(Boolean) as ThoughtNode[];
  }

  getChildren(id: string): ThoughtNode[] {
    const node = this.nodes.get(id);
    if (!node) return [];
    return node.childIds
      .map((cid) => this.nodes.get(cid))
      .filter(Boolean) as ThoughtNode[];
  }

  getAncestors(id: string): ThoughtNode[] {
    const ancestors: ThoughtNode[] = [];
    let current = this.nodes.get(id);
    while (current?.parentId) {
      const parent = this.nodes.get(current.parentId);
      if (parent) {
        ancestors.push(parent);
        current = parent;
      } else {
        break;
      }
    }
    return ancestors;
  }

  getDescendants(id: string): ThoughtNode[] {
    const result: ThoughtNode[] = [];
    const stack = [id];
    const visited = new Set<string>();
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      const node = this.nodes.get(currentId);
      if (node) {
        result.push(node);
        for (const childId of node.childIds) {
          stack.push(childId);
        }
      }
    }
    return result.slice(1); // exclude the starting node itself
  }

  getPath(fromId: string, toId: string): ThoughtNode[] | null {
    const path = this._findPath(fromId, toId, new Set());
    return path;
  }

  private _findPath(
    fromId: string,
    toId: string,
    visited: Set<string>
  ): ThoughtNode[] | null {
    if (fromId === toId) {
      const node = this.nodes.get(fromId);
      return node ? [node] : null;
    }
    if (visited.has(fromId)) return null;
    visited.add(fromId);

    const node = this.nodes.get(fromId);
    if (!node) return null;

    // Search children
    for (const childId of node.childIds) {
      const childPath = this._findPath(childId, toId, visited);
      if (childPath) {
        return [node, ...childPath];
      }
    }

    // Search edges
    for (const edge of node.edges) {
      const edgePath = this._findPath(edge.targetId, toId, visited);
      if (edgePath) {
        return [node, ...edgePath];
      }
    }

    return null;
  }

  getBranch(branchName: string): ThoughtNode[] {
    const branchNodes: ThoughtNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.metadata.branch === branchName) {
        branchNodes.push(node);
      }
    }
    return branchNodes.sort((a, b) => a.metadata.createdAt - b.metadata.createdAt);
  }

  getActiveNodes(): ThoughtNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.status === "active");
  }

  getLeaves(): ThoughtNode[] {
    return Array.from(this.nodes.values()).filter(
      (n) => n.status === "active" && n.childIds.length === 0
    );
  }

  getBestPath(): ThoughtNode[] {
    const leaves = this.getLeaves().filter((l) => l.status === "active");
    if (leaves.length === 0) return this.getRoots();

    let bestLeaf = leaves[0];
    let bestScore = this._pathScore(leaves[0]);

    for (let i = 1; i < leaves.length; i++) {
      const score = this._pathScore(leaves[i]);
      if (score > bestScore) {
        bestScore = score;
        bestLeaf = leaves[i];
      }
    }

    const path: ThoughtNode[] = [bestLeaf];
    let current = bestLeaf;
    while (current.parentId) {
      const parent = this.nodes.get(current.parentId);
      if (parent) {
        path.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    return path;
  }

  private _pathScore(leaf: ThoughtNode): number {
    let score = leaf.confidence;
    const ancestors = this.getAncestors(leaf.id);
    const supportCount = ancestors.reduce(
      (sum, a) => sum + a.edges.filter((e) => e.type === "supports").length,
      0
    );
    const contradictCount = ancestors.reduce(
      (sum, a) => sum + a.edges.filter((e) => e.type === "contradicts").length,
      0
    );
    score += supportCount * 0.05 - contradictCount * 0.1;
    score -= leaf.metadata.depth * 0.01; // slightly penalize depth
    return score;
  }

  getBranches(): string[] {
    return Array.from(this.branches);
  }

  pruneNode(id: string, reason: string): PruneResult {
    const node = this.nodes.get(id);
    if (!node) {
      return { prunedNodeIds: [], reason: "Node not found", freedDepth: 0, pathOptimized: false };
    }

    const descendants = this.getDescendants(id);
    const prunedIds = [id, ...descendants.map((d) => d.id)];

    updateStatus(node, "pruned");
    for (const desc of descendants) {
      updateStatus(desc, "pruned");
    }

    const freedDepth = descendants.length;

    // Remove from parent's children
    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        parent.childIds = parent.childIds.filter((cid) => cid !== id);
      }
    }

    const pathOptimized = this._checkPathOptimization();

    return { prunedNodeIds: prunedIds, reason, freedDepth, pathOptimized };
  }

  private _checkPathOptimization(): boolean {
    const bestPath = this.getBestPath();
    return bestPath.length > 0 && bestPath.every((n) => n.status === "active");
  }

  getStats(): GraphStats {
    const allNodes = Array.from(this.nodes.values());
    const activeNodes = allNodes.filter((n) => n.status === "active");
    const strategyDist: Record<Strategy, number> = {
      sequential: 0,
      dialectic: 0,
      parallel: 0,
      analogical: 0,
      abductive: 0,
      first_principles: 0,
      counterfactual: 0,
      systems_thinking: 0,
      mcts: 0,
      hybrid: 0,
      auto: 0,
    };
    const typeDist: Record<ThoughtType, number> = {
      hypothesis: 0,
      analysis: 0,
      evidence: 0,
      conclusion: 0,
      question: 0,
      assumption: 0,
      insight: 0,
      critique: 0,
      synthesis: 0,
      observation: 0,
    };

    for (const node of allNodes) {
      strategyDist[node.strategy]++;
      typeDist[node.type]++;
    }

    const totalEdges = allNodes.reduce(
      (sum, n) => sum + n.edges.length + n.childIds.length,
      0
    );
    const avgConfidence =
      activeNodes.length > 0
        ? activeNodes.reduce((sum, n) => sum + n.confidence, 0) / activeNodes.length
        : 0;
    const maxDepth = allNodes.reduce(
      (max, n) => Math.max(max, n.metadata.depth),
      0
    );

    return {
      totalNodes: allNodes.length,
      activeNodes: activeNodes.length,
      totalEdges,
      branches: Array.from(this.branches),
      maxDepth,
      avgConfidence,
      strategyDistribution: strategyDist,
      typeDistribution: typeDist,
    };
  }

  getAllNodes(): ThoughtNode[] {
    return Array.from(this.nodes.values());
  }

  findNodesByType(type: ThoughtType): ThoughtNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.type === type);
  }

  findNodesByTag(tag: string): ThoughtNode[] {
    return Array.from(this.nodes.values()).filter((n) =>
      n.metadata.tags.includes(tag)
    );
  }

  serialize(): object {
    return {
      nodes: Array.from(this.nodes.entries()),
      rootIds: this.rootIds,
      branches: Array.from(this.branches),
    };
  }

  toVisualization(): string {
    const lines: string[] = ["=== Thought Graph Visualization ==="];
    for (const root of this.getRoots()) {
      this._visualizeSubtree(root, lines, 0);
    }
    return lines.join("\n");
  }

  private _visualizeSubtree(
    node: ThoughtNode,
    lines: string[],
    indent: number
  ): void {
    const prefix = "  ".repeat(indent);
    const statusIcon =
      node.status === "active" ? "●"
        : node.status === "confirmed" ? "✓"
        : node.status === "pruned" ? "✗"
        : node.status === "superseded" ? "○"
        : "⊘";
    const confStr = (node.confidence * 100).toFixed(0);
    lines.push(
      `${prefix}${statusIcon} [${node.id}] ${node.type}(${confStr}%) → ${this._truncate(node.content, 60)}`
    );

    for (const edge of node.edges) {
      const target = this.nodes.get(edge.targetId);
      if (target) {
        lines.push(
          `${prefix}  ─${edge.type}─→ [${edge.targetId}] ${this._truncate(target.content, 40)}`
        );
      }
    }

    for (const childId of node.childIds) {
      const child = this.nodes.get(childId);
      if (child && child.status === "active") {
        this._visualizeSubtree(child, lines, indent + 1);
      }
    }
  }

  private _truncate(str: string, maxLen: number): string {
    return str.length > maxLen ? str.substring(0, maxLen) + "..." : str;
  }

  hasIncomingEdges(id: string): boolean {
    for (const node of this.nodes.values()) {
      if (node.childIds.includes(id)) return true;
      if (node.edges.some(e => e.targetId === id)) return true;
    }
    if (this.rootIds.includes(id)) return false;
    for (const node of this.nodes.values()) {
      if (node.parentId === id) return true;
    }
    return false;
  }

  resolveNodeId(alias: string): string | null {
    if (alias === "last") {
      const ids = Array.from(this.nodes.keys());
      return ids.length > 0 ? ids[ids.length - 1] : null;
    }
    if (alias === "best") {
      let bestId: string | null = null;
      let bestConf = -1;
      for (const [id, node] of this.nodes) {
        if (node.confidence > bestConf) {
          bestConf = node.confidence;
          bestId = id;
        }
      }
      return bestId;
    }
    if (alias === "root") {
      for (const [id] of this.nodes) {
        if (!this.hasIncomingEdges(id)) return id;
      }
      return null;
    }
    return this.nodes.has(alias) ? alias : null;
  }

  getContext(): { nodeCount: number; avgConfidence: number; recentStrategies: string[] } {
    const allNodes = Array.from(this.nodes.values());
    const activeNodes = allNodes.filter(n => n.status === "active");
    const avgConfidence = activeNodes.length > 0
      ? activeNodes.reduce((sum, n) => sum + n.confidence, 0) / activeNodes.length
      : 0;
    const recentStrategies = allNodes
      .sort((a, b) => a.metadata.createdAt - b.metadata.createdAt)
      .slice(-5)
      .map(n => n.strategy);
    return {
      nodeCount: allNodes.length,
      avgConfidence,
      recentStrategies,
    };
  }

  size(): number {
    return this.nodes.size;
  }

  deserialize(data: { nodes: [string, ThoughtNode][]; rootIds: string[]; branches: string[] }): void {
    this.nodes = new Map(data.nodes);
    this.rootIds = data.rootIds;
    this.branches = new Set(data.branches);
  }
}
