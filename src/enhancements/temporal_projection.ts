import { ThoughtGraph } from "../core/graph.js";
import { ThoughtNode, ThoughtType } from "../core/types.js";
import { createNode, addEdge } from "../core/node.js";

export interface TemporalScenario {
  name: string;
  description: string;
  confidenceMultiplier: number;
  changeFactors: string[];
}

export const SCENARIOS: Record<string, TemporalScenario> = {
  optimistic: {
    name: "optimistic",
    description: "Best-case scenario with favorable developments",
    confidenceMultiplier: 1.2,
    changeFactors: ["technological breakthroughs", "positive social trends", "efficient implementation"],
  },
  pessimistic: {
    name: "pessimistic",
    description: "Worst-case scenario with adverse developments",
    confidenceMultiplier: 0.7,
    changeFactors: ["unforeseen obstacles", "regulatory changes", "resource constraints"],
  },
  realistic: {
    name: "realistic",
    description: "Balanced scenario based on current trends",
    confidenceMultiplier: 1.0,
    changeFactors: ["gradual adoption", "market forces", "incremental innovation"],
  },
  disruptive: {
    name: "disruptive",
    description: "Scenario with radical change or black swan events",
    confidenceMultiplier: 0.9,
    changeFactors: ["paradigm shifts", "disruptive technologies", "societal upheaval"],
  },
};

export interface TemporalProjection {
  originalNodeId: string;
  years: number;
  scenario: TemporalScenario;
  projectedContent: string;
  confidence: number;
  changeFactors: string[];
}

export function projectThoughtTemporally(
  graph: ThoughtGraph,
  nodeId: string,
  years: number,
  scenarioName: string = "realistic"
): TemporalProjection {
  const node = graph.getNode(nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }

  const scenario = SCENARIOS[scenarioName] || SCENARIOS.realistic;
  
  // Analyze content for time-sensitive elements
  const content = node.content.toLowerCase();
  let projectedContent = node.content;
  const changeFactors: string[] = [];
  
  // Simple transformation rules
  if (years > 0) {
    // Future projection
    if (content.includes("now") || content.includes("currently")) {
      projectedContent = projectedContent.replace(/\b(now|currently|today)\b/gi, `in ${years} years`);
    }
    
    if (content.includes("will") || content.includes("going to")) {
      // Already future-oriented
    } else {
      projectedContent = `In ${years} years: ${projectedContent}`;
    }
    
    // Add scenario-specific modifiers
    if (scenario.name === "optimistic") {
      projectedContent += ` (Optimistic scenario: ${scenario.changeFactors.join(", ")})`;
      changeFactors.push(...scenario.changeFactors);
    } else if (scenario.name === "pessimistic") {
      projectedContent += ` (Pessimistic scenario: ${scenario.changeFactors.join(", ")})`;
      changeFactors.push(...scenario.changeFactors);
    }
  } else if (years < 0) {
    // Past projection
    const absYears = Math.abs(years);
    projectedContent = `${absYears} years ago: ${projectedContent}`;
    projectedContent = projectedContent.replace(/\b(now|currently|today)\b/gi, "then");
  }

  // Adjust confidence based on years and scenario
  let confidence = node.confidence;
  confidence *= scenario.confidenceMultiplier;
  
  // The further into future/past, the lower confidence
  const timeDecay = Math.min(0.95, 1.0 - (Math.abs(years) * 0.02));
  confidence *= timeDecay;

  return {
    originalNodeId: nodeId,
    years,
    scenario,
    projectedContent,
    confidence: Math.max(0.1, Math.min(0.95, confidence)),
    changeFactors,
  };
}

export function applyTemporalProjection(
  graph: ThoughtGraph,
  projection: TemporalProjection
): ThoughtNode {
  const originalNode = graph.getNode(projection.originalNodeId);
  if (!originalNode) {
    throw new Error(`Original node ${projection.originalNodeId} not found`);
  }

  const direction = projection.years > 0 ? "future" : "past";
  const timeLabel = `${Math.abs(projection.years)} years ${direction}`;
  
  const newNode = createNode({
    content: projection.projectedContent,
    type: originalNode.type,
    strategy: originalNode.strategy,
    confidence: projection.confidence,
    parentId: originalNode.id,
    branch: originalNode.metadata.branch,
    tags: [...originalNode.metadata.tags, "temporal_projection", timeLabel, projection.scenario.name],
  });

  // Add temporal metadata
  newNode.metadata.tags.push(`time_${projection.years > 0 ? 'future' : 'past'}`);

  graph.addNode(newNode);
  addEdge(newNode, originalNode.id, "derives_from");

  return newNode;
}