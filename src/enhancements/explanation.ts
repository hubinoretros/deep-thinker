import { ThoughtGraph } from "../core/graph.js";
import { ThoughtNode } from "../core/types.js";

export interface DecisionExplanation {
  decisionNodeId: string;
  contributingFactors: ContributingFactor[];
  alternativePaths: AlternativePath[];
  counterfactualScenarios: CounterfactualScenario[];
  confidenceExplanation: string;
  recommendation: string;
}

export interface ContributingFactor {
  factor: string;
  influence: number; // 0-1
  reasoning: string;
}

export interface AlternativePath {
  description: string;
  confidence: number;
  whyNotChosen: string;
}

export interface CounterfactualScenario {
  whatIf: string;
  likelyOutcome: string;
  confidenceImpact: number; // -1 to 1
}

export function explainDecision(
  graph: ThoughtGraph,
  nodeId: string,
  detailLevel: "simple" | "detailed" | "technical" = "detailed",
  includeCounterfactuals: boolean = true
): DecisionExplanation {
  const decisionNode = graph.getNode(nodeId);
  if (!decisionNode) {
    throw new Error(`Node ${nodeId} not found`);
  }

  // Get the path that led to this decision (trace back through parents)
  const path: ThoughtNode[] = [decisionNode];
  let currentNode: ThoughtNode | null = decisionNode;
  
  while (currentNode?.parentId) {
    const parent = graph.getNode(currentNode.parentId);
    if (parent) {
      path.unshift(parent);
      currentNode = parent;
    } else {
      break;
    }
  }
  
  const parentNodes = path.slice(0, -1); // Exclude the decision node itself

  // Analyze contributing factors
  const contributingFactors: ContributingFactor[] = [];
  
  // Factor 1: Confidence from parents
  if (parentNodes.length > 0) {
    const avgParentConfidence = parentNodes.reduce((sum: number, n: ThoughtNode) => sum + n.confidence, 0) / parentNodes.length;
    contributingFactors.push({
      factor: "Parent node confidence",
      influence: avgParentConfidence,
      reasoning: `Average confidence of ${parentNodes.length} parent nodes`,
    });
  }

  // Factor 2: Strategy used
  contributingFactors.push({
    factor: "Reasoning strategy",
    influence: 0.7,
    reasoning: `Used ${decisionNode.strategy} strategy which ${describeStrategy(decisionNode.strategy)}`,
  });

  // Factor 3: Evidence support
  const supportingEdges = decisionNode.edges.filter(e => e.type === "supports");
  contributingFactors.push({
    factor: "Supporting evidence",
    influence: supportingEdges.length > 0 ? 0.8 : 0.5,
    reasoning: `${supportingEdges.length} supporting connections`,
  });

  // Factor 4: Critique addressed
  if (decisionNode.critique && decisionNode.critique.addressed) {
    contributingFactors.push({
      factor: "Critique addressed",
      influence: 0.9,
      reasoning: "Potential weaknesses were acknowledged and addressed",
    });
  }

  // Alternative paths (siblings)
  const alternativePaths: AlternativePath[] = [];
  if (decisionNode.parentId) {
    const parent = graph.getNode(decisionNode.parentId);
    if (parent) {
      const siblings = parent.childIds
        .map(id => graph.getNode(id))
        .filter((n): n is ThoughtNode => n !== undefined && n !== null && n.id !== nodeId);

      siblings.forEach(sibling => {
        alternativePaths.push({
          description: sibling.content.substring(0, 80),
          confidence: sibling.confidence,
          whyNotChosen: `Lower confidence (${sibling.confidence.toFixed(2)} vs ${decisionNode.confidence.toFixed(2)}) or different focus`,
        });
      });
    }
  }

  // Counterfactual scenarios
  const counterfactualScenarios: CounterfactualScenario[] = [];
  if (includeCounterfactuals) {
    counterfactualScenarios.push({
      whatIf: "Key evidence was incorrect",
      likelyOutcome: "Confidence would drop by 30-50%",
      confidenceImpact: -0.4,
    });

    counterfactualScenarios.push({
      whatIf: "Alternative strategy was used",
      likelyOutcome: "Different perspective might emerge",
      confidenceImpact: -0.2,
    });

    if (decisionNode.confidence > 0.8) {
      counterfactualScenarios.push({
        whatIf: "More data became available",
        likelyOutcome: "Confidence could increase further",
        confidenceImpact: 0.1,
      });
    }
  }

  // Confidence explanation
  let confidenceExplanation = "";
  if (decisionNode.confidence > 0.8) {
    confidenceExplanation = "High confidence due to strong evidence and logical consistency";
  } else if (decisionNode.confidence > 0.6) {
    confidenceExplanation = "Moderate confidence with some areas needing verification";
  } else {
    confidenceExplanation = "Lower confidence indicates uncertainty or conflicting information";
  }

  // Recommendation
  let recommendation = "";
  if (decisionNode.confidence > 0.7 && alternativePaths.length === 0) {
    recommendation = "Proceed with this decision";
  } else if (decisionNode.confidence > 0.7 && alternativePaths.length > 0) {
    recommendation = "Consider this option among alternatives";
  } else {
    recommendation = "Gather more information before finalizing";
  }

  return {
    decisionNodeId: nodeId,
    contributingFactors,
    alternativePaths,
    counterfactualScenarios,
    confidenceExplanation,
    recommendation,
  };
}

function describeStrategy(strategy: string): string {
  const descriptions: Record<string, string> = {
    sequential: "builds step-by-step logic",
    dialectic: "considers opposing views",
    parallel: "explores multiple angles",
    analogical: "draws from similar domains",
    abductive: "infers best explanation",
  };
  return descriptions[strategy] || "provides reasoned approach";
}

export function formatExplanation(
  explanation: DecisionExplanation,
  detailLevel: "simple" | "detailed" | "technical"
): string {
  const lines: string[] = [];

  lines.push(`Decision Explanation: ${explanation.decisionNodeId}`);
  lines.push("=".repeat(60));

  if (detailLevel === "simple") {
    lines.push(`Confidence: ${explanation.confidenceExplanation}`);
    lines.push(`Recommendation: ${explanation.recommendation}`);
    return lines.join("\n");
  }

  lines.push("Contributing Factors:");
  explanation.contributingFactors.forEach(factor => {
    lines.push(`  • ${factor.factor}: ${(factor.influence * 100).toFixed(0)}% influence`);
    if (detailLevel === "detailed") {
      lines.push(`    Reason: ${factor.reasoning}`);
    }
  });

  if (explanation.alternativePaths.length > 0) {
    lines.push("\nAlternative Paths Considered:");
    explanation.alternativePaths.forEach(path => {
      lines.push(`  • ${path.description.substring(0, 60)}...`);
      lines.push(`    Confidence: ${(path.confidence * 100).toFixed(0)}% - ${path.whyNotChosen}`);
    });
  }

  if (explanation.counterfactualScenarios.length > 0) {
    lines.push("\nCounterfactual Scenarios:");
    explanation.counterfactualScenarios.forEach(scenario => {
      lines.push(`  • What if: ${scenario.whatIf}`);
      lines.push(`    Likely: ${scenario.likelyOutcome}`);
    });
  }

  lines.push(`\nConfidence Explanation: ${explanation.confidenceExplanation}`);
  lines.push(`Recommendation: ${explanation.recommendation}`);

  return lines.join("\n");
}