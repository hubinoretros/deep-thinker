import { ThoughtGraph } from "../core/graph.js";
import { ThoughtNode, SocialImpactAnalysis, EmotionType, EthicalEvaluation } from "../core/types.js";
import { analyzeEmotionalIntelligence } from "./emotional_intelligence.js";
import { evaluateEthically } from "./ethical_evaluation.js";

export interface SocialImpactAssessment {
  nodeId: string;
  stakeholderAnalyses: StakeholderAnalysis[];
  groupCohesionScore: number; // 0-1
  persuasionEffectiveness: number; // 0-1
  ethicalAlignment: EthicalEvaluation[];
  recommendations: string[];
}

export interface StakeholderAnalysis {
  stakeholder: string;
  likelyEmotion: EmotionType;
  impact: "positive" | "neutral" | "negative";
  intensity: number; // 0-1
  concerns: string[];
  suggestedCommunication: string;
}

export function analyzeSocialImpact(
  graph: ThoughtGraph,
  nodeId: string,
  stakeholders: string[] = ["customers", "employees", "investors", "community"]
): SocialImpactAssessment {
  const node = graph.getNode(nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }

  // Analyze emotional impact on stakeholders
  const stakeholderAnalyses: StakeholderAnalysis[] = stakeholders.map(stakeholder => {
    const { likelyEmotion, intensity } = estimateStakeholderEmotion(node, stakeholder);
    const impact = assessImpact(node, stakeholder);
    const concerns = identifyConcerns(node, stakeholder);
    const suggestedCommunication = suggestCommunication(node, stakeholder, likelyEmotion);

    return {
      stakeholder,
      likelyEmotion,
      impact,
      intensity,
      concerns,
      suggestedCommunication,
    };
  });

  // Calculate group cohesion score
  const groupCohesionScore = calculateGroupCohesion(stakeholderAnalyses);

  // Estimate persuasion effectiveness
  const persuasionEffectiveness = estimatePersuasionEffectiveness(node, stakeholderAnalyses);

  // Ethical alignment
  const ethicalAlignment = evaluateEthically(graph, nodeId);

  // Generate recommendations
  const recommendations = generateRecommendations(stakeholderAnalyses, groupCohesionScore);

  return {
    nodeId,
    stakeholderAnalyses,
    groupCohesionScore,
    persuasionEffectiveness,
    ethicalAlignment,
    recommendations,
  };
}

function estimateStakeholderEmotion(node: ThoughtNode, stakeholder: string): { likelyEmotion: EmotionType; intensity: number } {
  const content = node.content.toLowerCase();
  const stakeholderLower = stakeholder.toLowerCase();

  // Simple heuristic mapping
  if (content.includes("benefit") || content.includes("improve")) {
    return { likelyEmotion: "optimistic", intensity: 0.7 };
  }

  if (content.includes("cost") || content.includes("cut") || content.includes("reduce")) {
    if (stakeholderLower.includes("employee")) {
      return { likelyEmotion: "concerned", intensity: 0.8 };
    }
    if (stakeholderLower.includes("investor")) {
      return { likelyEmotion: "analytical", intensity: 0.6 };
    }
  }

  if (content.includes("innovative") || content.includes("new")) {
    return { likelyEmotion: "curious", intensity: 0.7 };
  }

  if (content.includes("risk") || content.includes("danger")) {
    return { likelyEmotion: "concerned", intensity: 0.9 };
  }

  return { likelyEmotion: "neutral", intensity: 0.5 };
}

function assessImpact(node: ThoughtNode, stakeholder: string): "positive" | "neutral" | "negative" {
  const content = node.content.toLowerCase();
  const stakeholderLower = stakeholder.toLowerCase();

  if (stakeholderLower.includes("customer")) {
    if (content.includes("better") || content.includes("cheaper") || content.includes("improved")) {
      return "positive";
    }
    if (content.includes("price increase") || content.includes("worse")) {
      return "negative";
    }
  }

  if (stakeholderLower.includes("employee")) {
    if (content.includes("more resources") || content.includes("training") || content.includes("promotion")) {
      return "positive";
    }
    if (content.includes("layoff") || content.includes("cut") || content.includes("reduce")) {
      return "negative";
    }
  }

  if (stakeholderLower.includes("investor")) {
    if (content.includes("profit") || content.includes("growth") || content.includes("efficiency")) {
      return "positive";
    }
    if (content.includes("loss") || content.includes("decline")) {
      return "negative";
    }
  }

  return "neutral";
}

