/**
 * Schema Validation for Deep Thinker MCP
 * Using Zod for strict input/output type safety
 */

import { z } from "zod";

// ============================================================================
// Base Schema Definitions
// ============================================================================

export const ThoughtTypeSchema = z.enum([
  "hypothesis",
  "analysis",
  "evidence",
  "conclusion",
  "question",
  "assumption",
  "insight",
  "critique",
  "synthesis",
  "observation",
]);

export const StrategySchema = z.enum([
  "sequential",
  "dialectic",
  "parallel",
  "analogical",
  "abductive",
  "first_principles",
  "counterfactual",
  "systems_thinking",
  "mcts",
]);

export const EdgeTypeSchema = z.enum([
  "derives_from",
  "contradicts",
  "supports",
  "refines",
  "challenges",
  "synthesizes",
  "parallels",
  "abstracts",
  "instantiates",
]);

export const NodeStatusSchema = z.enum([
  "active",
  "pruned",
  "superseded",
  "confirmed",
  "contradicted",
]);

// ============================================================================
// First Principles Node Schemas
// ============================================================================

export const DecompositionInputSchema = z.object({
  problem: z.string().min(1, "Problem statement is required"),
  assumptions: z.array(z.string()).default([]),
  depth: z.number().int().min(1).max(5).default(3),
  domain: z.string().optional(),
});

export const FundamentalTruthSchema = z.object({
  id: z.string(),
  truth: z.string(),
  isTangible: z.boolean(),
  isVerifiable: z.boolean(),
  domain: z.string().optional(),
});

export const ReconstructedSolutionSchema = z.object({
  solution: z.string(),
  components: z.array(z.string()),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});

export const FirstPrinciplesOutputSchema = z.object({
  originalProblem: z.string(),
  deconstructedAssumptions: z.array(z.object({
    assumption: z.string(),
    challenged: z.boolean(),
    replacement: z.string().optional(),
  })),
  fundamentalTruths: z.array(FundamentalTruthSchema),
  reconstructedSolution: ReconstructedSolutionSchema,
  synthesis: z.string(),
  confidence: z.number().min(0).max(1),
  metadata: z.object({
    depth: z.number(),
    processingTime: z.number(),
    assumptionsRejected: z.number(),
  }),
});

// ============================================================================
// Counterfactual Node Schemas
// ============================================================================

export const CounterfactualInputSchema = z.object({
  currentState: z.string().min(1, "Current state description is required"),
  variablesToChange: z.array(z.object({
    variable: z.string(),
    currentValue: z.union([z.string(), z.number(), z.boolean()]),
    hypotheticalValue: z.union([z.string(), z.number(), z.boolean()]),
    impactWeight: z.number().min(0).max(1).default(0.5),
  })).min(1, "At least one variable must be specified"),
  timeHorizon: z.enum(["immediate", "short_term", "medium_term", "long_term"]).default("short_term"),
  rippleDepth: z.number().int().min(1).max(5).default(3),
});

export const RippleEffectSchema = z.object({
  stage: z.number().int(),
  affectedVariable: z.string(),
  changeDescription: z.string(),
  magnitude: z.number().min(-1).max(1),
  probability: z.number().min(0).max(1),
  cascadingEffects: z.array(z.string()),
});

export const ScenarioOutcomeSchema = z.object({
  scenarioId: z.string(),
  description: z.string(),
  probability: z.number().min(0).max(1),
  desirability: z.number().min(-1).max(1),
  keyDrivers: z.array(z.string()),
  rippleEffects: z.array(RippleEffectSchema),
});

export const CounterfactualOutputSchema = z.object({
  originalState: z.string(),
  modifiedVariables: z.array(z.object({
    variable: z.string(),
    from: z.union([z.string(), z.number(), z.boolean()]),
    to: z.union([z.string(), z.number(), z.boolean()]),
  })),
  scenarios: z.array(ScenarioOutcomeSchema),
  mostLikelyOutcome: ScenarioOutcomeSchema,
  optimalOutcome: ScenarioOutcomeSchema.optional(),
  riskAnalysis: z.object({
    highestRiskPath: z.string(),
    riskMitigation: z.array(z.string()),
  }),
  confidence: z.number().min(0).max(1),
  metadata: z.object({
    scenariosGenerated: z.number(),
    rippleStages: z.number(),
    processingTime: z.number(),
  }),
});

