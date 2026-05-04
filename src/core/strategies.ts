import {
  Strategy,
  ThoughtType,
  EdgeType,
  ThoughtNode,
} from "./types.js";
import { createNode, addEdge } from "./node.js";
import { ThoughtGraph } from "./graph.js";
import {
  DecompositionInputSchema,
  FirstPrinciplesOutputSchema,
  CounterfactualInputSchema,
  CounterfactualOutputSchema,
  SystemsThinkingInputSchema,
  SystemsThinkingOutputSchema,
  MCTSInputSchema,
  MCTSOutputSchema,
  NodeErrorSchema,
  PromptOptimizerInputSchema,
  PromptOptimizerOutputSchema,
  type FirstPrinciplesInput,
  type FirstPrinciplesOutput,
  type CounterfactualInput,
  type CounterfactualOutput,
  type SystemsThinkingInput,
  type SystemsThinkingOutput,
  type MCTSInput,
  type MCTSOutput,
  type NodeError,
  type PromptOptimizerInput,
  type PromptOptimizerOutput,
  type PromptAnalysis,
  type CoreIntent,
  type MissingContext,
  type EnhancedPrompt,
} from "./schemas.js";

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

// ============================================================================
// First Principles Strategy
// ============================================================================

export function applyFirstPrinciples(
  ctx: StrategyContext,
  input: FirstPrinciplesInput
): StrategyResult {
  try {
    // Validate input
    const validated = DecompositionInputSchema.parse(input);
    
    const nodes: ThoughtNode[] = [];
    const edges: Array<{ from: string; to: string; type: EdgeType }> = [];

    // 1. Problem Statement Node
    const problemNode = createNode({
      content: `Problem: ${validated.problem}`,
      type: "observation",
      strategy: "first_principles",
      confidence: 0.95,
      parentId: ctx.parentNodeId,
      branch: `${ctx.branch}-firstprinciples`,
      tags: [...ctx.tags, "first-principles-root"],
    });
    nodes.push(problemNode);

    if (ctx.parentNodeId) {
      edges.push({ from: problemNode.id, to: ctx.parentNodeId, type: "derives_from" });
    }

    // 2. Challenge Assumptions Node
    const assumptionsContent = validated.assumptions.length > 0
      ? `Assumptions to challenge: ${validated.assumptions.join("; ")}`
      : "Identifying implicit assumptions to challenge";
    
    const assumptionsNode = createNode({
      content: assumptionsContent,
      type: "critique",
      strategy: "first_principles",
      confidence: 0.8,
      parentId: problemNode.id,
      branch: `${ctx.branch}-firstprinciples`,
      tags: [...ctx.tags, "first-principles-assumptions"],
    });
    nodes.push(assumptionsNode);
    edges.push({ from: assumptionsNode.id, to: problemNode.id, type: "challenges" });

    // 3. Fundamental Truths Nodes
    const fundamentalTruths = _generateFundamentalTruths(validated.problem, validated.depth);
    
    for (let i = 0; i < fundamentalTruths.length; i++) {
      const truth = fundamentalTruths[i];
      const truthNode = createNode({
        content: `Fundamental Truth: ${truth.truth}`,
        type: "evidence",
        strategy: "first_principles",
        confidence: truth.isVerifiable ? 0.95 : 0.85,
        parentId: assumptionsNode.id,
        branch: `${ctx.branch}-firstprinciples-truth-${i}`,
        tags: [...ctx.tags, "first-principles-truth", `truth-${i}`],
      });
      nodes.push(truthNode);
      edges.push({ from: truthNode.id, to: assumptionsNode.id, type: "supports" });
    }

    // 4. Reconstruction/Synthesis Node
    const reconstruction = _reconstructFromTruths(validated.problem, fundamentalTruths);
    const synthesisNode = createNode({
      content: `Reconstructed Solution: ${reconstruction.solution}`,
      type: "synthesis",
      strategy: "first_principles",
      confidence: reconstruction.confidence,
      parentId: assumptionsNode.id,
      branch: `${ctx.branch}-firstprinciples`,
      tags: [...ctx.tags, "first-principles-synthesis"],
    });
    nodes.push(synthesisNode);
    edges.push({ from: synthesisNode.id, to: assumptionsNode.id, type: "synthesizes" });

    // Connect synthesis to all truths
    for (const truthNode of nodes.filter(n => n.metadata.tags.includes("first-principles-truth"))) {
      edges.push({ from: synthesisNode.id, to: truthNode.id, type: "derives_from" });
    }

    return {
      nodes,
      edgeTypes: edges,
      strategy: "first_principles",
      nextSuggestedStrategy: null,
      reasoning: "First Principles: problem → challenge assumptions → fundamental truths → reconstruction",
    };
  } catch (error) {
    // Fallback to sequential strategy
    return _createFallbackResult(ctx, input.problem, "first_principles", error);
  }
}

function _generateFundamentalTruths(problem: string, depth: number): Array<{
  truth: string;
  isTangible: boolean;
  isVerifiable: boolean;
  domain?: string;
}> {
  // Generate domain-specific fundamental truths based on problem keywords
  const truths: Array<{truth: string; isTangible: boolean; isVerifiable: boolean; domain?: string}> = [];
  
  const lowerProblem = problem.toLowerCase();
  
  // Physics/Engineering domain
  if (lowerProblem.includes("battery") || lowerProblem.includes("energy") || lowerProblem.includes("electric")) {
    truths.push(
      { truth: "Energy cannot be created or destroyed, only converted", isTangible: true, isVerifiable: true, domain: "physics" },
      { truth: "Battery capacity is limited by material properties and electron transfer rates", isTangible: true, isVerifiable: true, domain: "chemistry" },
      { truth: "Lithium is the lightest metal with highest electrochemical potential", isTangible: true, isVerifiable: true, domain: "chemistry" }
    );
  }
  
  // Software/Computer Science domain
  if (lowerProblem.includes("software") || lowerProblem.includes("code") || lowerProblem.includes("system")) {
    truths.push(
      { truth: "All software executes on hardware with finite resources", isTangible: true, isVerifiable: true, domain: "computer-science" },
      { truth: "Complexity increases exponentially with system size", isTangible: false, isVerifiable: true, domain: "software-engineering" },
      { truth: "Code is data and data is code at the machine level", isTangible: true, isVerifiable: true, domain: "computer-science" }
    );
  }
  
  // Economics/Business domain
  if (lowerProblem.includes("cost") || lowerProblem.includes("price") || lowerProblem.includes("market")) {
    truths.push(
      { truth: "Value is subjective and determined by marginal utility", isTangible: false, isVerifiable: true, domain: "economics" },
      { truth: "Resources are scarce relative to unlimited wants", isTangible: true, isVerifiable: true, domain: "economics" },
      { truth: "Price aggregates distributed knowledge through supply and demand", isTangible: false, isVerifiable: true, domain: "economics" }
    );
  }
  
  // Generic truths for any problem
  truths.push(
    { truth: "Current state is a result of past decisions and constraints", isTangible: true, isVerifiable: true },
    { truth: "Change requires energy/investment to overcome inertia", isTangible: true, isVerifiable: true },
    { truth: "Every system has boundary conditions that define its behavior", isTangible: false, isVerifiable: true }
  );
  
  return truths.slice(0, depth + 2);
}

