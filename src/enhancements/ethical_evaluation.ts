import { ThoughtGraph } from "../core/graph.js";
import { ThoughtNode, EthicalEvaluation } from "../core/types.js";

export interface EthicalFramework {
  name: string;
  description: string;
  keyQuestions: string[];
  evaluationMethod: (content: string) => string;
}

export const ETHICAL_FRAMEWORKS: Record<string, EthicalFramework> = {
  deontological: {
    name: "deontological",
    description: "Duty-based ethics focusing on rules, obligations, and rights",
    keyQuestions: [
      "Does this action respect universal moral rules?",
      "Are people being treated as ends in themselves, not merely as means?",
      "Would this action be acceptable if everyone did it?",
    ],
    evaluationMethod: (content: string) => {
      const lower = content.toLowerCase();
      let score = 0.5;
      let reasoning = "";

      if (lower.includes("right") || lower.includes("duty") || lower.includes("obligation")) {
        score += 0.2;
        reasoning += "Content mentions duties/rights. ";
      }

      if (lower.includes("everyone") || lower.includes("universal")) {
        score += 0.1;
        reasoning += "Considers universal applicability. ";
      }

      if (lower.includes("use") && lower.includes("people")) {
        score -= 0.2;
        reasoning += "Possible instrumentalization of people. ";
      }

      return `Deontological assessment: ${(score * 100).toFixed(0)}% alignment.\n${reasoning}`;
    },
  },

  consequentialist: {
    name: "consequentialist",
    description: "Outcome-based ethics focusing on consequences and utility",
    keyQuestions: [
      "Does this action maximize overall happiness/utility?",
      "What are the long-term consequences?",
      "Who benefits and who suffers?",
    ],
    evaluationMethod: (content: string) => {
      const lower = content.toLowerCase();
      let score = 0.5;
      let reasoning = "";

      if (lower.includes("benefit") || lower.includes("improve") || lower.includes("help")) {
        score += 0.2;
        reasoning += "Focuses on positive outcomes. ";
      }

      if (lower.includes("cost") || lower.includes("harm") || lower.includes("suffer")) {
        score += 0.1;
        reasoning += "Acknowledges potential harms. ";
      }

      if (lower.includes("long-term") || lower.includes("future")) {
        score += 0.1;
        reasoning += "Considers long-term consequences. ";
      }

      return `Consequentialist assessment: ${(score * 100).toFixed(0)}% alignment.\n${reasoning}`;
    },
  },

  virtue: {
    name: "virtue",
    description: "Character-based ethics focusing on virtues and moral character",
    keyQuestions: [
      "Does this action demonstrate virtues like courage, wisdom, justice?",
      "What would a virtuous person do?",
      "Does this action help develop good character?",
    ],
    evaluationMethod: (content: string) => {
      const lower = content.toLowerCase();
      let score = 0.5;
      let reasoning = "";
      const virtues = ["courage", "wisdom", "justice", "compassion", "honesty", "integrity"];

      virtues.forEach(virtue => {
        if (lower.includes(virtue)) {
          score += 0.1;
          reasoning += `Mentions ${virtue}. `;
        }
      });

      if (lower.includes("character") || lower.includes("virtue")) {
        score += 0.1;
        reasoning += "Explicitly considers virtue ethics. ";
      }

      return `Virtue ethics assessment: ${(score * 100).toFixed(0)}% alignment.\n${reasoning}`;
    },
  },

  rights_based: {
    name: "rights_based",
    description: "Rights-based ethics focusing on fundamental human rights",
    keyQuestions: [
      "Does this action respect human dignity?",
      "Are fundamental rights being protected?",
      "Does this action infringe on anyone's rights?",
    ],
    evaluationMethod: (content: string) => {
      const lower = content.toLowerCase();
      let score = 0.5;
      let reasoning = "";
      const rights = ["right", "freedom", "liberty", "dignity", "autonomy", "privacy"];

      rights.forEach(right => {
        if (lower.includes(right)) {
          score += 0.1;
          reasoning += `Mentions ${right}. `;
        }
      });

      if (lower.includes("infringe") || lower.includes("violate")) {
        score -= 0.2;
        reasoning += "Possible rights infringement. ";
      }

      return `Rights-based assessment: ${(score * 100).toFixed(0)}% alignment.\n${reasoning}`;
    },
  },
};

export function evaluateEthically(
  graph: ThoughtGraph,
  nodeId: string,
  frameworks: string[] = ["deontological", "consequentialist", "virtue", "rights_based"]
): EthicalEvaluation[] {
  const node = graph.getNode(nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
  }

  const evaluations: EthicalEvaluation[] = [];

  for (const frameworkName of frameworks) {
    const framework = ETHICAL_FRAMEWORKS[frameworkName];
    if (!framework) continue;

    const assessment = framework.evaluationMethod(node.content);
    const alignmentScore = 0.5 + Math.random() * 0.3; // Placeholder

    const concerns: string[] = [];
    if (alignmentScore < 0.6) {
      concerns.push(`Potential ${frameworkName} concern detected`);
    }

    evaluations.push({
      framework: frameworkName as any,
      assessment,
      alignmentScore,
      concerns,
    });
  }

  return evaluations;
}

export function applyEthicalEvaluation(
  node: ThoughtNode,
  evaluations: EthicalEvaluation[]
): void {
  node.ethicalConsiderations = evaluations;
}