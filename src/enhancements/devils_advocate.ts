import { ThoughtGraph } from "../core/graph.js";
import { ThoughtNode, ThoughtType, EdgeType } from "../core/types.js";
import { createNode, addEdge } from "../core/node.js";

export interface DevilsAdvocateOptions {
  depth: number;
  intensity: "mild" | "moderate" | "aggressive";
}

export interface Counterargument {
  content: string;
  type: ThoughtType;
  confidence: number;
  targetNodeId: string;
  edgeType: EdgeType;
}

export function generateCounterarguments(
  graph: ThoughtGraph,
  targetNodeId: string,
  options: DevilsAdvocateOptions
): Counterargument[] {
  const targetNode = graph.getNode(targetNodeId);
  if (!targetNode) {
    throw new Error(`Node ${targetNodeId} not found`);
  }

  const counterarguments: Counterargument[] = [];
  const intensityMap = {
    mild: 0.3,
    moderate: 0.5,
    aggressive: 0.7,
  };
  const challengeStrength = intensityMap[options.intensity];

  // Generate counterarguments based on node type and content
  const content = targetNode.content.toLowerCase();
  
  // Universal counterargument templates
  const templates = [
    {
      condition: (content: string) => true,
      templates: [
        "What if the opposite is true? {content}",
        "This assumes that {assumption}, but what if {alternative}?",
        "This perspective might be missing {missing_perspective}",
        "Consider the long-term consequences: {long_term}",
        "What evidence contradicts this? {contradicting_evidence}",
      ],
      type: "critique" as ThoughtType,
    },
    {
      condition: (content: string) => content.includes("should") || content.includes("must"),
      templates: [
        "Who decides what 'should' be done? {stakeholder_perspective}",
        "Alternative approaches exist: {alternatives}",
        "This prescription ignores practical constraints: {constraints}",
      ],
      type: "question" as ThoughtType,
    },
    {
      condition: (content: string) => content.includes("always") || content.includes("never"),
      templates: [
        "Are there exceptions? {exceptions}",
        "This absolute statement ignores nuance: {nuance}",
        "What about edge cases? {edge_cases}",
      ],
      type: "observation" as ThoughtType,
    },
  ];

  const applicableTemplates = templates.filter(t => t.condition(content));
  
  for (let i = 0; i < options.depth; i++) {
    for (const templateGroup of applicableTemplates) {
      const template = templateGroup.templates[
        Math.floor(Math.random() * templateGroup.templates.length)
      ];
      
      // Simple placeholder replacement
      let generated = template
        .replace("{content}", targetNode.content)
        .replace("{assumption}", "certain assumptions hold")
        .replace("{alternative}", "a different factor is at play")
        .replace("{missing_perspective}", "important contextual information")
        .replace("{long_term}", "unintended side effects may emerge")
        .replace("{contradicting_evidence}", "some studies suggest otherwise")
        .replace("{stakeholder_perspective}", "different stakeholders may have different priorities")
        .replace("{alternatives}", "other viable options exist")
        .replace("{constraints}", "resource limitations, timing issues")
        .replace("{exceptions}", "historical precedents show variability")
        .replace("{nuance}", "context-dependent factors")
        .replace("{edge_cases}", "rare but important scenarios");

      counterarguments.push({
        content: generated,
        type: templateGroup.type,
        confidence: Math.max(0.1, targetNode.confidence - challengeStrength),
        targetNodeId,
        edgeType: "challenges" as EdgeType,
      });
    }
  }

  return counterarguments;
}

export function applyCounterarguments(
  graph: ThoughtGraph,
  counterarguments: Counterargument[]
): ThoughtNode[] {
  const createdNodes: ThoughtNode[] = [];

  for (const ca of counterarguments) {
    const targetNode = graph.getNode(ca.targetNodeId);
    if (!targetNode) continue;

    const newNode = createNode({
      content: ca.content,
      type: ca.type,
      strategy: targetNode.strategy,
      confidence: ca.confidence,
      parentId: targetNode.id,
      branch: targetNode.metadata.branch,
      tags: [...targetNode.metadata.tags, "counterargument"],
    });

    graph.addNode(newNode);
    addEdge(newNode, ca.targetNodeId, ca.edgeType);
    createdNodes.push(newNode);
  }

  return createdNodes;
}