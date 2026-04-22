import { EmotionType } from "../core/types.js";

export interface EmotionalAnalysis {
  primaryEmotion: EmotionType;
  secondaryEmotions: EmotionType[];
  emotionalIntensity: number; // 0-1
  sentimentScore: number; // -1 to 1
  empathyScore: number; // 0-1
  persuasionScore: number; // 0-1
  stakeholderAnalysis: StakeholderEmotion[];
  recommendations: string[];
}

export interface StakeholderEmotion {
  stakeholder: string;
  likelyEmotion: EmotionType;
  intensity: number;
  reasoning: string;
}

export interface ContextFactors {
  context: string;
  powerDynamics: string[];
  culturalNorms: string[];
  relationshipHistory: string;
}

const EMOTION_KEYWORDS: Record<EmotionType, string[]> = {
  neutral: ["neutral", "objective", "factual", "balanced"],
  curious: ["curious", "inquiring", "exploring", "questioning"],
  skeptical: ["skeptical", "doubt", "question", "uncertain"],
  confident: ["confident", "certain", "sure", "convincing"],
  concerned: ["concerned", "worried", "anxious", "apprehensive"],
  optimistic: ["optimistic", "hopeful", "positive", "encouraging"],
  pessimistic: ["pessimistic", "negative", "doubtful", "cynical"],
  analytical: ["analytical", "logical", "reasoned", "systematic"],
  creative: ["creative", "innovative", "imaginative", "novel"],
  critical: ["critical", "critique", "flaw", "weakness"],
};

const CONTEXT_PROFILES: Record<string, ContextFactors> = {
  "team meeting": {
    context: "team meeting",
    powerDynamics: ["hierarchical", "collaborative", "competitive"],
    culturalNorms: ["professional", "respectful", "results-oriented"],
    relationshipHistory: "ongoing collaboration",
  },
  "customer feedback": {
    context: "customer feedback",
    powerDynamics: ["service provider", "customer relationship", "asymmetrical"],
    culturalNorms: ["customer-centric", "solution-oriented", "empathetic"],
    relationshipHistory: "transactional",
  },
  "crisis situation": {
    context: "crisis situation",
    powerDynamics: ["urgent", "high-stakes", "centralized decision-making"],
    culturalNorms: ["action-oriented", "clear communication", "calm"],
    relationshipHistory: "stressful",
  },
  "academic discussion": {
    context: "academic discussion",
    powerDynamics: ["peer-based", "knowledge hierarchy", "meritocratic"],
    culturalNorms: ["evidence-based", "rigorous", "constructive criticism"],
    relationshipHistory: "intellectual",
  },
};

export function analyzeEmotionalIntelligence(
  text: string,
  context?: string,
  perspectiveTaking: number = 0.7
): EmotionalAnalysis {
  const lowerText = text.toLowerCase();
  
  // Detect primary emotion
  let primaryEmotion: EmotionType = "neutral";
  let maxScore = 0;
  
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        score += 1;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      primaryEmotion = emotion as EmotionType;
    }
  }

  // Detect secondary emotions
  const secondaryEmotions: EmotionType[] = [];
  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    if (emotion === primaryEmotion) continue;
    let score = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        score += 1;
      }
    }
    if (score > 0) {
      secondaryEmotions.push(emotion as EmotionType);
    }
  }

  // Calculate sentiment (simple)
  const positiveWords = ["good", "great", "excellent", "positive", "benefit", "success"];
  const negativeWords = ["bad", "poor", "negative", "problem", "failure", "risk"];
  let sentiment = 0;
  positiveWords.forEach(w => { if (lowerText.includes(w)) sentiment += 0.1; });
  negativeWords.forEach(w => { if (lowerText.includes(w)) sentiment -= 0.1; });
  sentiment = Math.max(-1, Math.min(1, sentiment));

  // Contextual analysis
  const contextFactors = context ? CONTEXT_PROFILES[context] : undefined;
  const stakeholderAnalysis: StakeholderEmotion[] = [];

  if (contextFactors) {
    // Simulate stakeholder emotions based on context
    const stakeholders = ["leader", "participants", "affected parties"];
    stakeholders.forEach(stakeholder => {
      stakeholderAnalysis.push({
        stakeholder,
        likelyEmotion: primaryEmotion,
        intensity: 0.5 + Math.random() * 0.5,
        reasoning: `Based on context ${contextFactors.context} and power dynamics`,
      });
    });
  }

  // Calculate empathy score
  const empathyIndicators = ["understand", "perspective", "feel", "experience", "empathize"];
  let empathyScore = 0.3; // baseline
  empathyIndicators.forEach(indicator => {
    if (lowerText.includes(indicator)) {
      empathyScore += 0.1;
    }
  });
  empathyScore = Math.min(1, empathyScore * perspectiveTaking);

  // Calculate persuasion score
  const persuasionIndicators = ["should", "must", "recommend", "suggest", "propose", "convince"];
  let persuasionScore = 0.3;
  persuasionIndicators.forEach(indicator => {
    if (lowerText.includes(indicator)) {
      persuasionScore += 0.1;
    }
  });

  // Generate recommendations
  const recommendations: string[] = [];
  if (empathyScore < 0.5) {
    recommendations.push("Consider adding more perspective-taking language");
  }
  if (sentiment < -0.3) {
    recommendations.push("Balance negative points with potential solutions");
  }
  if (primaryEmotion === "critical" && secondaryEmotions.includes("optimistic")) {
    recommendations.push("Good balance of critique and optimism");
  }

  return {
    primaryEmotion,
    secondaryEmotions,
    emotionalIntensity: maxScore / 5, // normalize
    sentimentScore: sentiment,
    empathyScore,
    persuasionScore,
    stakeholderAnalysis,
    recommendations,
  };
}