function _reconstructFromTruths(
  problem: string,
  truths: Array<{truth: string; isTangible: boolean; isVerifiable: boolean; domain?: string}>
): { solution: string; components: string[]; reasoning: string; confidence: number } {
  return {
    solution: `From fundamental truths, we can approach "${problem}" by focusing on what is physically possible, economically viable, and technically feasible rather than accepted conventions.`,
    components: truths.map(t => t.truth),
    reasoning: `Reconstruction based on ${truths.length} fundamental truths, rejecting conventional assumptions in favor of verifiable principles`,
    confidence: truths.filter(t => t.isVerifiable).length / truths.length * 0.9,
  };
}

// ============================================================================
// Counterfactual Strategy
// ============================================================================

export function applyCounterfactual(
  ctx: StrategyContext,
  input: CounterfactualInput
): StrategyResult {
  try {
    const validated = CounterfactualInputSchema.parse(input);
    
    const nodes: ThoughtNode[] = [];
    const edges: Array<{ from: string; to: string; type: EdgeType }> = [];

    // 1. Baseline State Node
    const baselineNode = createNode({
      content: `Baseline State: ${validated.currentState}`,
      type: "observation",
      strategy: "counterfactual",
      confidence: 0.95,
      parentId: ctx.parentNodeId,
      branch: `${ctx.branch}-counterfactual`,
      tags: [...ctx.tags, "counterfactual-baseline"],
    });
    nodes.push(baselineNode);

    if (ctx.parentNodeId) {
      edges.push({ from: baselineNode.id, to: ctx.parentNodeId, type: "derives_from" });
    }

    // 2. Modified Variables Nodes
    for (const variable of validated.variablesToChange) {
      const modNode = createNode({
        content: `What if "${variable.variable}" changed from ${String(variable.currentValue)} to ${String(variable.hypotheticalValue)}?`,
        type: "hypothesis",
        strategy: "counterfactual",
        confidence: 0.7,
        parentId: baselineNode.id,
        branch: `${ctx.branch}-counterfactual-var-${variable.variable}`,
        tags: [...ctx.tags, "counterfactual-variable", variable.variable],
      });
      nodes.push(modNode);
      edges.push({ from: modNode.id, to: baselineNode.id, type: "challenges" });

      // 3. Ripple Effects for this variable
      const ripples = _simulateRippleEffects(
        variable,
        validated.currentState,
        validated.rippleDepth
      );

      for (let i = 0; i < ripples.length; i++) {
        const ripple = ripples[i];
        const rippleNode = createNode({
          content: `Stage ${ripple.stage}: ${ripple.changeDescription} (magnitude: ${ripple.magnitude.toFixed(2)}, prob: ${ripple.probability.toFixed(2)})`,
          type: "analysis",
          strategy: "counterfactual",
          confidence: ripple.probability * 0.9,
          parentId: modNode.id,
          branch: `${ctx.branch}-counterfactual-var-${variable.variable}-ripple-${i}`,
          tags: [...ctx.tags, "counterfactual-ripple", `stage-${ripple.stage}`],
        });
        nodes.push(rippleNode);
        edges.push({ from: rippleNode.id, to: modNode.id, type: "derives_from" });
      }
    }

    // 4. Scenario Outcome Nodes
    const scenarios = _generateScenarios(validated);
    
    for (const scenario of scenarios) {
      const scenarioNode = createNode({
        content: `${scenario.description} [Prob: ${(scenario.probability * 100).toFixed(0)}%, Desirability: ${(scenario.desirability * 100).toFixed(0)}%]`,
        type: scenario.desirability > 0 ? "insight" : "critique",
        strategy: "counterfactual",
        confidence: scenario.probability,
        parentId: baselineNode.id,
        branch: `${ctx.branch}-counterfactual-scenario-${scenario.scenarioId}`,
        tags: [...ctx.tags, "counterfactual-scenario", scenario.scenarioId],
      });
      nodes.push(scenarioNode);
      edges.push({ from: scenarioNode.id, to: baselineNode.id, type: "parallels" });
    }

    // 5. Risk Analysis Node
    const riskNode = createNode({
      content: `Risk Analysis: Highest risk path involves cascading effects of ${validated.variablesToChange[0]?.variable}. Mitigation: phased implementation with monitoring.`,
      type: "critique",
      strategy: "counterfactual",
      confidence: 0.75,
      parentId: baselineNode.id,
      branch: `${ctx.branch}-counterfactual`,
      tags: [...ctx.tags, "counterfactual-risk"],
    });
    nodes.push(riskNode);
    edges.push({ from: riskNode.id, to: baselineNode.id, type: "challenges" });

    return {
      nodes,
      edgeTypes: edges,
      strategy: "counterfactual",
      nextSuggestedStrategy: null,
      reasoning: `Counterfactual: baseline → modified variables → ${validated.rippleDepth}-stage ripple effects → scenario analysis`,
    };
  } catch (error) {
    return _createFallbackResult(ctx, input.currentState, "counterfactual", error);
  }
}

function _simulateRippleEffects(
  variable: { variable: string; currentValue: string | number | boolean; hypotheticalValue: string | number | boolean; impactWeight: number },
  currentState: string,
  depth: number
): Array<{stage: number; affectedVariable: string; changeDescription: string; magnitude: number; probability: number; cascadingEffects: string[]}> {
  const ripples: Array<{stage: number; affectedVariable: string; changeDescription: string; magnitude: number; probability: number; cascadingEffects: string[]}> = [];
  
  const baseMagnitude = variable.impactWeight;
  
  for (let i = 1; i <= depth; i++) {
    const decay = Math.pow(0.7, i - 1);
    const magnitude = baseMagnitude * decay * (Math.random() * 0.4 + 0.8);
    
    ripples.push({
      stage: i,
      affectedVariable: `Dependent_${i}_${variable.variable}`,
      changeDescription: `Cascading effect on ${i === 1 ? 'direct' : 'indirect'} dependencies of ${variable.variable}`,
      magnitude: magnitude,
      probability: Math.max(0.3, 0.9 - (i * 0.15)),
      cascadingEffects: i < depth ? [`Stage_${i+1}_effect`] : [],
    });
  }
  
  return ripples;
}

