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

// ============================================================================
// Enhanced Strategy Recommendations for New Node Types
// ============================================================================

export function recommendSpecializedStrategy(
  metrics: ProgressMetrics,
  nodes: ThoughtNode[],
  currentStrategy: Strategy
): { strategy: Strategy; reason: string } | null {
  
  // Detect problem characteristics to suggest specialized strategies
  const recentContent = nodes.slice(-5).map(n => n.content.toLowerCase()).join(" ");
  const recentTags = nodes.slice(-5).flatMap(n => n.metadata.tags);
  
  const hasSystemKeywords = /\b(system|feedback|loop|component|interconnected|emergent|structure)\b/.test(recentContent);
  const hasWhatIfKeywords = /\b(what if|alternative|scenario|imagine|suppose|change|different|would be)\b/.test(recentContent);
  const hasOptimizationKeywords = /\b(optimal|best|decision|choice|path|option|strategy|select|choose)\b/.test(recentContent);
  const hasFundamentalKeywords = /\b(assumption|fundamental|truth|why|basic|root|cause|deconstruct)\b/.test(recentContent);
  const hasContradictionKeywords = /\b(but|however|contradict|conflict|paradox|opposite|versus)\b/.test(recentContent);
  const hasPatternTags = recentTags.some((tag: string) => /pattern|emergent|system|feedback/.test(tag));
  
  // HIGH PRIORITY: First Principles for fundamental questioning
  if (hasFundamentalKeywords && metrics.stagnationSteps >= 2) {
    return {
      strategy: "first_principles",
      reason: "Fundamental questioning detected with stagnation - deconstruct to basic truths",
    };
  }
  
  // HIGH PRIORITY: Counterfactual for what-if scenarios
  if (hasWhatIfKeywords && metrics.branchCount < 4) {
    return {
      strategy: "counterfactual",
      reason: "What-if questioning detected - explore alternative scenarios and ripple effects",
    };
  }
  
  // HIGH PRIORITY: Systems Thinking for complex system problems
  if (hasSystemKeywords && metrics.totalThoughts > 8) {
    return {
      strategy: "systems_thinking",
      reason: "System complexity detected with multiple thoughts - analyze feedback loops and leverage points",
    };
  }
  
  // HIGH PRIORITY: MCTS for optimization/decision problems with many paths
  if (hasOptimizationKeywords && metrics.branchCount >= 5) {
    return {
      strategy: "mcts",
      reason: `Multiple decision paths (${metrics.branchCount}) with optimization focus - use Monte Carlo search for optimal selection`,
    };
  }
  
  // MEDIUM PRIORITY: Systems thinking for high complexity
  if (metrics.branchCount > 6 && metrics.averageConfidence < 0.5) {
    return {
      strategy: "systems_thinking",
      reason: "Too many branches with low confidence - view as interconnected system to find patterns",
    };
  }
  
  // MEDIUM PRIORITY: MCTS when we have many parallel branches
  if (metrics.branchCount > 8 && metrics.totalThoughts > 10) {
    return {
      strategy: "mcts",
      reason: "Excessive branching - use tree search to evaluate and prune suboptimal paths",
    };
  }
  
  // MEDIUM PRIORITY: Counterfactual for contradiction resolution
  if (hasContradictionKeywords && metrics.contradictionCount > 2) {
    return {
      strategy: "counterfactual",
      reason: "Contradictions present - explore alternative assumptions through counterfactual analysis",
    };
  }
  
  // LOW PRIORITY: First principles for deep analysis
  if (metrics.maxDepth > 5 && metrics.confidenceTrend === "falling") {
    return {
      strategy: "first_principles",
      reason: "Deep reasoning with declining confidence - return to fundamentals",
    };
  }
  
  return null;
}

export function shouldTriggerFirstPrinciples(
  metrics: ProgressMetrics,
  nodes: ThoughtNode[]
): { shouldTrigger: boolean; reason: string } {
  // Trigger when stuck in conventional thinking
  if (metrics.stagnationSteps >= 2 && metrics.maxDepth > 3) {
    return { 
      shouldTrigger: true, 
      reason: "Stagnation in conventional reasoning - challenge assumptions" 
    };
  }
  
  // Trigger when dealing with "how" questions that need "why" answers
  const recentNodes = nodes.slice(-3);
  const hasAssumptionChallenges = recentNodes.some(n => 
    n.type === "question" && /\b(why|assume|convention|always|never)\b/.test(n.content.toLowerCase())
  );
  
  if (hasAssumptionChallenges) {
    return { 
      shouldTrigger: true, 
      reason: "Questioning assumptions detected - deconstruct to first principles" 
    };
  }
  
  return { shouldTrigger: false, reason: "" };
}