function identifyConcerns(node: ThoughtNode, stakeholder: string): string[] {
  const concerns: string[] = [];
  const content = node.content.toLowerCase();
  const stakeholderLower = stakeholder.toLowerCase();

  if (stakeholderLower.includes("community")) {
    if (content.includes("environment") || content.includes("pollution")) {
      concerns.push("Environmental impact");
    }
    if (content.includes("noise") || content.includes("traffic")) {
      concerns.push("Quality of life disruption");
    }
  }

  if (stakeholderLower.includes("employee")) {
    if (content.includes("change") || content.includes("new system")) {
      concerns.push("Adaptation stress");
    }
  }

  if (content.includes("uncertain") || content.includes("unknown")) {
    concerns.push("Lack of clarity");
  }

  return concerns;
}

function suggestCommunication(node: ThoughtNode, stakeholder: string, emotion: EmotionType): string {
  const stakeholderLower = stakeholder.toLowerCase();

  if (emotion === "concerned") {
    return "Address concerns directly with transparent data and mitigation plans";
  }

  if (emotion === "optimistic") {
    return "Highlight benefits while managing expectations";
  }

  if (stakeholderLower.includes("customer")) {
    return "Focus on customer value and problem-solving";
  }

  if (stakeholderLower.includes("employee")) {
    return "Emphasize team impact and support structures";
  }

  if (stakeholderLower.includes("investor")) {
    return "Present with data, ROI analysis, and risk assessment";
  }

  return "Use clear, factual communication tailored to audience";
}

function calculateGroupCohesion(analyses: StakeholderAnalysis[]): number {
  // Simple cohesion calculation based on emotion alignment
  const positiveEmotions: EmotionType[] = ["optimistic", "confident", "curious"];
  const negativeEmotions: EmotionType[] = ["concerned", "pessimistic", "skeptical"];

  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  analyses.forEach(a => {
    if (positiveEmotions.includes(a.likelyEmotion)) positiveCount++;
    else if (negativeEmotions.includes(a.likelyEmotion)) negativeCount++;
    else neutralCount++;
  });

  const total = analyses.length;
  const alignmentScore = positiveCount / total;
  const conflictScore = negativeCount / total;

  // Higher cohesion when emotions align positively
  return 0.5 + (alignmentScore * 0.5) - (conflictScore * 0.3);
}

function estimatePersuasionEffectiveness(node: ThoughtNode, analyses: StakeholderAnalysis[]): number {
  let baseScore = 0.5;

  // Content factors
  const content = node.content.toLowerCase();
  if (content.includes("evidence") || content.includes("data")) baseScore += 0.1;
  if (content.includes("benefit") || content.includes("value")) baseScore += 0.1;
  if (content.includes("risk") && content.includes("mitigate")) baseScore += 0.1;

  // Stakeholder alignment
  const alignedStakeholders = analyses.filter(a => a.impact === "positive").length;
  const totalStakeholders = analyses.length;
  const alignmentRatio = alignedStakeholders / totalStakeholders;
  baseScore += alignmentRatio * 0.2;

  return Math.min(0.95, Math.max(0.2, baseScore));
}

function generateRecommendations(analyses: StakeholderAnalysis[], cohesionScore: number): string[] {
  const recommendations: string[] = [];

  if (cohesionScore < 0.6) {
    recommendations.push("Consider addressing stakeholder concerns before implementation");
  }

  const concernedStakeholders = analyses.filter(a => a.likelyEmotion === "concerned");
  if (concernedStakeholders.length > 0) {
    recommendations.push(`Engage with ${concernedStakeholders.map(s => s.stakeholder).join(", ")} to understand concerns`);
  }

  const highImpactNegative = analyses.filter(a => a.impact === "negative" && a.intensity > 0.7);
  if (highImpactNegative.length > 0) {
    recommendations.push("Develop mitigation strategies for negatively impacted stakeholders");
  }

  if (analyses.some(a => a.impact === "positive")) {
    recommendations.push("Leverage positive impacts to build support");
  }

  return recommendations;
}