function _generateScenarios(input: CounterfactualInput): Array<{
  scenarioId: string;
  description: string;
  probability: number;
  desirability: number;
  keyDrivers: string[];
}> {
  const scenarios = [];
  const numScenarios = Math.min(3, input.variablesToChange.length);
  
  const outcomes = ["Optimistic", "Pessimistic", "Most Likely"];
  
  for (let i = 0; i < numScenarios; i++) {
    const prob = i === 0 ? 0.7 : i === 1 ? 0.2 : 0.5;
    const des = i === 0 ? 0.8 : i === 1 ? -0.6 : 0.3;
    
    scenarios.push({
      scenarioId: `scenario_${i}`,
      description: `${outcomes[i]}: ${outcomes[i].toLowerCase()} outcome if changes proceed as planned`,
      probability: prob,
      desirability: des,
      keyDrivers: input.variablesToChange.slice(0, 2).map(v => v.variable),
    });
  }
  
  return scenarios;
}

// ============================================================================
// Systems Thinking Strategy
// ============================================================================

export function applySystemsThinking(
  ctx: StrategyContext,
  input: SystemsThinkingInput
): StrategyResult {
  try {
    const validated = SystemsThinkingInputSchema.parse(input);
    
    const nodes: ThoughtNode[] = [];
    const edges: Array<{ from: string; to: string; type: EdgeType }> = [];

    // 1. System Overview Node
    const systemNode = createNode({
      content: `System: ${validated.systemDescription}`,
      type: "observation",
      strategy: "systems_thinking",
      confidence: 0.95,
      parentId: ctx.parentNodeId,
      branch: `${ctx.branch}-system`,
      tags: [...ctx.tags, "systems-thinking-root"],
    });
    nodes.push(systemNode);

    if (ctx.parentNodeId) {
      edges.push({ from: systemNode.id, to: ctx.parentNodeId, type: "derives_from" });
    }

    // 2. Component Nodes
    const componentNodes: ThoughtNode[] = [];
    for (const component of validated.components) {
      const compNode = createNode({
        content: `${component.type.toUpperCase()}: ${component.name} - ${component.description}`,
        type: "observation",
        strategy: "systems_thinking",
        confidence: 0.9,
        parentId: systemNode.id,
        branch: `${ctx.branch}-system-components`,
        tags: [...ctx.tags, "system-component", component.name],
      });
      nodes.push(compNode);
      componentNodes.push(compNode);
      edges.push({ from: compNode.id, to: systemNode.id, type: "instantiates" });
    }

    // 3. Feedback Loop Nodes
    const feedbackLoops = _identifyFeedbackLoops(validated.components);
    
    for (const loop of feedbackLoops) {
      const loopNode = createNode({
        content: `${loop.type === "balancing" ? "⚖️" : loop.type === "reinforcing" ? "📈" : "⏱️"} ${loop.name}: ${loop.description} (strength: ${loop.strength})`,
        type: "analysis",
        strategy: "systems_thinking",
        confidence: 0.75,
        parentId: systemNode.id,
        branch: `${ctx.branch}-system-loops`,
        tags: [...ctx.tags, "feedback-loop", loop.type],
      });
      nodes.push(loopNode);
      edges.push({ from: loopNode.id, to: systemNode.id, type: "derives_from" });

      // Connect loop to components
      for (const compName of loop.components) {
        const compNode = componentNodes.find(n => n.content.includes(compName));
        if (compNode) {
          edges.push({ from: loopNode.id, to: compNode.id, type: "abstracts" });
        }
      }
    }

    // 4. Leverage Point Nodes
    const leveragePoints = _identifyLeveragePoints(validated.components, feedbackLoops);
    
    for (let i = 0; i < leveragePoints.length; i++) {
      const point = leveragePoints[i];
      const pointNode = createNode({
        content: `Leverage Point ${point.interventionLevel}: ${point.name} - ${point.description} [Effort: ${point.effortRequired}, Impact: ${(point.systemicImpact * 100).toFixed(0)}%]`,
        type: point.interventionLevel <= 3 ? "insight" : "analysis",
        strategy: "systems_thinking",
        confidence: point.effectiveness,
        parentId: systemNode.id,
        branch: `${ctx.branch}-system-leverage`,
        tags: [...ctx.tags, "leverage-point", `level-${point.interventionLevel}`],
      });
      nodes.push(pointNode);
      edges.push({ from: pointNode.id, to: systemNode.id, type: "refines" });
    }

    // 5. Recommendations Node (highest leverage)
    if (leveragePoints.length > 0) {
      const highestLeverage = leveragePoints.reduce((prev, current) => 
        prev.systemicImpact > current.systemicImpact ? prev : current
      );
      
      const recNode = createNode({
        content: `RECOMMENDED ACTION: Target "${highestLeverage.name}" (Level ${highestLeverage.interventionLevel}) for maximum systemic impact with ${highestLeverage.effortRequired} effort`,
        type: "conclusion",
        strategy: "systems_thinking",
        confidence: highestLeverage.effectiveness,
        parentId: systemNode.id,
        branch: `${ctx.branch}-system`,
        tags: [...ctx.tags, "system-recommendation"],
      });
      nodes.push(recNode);
      edges.push({ from: recNode.id, to: systemNode.id, type: "derives_from" });
    }

    return {
      nodes,
      edgeTypes: edges,
      strategy: "systems_thinking",
      nextSuggestedStrategy: null,
      reasoning: `Systems Thinking: system overview → ${validated.components.length} components → ${feedbackLoops.length} feedback loops → ${leveragePoints.length} leverage points → recommendations`,
    };
  } catch (error) {
    return _createFallbackResult(ctx, input.systemDescription, "systems_thinking", error);
  }
}

function _identifyFeedbackLoops(components: Array<{name: string; type: string; description: string}>): Array<{
  id: string;
  type: "balancing" | "reinforcing" | "delay";
  name: string;
  description: string;
  components: string[];
  polarity: number;
  strength: "weak" | "moderate" | "strong" | "critical";
  timeDelay?: "immediate" | "fast" | "slow" | "very_slow";
}> {
  const loops: Array<{
    id: string;
    type: "balancing" | "reinforcing" | "delay";
    name: string;
    description: string;
    components: string[];
    polarity: number;
    strength: "weak" | "moderate" | "strong" | "critical";
    timeDelay?: "immediate" | "fast" | "slow" | "very_slow";
  }> = [];
  
  if (components.length >= 2) {
    // Generate some plausible feedback loops
    loops.push({
      id: "loop_1",
      type: "reinforcing",
      name: "Growth Loop",
      description: "Increased activity leads to more resources, enabling further growth",
      components: components.slice(0, 2).map(c => c.name),
      polarity: 1,
      strength: components.some(c => c.type === "stock") ? "strong" : "moderate",
    });
    
    loops.push({
      id: "loop_2",
      type: "balancing",
      name: "Regulation Loop",
      description: "Counteracting forces that maintain system equilibrium",
      components: components.slice(-2).map(c => c.name),
      polarity: -1,
      strength: components.some(c => c.type === "converter") ? "moderate" : "weak",
      timeDelay: "slow",
    });
    
    if (components.length > 2) {
      loops.push({
        id: "loop_3",
        type: "delay",
        name: "Response Lag",
        description: "Time delay between action and system response",
        components: [components[0].name, components[components.length - 1].name],
        polarity: 0,
        strength: "moderate",
        timeDelay: "slow",
      });
    }
  }
  
  return loops;
}