export function shouldTriggerCounterfactual(
  metrics: ProgressMetrics,
  nodes: ThoughtNode[]
): { shouldTrigger: boolean; reason: string } {
  // Trigger when we need to explore alternatives
  if (metrics.confidenceTrend === "falling" && metrics.totalThoughts > 5) {
    return { 
      shouldTrigger: true, 
      reason: "Declining confidence - explore what-if scenarios" 
    };
  }
  
  // Trigger for decision nodes with multiple options
  const decisionNodes = nodes.filter(n => 
    n.type === "hypothesis" && /\b(option|choice|alternative|scenario)\b/.test(n.content.toLowerCase())
  );
  
  if (decisionNodes.length >= 2) {
    return { 
      shouldTrigger: true, 
      reason: `Multiple hypotheses (${decisionNodes.length}) - simulate counterfactual scenarios` 
    };
  }
  
  return { shouldTrigger: false, reason: "" };
}

export function shouldTriggerSystemsThinking(
  metrics: ProgressMetrics,
  nodes: ThoughtNode[]
): { shouldTrigger: boolean; reason: string } {
  // Trigger for complex interconnected problems
  const edgeCount = nodes.reduce((sum, n) => sum + n.edges.length, 0);
  const avgConnectivity = edgeCount / (nodes.length || 1);
  
  if (avgConnectivity > 2 && nodes.length > 8) {
    return { 
      shouldTrigger: true, 
      reason: `High interconnectivity (${avgConnectivity.toFixed(2)} edges/node) - analyze as system` 
    };
  }
  
  // Trigger when seeing emergent patterns in recent tags
  const recentTags = nodes.slice(-5).flatMap(n => n.metadata.tags);
  const hasPatternTags = recentTags.some((tag: string) => /pattern|emergent|system|feedback/.test(tag));
  
  if (hasPatternTags) {
    return { 
      shouldTrigger: true, 
      reason: "System patterns detected in tags - apply systems thinking" 
    };
  }
  
  return { shouldTrigger: false, reason: "" };
}

