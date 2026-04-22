import { ThoughtGraph } from "../core/graph.js";
import { ThoughtNode, ThoughtType } from "../core/types.js";
import { createNode, addEdge } from "../core/node.js";

export interface CrossDomainAnalogy {
  sourceDomain: string;
  targetDomain: string;
  mapping: string;
  insight: string;
  confidence: number;
}

export interface DomainKnowledge {
  domain: string;
  keyConcepts: string[];
  principles: string[];
  commonPatterns: string[];
}

const DOMAIN_KNOWLEDGE: Record<string, DomainKnowledge> = {
  biology: {
    domain: "biology",
    keyConcepts: ["evolution", "ecosystem", "homeostasis", "adaptation", "symbiosis"],
    principles: ["survival of the fittest", "energy flow", "information encoding in DNA"],
    commonPatterns: ["feedback loops", "hierarchical organization", "emergence"],
  },
  economics: {
    domain: "economics",
    keyConcepts: ["supply and demand", "incentives", "market equilibrium", "opportunity cost"],
    principles: ["rational choice theory", "marginal utility", "comparative advantage"],
    commonPatterns: ["boom and bust cycles", "network effects", "winner-takes-all markets"],
  },
  physics: {
    domain: "physics",
    keyConcepts: ["conservation laws", "entropy", "force fields", "wave-particle duality"],
    principles: ["least action principle", "uncertainty principle", "relativity"],
    commonPatterns: ["symmetry breaking", "phase transitions", "resonance"],
  },
  psychology: {
    domain: "psychology",
    keyConcepts: ["cognitive biases", "motivation", "learning", "memory"],
    principles: ["Maslow's hierarchy", "social learning theory", "cognitive dissonance"],
    commonPatterns: ["confirmation bias", "groupthink", "halo effect"],
  },
  computer_science: {
    domain: "computer_science",
    keyConcepts: ["algorithms", "data structures", "abstraction", "encapsulation"],
    principles: ["divide and conquer", "caching", "parallelism", "recursion"],
    commonPatterns: ["observer pattern", "factory pattern", "publish-subscribe"],
  },
  art: {
    domain: "art",
    keyConcepts: ["composition", "contrast", "harmony", "narrative"],
    principles: ["rule of thirds", "color theory", "visual hierarchy"],
    commonPatterns: ["call and response", "variation on a theme", "foreshadowing"],
  },
};

export function generateCrossDomainAnalogies(
  sourceDomains: string[],
  targetProblem: string,
  maxAnalogies: number = 3
): CrossDomainAnalogy[] {
  const analogies: CrossDomainAnalogy[] = [];
  
  for (const sourceDomain of sourceDomains) {
    const knowledge = DOMAIN_KNOWLEDGE[sourceDomain];
    if (!knowledge) continue;

    for (const principle of knowledge.principles.slice(0, 2)) {
      for (const pattern of knowledge.commonPatterns.slice(0, 2)) {
        const mapping = `Apply ${principle} from ${sourceDomain} to ${targetProblem}`;
        const insight = `In ${sourceDomain}, ${pattern} suggests that ${targetProblem} might exhibit similar patterns.`;
        
        analogies.push({
          sourceDomain,
          targetDomain: targetProblem,
          mapping,
          insight,
          confidence: 0.6 + Math.random() * 0.3, // 0.6-0.9
        });

        if (analogies.length >= maxAnalogies) {
          return analogies;
        }
      }
    }
  }

  return analogies;
}

export function applyAnalogiesToGraph(
  graph: ThoughtGraph,
  analogies: CrossDomainAnalogy[],
  parentNodeId?: string
): ThoughtNode[] {
  const createdNodes: ThoughtNode[] = [];
  const parentNode = parentNodeId ? graph.getNode(parentNodeId) : null;

  for (const analogy of analogies) {
    const content = `Analogy from ${analogy.sourceDomain}: ${analogy.mapping}\nInsight: ${analogy.insight}`;
    
    const newNode = createNode({
      content,
      type: "insight" as ThoughtType,
      strategy: "analogical",
      confidence: analogy.confidence,
      parentId: parentNode?.id || null,
      branch: parentNode?.metadata.branch || "main",
      tags: [...(parentNode?.metadata.tags || []), "cross_domain", analogy.sourceDomain],
    });

    // Add cross-domain reference
    newNode.crossDomainReferences = [{
      sourceDomain: analogy.sourceDomain,
      targetDomain: analogy.targetDomain,
      mapping: analogy.mapping,
      insight: analogy.insight,
      relevance: analogy.confidence,
    }];

    graph.addNode(newNode);
    
    if (parentNode) {
      addEdge(newNode, parentNode.id, "parallels");
    }

    createdNodes.push(newNode);
  }

  return createdNodes;
}