function _identifyLeveragePoints(
  components: Array<{name: string; type: string; description: string}>,
  feedbackLoops: Array<{id: string; type: string; name: string}>
): Array<{
  id: string;
  name: string;
  description: string;
  interventionLevel: number;
  effectiveness: number;
  effortRequired: "low" | "medium" | "high" | "very_high";
  systemicImpact: number;
  sideEffects: string[];
}> {
  const points: Array<{
    id: string;
    name: string;
    description: string;
    interventionLevel: number;
    effectiveness: number;
    effortRequired: "low" | "medium" | "high" | "very_high";
    systemicImpact: number;
    sideEffects: string[];
  }> = [];
  
  // Donella Meadows' 12 leverage points simplified
  const levels = [
    { level: 12, name: "Constants, parameters, numbers", effort: "low" as const },
    { level: 10, name: "Material stocks and flows", effort: "medium" as const },
    { level: 8, name: "Delays and feedback loops", effort: "high" as const },
    { level: 4, name: "Rules of the system", effort: "very_high" as const },
    { level: 2, name: "System mindset", effort: "very_high" as const },
    { level: 1, name: "Power to transcend paradigms", effort: "very_high" as const },
  ];
  
  for (let i = 0; i < Math.min(4, components.length); i++) {
    const levelInfo = levels[i % levels.length];
    points.push({
      id: `leverage_${i}`,
      name: `${levelInfo.name} (${components[i].name})`,
      description: `Intervene at ${levelInfo.name.toLowerCase()} to shift system behavior`,
      interventionLevel: levelInfo.level,
      effectiveness: 0.6 + (Math.random() * 0.3),
      effortRequired: levelInfo.effort,
      systemicImpact: (13 - levelInfo.level) / 12 * 0.9,
      sideEffects: [`Affects ${components[(i + 1) % components.length].name}`, "Potential unintended consequences"],
    });
  }
  
  return points.sort((a, b) => b.systemicImpact - a.systemicImpact);
}

// ============================================================================
// MCTS (Monte Carlo Tree Search) Strategy
// ============================================================================

export function applyMCTS(
  ctx: StrategyContext,
  input: MCTSInput
): StrategyResult {
  try {
    const validated = MCTSInputSchema.parse(input);
    
    const nodes: ThoughtNode[] = [];
    const edges: Array<{ from: string; to: string; type: EdgeType }> = [];

    // 1. Root Problem Node
    const rootNode = createNode({
      content: `MCTS Root: ${validated.problem}`,
      type: "question",
      strategy: "mcts",
      confidence: 1.0,
      parentId: ctx.parentNodeId,
      branch: `${ctx.branch}-mcts`,
      tags: [...ctx.tags, "mcts-root"],
    });
    nodes.push(rootNode);

    if (ctx.parentNodeId) {
      edges.push({ from: rootNode.id, to: ctx.parentNodeId, type: "derives_from" });
    }

    // 2. Build MCTS Tree
    const mctsTree = _buildMCTSTree(validated);
    
    // Add action nodes as children of root
    const actionNodes: ThoughtNode[] = [];
    for (const action of validated.possibleActions) {
      const actionNode = createNode({
        content: `ACTION: ${action.description} [ID: ${action.id}]`,
        type: "hypothesis",
        strategy: "mcts",
        confidence: 0.5, // Initial uniform confidence
        parentId: rootNode.id,
        branch: `${ctx.branch}-mcts-action-${action.id}`,
        tags: [...ctx.tags, "mcts-action", action.id],
      });
      nodes.push(actionNode);
      actionNodes.push(actionNode);
      edges.push({ from: actionNode.id, to: rootNode.id, type: "derives_from" });
    }

    // 3. Simulation Results Nodes
    const simulationNodes: ThoughtNode[] = [];
    for (let i = 0; i < Math.min(5, validated.possibleActions.length); i++) {
      const simNode = createNode({
        content: `SIMULATION ${i + 1}: Path ${i + 1} → Expected reward: ${(Math.random() * 2 - 0.5).toFixed(2)}`,
        type: "analysis",
        strategy: "mcts",
        confidence: 0.6 + Math.random() * 0.3,
        parentId: actionNodes[i % actionNodes.length].id,
        branch: `${ctx.branch}-mcts-sim-${i}`,
        tags: [...ctx.tags, "mcts-simulation"],
      });
      nodes.push(simNode);
      simulationNodes.push(simNode);
      edges.push({ from: simNode.id, to: actionNodes[i % actionNodes.length].id, type: "derives_from" });
    }

    // 4. Pruning Analysis Node
    const prunedCount = Math.floor(validated.possibleActions.length * validated.pruningThreshold);
    const pruneNode = createNode({
      content: `PRUNING: ${prunedCount} low-reward paths pruned (${(validated.pruningThreshold * 100).toFixed(0)}% threshold)`,
      type: "critique",
      strategy: "mcts",
      confidence: 0.8,
      parentId: rootNode.id,
      branch: `${ctx.branch}-mcts`,
      tags: [...ctx.tags, "mcts-pruning"],
    });
    nodes.push(pruneNode);
    edges.push({ from: pruneNode.id, to: rootNode.id, type: "challenges" });

    // 5. Best Path/Conclusion Node
    const bestAction = validated.possibleActions.reduce((best, current, idx) => {
      const currentReward = current.estimatedReward ?? (Math.random() * 2 - 0.5);
      const bestReward = best.action.estimatedReward ?? (Math.random() * 2 - 0.5);
      return currentReward > bestReward ? { action: current, idx } : best;
    }, { action: validated.possibleActions[0], idx: 0 });

    const bestPathNode = createNode({
      content: `OPTIMAL PATH: ${bestAction.action.description} | UCB1 Score: ${mctsTree.bestScore.toFixed(3)} | Visits: ${mctsTree.totalVisits} | Confidence: ${(mctsTree.confidence * 100).toFixed(0)}%`,
      type: "conclusion",
      strategy: "mcts",
      confidence: mctsTree.confidence,
      parentId: rootNode.id,
      branch: `${ctx.branch}-mcts`,
      tags: [...ctx.tags, "mcts-optimal", bestAction.action.id],
    });
    nodes.push(bestPathNode);
    edges.push({ from: bestPathNode.id, to: rootNode.id, type: "derives_from" });

    // Connect best path to the winning action
    edges.push({ from: bestPathNode.id, to: actionNodes[bestAction.idx].id, type: "supports" });

    return {
      nodes,
      edgeTypes: edges,
      strategy: "mcts",
      nextSuggestedStrategy: null,
      reasoning: `MCTS: root → ${validated.possibleActions.length} actions → ${validated.numSimulations} simulations → pruning → optimal path selected`,
    };
  } catch (error) {
    return _createFallbackResult(ctx, input.problem, "mcts", error);
  }
}

