import {
  Strategy,
  MetacognitiveState,
  MetacognitiveAction,
  ProgressMetrics,
  StrategySwitch,
} from "./types.js";
import { ThoughtGraph } from "./graph.js";
import { ThoughtNode } from "./types.js";

const STAGNATION_THRESHOLD = 3;
const LOW_CONFIDENCE_THRESHOLD = 0.3;
const HIGH_CONFIDENCE_THRESHOLD = 0.8;
const MAX_COGNITIVE_LOAD = 15;

export function createMetacognitiveState(
  initialStrategy: Strategy = "sequential"
): MetacognitiveState {
  return {
    currentStrategy: initialStrategy,
    strategyHistory: [],
    cognitiveLoad: 0,
    stuckDetected: false,
    stuckReason: null,
    suggestedAction: null,
    progressMetrics: {
      totalThoughts: 0,
      averageConfidence: 0,
      confidenceTrend: "stable",
      branchCount: 1,
      maxDepth: 0,
      contradictionCount: 0,
      supportCount: 0,
      stagnationSteps: 0,
    },
  };
}

export function updateMetacognition(
  state: MetacognitiveState,
  graph: ThoughtGraph
): MetacognitiveState {
  const stats = graph.getStats();
  const activeNodes = graph.getActiveNodes();
  const metrics = state.progressMetrics;

  const prevAvgConfidence = metrics.averageConfidence;
  const newAvgConfidence = stats.avgConfidence;

  let trend: "rising" | "falling" | "stable" = "stable";
  if (newAvgConfidence > prevAvgConfidence + 0.05) trend = "rising";
  else if (newAvgConfidence < prevAvgConfidence - 0.05) trend = "falling";

  const contradictionCount = activeNodes.reduce(
    (sum, n) => sum + n.edges.filter((e) => e.type === "contradicts").length,
    0
  );
  const supportCount = activeNodes.reduce(
    (sum, n) => sum + n.edges.filter((e) => e.type === "supports").length,
    0
  );

  const newMetrics: ProgressMetrics = {
    totalThoughts: stats.totalNodes,
    averageConfidence: newAvgConfidence,
    confidenceTrend: trend,
    branchCount: stats.branches.length,
    maxDepth: stats.maxDepth,
    contradictionCount,
    supportCount,
    stagnationSteps: trend === "stable" ? metrics.stagnationSteps + 1 : 0,
  };

  const cognitiveLoad = Math.min(1, stats.totalNodes / MAX_COGNITIVE_LOAD);

  const stuckDetected = _detectStuck(newMetrics, activeNodes);
  const stuckReason = stuckDetected
    ? _diagnoseStuck(newMetrics, activeNodes, state)
    : null;

  const suggestedAction = stuckDetected || newAvgConfidence < LOW_CONFIDENCE_THRESHOLD
    ? _suggestAction(newMetrics, state, activeNodes)
    : null;

  return {
    currentStrategy: state.currentStrategy,
    strategyHistory: state.strategyHistory,
    cognitiveLoad,
    stuckDetected,
    stuckReason,
    suggestedAction,
    progressMetrics: newMetrics,
  };
}

function _detectStuck(metrics: ProgressMetrics, nodes: ThoughtNode[]): boolean {
  if (metrics.stagnationSteps >= STAGNATION_THRESHOLD) return true;
  if (metrics.confidenceTrend === "falling" && metrics.totalThoughts > 5) return true;

  const recentNodes = nodes.slice(-3);
  if (recentNodes.length >= 3) {
    const recentConfAvg =
      recentNodes.reduce((sum, n) => sum + n.confidence, 0) / recentNodes.length;
    if (recentConfAvg < LOW_CONFIDENCE_THRESHOLD) return true;
  }

  if (metrics.contradictionCount > metrics.supportCount * 2 && metrics.totalThoughts > 4) {
    return true;
  }

  return false;
}

function _diagnoseStuck(
  metrics: ProgressMetrics,
  nodes: ThoughtNode[],
  state: MetacognitiveState
): string {
  if (metrics.stagnationSteps >= STAGNATION_THRESHOLD) {
    return `Stagnation detected: confidence has not improved for ${metrics.stagnationSteps} steps`;
  }
  if (metrics.confidenceTrend === "falling") {
    return "Confidence is declining — reasoning may be heading in the wrong direction";
  }

  const recentLow = nodes.slice(-3).filter((n) => n.confidence < LOW_CONFIDENCE_THRESHOLD);
  if (recentLow.length >= 2) {
    return "Recent thoughts have low confidence — assumptions may need revision";
  }

  if (metrics.contradictionCount > metrics.supportCount * 2) {
    return "Excessive contradictions — consider switching to dialectic strategy to resolve them";
  }

  return "Reasoning progress has stalled";
}