// ============================================================================
// Systems Thinking Node Schemas
// ============================================================================

export const SystemsThinkingInputSchema = z.object({
  systemDescription: z.string().min(1, "System description is required"),
  boundaries: z.array(z.string()).default([]),
  components: z.array(z.object({
    name: z.string(),
    type: z.enum(["stock", "flow", "converter", "connector"]),
    description: z.string(),
  })).min(2, "At least 2 components are required"),
  timeScale: z.enum(["immediate", "short_term", "medium_term", "long_term"]).default("medium_term"),
  focusArea: z.enum(["feedback_loops", "leverage_points", "emergence", "resilience", "all"]).default("all"),
});

export const FeedbackLoopSchema = z.object({
  id: z.string(),
  type: z.enum(["balancing", "reinforcing", "delay"]),
  name: z.string(),
  description: z.string(),
  components: z.array(z.string()),
  polarity: z.number().min(-1).max(1),
  strength: z.enum(["weak", "moderate", "strong", "critical"]),
  timeDelay: z.enum(["immediate", "fast", "slow", "very_slow"]).optional(),
});

export const LeveragePointSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  interventionLevel: z.number().int().min(1).max(12), // Donella Meadows' 12 leverage points
  effectiveness: z.number().min(0).max(1),
  effortRequired: z.enum(["low", "medium", "high", "very_high"]),
  systemicImpact: z.number().min(0).max(1),
  sideEffects: z.array(z.string()),
});

export const EmergentPropertySchema = z.object({
  property: z.string(),
  description: z.string(),
  arisesFrom: z.array(z.string()),
  predictability: z.number().min(0).max(1),
  manageability: z.number().min(0).max(1),
});

export const SystemsThinkingOutputSchema = z.object({
  systemMap: z.object({
    components: z.array(z.object({
      name: z.string(),
      type: z.string(),
      description: z.string(),
    })),
    connections: z.array(z.object({
      from: z.string(),
      to: z.string(),
      type: z.enum(["influences", "determines", "feeds", "regulates", "enables"]),
      strength: z.number().min(0).max(1),
    })),
  }),
  feedbackLoops: z.array(FeedbackLoopSchema),
  dominantLoops: z.array(z.string()),
  leveragePoints: z.array(LeveragePointSchema),
  highestLeverage: LeveragePointSchema.optional(),
  emergentProperties: z.array(EmergentPropertySchema),
  systemBehavior: z.object({
    patterns: z.array(z.string()),
    trends: z.array(z.object({
      trend: z.string(),
      direction: z.enum(["increasing", "decreasing", "stable", "oscillating"]),
      timeframe: z.string(),
    })),
  }),
  recommendations: z.array(z.object({
    action: z.string(),
    targetLeveragePoint: z.string(),
    expectedOutcome: z.string(),
    riskLevel: z.enum(["low", "medium", "high"]),
  })),
  confidence: z.number().min(0).max(1),
  metadata: z.object({
    componentsAnalyzed: z.number(),
    loopsIdentified: z.number(),
    leveragePointsFound: z.number(),
  }),
});

// ============================================================================
// MCTS (Monte Carlo Tree Search) Node Schemas
// ============================================================================

export const MCTSInputSchema = z.object({
  problem: z.string().min(1, "Problem statement is required"),
  possibleActions: z.array(z.object({
    id: z.string(),
    description: z.string(),
    estimatedReward: z.number().min(-1).max(1).optional(),
    constraints: z.array(z.string()).default([]),
  })).min(2, "At least 2 possible actions are required"),
  simulationDepth: z.number().int().min(1).max(10).default(5),
  numSimulations: z.number().int().min(10).max(1000).default(100),
  explorationConstant: z.number().min(0.1).max(5).default(1.414), // sqrt(2)
  pruningThreshold: z.number().min(0).max(1).default(0.2),
  evaluationCriteria: z.array(z.object({
    name: z.string(),
    weight: z.number().min(0).max(1),
  })).optional(),
});