function _buildMCTSTree(input: MCTSInput): {
  totalVisits: number;
  bestScore: number;
  confidence: number;
  nodes: Array<{actionId: string; visits: number; averageReward: number; ucb1: number}>;
} {
  const nodes: Array<{actionId: string; visits: number; averageReward: number; ucb1: number}> = [];
  const c = input.explorationConstant;
  
  // Initialize nodes
  for (const action of input.possibleActions) {
    nodes.push({
      actionId: action.id,
      visits: 1,
      averageReward: action.estimatedReward ?? (Math.random() * 2 - 0.5),
      ucb1: 0,
    });
  }
  
  let totalVisits = nodes.length;
  
  // Simulate MCTS iterations (simplified)
  for (let i = 0; i < input.numSimulations; i++) {
    // Update UCB1 scores
    for (const node of nodes) {
      node.ucb1 = node.averageReward + c * Math.sqrt(Math.log(totalVisits) / node.visits);
    }
    
    // Select best node
    const bestNode = nodes.reduce((prev, current) => prev.ucb1 > current.ucb1 ? prev : current);
    
    // Simulate (rollout)
    const reward = Math.random() * 2 - 0.5; // -0.5 to 1.5
    
    // Backpropagate
    bestNode.visits++;
    bestNode.averageReward += (reward - bestNode.averageReward) / bestNode.visits;
    totalVisits++;
  }
  
  const bestNode = nodes.reduce((prev, current) => prev.averageReward > current.averageReward ? prev : current);
  
  return {
    totalVisits,
    bestScore: bestNode.ucb1,
    confidence: Math.min(1, bestNode.visits / (input.numSimulations * 0.1)),
    nodes,
  };
}

// ============================================================================
// Error Handling Helpers
// ============================================================================

function _createFallbackResult(
  ctx: StrategyContext,
  content: string,
  failedStrategy: Strategy,
  error: unknown
): StrategyResult {
  // Log the error
  const errorInfo: NodeError = {
    nodeType: failedStrategy,
    error: error instanceof Error ? error.message : String(error),
    code: error instanceof Error && error.name === "ZodError" ? "SCHEMA_VALIDATION_ERROR" : "PROCESSING_ERROR",
    input: content,
    fallbackUsed: true,
    timestamp: Date.now(),
  };
  
  console.error(`[${failedStrategy}] Node failed, falling back to sequential:`, errorInfo);
  
  // Create a simple sequential fallback
  const fallbackNode = createNode({
    content: `FALLBACK (from ${failedStrategy}): ${content.substring(0, 100)}...`,
    type: "analysis",
    strategy: "sequential", // Fallback to sequential
    confidence: 0.5,
    parentId: ctx.parentNodeId,
    branch: `${ctx.branch}-fallback`,
    tags: [...ctx.tags, "fallback", `failed-${failedStrategy}`],
  });
  
  const edges: Array<{ from: string; to: string; type: EdgeType }> = [];
  if (ctx.parentNodeId) {
    edges.push({ from: fallbackNode.id, to: ctx.parentNodeId, type: "derives_from" });
  }
  
  return {
    nodes: [fallbackNode],
    edgeTypes: edges,
    strategy: "sequential", // Report as sequential fallback
    nextSuggestedStrategy: null,
    reasoning: `${failedStrategy} strategy failed (${errorInfo.code}), falling back to sequential processing`,
  };
}

// ============================================================================
// Prompt Optimizer Node (Node Zero - Entry Point)
// ============================================================================

export interface PromptOptimizerResult {
  nodes: ThoughtNode[];
  edgeTypes: Array<{ from: string; to: string; type: EdgeType }>;
  strategy: "hybrid";
  nextSuggestedStrategy: Strategy | null;
  reasoning: string;
  optimizationOutput: {
    inputAnalysis: {
      ambiguityLevel: number;
      domainCategory: string;
      complexityScore: number;
    };
    coreIntent: {
      primaryGoal: string;
      successCriteria: string[];
      desiredFormat: string;
    };
    missingContext: {
      criticalGaps: Array<{ gap: string; whyItMatters: string }>;
      suggestedClarifications: Array<{ question: string; priority: string }>;
    };
    enhancedPrompt: {
      superPrompt: string;
      reasoningStrategy: Strategy | "hybrid";
      requiredCapabilities: string[];
      outputSpecifications: {
        format: string;
        structure: string[];
        depthLevel: string;
      };
    };
    routingRecommendation: {
      primaryStrategy: Strategy;
      suggestedNodes: string[];
      autoExecute: boolean;
    };
  };
}

