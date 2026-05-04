export type ThoughtType =
  | "hypothesis"
  | "analysis"
  | "evidence"
  | "conclusion"
  | "question"
  | "assumption"
  | "insight"
  | "critique"
  | "synthesis"
  | "observation";

export type EdgeType =
  | "derives_from"
  | "contradicts"
  | "supports"
  | "refines"
  | "challenges"
  | "synthesizes"
  | "parallels"
  | "abstracts"
  | "instantiates";

export type NodeStatus =
  | "active"
  | "pruned"
  | "superseded"
  | "confirmed"
  | "contradicted";

export type Strategy =
  | "sequential"
  | "dialectic"
  | "parallel"
  | "analogical"
  | "abductive"
  | "first_principles"
  | "counterfactual"
  | "systems_thinking"
  | "mcts"
  | "hybrid"
  | "auto"; // For PromptOptimizer routing recommendations

export interface ThoughtNode {
  id: string;
  content: string;
  type: ThoughtType;
  strategy: Strategy;
  confidence: number;
  parentId: string | null;
  childIds: string[];
  edges: ThoughtEdge[];
  metadata: ThoughtMetadata;
  status: NodeStatus;
  critique: Critique | null;
  knowledge: KnowledgeReference[];
  // Enhanced fields for high-IQ reasoning
  language?: LanguageCode;
  emotionalTone?: EmotionType;
  uncertaintyModel?: UncertaintyModel;
  ethicalConsiderations?: EthicalEvaluation[];
  crossDomainReferences?: CrossDomainReference[];
  socialImpact?: SocialImpactAnalysis;
}

export interface ThoughtEdge {
  targetId: string;
  type: EdgeType;
  weight: number;
}

export interface ThoughtMetadata {
  createdAt: number;
  depth: number;
  branch: string;
  tags: string[];
  revisionOf: string | null;
}

export interface Critique {
  content: string;
  severity: "low" | "medium" | "high";
  addressed: boolean;
  confidenceDelta: number;
}

export interface KnowledgeReference {
  source: string;
  content: string;
  relevance: number;
  integratedAt: number;
}

export interface MetacognitiveState {
  currentStrategy: Strategy;
  strategyHistory: StrategySwitch[];
  cognitiveLoad: number;
  stuckDetected: boolean;
  stuckReason: string | null;
  suggestedAction: MetacognitiveAction | null;
  progressMetrics: ProgressMetrics;
}

export interface StrategySwitch {
  from: Strategy;
  to: Strategy;
  reason: string;
  timestamp: number;
}

export interface MetacognitiveAction {
  type: "switch_strategy" | "backtrack" | "prune" | "deepen" | "broaden" | "conclude";
  description: string;
  targetNodeId?: string;
  suggestedStrategy?: Strategy;
}

export interface ProgressMetrics {
  totalThoughts: number;
  averageConfidence: number;
  confidenceTrend: "rising" | "falling" | "stable";
  branchCount: number;
  maxDepth: number;
  contradictionCount: number;
  supportCount: number;
  stagnationSteps: number;
}

export interface PruneResult {
  prunedNodeIds: string[];
  reason: string;
  freedDepth: number;
  pathOptimized: boolean;
}

export interface GraphStats {
  totalNodes: number;
  activeNodes: number;
  totalEdges: number;
  branches: string[];
  maxDepth: number;
  avgConfidence: number;
  strategyDistribution: Record<Strategy, number>;
  typeDistribution: Record<ThoughtType, number>;
}

export const THOUGHT_TYPE_DESCRIPTIONS: Record<ThoughtType, string> = {
  hypothesis: "A testable proposition or educated guess",
  analysis: "Detailed examination of evidence or reasoning",
  evidence: "Factual observation supporting or contradicting a claim",
  conclusion: "A judgment reached after reasoning",
  question: "An inquiry that needs resolution",
  assumption: "A premise taken for granted",
  insight: "A sudden understanding or realization",
  critique: "Critical evaluation identifying flaws or weaknesses",
  synthesis: "Integration of multiple perspectives into a unified view",
  observation: "A factual statement about the current state",
};