export const MCTSNodeSchema = z.object({
  id: z.string(),
  actionId: z.string().optional(),
  state: z.string(),
  parentId: z.string().optional(),
  childrenIds: z.array(z.string()),
  visits: z.number().int().min(0),
  totalReward: z.number(),
  averageReward: z.number(),
  ucb1Score: z.number(),
  depth: z.number().int(),
  isTerminal: z.boolean(),
  isFullyExpanded: z.boolean(),
});

export const SimulationResultSchema = z.object({
  path: z.array(z.string()),
  finalReward: z.number(),
  steps: z.number().int(),
  terminalState: z.string(),
});

export const PathAnalysisSchema = z.object({
  pathId: z.string(),
  actions: z.array(z.string()),
  expectedReward: z.number(),
  confidence: z.number().min(0).max(1),
  riskFactors: z.array(z.string()),
  opportunityFactors: z.array(z.string()),
  worstCase: z.number(),
  bestCase: z.number(),
});

export const MCTSOutputSchema = z.object({
  rootNode: MCTSNodeSchema,
  tree: z.array(MCTSNodeSchema),
  optimalPath: PathAnalysisSchema,
  alternativePaths: z.array(PathAnalysisSchema),
  prunedPaths: z.array(z.object({
    pathId: z.string(),
    reason: z.string(),
    finalReward: z.number(),
  })),
  statistics: z.object({
    totalSimulations: z.number(),
    nodesExpanded: z.number(),
    averageDepth: z.number(),
    bestRewardFound: z.number(),
    convergenceRate: z.number(),
  }),
  recommendation: z.object({
    bestAction: z.string(),
    expectedValue: z.number(),
    confidence: z.number().min(0).max(1),
    reasoning: z.string(),
    nextSteps: z.array(z.string()),
  }),
  confidence: z.number().min(0).max(1),
});

// ============================================================================
// Error Handling Schemas
// ============================================================================

export const NodeErrorSchema = z.object({
  nodeType: z.string(),
  error: z.string(),
  code: z.enum([
    "SCHEMA_VALIDATION_ERROR",
    "PROCESSING_ERROR",
    "HALUCINATION_DETECTED",
    "TIMEOUT",
    "FALLBACK_TRIGGERED",
  ]),
  input: z.unknown(),
  fallbackUsed: z.boolean(),
  fallbackResult: z.unknown().optional(),
  timestamp: z.number(),
});

export const FallbackStrategySchema = z.object({
  originalStrategy: StrategySchema,
  fallbackStrategy: StrategySchema,
  reason: z.string(),
  degradedOutput: z.unknown(),
  confidence: z.number().min(0).max(1),
});

// ============================================================================
// Type Exports
// ============================================================================

export type ThoughtType = z.infer<typeof ThoughtTypeSchema>;
export type Strategy = z.infer<typeof StrategySchema>;
export type EdgeType = z.infer<typeof EdgeTypeSchema>;
export type NodeStatus = z.infer<typeof NodeStatusSchema>;

export type FirstPrinciplesInput = z.infer<typeof DecompositionInputSchema>;
export type FirstPrinciplesOutput = z.infer<typeof FirstPrinciplesOutputSchema>;

export type CounterfactualInput = z.infer<typeof CounterfactualInputSchema>;
export type CounterfactualOutput = z.infer<typeof CounterfactualOutputSchema>;

export type SystemsThinkingInput = z.infer<typeof SystemsThinkingInputSchema>;
export type SystemsThinkingOutput = z.infer<typeof SystemsThinkingOutputSchema>;

export type MCTSInput = z.infer<typeof MCTSInputSchema>;
export type MCTSOutput = z.infer<typeof MCTSOutputSchema>;

export type NodeError = z.infer<typeof NodeErrorSchema>;
export type FallbackStrategy = z.infer<typeof FallbackStrategySchema>;