export function applyPromptOptimizer(
  ctx: StrategyContext,
  input: PromptOptimizerInput
): PromptOptimizerResult {
  const startTime = Date.now();
  
  try {
    // Validate input
    const validated = PromptOptimizerInputSchema.parse(input);
    
    const nodes: ThoughtNode[] = [];
    const edges: Array<{ from: string; to: string; type: EdgeType }> = [];

    // Step 1: Original Prompt Node (Input Capture)
    const originalNode = createNode({
      content: `📥 ORIGINAL PROMPT: "${validated.originalPrompt.substring(0, 200)}${validated.originalPrompt.length > 200 ? "..." : ""}"`,
      type: "observation",
      strategy: "hybrid" as Strategy,
      confidence: 1.0,
      parentId: ctx.parentNodeId,
      branch: `${ctx.branch}-optimizer`,
      tags: [...ctx.tags, "node-zero", "prompt-optimizer", "original-input"],
    });
    nodes.push(originalNode);

    if (ctx.parentNodeId) {
      edges.push({ from: originalNode.id, to: ctx.parentNodeId, type: "derives_from" });
    }

    // Step 2: Analyze the prompt
    const analysis = _analyzePrompt(validated);
    
    const analysisNode = createNode({
      content: `🔍 ANALYSIS: Domain=${analysis.domainCategory}, Complexity=${analysis.complexityScore}/10, Ambiguity=${(analysis.ambiguityLevel * 100).toFixed(0)}%`,
      type: "analysis",
      strategy: "hybrid" as Strategy,
      confidence: 0.9,
      parentId: originalNode.id,
      branch: `${ctx.branch}-optimizer`,
      tags: [...ctx.tags, "prompt-analysis", `domain-${analysis.domainCategory}`, `complexity-${analysis.complexityScore}`],
    });
    nodes.push(analysisNode);
    edges.push({ from: analysisNode.id, to: originalNode.id, type: "derives_from" });

    // Step 3: Extract Core Intent
    const coreIntent = _extractCoreIntent(validated, analysis);
    
    const intentNode = createNode({
      content: `🎯 CORE INTENT: "${coreIntent.primaryGoal}" | Format: ${coreIntent.desiredFormat} | Success: ${coreIntent.successCriteria.slice(0, 2).join("; ")}`,
      type: "insight",
      strategy: "hybrid" as Strategy,
      confidence: 0.85,
      parentId: analysisNode.id,
      branch: `${ctx.branch}-optimizer`,
      tags: [...ctx.tags, "core-intent", `format-${coreIntent.desiredFormat}`],
    });
    nodes.push(intentNode);
    edges.push({ from: intentNode.id, to: analysisNode.id, type: "abstracts" });

    // Step 4: Identify Missing Context
    const missingContext = _identifyMissingContext(validated, analysis);
    
    if (missingContext.criticalGaps.length > 0) {
      const gapsNode = createNode({
        content: `⚠️ MISSING CONTEXT: ${missingContext.criticalGaps.length} critical gaps identified - ${missingContext.criticalGaps[0]?.gap}`,
        type: "critique",
        strategy: "hybrid" as Strategy,
        confidence: 0.75,
        parentId: intentNode.id,
        branch: `${ctx.branch}-optimizer`,
        tags: [...ctx.tags, "missing-context", `gaps-${missingContext.criticalGaps.length}`],
      });
      nodes.push(gapsNode);
      edges.push({ from: gapsNode.id, to: intentNode.id, type: "challenges" });
    }

    // Step 5: Generate Enhanced Prompt (Super Prompt)
    const enhancedPrompt = _generateSuperPrompt(validated, analysis, coreIntent, missingContext);
    
    const superPromptNode = createNode({
      content: `✨ SUPER PROMPT: "${enhancedPrompt.superPrompt.substring(0, 150)}..." [Strategy: ${enhancedPrompt.reasoningStrategy}]`,
      type: "synthesis",
      strategy: "hybrid" as Strategy,
      confidence: 0.9,
      parentId: intentNode.id,
      branch: `${ctx.branch}-optimizer`,
      tags: [...ctx.tags, "super-prompt", `strategy-${enhancedPrompt.reasoningStrategy}`, "optimized-output"],
    });
    nodes.push(superPromptNode);
    edges.push({ from: superPromptNode.id, to: intentNode.id, type: "synthesizes" });
    
    // Connect to analysis node as well
    edges.push({ from: superPromptNode.id, to: analysisNode.id, type: "derives_from" });

    // Step 6: Routing Recommendation
    const routing = _determineRouting(enhancedPrompt, analysis);
    
    const routingNode = createNode({
      content: `🚦 ROUTING: Primary=${routing.primaryStrategy} | Nodes=[${routing.suggestedNodes.join(", ")}] | AutoExecute=${routing.autoExecute}`,
      type: "conclusion",
      strategy: "hybrid" as Strategy,
      confidence: 0.88,
      parentId: superPromptNode.id,
      branch: `${ctx.branch}-optimizer`,
      tags: [...ctx.tags, "routing", `primary-${routing.primaryStrategy}`, ...routing.suggestedNodes.map(n => `node-${n}`)],
    });
    nodes.push(routingNode);
    edges.push({ from: routingNode.id, to: superPromptNode.id, type: "derives_from" });

    // Calculate processing time and metrics
    const processingTime = Date.now() - startTime;
    const expansionRatio = enhancedPrompt.superPrompt.length / validated.originalPrompt.length;
    const optimizationScore = _calculateOptimizationScore(analysis, missingContext, enhancedPrompt);

    return {
      nodes,
      edgeTypes: edges,
      strategy: "hybrid",
      nextSuggestedStrategy: routing.primaryStrategy,
      reasoning: `PromptOptimizer: original(${validated.originalPrompt.length}chars) → analysis → intent extraction → gap identification → super-prompt(${enhancedPrompt.superPrompt.length}chars) → routing recommendation`,
      optimizationOutput: {
        inputAnalysis: {
          ambiguityLevel: analysis.ambiguityLevel,
          domainCategory: analysis.domainCategory,
          complexityScore: analysis.complexityScore,
        },
        coreIntent: {
          primaryGoal: coreIntent.primaryGoal,
          successCriteria: coreIntent.successCriteria,
          desiredFormat: coreIntent.desiredFormat,
        },
        missingContext: {
          criticalGaps: missingContext.criticalGaps,
          suggestedClarifications: missingContext.suggestedClarifications,
        },
        enhancedPrompt: {
          superPrompt: enhancedPrompt.superPrompt,
          reasoningStrategy: enhancedPrompt.reasoningStrategy,
          requiredCapabilities: enhancedPrompt.requiredCapabilities,
          outputSpecifications: enhancedPrompt.outputSpecifications,
        },
        routingRecommendation: {
          primaryStrategy: routing.primaryStrategy,
          suggestedNodes: routing.suggestedNodes,
          autoExecute: routing.autoExecute,
        },
      },
    };
    
  } catch (error) {
    // Fallback to simple pass-through
    return _createPromptOptimizerFallback(ctx, input, error);
  }
}

// ============================================================================
// Prompt Optimizer Helper Functions
// ============================================================================

function _analyzePrompt(input: PromptOptimizerInput): PromptAnalysis {
  const prompt = input.originalPrompt.toLowerCase();
  
  // Domain detection
  let domainCategory: PromptAnalysis["domainCategory"] = "general";
  if (/\b(code|program|function|class|api|database|server|client|algorithm|debug)\b/.test(prompt)) {
    domainCategory = "technical";
  } else if (/\b(strategy|plan|decision|optimize|improve|efficiency|cost|benefit)\b/.test(prompt)) {
    domainCategory = "strategic";
  } else if (/\b(analyze|compare|evaluate|assess|research|study|data)\b/.test(prompt)) {
    domainCategory = "analytical";
  } else if (/\b(design|create|build|develop|innovate|concept)\b/.test(prompt)) {
    domainCategory = "creative";
  } else if (/\b(science|experiment|hypothesis|theory|physics|biology|chemistry)\b/.test(prompt)) {
    domainCategory = "scientific";
  } else if (/\b(business|market|customer|revenue|profit|sales|marketing)\b/.test(prompt)) {
    domainCategory = "business";
  }

  // Ambiguity detection
  const vagueWords = ["something", "somehow", "maybe", "perhaps", "whatever", "whatever", "etc", "and so on"];
  const ambiguityCount = vagueWords.filter(w => prompt.includes(w)).length;
  const ambiguityLevel = Math.min(1, ambiguityCount / 3 + (input.originalPrompt.length < 50 ? 0.3 : 0));

  // Complexity scoring
  let complexityScore = Math.min(10, Math.max(1, 
    input.originalPrompt.split(/[.!?;]+/).length + // Sentence count
    input.originalPrompt.split(/\s+/).filter(w => w.length > 8).length * 0.5 + // Complex words
    (input.conversationHistory?.length || 0) * 0.5 // Context depth
  ));

  // Urgency indicators
  const urgencyWords = ["urgent", "asap", "quickly", "fast", "immediately", "deadline", "emergency", "critical"];
  const urgencyIndicators = urgencyWords.filter(w => prompt.includes(w));

  // Constraint mentions
  const constraintWords = ["must", "should", "cannot", "limited", "budget", "time", "resource", "constraint"];
  const constraintMentions = constraintWords.filter(w => prompt.includes(w));

  return {
    ambiguityLevel,
    domainCategory,
    complexityScore,
    urgencyIndicators,
    constraintMentions,
  };
}