export const STRATEGY_DESCRIPTIONS: Record<Strategy, string> = {
  sequential: "Step-by-step linear reasoning, each thought building on the previous",
  dialectic: "Thesis → Antithesis → Synthesis pattern, resolving contradictions",
  parallel: "Exploring multiple independent branches simultaneously",
  analogical: "Mapping patterns from a known domain to the current problem",
  abductive: "Inference to the best explanation from available evidence",
  first_principles: "Deconstructing to fundamental truths and rebuilding from scratch",
  counterfactual: "What-if analysis exploring alternative scenarios and ripple effects",
  systems_thinking: "Analyzing feedback loops, leverage points, and emergent properties",
  mcts: "Monte Carlo Tree Search for optimal decision path selection through simulation",
  hybrid: "Combination of multiple strategies for complex, multi-faceted problems",
  auto: "Automatically select the best strategy based on content and graph context",
};

export const EDGE_TYPE_DESCRIPTIONS: Record<EdgeType, string> = {
  derives_from: "This thought logically follows from the target",
  contradicts: "This thought contradicts or challenges the target",
  supports: "This thought provides evidence for the target",
  refines: "This thought narrows or improves the target",
  challenges: "This thought questions the validity of the target",
  synthesizes: "This thought combines multiple preceding thoughts",
  parallels: "This thought runs alongside the target, exploring alternatives",
  abstracts: "This thought generalizes from the specific target",
  instantiates: "This thought provides a specific case of the abstract target",
};

// Enhanced types for high-IQ reasoning
export type EmotionType =
  | "neutral"
  | "curious"
  | "skeptical"
  | "confident"
  | "concerned"
  | "optimistic"
  | "pessimistic"
  | "analytical"
  | "creative"
  | "critical";

export interface UncertaintyModel {
  confidence: number; // 0-1
  confidenceInterval: [number, number];
  probabilityDistribution: Map<string, number>;
  sensitivityAnalysis: Map<string, number>; // impact of each factor
}

export interface EthicalEvaluation {
  framework: "deontological" | "consequentialist" | "virtue" | "rights_based";
  assessment: string;
  alignmentScore: number; // 0-1
  concerns: string[];
}

export interface CrossDomainReference {
  sourceDomain: string;
  targetDomain: string;
  mapping: string;
  insight: string;
  relevance: number; // 0-1
}

export interface SocialImpactAnalysis {
  stakeholderEmotions: Map<string, EmotionType>;
  groupCohesionScore: number; // 0-1
  persuasionEffectiveness: number; // 0-1
  ethicalAlignment: EthicalEvaluation;
}

export type LanguageCode = "en" | "tr" | "de" | "fr" | "es" | "jp" | "zh" | "ru";

export interface NextAction {
  tool: string;
  params?: Record<string, unknown>;
  reason: string;
}

export interface MCPResponse {
  status: "ok" | "error" | "warning";
  nodeId?: string;
  summary: string;
  confidence?: number;
  data?: Record<string, unknown>;
  nextSuggested?: NextAction;
  warnings?: string[];
}

// Enhanced ThoughtNode with high-IQ capabilities
export interface EnhancedThoughtNode extends ThoughtNode {
  language?: LanguageCode;
  emotionalTone?: EmotionType;
  uncertaintyModel?: UncertaintyModel;
  ethicalConsiderations?: EthicalEvaluation[];
  crossDomainReferences?: CrossDomainReference[];
  socialImpact?: SocialImpactAnalysis;
}

export type MetacognitiveLayer = 1 | 2 | 3 | 4 | 5;

export interface LayerDescription {
  level: MetacognitiveLayer;
  description: string;
  focus: string;
}