export function shouldTriggerMCTS(
  metrics: ProgressMetrics,
  nodes: ThoughtNode[]
): { shouldTrigger: boolean; reason: string } {
  // Trigger when we have many parallel branches to evaluate
  const activeBranches = new Set(nodes.map(n => n.metadata.branch)).size;
  
  if (activeBranches > 6 && metrics.totalThoughts > 12) {
    return { 
      shouldTrigger: true, 
      reason: `${activeBranches} active branches - use MCTS to evaluate and select optimal path` 
    };
  }
  
  // Trigger for explicit optimization problems
  const optimizationNodes = nodes.filter(n => 
    /\b(optimize|best|optimal|maximize|minimize|decision|choose)\b/.test(n.content.toLowerCase())
  );
  
  if (optimizationNodes.length >= 2 && metrics.branchCount > 3) {
    return { 
      shouldTrigger: true, 
      reason: "Optimization problem with multiple paths - apply Monte Carlo Tree Search" 
    };
  }
  
  // Trigger for pruning opportunity
  if (metrics.branchCount > 10 && metrics.averageConfidence < 0.4) {
    return { 
      shouldTrigger: true, 
      reason: `Many low-confidence branches (${metrics.branchCount}) - prune with MCTS` 
    };
  }
  
  return { shouldTrigger: false, reason: "" };
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

// ============================================================================
// Prompt Optimizer Router Integration (Node Zero)
// ============================================================================

export interface PromptOptimizationResult {
  shouldOptimize: boolean;
  reason: string;
  optimized: boolean;
  recommendation: {
    primaryStrategy: Strategy;
    suggestedNodes: string[];
    autoExecute: boolean;
  } | null;
}

/**
 * Determines if a prompt should go through PromptOptimizer (Node Zero)
 * before being routed to other reasoning strategies.
 */
export function shouldOptimizePrompt(
  prompt: string,
  conversationHistory?: Array<{ role: string; content: string }>
): PromptOptimizationResult {
  const trimmedPrompt = prompt.trim();
  
  // Skip optimization for very simple/short prompts
  if (trimmedPrompt.length < 20) {
    return {
      shouldOptimize: false,
      reason: "Prompt too short, direct routing to sequential",
      optimized: false,
      recommendation: {
        primaryStrategy: "sequential",
        suggestedNodes: [],
        autoExecute: true,
      },
    };
  }
  
  // Check for already-optimized prompts (avoid double optimization)
  if (trimmedPrompt.includes("OPTIMIZED PROMPT") || 
      trimmedPrompt.includes("SUPER PROMPT") ||
      trimmedPrompt.includes("## Context") && trimmedPrompt.includes("## Requirements")) {
    return {
      shouldOptimize: false,
      reason: "Prompt appears to be already optimized",
      optimized: false,
      recommendation: null,
    };
  }
  
  // Detect ambiguity indicators
  const ambiguityIndicators = [
    /\b(something|somehow|whatever|etc|\.\.\.|…)\b/gi,
    /\b(maybe|perhaps|possibly)\b/gi,
    /\?$/m, // Questions that need clarification
    /\b(help|assist|advice)\b/gi,
  ];
  
  const ambiguityScore = ambiguityIndicators.reduce((score, regex) => {
    const matches = trimmedPrompt.match(regex);
    return score + (matches ? matches.length * 0.2 : 0);
  }, 0);
  
  // Detect complexity
  const sentenceCount = trimmedPrompt.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const wordCount = trimmedPrompt.split(/\s+/).length;
  const complexityScore = Math.min(1, (sentenceCount * 0.1) + (wordCount * 0.01));
  
  // Check if context is provided through conversation history
  const hasContext = conversationHistory && conversationHistory.length > 1;
  
  // Decision logic
  if (ambiguityScore > 0.4 || complexityScore > 0.6 || trimmedPrompt.length > 200) {
    return {
      shouldOptimize: true,
      reason: `Optimization recommended: ambiguity=${ambiguityScore.toFixed(2)}, complexity=${complexityScore.toFixed(2)}, length=${trimmedPrompt.length}`,
      optimized: false,
      recommendation: null, // Will be filled after optimization
    };
  }
  
  return {
    shouldOptimize: false,
    reason: "Prompt is clear and concise, direct routing",
    optimized: false,
    recommendation: {
      primaryStrategy: "sequential",
      suggestedNodes: [],
      autoExecute: true,
    },
  };
}

/**
 * Routes the optimized prompt result to appropriate next steps
 */
export function routeOptimizedPrompt(
  optimizationResult: {
    primaryStrategy: Strategy;
    suggestedNodes: string[];
    autoExecute: boolean;
  },
  currentState: MetacognitiveState
): MetacognitiveState {
  // Update the metacognitive state based on optimization result
  const switchRecord: StrategySwitch = {
    from: currentState.currentStrategy,
    to: optimizationResult.primaryStrategy,
    reason: `PromptOptimizer (Node Zero) recommended: ${optimizationResult.suggestedNodes.join(", ")}`,
    timestamp: Date.now(),
  };
  
  return {
    ...currentState,
    currentStrategy: optimizationResult.primaryStrategy,
    strategyHistory: [...currentState.strategyHistory, switchRecord],
    stuckDetected: false,
    stuckReason: null,
    suggestedAction: {
      type: optimizationResult.autoExecute ? "deepen" : "switch_strategy",
      description: optimizationResult.autoExecute 
        ? "Auto-executing optimized reasoning chain"
        : "Review optimized prompt before proceeding",
      suggestedStrategy: optimizationResult.primaryStrategy,
    },
    progressMetrics: {
      ...currentState.progressMetrics,
      stagnationSteps: 0,
    },
  };
}

/**
 * Analyzes if user input is a direct command vs a reasoning request
 * Commands skip optimization, reasoning requests go through Node Zero
 */
export function classifyUserIntent(prompt: string): {
  type: "command" | "reasoning" | "optimization_needed";
  confidence: number;
} {
  const lowerPrompt = prompt.toLowerCase().trim();
  
  // Direct commands that should skip optimization
  const commandPatterns = [
    /^(reset|clear|start over|new session)/i,
    /^(evaluate|assess|score)/i,
    /^(prune|optimize|visualize|show)/i,
    /^(metacog|report|status)/i,
  ];
  
  for (const pattern of commandPatterns) {
    if (pattern.test(lowerPrompt)) {
      return { type: "command", confidence: 0.9 };
    }
  }
  
  // Check if it looks like a reasoning/thinking request
  const reasoningIndicators = [
    /\b(why|how|what if|should|would|could|analyze|compare|evaluate|decide)\b/gi,
    /\b(thinking|reasoning|approach|strategy|solution|problem)\b/gi,
    /\?$/,
  ];
  
  let reasoningScore = 0;
  for (const indicator of reasoningIndicators) {
    if (indicator.test(lowerPrompt)) {
      reasoningScore += 0.25;
    }
  }
  
  if (reasoningScore > 0.4) {
    // Check complexity to see if optimization is needed
    const wordCount = lowerPrompt.split(/\s+/).length;
    const hasMultipleQuestions = (lowerPrompt.match(/\?/g) || []).length > 1;
    
    if (wordCount > 30 || hasMultipleQuestions) {
      return { type: "optimization_needed", confidence: reasoningScore };
    }
    
    return { type: "reasoning", confidence: reasoningScore };
  }
  
  return { type: "reasoning", confidence: 0.5 };
}

/**
 * Creates initial Node Zero state for prompt optimization mode
 */
export function createNodeZeroState(): MetacognitiveState {
  return {
    currentStrategy: "hybrid", // Special mode for Node Zero
    strategyHistory: [{
      from: "sequential" as Strategy,
      to: "hybrid" as Strategy,
      reason: "Node Zero (PromptOptimizer) entry point",
      timestamp: Date.now(),
    }],
    cognitiveLoad: 0.1,
    stuckDetected: false,
    stuckReason: null,
    suggestedAction: {
      type: "deepen",
      description: "Analyzing and optimizing user prompt through Node Zero",
    },
    progressMetrics: {
      totalThoughts: 0,
      averageConfidence: 0.95,
      confidenceTrend: "rising",
      branchCount: 1,
      maxDepth: 0,
      contradictionCount: 0,
      supportCount: 0,
      stagnationSteps: 0,
    },
  };
}