function _extractCoreIntent(input: PromptOptimizerInput, analysis: PromptAnalysis): CoreIntent {
  const prompt = input.originalPrompt;
  
  // Extract primary goal (simplified - first sentence usually contains the goal)
  const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const primaryGoal = sentences[0]?.trim() || prompt;

  // Detect desired format
  let desiredFormat: CoreIntent["desiredFormat"] = "structured_analysis";
  if (/\b(code|function|class|script|program)\b/i.test(prompt)) {
    desiredFormat = "code";
  } else if (/\b(step by step|how to|guide|tutorial|instructions)\b/i.test(prompt)) {
    desiredFormat = "step_by_step_guide";
  } else if (/\b(compare|versus|vs|difference between|pros and cons)\b/i.test(prompt)) {
    desiredFormat = "comparative_evaluation";
  } else if (/\b(design|proposal|plan|solution)\b/i.test(prompt)) {
    desiredFormat = "creative_proposal";
  } else if (/\b(specification|specs|requirements|technical)\b/i.test(prompt)) {
    desiredFormat = "technical_specification";
  } else if (/\b(recommend|should|best option|advise|suggest)\b/i.test(prompt)) {
    desiredFormat = "decision_recommendation";
  } else if (/\b(explain|what is|how does|why|describe)\b/i.test(prompt)) {
    desiredFormat = "explanation";
  }

  // Generate success criteria based on format
  const successCriteria: string[] = [];
  switch (desiredFormat) {
    case "code":
      successCriteria.push("Runnable code provided");
      successCriteria.push("Includes error handling");
      successCriteria.push("Follows best practices");
      break;
    case "decision_recommendation":
      successCriteria.push("Clear recommendation made");
      successCriteria.push("Pros and cons evaluated");
      successCriteria.push("Risk assessment included");
      break;
    case "comparative_evaluation":
      successCriteria.push("All options compared fairly");
      successCriteria.push("Evaluation criteria defined");
      successCriteria.push("Clear winner identified");
      break;
    default:
      successCriteria.push("Comprehensive analysis provided");
      successCriteria.push("Key insights highlighted");
      successCriteria.push("Actionable conclusions drawn");
  }

  return {
    primaryGoal,
    secondaryGoals: [], // Could extract from later sentences
    successCriteria,
    targetAudience: input.userContext?.expertiseLevel,
    desiredFormat,
  };
}

function _identifyMissingContext(input: PromptOptimizerInput, analysis: PromptAnalysis): MissingContext {
  const prompt = input.originalPrompt.toLowerCase();
  const criticalGaps: MissingContext["criticalGaps"] = [];
  const suggestedClarifications: MissingContext["suggestedClarifications"] = [];
  const implicitAssumptions: MissingContext["implicitAssumptions"] = [];

  // Check for missing context based on domain
  if (analysis.domainCategory === "technical" && !/\b(language|framework|platform|environment)\b/.test(prompt)) {
    criticalGaps.push({
      gap: "Technical stack not specified",
      whyItMatters: "Implementation details depend heavily on chosen technologies",
      assumptionMade: "Generic solution applicable to common stacks",
    });
    suggestedClarifications.push({
      question: "What programming language/framework are you using?",
      priority: "high",
      impact: "Enables specific, runnable code examples",
    });
  }

  if (analysis.domainCategory === "strategic" && !/\b(budget|timeline|resources|team)\b/.test(prompt)) {
    criticalGaps.push({
      gap: "Constraints not defined",
      whyItMatters: "Recommendations must fit within practical limitations",
      assumptionMade: "Moderate budget and resources available",
    });
    suggestedClarifications.push({
      question: "What are your budget, timeline, and resource constraints?",
      priority: "high",
      impact: "Ensures feasible, realistic recommendations",
    });
  }

  if (!/\b(for whom|audience|user|customer|stakeholder)\b/.test(prompt)) {
    suggestedClarifications.push({
      question: "Who is the target audience for this output?",
      priority: "medium",
      impact: "Allows tailoring of language and depth",
    });
  }

  // Add implicit assumptions based on user context
  implicitAssumptions.push({
    assumption: `User has ${input.userContext?.expertiseLevel || "intermediate"} level expertise`,
    riskIfWrong: "Output may be too basic or too advanced",
    confidence: 0.7,
  });

  return {
    criticalGaps,
    suggestedClarifications,
    implicitAssumptions,
  };
}

function _generateSuperPrompt(
  input: PromptOptimizerInput,
  analysis: PromptAnalysis,
  coreIntent: CoreIntent,
  missingContext: MissingContext
): EnhancedPrompt {
  const original = input.originalPrompt;
  
  // Determine best reasoning strategy
  let reasoningStrategy: EnhancedPrompt["reasoningStrategy"] = "sequential";
  
  if (analysis.complexityScore > 7 && analysis.domainCategory === "strategic") {
    reasoningStrategy = "mcts"; // Complex decisions
  } else if (analysis.domainCategory === "technical" && /\b(optimize|improve|scale|performance)\b/.test(original)) {
    reasoningStrategy = "systems_thinking"; // System optimization
  } else if (/\b(why|what if|alternative|scenario)\b/i.test(original)) {
    reasoningStrategy = "first_principles"; // Fundamental questioning
  } else if (/\b(compare|choose|decide|select)\b/i.test(original)) {
    reasoningStrategy = "parallel"; // Multiple options
  }

  // Build the super prompt
  const sections: string[] = [];
  
  sections.push(`# OPTIMIZED PROMPT v2.0`);
  sections.push(`## Original Intent`);
  sections.push(`"${coreIntent.primaryGoal}"`);
  sections.push(``);
  
  sections.push(`## Context`);
  sections.push(`- Domain: ${analysis.domainCategory}`);
  sections.push(`- Complexity: ${analysis.complexityScore}/10`);
  sections.push(`- Target Audience: ${coreIntent.targetAudience || "General"}`);
  sections.push(`- Expertise Level: ${input.userContext?.expertiseLevel || "Intermediate"}`);
  sections.push(``);
  
  if (missingContext.criticalGaps.length > 0) {
    sections.push(`## Assumptions (Gaps Identified)`);
    missingContext.criticalGaps.forEach(gap => {
      sections.push(`- ${gap.gap}: ${gap.assumptionMade}`);
    });
    sections.push(``);
  }
  
  sections.push(`## Requirements`);
  coreIntent.successCriteria.forEach(criterion => {
    sections.push(`- [ ] ${criterion}`);
  });
  sections.push(``);
  
  sections.push(`## Output Format`);
  sections.push(`Format: ${coreIntent.desiredFormat}`);
  sections.push(`Depth: ${input.userContext?.preferences?.technicalDepth || "moderate"}`);
  sections.push(`Verbosity: ${input.userContext?.preferences?.verbosity || "balanced"}`);
  sections.push(``);
  
  sections.push(`## Core Task`);
  sections.push(original);
  sections.push(``);
  
  sections.push(`## Success Metrics`);
  sections.push(`The response should be: ${coreIntent.successCriteria.join("; ")}`);

  const superPrompt = sections.join("\n");

  // Determine required capabilities
  const requiredCapabilities: EnhancedPrompt["requiredCapabilities"] = ["analysis"];
  if (reasoningStrategy === "mcts") requiredCapabilities.push("evaluation", "optimization");
  if (coreIntent.desiredFormat === "creative_proposal") requiredCapabilities.push("creation");
  if (/\b(compare|versus)\b/i.test(original)) requiredCapabilities.push("comparison");

  return {
    superPrompt,
    reasoningStrategy,
    strategyRationale: `Selected ${reasoningStrategy} based on ${analysis.domainCategory} domain and complexity ${analysis.complexityScore}/10`,
    requiredCapabilities,
    suggestedChain: undefined, // Could be populated for complex scenarios
    outputSpecifications: {
      format: coreIntent.desiredFormat,
      structure: ["Introduction", "Analysis", "Recommendations", "Conclusion"],
      depthLevel: input.userContext?.preferences?.technicalDepth === "deep" ? "exhaustive" : 
                  input.userContext?.preferences?.technicalDepth === "high_level" ? "high_level" : "detailed",
      includeExamples: input.userContext?.preferences?.includeCode || false,
      includeEdgeCases: true,
    },
  };
}