function _suggestAction(
  metrics: ProgressMetrics,
  state: MetacognitiveState,
  nodes: ThoughtNode[]
): MetacognitiveAction {
  if (metrics.contradictionCount > metrics.supportCount * 2) {
    return {
      type: "switch_strategy",
      description: "Switch to dialectic strategy to resolve contradictions through thesis-antithesis-synthesis",
      suggestedStrategy: "dialectic",
    };
  }

  if (metrics.confidenceTrend === "falling" && state.currentStrategy === "sequential") {
    return {
      type: "switch_strategy",
      description: "Try parallel exploration to discover alternative paths",
      suggestedStrategy: "parallel",
    };
  }

  if (metrics.stagnationSteps >= STAGNATION_THRESHOLD && metrics.maxDepth < 3) {
    return {
      type: "deepen",
      description: "Deepen analysis — current reasoning is too shallow to reach conclusions",
    };
  }

  if (metrics.branchCount > 5 && metrics.averageConfidence < 0.5) {
    return {
      type: "prune",
      description: "Too many branches with low confidence — prune dead-end paths",
    };
  }

  if (metrics.averageConfidence > HIGH_CONFIDENCE_THRESHOLD && metrics.maxDepth >= 3) {
    return {
      type: "conclude",
      description: "High confidence with sufficient depth — ready to draw conclusions",
    };
  }

  if (metrics.stagnationSteps >= STAGNATION_THRESHOLD) {
    return {
      type: "broaden",
      description: "Try abductive reasoning to find new explanatory frameworks",
      suggestedStrategy: "abductive",
    };
  }

  return {
    type: "switch_strategy",
    description: "Consider changing thinking approach to break through current impasse",
    suggestedStrategy: _recommendStrategy(state.currentStrategy, metrics),
  };
}

function _recommendStrategy(
  current: Strategy,
  metrics: ProgressMetrics
): Strategy {
  const strategyOrder: Strategy[] = [
    "sequential",
    "parallel",
    "dialectic",
    "abductive",
    "analogical",
  ];
  const idx = strategyOrder.indexOf(current);
  return strategyOrder[(idx + 1) % strategyOrder.length];
}

export function switchStrategy(
  state: MetacognitiveState,
  newStrategy: Strategy,
  reason: string
): MetacognitiveState {
  const switchRecord: StrategySwitch = {
    from: state.currentStrategy,
    to: newStrategy,
    reason,
    timestamp: Date.now(),
  };

  return {
    ...state,
    currentStrategy: newStrategy,
    strategyHistory: [...state.strategyHistory, switchRecord],
    stuckDetected: false,
    stuckReason: null,
    suggestedAction: null,
    progressMetrics: {
      ...state.progressMetrics,
      stagnationSteps: 0,
    },
  };
}

export function metacognitiveReport(state: MetacognitiveState): string {
  const lines: string[] = [
    "=== Metacognitive Report ===",
    `Current Strategy: ${state.currentStrategy}`,
    `Cognitive Load: ${(state.cognitiveLoad * 100).toFixed(0)}%`,
    `Stuck: ${state.stuckDetected ? `YES — ${state.stuckReason}` : "No"}`,
    "",
    "Progress Metrics:",
    `  Total Thoughts: ${state.progressMetrics.totalThoughts}`,
    `  Avg Confidence: ${(state.progressMetrics.averageConfidence * 100).toFixed(0)}% (${state.progressMetrics.confidenceTrend})`,
    `  Branches: ${state.progressMetrics.branchCount}`,
    `  Max Depth: ${state.progressMetrics.maxDepth}`,
    `  Contradictions: ${state.progressMetrics.contradictionCount}`,
    `  Supporting Links: ${state.progressMetrics.supportCount}`,
    `  Stagnation Steps: ${state.progressMetrics.stagnationSteps}`,
  ];

  if (state.suggestedAction) {
    lines.push("");
    lines.push(`Suggested Action: [${state.suggestedAction.type}] ${state.suggestedAction.description}`);
    if (state.suggestedAction.suggestedStrategy) {
      lines.push(`  → Try: ${state.suggestedAction.suggestedStrategy}`);
    }
  }

  if (state.strategyHistory.length > 0) {
    lines.push("");
    lines.push("Strategy History:");
    for (const sw of state.strategyHistory.slice(-5)) {
      lines.push(`  ${sw.from} → ${sw.to}: ${sw.reason}`);
    }
  }

  return lines.join("\n");
}