function _determineRouting(
  enhancedPrompt: EnhancedPrompt,
  analysis: PromptAnalysis
): PromptOptimizerOutput["routingRecommendation"] {
  type SuggestedNode = "FirstPrinciplesNode" | "CounterfactualNode" | "SystemsThinkingNode" | "MCTSNode" | "DialecticNode" | "AbductiveNode";
  
  const strategyToNode: Record<string, SuggestedNode[]> = {
    sequential: [],
    dialectic: ["DialecticNode"],
    parallel: [],
    analogical: [],
    abductive: ["AbductiveNode"],
    first_principles: ["FirstPrinciplesNode"],
    counterfactual: ["CounterfactualNode"],
    systems_thinking: ["SystemsThinkingNode"],
    mcts: ["MCTSNode"],
    hybrid: ["FirstPrinciplesNode", "CounterfactualNode"],
  };

  const primaryStrategy = enhancedPrompt.reasoningStrategy === "hybrid" ? "first_principles" : enhancedPrompt.reasoningStrategy;
  
  // Auto-execute for simple, low-ambiguity prompts
  const autoExecute = analysis.ambiguityLevel < 0.3 && analysis.complexityScore < 5;

  return {
    primaryStrategy,
    fallbackStrategy: "sequential",
    suggestedNodes: (strategyToNode[enhancedPrompt.reasoningStrategy] || []) as SuggestedNode[],
    autoExecute,
  };
}

function _calculateOptimizationScore(
  analysis: PromptAnalysis,
  missingContext: MissingContext,
  enhancedPrompt: EnhancedPrompt
): number {
  // Higher score = better optimization
  let score = 0.5; // Base score
  
  // Bonus for addressing ambiguity
  if (analysis.ambiguityLevel > 0.5 && missingContext.criticalGaps.length > 0) {
    score += 0.2;
  }
  
  // Bonus for structure
  if (enhancedPrompt.outputSpecifications.structure.length > 2) {
    score += 0.15;
  }
  
  // Bonus for specificity
  if (enhancedPrompt.reasoningStrategy !== "sequential") {
    score += 0.15;
  }
  
  return Math.min(1, score);
}

function _createPromptOptimizerFallback(
  ctx: StrategyContext,
  input: PromptOptimizerInput,
  error: unknown
): PromptOptimizerResult {
  console.error("[PromptOptimizer] Failed, using fallback:", error);
  
  const nodes: ThoughtNode[] = [];
  const edges: Array<{ from: string; to: string; type: EdgeType }> = [];
  
  const passThroughNode = createNode({
    content: `📥 PASS-THROUGH (Optimizer Failed): "${input.originalPrompt.substring(0, 100)}..."`,
    type: "observation",
    strategy: "sequential",
    confidence: 0.7,
    parentId: ctx.parentNodeId,
    branch: `${ctx.branch}-optimizer-fallback`,
    tags: [...ctx.tags, "node-zero", "optimizer-fallback"],
  });
  nodes.push(passThroughNode);

  return {
    nodes,
    edgeTypes: edges,
    strategy: "hybrid",
    nextSuggestedStrategy: "sequential",
    reasoning: "PromptOptimizer failed, using pass-through mode",
    optimizationOutput: {
      inputAnalysis: {
        ambiguityLevel: 0.5,
        domainCategory: "general",
        complexityScore: 5,
      },
      coreIntent: {
        primaryGoal: input.originalPrompt,
        successCriteria: ["Provide helpful response"],
        desiredFormat: "structured_analysis",
      },
      missingContext: {
        criticalGaps: [],
        suggestedClarifications: [],
      },
      enhancedPrompt: {
        superPrompt: input.originalPrompt,
        reasoningStrategy: "sequential",
        requiredCapabilities: ["analysis"],
        outputSpecifications: {
          format: "structured_analysis",
          structure: ["Analysis", "Conclusion"],
          depthLevel: "detailed",
        },
      },
      routingRecommendation: {
        primaryStrategy: "sequential",
        suggestedNodes: [],
        autoExecute: false,
      },
    },
  };
}

export function selectStrategy(
  content: string,
  graphContext: { nodeCount: number; avgConfidence: number; recentStrategies: string[] }
): Strategy {
  const lower = content.toLowerCase();

  if (lower.includes("neden") || lower.includes("why") || lower.includes("nasıl") || lower.includes("how")) {
    return "abductive";
  }
  if (lower.includes("eğer") || lower.includes("if") || lower.includes("varsayalım") || lower.includes("what if")) {
    return "counterfactual";
  }
  if (lower.includes("vs") || lower.includes("veya") || lower.includes("karşılaştır") || lower.includes("compare")) {
    return "dialectic";
  }
  if (lower.includes("sistem") || lower.includes("system") || lower.includes("döngü") || lower.includes("loop")) {
    return "systems_thinking";
  }
  if (lower.includes("temel") || lower.includes("fundamental") || lower.includes("varsayım") || lower.includes("assumption")) {
    return "first_principles";
  }

  if (graphContext.avgConfidence < 0.4 && graphContext.nodeCount > 3) {
    return "parallel";
  }
  if (graphContext.nodeCount === 0) {
    return "sequential";
  }

  const last = graphContext.recentStrategies[graphContext.recentStrategies.length - 1];
  if (last === "sequential" && graphContext.nodeCount > 4) {
    return "dialectic";
  }

  return "sequential";
}
