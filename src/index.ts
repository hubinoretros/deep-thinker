#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { ThoughtGraph } from "./core/graph.js";
import { createNode, addEdge, setCritique, updateStatus, addTag, nodeToSummary } from "./core/node.js";
import { resetCounter } from "./core/node.js";
import {
  applySequential,
  applyDialectic,
  applyParallel,
  applyAnalogical,
  applyAbductive,
  applyFirstPrinciples,
  applyCounterfactual,
  applySystemsThinking,
  applyMCTS,
  applyPromptOptimizer,
  selectStrategy,
  type StrategyContext,
  type PromptOptimizerResult,
} from "./core/strategies.js";
import {
  calculateConfidence,
  generateCritique,
  evaluateGraphConfidence,
} from "./core/scorer.js";
import {
  createMetacognitiveState,
  updateMetacognition,
  switchStrategy,
  metacognitiveReport,
  recommendSpecializedStrategy,
  shouldTriggerFirstPrinciples,
  shouldTriggerCounterfactual,
  shouldTriggerSystemsThinking,
  shouldTriggerMCTS,
  shouldOptimizePrompt,
  routeOptimizedPrompt,
  classifyUserIntent,
  createNodeZeroState,
  type PromptOptimizationResult,
} from "./core/metacog.js";
import {
  integrateKnowledge,
  getKnowledgeConfidenceBoost,
  findKnowledgeGaps,
  validateKnowledgeConsistency,
} from "./core/knowledge.js";
import {
  pruneGraph,
  optimizePath,
  prunerReport,
  detectDeadEnds,
  detectRedundantBranches,
} from "./core/pruner.js";
import {
  Strategy,
  ThoughtType,
  EdgeType,
  THOUGHT_TYPE_DESCRIPTIONS,
  STRATEGY_DESCRIPTIONS,
  EDGE_TYPE_DESCRIPTIONS,
  MCPResponse,
  NextAction,
} from "./core/types.js";
import {
  PromptOptimizerInputSchema,
  type PromptOptimizerInput,
  type PromptOptimizerOutput,
} from "./core/schemas.js";

// Enhanced capabilities
import { visualizeAsSVG, visualizeAsASCII } from "./enhancements/visualization.js";
import { generateCounterarguments, applyCounterarguments } from "./enhancements/devils_advocate.js";
import { generateCrossDomainAnalogies, applyAnalogiesToGraph } from "./enhancements/cross_disciplinary.js";
import { projectThoughtTemporally, applyTemporalProjection } from "./enhancements/temporal_projection.js";
import { evaluateEthically, applyEthicalEvaluation } from "./enhancements/ethical_evaluation.js";
import { analyzeEmotionalIntelligence } from "./enhancements/emotional_intelligence.js";
import { explainDecision, formatExplanation } from "./enhancements/explanation.js";
import { analyzeSocialImpact } from "./enhancements/social_impact.js";
import { SessionManager } from "./core/session.js";
import { formatZodError, formatUnknownError } from "./core/errors.js";
import { ZodError } from "zod";

const sessionManager = new SessionManager();

const graph = new ThoughtGraph();
let metaState = createMetacognitiveState("sequential");
let problemStatement: string | null = null;

const server = new Server(
  {
    name: "deep-thinker",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "think",
      description:
        "Add a thought to the cognitive graph using the current strategy. Supports sequential, dialectic, parallel, analogical, and abductive reasoning strategies. Each thought becomes a node in a DAG with confidence scoring, edges, and metadata.",
      inputSchema: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "The thought content",
          },
          type: {
            type: "string",
            enum: ["hypothesis", "analysis", "evidence", "conclusion", "question", "assumption", "insight", "critique", "synthesis", "observation"],
            description: "Type of thought (default: analysis)",
          },
          strategy: {
            type: "string",
            enum: ["sequential", "dialectic", "parallel", "analogical", "abductive", "first_principles", "counterfactual", "systems_thinking", "mcts", "auto"],
            description: "Reasoning strategy to use (default: current strategy from metacognition). Use 'auto' for automatic strategy selection. New strategies: first_principles=deconstruct to fundamentals, counterfactual=what-if analysis, systems_thinking=feedback loops & leverage points, mcts=Monte Carlo tree search for optimization",
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Initial confidence in this thought 0-1 (default: 0.5)",
          },
          parentId: {
            type: "string",
            description: "ID of parent thought to connect to (default: last active leaf)",
          },
          branch: {
            type: "string",
            description: "Branch name for parallel exploration (default: main)",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags for categorizing this thought",
          },
          edgeTo: {
            type: "object",
            properties: {
              targetId: { type: "string", description: "Target node ID" },
              type: {
                type: "string",
                enum: ["derives_from", "contradicts", "supports", "refines", "challenges", "synthesizes", "parallels", "abstracts", "instantiates"],
                description: "Edge type",
              },
            },
            description: "Create an explicit edge to another node",
          },
          dialectic: {
            type: "object",
            properties: {
              thesis: { type: "string", description: "The thesis/proposition" },
              antithesis: { type: "string", description: "The opposing view (optional)" },
              synthesis: { type: "string", description: "The resolution (optional)" },
            },
            description: "Dialectic mode: provide thesis (and optionally antithesis/synthesis)",
          },
          parallel: {
            type: "array",
            items: {
              type: "object",
              properties: {
                content: { type: "string" },
                type: { type: "string" },
                confidence: { type: "number" },
              },
            },
            description: "Parallel mode: multiple independent thoughts to explore simultaneously",
          },
          analogical: {
            type: "object",
            properties: {
              sourceDomain: { type: "string", description: "The known domain to draw analogy from" },
              mapping: { type: "string", description: "How the domains map to each other" },
              projectedConclusion: { type: "string", description: "The projected conclusion from the analogy" },
            },
            description: "Analogical mode: source domain, mapping, and projected conclusion",
          },
          abductive: {
            type: "object",
            properties: {
              observation: { type: "string", description: "The observation to explain" },
              explanations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    content: { type: "string" },
                    plausibility: { type: "number" },
                  },
                },
                description: "Possible explanations with plausibility scores",
              },
              bestExplanation: { type: "string", description: "The best explanation (if determined)" },
            },
            description: "Abductive mode: observation, explanations, and best explanation",
          },
          firstPrinciples: {
            type: "object",
            properties: {
              problem: { type: "string", description: "The problem to deconstruct (default: uses content)" },
              assumptions: { type: "array", items: { type: "string" }, description: "Assumptions to challenge" },
              depth: { type: "number", minimum: 1, maximum: 5, description: "Decomposition depth (default: 3)" },
              domain: { type: "string", description: "Optional domain context (e.g., 'physics', 'economics')" },
            },
            description: "First Principles mode: deconstruct problem to fundamental truths and rebuild",
          },
          counterfactual: {
            type: "object",
            properties: {
              currentState: { type: "string", description: "Description of current state (default: uses content)" },
              variablesToChange: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    variable: { type: "string", description: "Variable name to change" },
                    currentValue: { type: "string", description: "Current value" },
                    hypotheticalValue: { type: "string", description: "Hypothetical value" },
                    impactWeight: { type: "number", minimum: 0, maximum: 1, description: "Impact weight 0-1" },
                  },
                  required: ["variable", "currentValue", "hypotheticalValue"],
                },
                description: "Variables to modify in what-if scenario",
              },
              timeHorizon: { type: "string", enum: ["immediate", "short_term", "medium_term", "long_term"], description: "Time horizon for effects" },
              rippleDepth: { type: "number", minimum: 1, maximum: 5, description: "Number of ripple effect stages (default: 3)" },
            },
            required: ["variablesToChange"],
            description: "Counterfactual mode: what-if analysis with ripple effects",
          },
          systemsThinking: {
            type: "object",
            properties: {
              systemDescription: { type: "string", description: "System description (default: uses content)" },
              boundaries: { type: "array", items: { type: "string" }, description: "System boundaries" },
              components: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: { type: "string", enum: ["stock", "flow", "converter", "connector"] },
                    description: { type: "string" },
                  },
                  required: ["name", "type", "description"],
                },
                description: "System components (min 2 required)",
              },
              timeScale: { type: "string", enum: ["immediate", "short_term", "medium_term", "long_term"], description: "Analysis time scale" },
              focusArea: { type: "string", enum: ["feedback_loops", "leverage_points", "emergence", "resilience", "all"], description: "Analysis focus" },
            },
            required: ["components"],
            description: "Systems Thinking mode: analyze feedback loops and leverage points",
          },
          mcts: {
            type: "object",
            properties: {
              problem: { type: "string", description: "Problem to solve (default: uses content)" },
              possibleActions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "Action identifier" },
                    description: { type: "string", description: "Action description" },
                    estimatedReward: { type: "number", minimum: -1, maximum: 1, description: "Estimated reward -1 to 1" },
                    constraints: { type: "array", items: { type: "string" }, description: "Action constraints" },
                  },
                  required: ["id", "description"],
                },
                description: "Possible actions to evaluate (min 2)",
              },
              simulationDepth: { type: "number", minimum: 1, maximum: 10, description: "Simulation depth (default: 5)" },
              numSimulations: { type: "number", minimum: 10, maximum: 1000, description: "Number of simulations (default: 100)" },
              explorationConstant: { type: "number", minimum: 0.1, maximum: 5, description: "UCB1 exploration constant (default: 1.414)" },
              pruningThreshold: { type: "number", minimum: 0, maximum: 1, description: "Pruning threshold (default: 0.2)" },
            },
            required: ["possibleActions"],
            description: "MCTS mode: Monte Carlo Tree Search for optimal path selection",
          },
          knowledge: {
            type: "object",
            properties: {
              source: { type: "string", description: "Source of the knowledge" },
              content: { type: "string", description: "The knowledge content" },
              relevance: { type: "number", description: "Relevance to this thought (0-1)" },
            },
            description: "Attach external knowledge to this thought",
          },
        },
        required: ["content"],
      },
    },
    {
      name: "evaluate",
      description:
        "Evaluate the thinking process: score confidence, generate critiques, and assess overall graph health. Provides detailed analysis of weak spots and strong reasoning paths.",
      inputSchema: {
        type: "object",
        properties: {
          nodeId: {
            type: "string",
            description: "Specific node ID to evaluate (default: evaluate entire graph)",
          },
          critique: {
            type: "boolean",
            description: "Generate self-critique for the specified node (default: true)",
          },
          findGaps: {
            type: "boolean",
            description: "Find knowledge gaps in the graph (default: false)",
          },
          validateKnowledge: {
            type: "boolean",
            description: "Validate knowledge consistency across nodes (default: false)",
          },
        },
      },
    },
    {
      name: "metacog",
      description:
        "Metacognitive operations: view the current thinking state, get strategy suggestions, switch strategies, and receive guidance on improving reasoning. The system automatically detects stuck states and recommends actions.",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["report", "switch", "auto_update"],
            description: "report=full metacognitive state, switch=change strategy, auto_update=let system analyze and update",
          },
          strategy: {
            type: "string",
            enum: ["sequential", "dialectic", "parallel", "analogical", "abductive", "first_principles", "counterfactual", "systems_thinking", "mcts"],
            description: "New strategy (for switch action). New: first_principles, counterfactual, systems_thinking, mcts",
          },
          reason: {
            type: "string",
            description: "Reason for switching strategy (for switch action)",
          },
        },
        required: ["action"],
      },
    },
    {
      name: "graph",
      description:
        "Query and visualize the thought graph. View the DAG structure, find paths, inspect branches, and get statistics.",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["visualize", "stats", "path", "node", "branches", "best_path", "leaves"],
            description: "visualize=tree view, stats=graph statistics, path=path between nodes, node=inspect specific node, branches=list branches, best_path=optimal reasoning path, leaves=leaf nodes",
          },
          nodeId: {
            type: "string",
            description: "Node ID (for path/node actions)",
          },
          targetId: {
            type: "string",
            description: "Target node ID (for path action)",
          },
        },
        required: ["action"],
      },
    },
    {
      name: "prune",
      description:
        "Prune and optimize the thought graph. Remove dead ends, consolidate redundant branches, and optimize reasoning paths. Helps maintain graph efficiency during deep reasoning.",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["analyze", "prune", "optimize_path", "prune_node"],
            description: "analyze=report without changes, prune=execute pruning, optimize_path=optimize best path, prune_node=prune specific node",
          },
          nodeId: {
            type: "string",
            description: "Node ID to prune (for prune_node action)",
          },
          reason: {
            type: "string",
            description: "Reason for pruning (for prune_node action)",
          },
        },
        required: ["action"],
      },
    },
    {
      name: "reset",
      description:
        "Reset the thought graph and metacognitive state. Start a fresh reasoning session, save current session, or resume a saved session.",
      inputSchema: {
        type: "object",
        properties: {
          problem: {
            type: "string",
            description: "New problem statement for this session",
          },
          save: {
            type: "boolean",
            description: "Save current session before resetting (default: false)",
          },
          saveName: {
            type: "string",
            description: "Name for saved session (required if save: true)",
          },
          resume: {
            type: "string",
            description: "Resume a previously saved session by name",
          },
          listSessions: {
            type: "boolean",
            description: "List all saved sessions",
          },
        },
      },
    },
    {
      name: "visualize_thought_graph",
      description:
        "Generate visual representation of the thought graph as SVG or ASCII. Supports highlighting paths, branches, and confidence levels.",
      inputSchema: {
        type: "object",
        properties: {
          format: {
            type: "string",
            enum: ["svg", "ascii", "tree"],
            description: "Output format (default: ascii)",
          },
          highlightPath: {
            type: "string",
            description: "Optional: highlight path between two node IDs (format: 'fromId-toId')",
          },
          showConfidence: {
            type: "boolean",
            description: "Show confidence scores (default: true)",
          },
        },
      },
    },
    {
      name: "simulate_devils_advocate",
      description:
        "Generate counterarguments and opposing viewpoints for a given thought. Automatically creates antithesis nodes.",
      inputSchema: {
        type: "object",
        properties: {
          nodeId: {
            type: "string",
            description: "Target node ID to challenge",
          },
          depth: {
            type: "number",
            minimum: 1,
            maximum: 5,
            description: "How many levels of counterarguments to generate (default: 2)",
          },
          intensity: {
            type: "string",
            enum: ["mild", "moderate", "aggressive"],
            description: "How strongly to oppose the original thought",
          },
        },
        required: ["nodeId"],
      },
    },
    {
      name: "cross_disciplinary_synthesis",
      description:
        "Combine insights from multiple domains to generate novel perspectives. Creates analogical mappings between domains.",
      inputSchema: {
        type: "object",
        properties: {
          sourceDomains: {
            type: "array",
            items: { type: "string" },
            description: "List of domains to draw analogies from (e.g., ['biology', 'economics', 'art'])",
          },
          targetProblem: {
            type: "string",
            description: "The problem to apply cross-domain insights to",
          },
          maxAnalogies: {
            type: "number",
            minimum: 1,
            maximum: 10,
            description: "Maximum number of analogies to generate (default: 3)",
          },
        },
        required: ["sourceDomains", "targetProblem"],
      },
    },
    {
      name: "temporal_projection",
      description:
        "Project thoughts into future or past scenarios. Analyze how conclusions change over time.",
      inputSchema: {
        type: "object",
        properties: {
          nodeId: {
            type: "string",
            description: "Root node ID to project from",
          },
          years: {
            type: "number",
            description: "Number of years forward (positive) or backward (negative) to project",
          },
          scenario: {
            type: "string",
            enum: ["optimistic", "pessimistic", "realistic", "disruptive"],
            description: "Scenario type (default: realistic)",
          },
        },
        required: ["nodeId", "years"],
      },
    },
    {
      name: "ethical_framework_evaluation",
      description:
        "Evaluate a thought or decision through multiple ethical frameworks (deontological, consequentialist, virtue ethics, rights-based).",
      inputSchema: {
        type: "object",
        properties: {
          nodeId: {
            type: "string",
            description: "Node ID to evaluate ethically",
          },
          frameworks: {
            type: "array",
            items: { type: "string", enum: ["deontological", "consequentialist", "virtue", "rights_based"] },
            description: "Which frameworks to apply (default: all)",
          },
        },
        required: ["nodeId"],
      },
    },
    {
      name: "emotional_intelligence_analysis",
      description:
        "Analyze emotional tone, stakeholder emotions, and social dynamics of thoughts. Provides empathy and persuasion insights.",
      inputSchema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Text to analyze for emotional content",
          },
          context: {
            type: "string",
            description: "Optional context (e.g., 'team meeting', 'customer feedback', 'crisis situation')",
          },
          perspectiveTaking: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Level of perspective-taking to apply (0=none, 1=full) (default: 0.7)",
          },
        },
        required: ["text"],
      },
    },
    {
      name: "explain_decision",
      description:
        "Generate human-understandable explanation of a decision path. Shows which factors contributed most and why.",
      inputSchema: {
        type: "object",
        properties: {
          nodeId: {
            type: "string",
            description: "Decision/conclusion node ID to explain",
          },
          detailLevel: {
            type: "string",
            enum: ["simple", "detailed", "technical"],
            description: "Explanation depth (default: detailed)",
          },
          includeCounterfactuals: {
            type: "boolean",
            description: "Show what would change if key factors were different (default: true)",
          },
        },
        required: ["nodeId"],
      },
    },
    {
      name: "social_impact_analysis",
      description:
        "Analyze social impact, stakeholder emotions, group cohesion, and persuasion effectiveness of a thought or decision.",
      inputSchema: {
        type: "object",
        properties: {
          nodeId: {
            type: "string",
            description: "Node ID to analyze for social impact",
          },
          stakeholders: {
            type: "array",
            items: { type: "string" },
            description: "List of stakeholder groups (e.g., ['customers', 'employees', 'investors', 'community'])",
          },
        },
        required: ["nodeId"],
      },
    },
    {
      name: "optimize_prompt",
      description:
        "Node Zero (PromptOptimizer): Transform vague/raw prompts into optimized Super Prompts with routing recommendations. Entry point for the reasoning DAG.",
      inputSchema: {
        type: "object",
        properties: {
          originalPrompt: {
            type: "string",
            description: "User's raw, potentially vague or incomplete prompt",
          },
          userContext: {
            type: "object",
            properties: {
              expertiseLevel: {
                type: "string",
                enum: ["novice", "intermediate", "expert"],
                description: "User's expertise level",
              },
              domainKnowledge: {
                type: "array",
                items: { type: "string" },
                description: "Known domains/topics",
              },
              preferences: {
                type: "object",
                properties: {
                  verbosity: {
                    type: "string",
                    enum: ["concise", "balanced", "verbose"],
                  },
                  technicalDepth: {
                    type: "string",
                    enum: ["high_level", "moderate", "deep"],
                  },
                  includeCode: {
                    type: "boolean",
                  },
                },
              },
            },
          },
          conversationHistory: {
            type: "array",
            items: {
              type: "object",
              properties: {
                role: { type: "string", enum: ["user", "assistant", "system"] },
                content: { type: "string" },
              },
            },
            description: "Previous messages for context (max 20)",
          },
          optimizationLevel: {
            type: "string",
            enum: ["light", "standard", "aggressive"],
            description: "How aggressively to optimize the prompt",
            default: "standard",
          },
          targetModel: {
            type: "string",
            enum: ["claude", "gpt4", "gpt35", "local", "generic"],
            description: "Target LLM for prompt tailoring",
            default: "generic",
          },
          autoRoute: {
            type: "boolean",
            description: "Automatically route to recommended strategy after optimization",
            default: false,
          },
        },
        required: ["originalPrompt"],
      },
    },
    {
      name: "help",
      description: "Discover deep-thinker tools and learn usage workflows. Shows tools grouped by category with quick-start examples.",
      inputSchema: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["all", "core", "advanced", "workflow"],
            description: "Category to display (default: all)",
          },
        },
      },
    },
    {
      name: "conclude",
      description: "Analyze the entire thought graph and produce a comprehensive summary-conclusion with action items and graph health report.",
      inputSchema: {
        type: "object",
        properties: {
          detailLevel: {
            type: "string",
            enum: ["brief", "detailed", "technical"],
            description: "Summary detail level (default: detailed)",
          },
          includeCounterfactuals: {
            type: "boolean",
            description: "Include counterfactual analysis (default: false)",
          },
          format: {
            type: "string",
            enum: ["prose", "structured", "executive"],
            description: "Output format (default: structured)",
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments ?? {};

  try {
    switch (toolName) {
      case "think":
        return handleThink(args);
      case "evaluate":
        return handleEvaluate(args);
      case "metacog":
        return handleMetacog(args);
      case "graph":
        return handleGraph(args);
      case "prune":
        return handlePrune(args);
      case "reset":
        return handleReset(args);
      case "visualize_thought_graph":
        return handleVisualizeThoughtGraph(args);
      case "simulate_devils_advocate":
        return handleSimulateDevilsAdvocate(args);
      case "cross_disciplinary_synthesis":
        return handleCrossDisciplinarySynthesis(args);
      case "temporal_projection":
        return handleTemporalProjection(args);
      case "ethical_framework_evaluation":
        return handleEthicalFrameworkEvaluation(args);
      case "emotional_intelligence_analysis":
        return handleEmotionalIntelligenceAnalysis(args);
      case "explain_decision":
        return handleExplainDecision(args);
      case "social_impact_analysis":
        return handleSocialImpactAnalysis(args);
      case "optimize_prompt":
        return handleOptimizePrompt(args);
      case "help":
        return handleHelp(args);
      case "conclude":
        return handleConclude(args);
      default:
        return { content: [{ type: "text", text: `Unknown tool: ${toolName}` }], isError: true };
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const friendly = formatZodError(error, toolName);
      return {
        content: [{ type: "text", text: JSON.stringify(friendly, null, 2) }],
        isError: true,
      };
    }
    const friendly = formatUnknownError(error, toolName);
    return {
      content: [{ type: "text", text: JSON.stringify(friendly, null, 2) }],
      isError: true,
    };
  }
});

function _getLastLeafId(): string | null {
  const leaves = graph.getLeaves();
  if (leaves.length === 0) {
    const roots = graph.getRoots();
    return roots.length > 0 ? roots[roots.length - 1].id : null;
  }
  return leaves[leaves.length > 1 ? leaves.length - 1 : 0].id;
}

function _resolveNodeId(rawId: string): string | null {
  return graph.resolveNodeId(rawId);
}

function _nodeNotFoundResponse(rawId: string) {
  return {
    content: [{
      type: "text" as const,
      text: JSON.stringify({
        status: "error",
        error: "NODE_NOT_FOUND",
        provided: rawId,
        hint: 'Geçerli alias\'lar: "last", "best", "root" veya graph aracıyla node ID alın',
      }),
    }],
    isError: true,
  };
}

function handleThink(args: Record<string, unknown>) {
  const content = args.content as string;
  const rawStrategy = (args.strategy as Strategy) || metaState.currentStrategy;
  const strategy: Strategy = (rawStrategy === "auto" || rawStrategy === undefined)
    ? selectStrategy(content, graph.getContext())
    : rawStrategy;
  const type = (args.type as ThoughtType) || "analysis";
  const confidence = (args.confidence as number) ?? 0.5;
  const rawParentId = args.parentId as string | undefined;
  const parentId = rawParentId ? (_resolveNodeId(rawParentId) || rawParentId) : (args.parentId === undefined ? _getLastLeafId() : null);
  const branch = (args.branch as string) || "main";
  const tags = (args.tags as string[]) || [];
  const edgeTo = args.edgeTo as { targetId: string; type: EdgeType } | undefined;
  const knowledge = args.knowledge as { source: string; content: string; relevance: number } | undefined;

  if (!problemStatement && graph.getRoots().length === 0) {
    problemStatement = content;
  }

  const ctx: StrategyContext = {
    graph,
    currentStrategy: strategy,
    problem: problemStatement || "",
    parentNodeId: parentId,
    branch,
    tags,
  };

  let result;

  if (args.dialectic && strategy === "dialectic") {
    const d = args.dialectic as { thesis: string; antithesis?: string; synthesis?: string };
    result = applyDialectic(ctx, d.thesis || content, d.antithesis ?? null, d.synthesis ?? null, confidence);
  } else if (args.parallel && strategy === "parallel") {
    const p = args.parallel as Array<{ content: string; type: string; confidence: number }>;
    result = applyParallel(
      ctx,
      p.map((item) => ({
        content: item.content,
        type: (item.type as ThoughtType) || "analysis",
        confidence: item.confidence ?? 0.5,
      }))
    );
  } else if (args.analogical && strategy === "analogical") {
    const a = args.analogical as { sourceDomain: string; mapping: string; projectedConclusion: string };
    result = applyAnalogical(ctx, a.sourceDomain, a.mapping, a.projectedConclusion, confidence);
  } else if (args.abductive && strategy === "abductive") {
    const ab = args.abductive as {
      observation: string;
      explanations: Array<{ content: string; plausibility: number }>;
      bestExplanation?: string;
    };
    result = applyAbductive(ctx, ab.observation, ab.explanations, ab.bestExplanation ?? null, confidence);
  } else if (args.firstPrinciples && strategy === "first_principles") {
    const fp = args.firstPrinciples as {
      problem: string;
      assumptions?: string[];
      depth?: number;
      domain?: string;
    };
    result = applyFirstPrinciples(ctx, {
      problem: fp.problem || content,
      assumptions: fp.assumptions || [],
      depth: fp.depth || 3,
      domain: fp.domain,
    });
  } else if (args.counterfactual && strategy === "counterfactual") {
    const cf = args.counterfactual as {
      currentState: string;
      variablesToChange: Array<{
        variable: string;
        currentValue: string | number | boolean;
        hypotheticalValue: string | number | boolean;
        impactWeight?: number;
      }>;
      timeHorizon?: "immediate" | "short_term" | "medium_term" | "long_term";
      rippleDepth?: number;
    };
    // Ensure all variables have impactWeight with default
    const variablesWithDefaults = (cf.variablesToChange || []).map(v => ({
      ...v,
      impactWeight: v.impactWeight ?? 0.5,
    }));
    result = applyCounterfactual(ctx, {
      currentState: cf.currentState || content,
      variablesToChange: variablesWithDefaults,
      timeHorizon: cf.timeHorizon || "short_term",
      rippleDepth: cf.rippleDepth || 3,
    });
  } else if (args.systemsThinking && strategy === "systems_thinking") {
    const st = args.systemsThinking as {
      systemDescription: string;
      boundaries?: string[];
      components: Array<{
        name: string;
        type: "stock" | "flow" | "converter" | "connector";
        description: string;
      }>;
      timeScale?: "immediate" | "short_term" | "medium_term" | "long_term";
      focusArea?: "feedback_loops" | "leverage_points" | "emergence" | "resilience" | "all";
    };
    result = applySystemsThinking(ctx, {
      systemDescription: st.systemDescription || content,
      boundaries: st.boundaries || [],
      components: st.components || [],
      timeScale: st.timeScale || "medium_term",
      focusArea: st.focusArea || "all",
    });
  } else if (args.mcts && strategy === "mcts") {
    const mcts = args.mcts as {
      problem: string;
      possibleActions: Array<{
        id: string;
        description: string;
        estimatedReward?: number;
        constraints?: string[];
      }>;
      simulationDepth?: number;
      numSimulations?: number;
      explorationConstant?: number;
      pruningThreshold?: number;
    };
    // Ensure all actions have constraints with default
    const actionsWithDefaults = (mcts.possibleActions || []).map(a => ({
      ...a,
      constraints: a.constraints ?? [],
    }));
    result = applyMCTS(ctx, {
      problem: mcts.problem || content,
      possibleActions: actionsWithDefaults,
      simulationDepth: mcts.simulationDepth || 5,
      numSimulations: mcts.numSimulations || 100,
      explorationConstant: mcts.explorationConstant || 1.414,
      pruningThreshold: mcts.pruningThreshold || 0.2,
    });
  } else {
    result = applySequential(ctx, content, type, confidence);
  }

  for (const node of result.nodes) {
    graph.addNode(node);
  }

  for (const edge of result.edgeTypes) {
    const fromNode = graph.getNode(edge.from);
    if (fromNode) {
      addEdge(fromNode, edge.to, edge.type);
    }
  }

  const mainNode = result.nodes[0];

  if (edgeTo) {
    const node = graph.getNode(mainNode.id);
    if (node) {
      addEdge(node, edgeTo.targetId, edgeTo.type);
    }
  }

  if (knowledge) {
    const node = graph.getNode(mainNode.id);
    if (node) {
      integrateKnowledge(node, knowledge.source, knowledge.content, knowledge.relevance);
      const boost = getKnowledgeConfidenceBoost(node);
      if (boost > 0) {
        node.confidence = Math.min(1, node.confidence + boost);
      }
    }
  }

  metaState = updateMetacognition(metaState, graph);

  const warnings: string[] = [];
  if (metaState.stuckDetected) {
    warnings.push(`Stuck detected: ${metaState.stuckReason}`);
  }

  const allNodes = graph.getAllNodes();
  const specializedRec = recommendSpecializedStrategy(metaState.progressMetrics, allNodes, metaState.currentStrategy);

  let nextSuggested: NextAction;
  if (mainNode.confidence < 0.4) {
    nextSuggested = { tool: "evaluate", params: { critique: true }, reason: "Düşük confidence — değerlendirme önerilir" };
  } else if (graph.size() % 5 === 0) {
    nextSuggested = { tool: "metacog", params: { action: "auto_update" }, reason: "Her 5 düşüncede bir metacognitive kontrol önerilir" };
  } else if (metaState.suggestedAction) {
    nextSuggested = { tool: metaState.suggestedAction.type === "switch_strategy" ? "metacog" : metaState.suggestedAction.type, reason: metaState.suggestedAction.description };
  } else {
    nextSuggested = { tool: "think", reason: "Akıl yürütmeye devam et" };
  }

  if (specializedRec) {
    warnings.push(`Specialized Strategy Detected: ${specializedRec.strategy} — ${specializedRec.reason}`);
  }

  const response: MCPResponse = {
    status: warnings.length > 0 ? "warning" : "ok",
    nodeId: mainNode.id,
    summary: `${result.strategy} stratejisiyle "${content.substring(0, 60)}${content.length > 60 ? "..." : ""}" eklendi`,
    confidence: mainNode.confidence,
    data: {
      thoughtType: mainNode.type,
      edgeCount: mainNode.edges.length,
      branchName: branch ?? null,
      nodesCreated: result.nodes.length,
      reasoning: result.reasoning,
    },
    nextSuggested,
    warnings: warnings.length > 0 ? warnings : undefined,
  };

  sessionManager.autoSave(graph.serialize(), problemStatement ?? undefined);

  return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
}

function handleEvaluate(args: Record<string, unknown>) {
  const rawNodeId = args.nodeId as string | undefined;
  const doCritique = (args.critique as boolean) ?? true;
  const doFindGaps = (args.findGaps as boolean) ?? false;
  const doValidate = (args.validateKnowledge as boolean) ?? false;

  const lines: string[] = [];

  if (rawNodeId) {
    const nodeId = _resolveNodeId(rawNodeId);
    if (!nodeId) {
      return _nodeNotFoundResponse(rawNodeId);
    }
    const node = graph.getNode(nodeId);
    if (!node) {
      return { content: [{ type: "text", text: `Node ${nodeId} not found` }], isError: true };
    }

    const score = calculateConfidence(node, graph, graph.getAllNodes());
    const warnings: string[] = [];

    if (doCritique) {
      const critique = generateCritique(node, graph);
      setCritique(node, critique);
      if (critique.severity === "high") {
        warnings.push(`High severity critique: ${critique.content}`);
      }
    }

    let nextSuggested: NextAction;
    const graphHealth = evaluateGraphConfidence(graph);
    if (graphHealth.overallConfidence < 0.5) {
      nextSuggested = { tool: "prune", params: { action: "analyze" }, reason: "Graph health score düşük — prune önerilir" };
    } else if (doFindGaps) {
      const gaps = findKnowledgeGaps(graph);
      if (gaps.length > 0) {
        nextSuggested = { tool: "think", params: { knowledge: { source: "gap-analysis", content: gaps[0].description, relevance: 0.8 } }, reason: "Knowledge gaps tespit edildi — think ile knowledge parametresi önerilir" };
      } else {
        nextSuggested = { tool: "metacog", params: { action: "auto_update" }, reason: "Değerlendirme tamamlandı — metacog kontrolü önerilir" };
      }
    } else if (metaState.progressMetrics.confidenceTrend === "falling") {
      nextSuggested = { tool: "metacog", params: { action: "auto_update" }, reason: "Confidence trend düşüyor — metacog auto_update önerilir" };
    } else {
      nextSuggested = { tool: "think", reason: "Değerlendirme tamamlandı — akıl yürütmeye devam et" };
    }

    const response: MCPResponse = {
      status: warnings.length > 0 ? "warning" : "ok",
      nodeId,
      summary: `Node ${nodeId} değerlendirildi — confidence: ${score.confidence.toFixed(2)}`,
      confidence: score.confidence,
      data: {
        scoringFactors: score.factors.map(f => ({ name: f.name, contribution: f.contribution, description: f.description })),
        recommendation: score.recommendation,
      },
      nextSuggested,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  } else {
    const evaluation = evaluateGraphConfidence(graph);
    const warnings: string[] = [];

    if (evaluation.weakSpots.length > 0) {
      warnings.push(`${evaluation.weakSpots.length} weak spot tespit edildi`);
    }

    let nextSuggested: NextAction;
    if (evaluation.overallConfidence < 0.5) {
      nextSuggested = { tool: "prune", params: { action: "prune" }, reason: "Graph health düşük — prune önerilir" };
    } else if (doFindGaps) {
      const gaps = findKnowledgeGaps(graph);
      nextSuggested = gaps.length > 0
        ? { tool: "think", params: { knowledge: { source: "gap-analysis", content: gaps[0].description, relevance: 0.8 } }, reason: "Knowledge gaps var — knowledge ile think önerilir" }
        : { tool: "conclude", reason: "Knowledge gap yok — sonuç çıkarma önerilir" };
    } else if (metaState.progressMetrics.confidenceTrend === "falling") {
      nextSuggested = { tool: "metacog", params: { action: "auto_update" }, reason: "Confidence trend düşüyor — strateji değişikliği önerilir" };
    } else {
      nextSuggested = { tool: "think", reason: "Değerlendirme tamamlandı — akıl yürütmeye devam et" };
    }

    const response: MCPResponse = {
      status: warnings.length > 0 ? "warning" : "ok",
      summary: `Genel graph değerlendirmesi — confidence: ${(evaluation.overallConfidence * 100).toFixed(0)}%`,
      confidence: evaluation.overallConfidence,
      data: {
        weakSpots: evaluation.weakSpots.map(ws => ({ nodeId: ws.nodeId, confidence: ws.confidence, issue: ws.issue })),
        strongPaths: evaluation.strongPaths.map(sp => ({ nodeIds: sp.nodeIds, avgConfidence: sp.avgConfidence })),
      },
      nextSuggested,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    if (doFindGaps) {
      const gaps = findKnowledgeGaps(graph);
      (response.data as Record<string, unknown>).knowledgeGaps = gaps.map(g => ({ nodeId: g.nodeId, missingType: g.missingType, description: g.description }));
    }

    if (doValidate) {
      const conflicts = validateKnowledgeConsistency(graph);
      (response.data as Record<string, unknown>).knowledgeConflicts = conflicts.map(c => ({ node1: c.node1, node2: c.node2, conflict: c.conflict }));
    }

    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  }
}

function handleMetacog(args: Record<string, unknown>) {
  const action = args.action as string;

  switch (action) {
    case "report": {
      metaState = updateMetacognition(metaState, graph);
      const report = metacognitiveReport(metaState);
      return { content: [{ type: "text", text: report }] };
    }

    case "switch": {
      const newStrategy = args.strategy as Strategy;
      const reason = (args.reason as string) || "Manual strategy switch";
      if (!newStrategy) {
        return {
          content: [{ type: "text", text: "Must specify 'strategy' parameter for switch action" }],
          isError: true,
        };
      }
      metaState = switchStrategy(metaState, newStrategy, reason);
      return {
        content: [{ type: "text", text: `Strategy switched: ${metaState.strategyHistory[metaState.strategyHistory.length - 1].from} → ${newStrategy}\nReason: ${reason}` }],
      };
    }

    case "auto_update": {
      const prevState = metaState.currentStrategy;
      metaState = updateMetacognition(metaState, graph);

      const lines: string[] = ["=== Auto Metacognitive Update ==="];
      lines.push(`Strategy: ${prevState} → ${metaState.currentStrategy}`);

      if (metaState.stuckDetected) {
        lines.push(`⚠ STUCK: ${metaState.stuckReason}`);
      } else {
        lines.push("Progress: Normal");
      }

      lines.push(`Cognitive Load: ${(metaState.cognitiveLoad * 100).toFixed(0)}%`);
      lines.push(`Confidence Trend: ${metaState.progressMetrics.confidenceTrend}`);

      if (metaState.suggestedAction) {
        lines.push("");
        lines.push(`💡 Action: [${metaState.suggestedAction.type}] ${metaState.suggestedAction.description}`);
        if (metaState.suggestedAction.suggestedStrategy) {
          lines.push(`  Suggested Strategy: ${metaState.suggestedAction.suggestedStrategy}`);
        }
        if (metaState.suggestedAction.targetNodeId) {
          lines.push(`  Target Node: ${metaState.suggestedAction.targetNodeId}`);
        }
      }

      return { content: [{ type: "text", text: lines.join("\n") }] };
    }

    default:
      return { content: [{ type: "text", text: `Unknown action: ${action}` }], isError: true };
  }
}

function handleGraph(args: Record<string, unknown>) {
  const action = args.action as string;

  switch (action) {
    case "visualize":
      return { content: [{ type: "text", text: graph.toVisualization() }] };

    case "stats": {
      const stats = graph.getStats();
      const lines: string[] = [
        "=== Graph Statistics ===",
        `Total Nodes: ${stats.totalNodes} | Active: ${stats.activeNodes}`,
        `Total Edges: ${stats.totalEdges}`,
        `Branches: ${stats.branches.join(", ")}`,
        `Max Depth: ${stats.maxDepth}`,
        `Avg Confidence: ${(stats.avgConfidence * 100).toFixed(0)}%`,
        "",
        "Strategy Distribution:",
        ...Object.entries(stats.strategyDistribution)
          .filter(([, v]) => v > 0)
          .map(([k, v]) => `  ${k}: ${v}`),
        "",
        "Type Distribution:",
        ...Object.entries(stats.typeDistribution)
          .filter(([, v]) => v > 0)
          .map(([k, v]) => `  ${k}: ${v}`),
      ];
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }

    case "path": {
      const rawFromId = args.nodeId as string;
      const rawToId = args.targetId as string;
      if (!rawFromId || !rawToId) {
        return { content: [{ type: "text", text: "Must specify both nodeId and targetId for path action" }], isError: true };
      }
      const fromId = _resolveNodeId(rawFromId);
      if (!fromId) {
        return _nodeNotFoundResponse(rawFromId);
      }
      const toId = _resolveNodeId(rawToId);
      if (!toId) {
        return _nodeNotFoundResponse(rawToId);
      }
      const path = graph.getPath(fromId, toId);
      if (!path) {
        return { content: [{ type: "text", text: `No path found from ${fromId} to ${toId}` }] };
      }
      const lines = path.map((n) => `[${n.id}] ${n.type}(${(n.confidence * 100).toFixed(0)}%) ${n.content.substring(0, 60)}`);
      return { content: [{ type: "text", text: `Path (${path.length} nodes):\n${lines.join("\n→ ")}` }] };
    }

    case "node": {
      const rawNodeId = args.nodeId as string;
      if (!rawNodeId) {
        return { content: [{ type: "text", text: "Must specify nodeId" }], isError: true };
      }
      const nodeId = _resolveNodeId(rawNodeId);
      if (!nodeId) {
        return _nodeNotFoundResponse(rawNodeId);
      }
      const node = graph.getNode(nodeId);
      if (!node) {
        return { content: [{ type: "text", text: `Node ${nodeId} not found` }] };
      }
      return { content: [{ type: "text", text: nodeToSummary(node) }] };
    }

    case "branches": {
      const branches = graph.getBranches();
      const lines = branches.map((b) => {
        const nodes = graph.getBranch(b);
        const avgConf = nodes.length > 0
          ? nodes.reduce((sum, n) => sum + n.confidence, 0) / nodes.length
          : 0;
        return `${b}: ${nodes.length} nodes, avg confidence ${(avgConf * 100).toFixed(0)}%`;
      });
      return { content: [{ type: "text", text: `Branches:\n${lines.join("\n")}` }] };
    }

    case "best_path": {
      const path = graph.getBestPath();
      const lines = path.map((n) => `[${n.id}] ${n.type}(${(n.confidence * 100).toFixed(0)}%) ${n.content.substring(0, 60)}`);
      const avgConf = path.length > 0
        ? path.reduce((sum, n) => sum + n.confidence, 0) / path.length
        : 0;
      return {
        content: [{
          type: "text",
          text: `Best Path (avg confidence ${(avgConf * 100).toFixed(0)}%, ${path.length} nodes):\n${lines.join("\n→ ")}`,
        }],
      };
    }

    case "leaves": {
      const leaves = graph.getLeaves();
      if (leaves.length === 0) {
        return { content: [{ type: "text", text: "No leaf nodes (thinking hasn't started yet)" }] };
      }
      const lines = leaves.map((l) =>
        `[${l.id}] conf=${(l.confidence * 100).toFixed(0)}% branch=${l.metadata.branch} ${l.content.substring(0, 50)}`
      );
      return { content: [{ type: "text", text: `Leaf Nodes (${leaves.length}):\n${lines.join("\n")}` }] };
    }

    default:
      return { content: [{ type: "text", text: `Unknown action: ${action}` }], isError: true };
  }
}

function handlePrune(args: Record<string, unknown>) {
  const action = args.action as string;

  switch (action) {
    case "analyze": {
      const report = prunerReport(graph);
      return { content: [{ type: "text", text: report }] };
    }

    case "prune": {
      const results = pruneGraph(graph);
      const totalPruned = results.reduce((sum, r) => sum + r.prunedNodeIds.length, 0);
      const lines: string[] = [
        `Pruned ${totalPruned} node(s) in ${results.length} operation(s):`,
        ...results.map((r) =>
          `  [${r.prunedNodeIds.join(", ")}]: ${r.reason} (freed ${r.freedDepth} depth, path optimized: ${r.pathOptimized})`
        ),
      ];
      metaState = updateMetacognition(metaState, graph);
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }

    case "optimize_path": {
      const result = optimizePath(graph);
      metaState = updateMetacognition(metaState, graph);
      return {
        content: [{
          type: "text",
          text: `Path optimized: ${result.originalLength} → ${result.optimizedLength} nodes\nRemoved: ${result.removedNodes.length > 0 ? result.removedNodes.join(", ") : "none"}`,
        }],
      };
    }

    case "prune_node": {
      const rawNodeId = args.nodeId as string;
      const reason = (args.reason as string) || "Manual prune";
      if (!rawNodeId) {
        return { content: [{ type: "text", text: "Must specify nodeId" }], isError: true };
      }
      const nodeId = _resolveNodeId(rawNodeId);
      if (!nodeId) {
        return _nodeNotFoundResponse(rawNodeId);
      }
      const result = graph.pruneNode(nodeId, reason);
      metaState = updateMetacognition(metaState, graph);
      return {
        content: [{
          type: "text",
          text: `Pruned: ${result.prunedNodeIds.join(", ")}\nReason: ${result.reason}\nFreed: ${result.freedDepth} depth\nPath optimized: ${result.pathOptimized}`,
        }],
      };
    }

    default:
      return { content: [{ type: "text", text: `Unknown action: ${action}` }], isError: true };
  }
}

function handleReset(args: Record<string, unknown>) {
  const problem = args.problem as string | undefined;
  const doSave = (args.save as boolean) ?? false;
  const saveName = args.saveName as string | undefined;
  const resume = args.resume as string | undefined;
  const listSessions = (args.listSessions as boolean) ?? false;

  if (listSessions) {
    const sessions = sessionManager.list();
    const response: MCPResponse = {
      status: "ok",
      summary: `${sessions.length} kayıtlı oturum bulundu`,
      data: { sessions },
      nextSuggested: { tool: "reset", params: { resume: sessions[0]?.name }, reason: "Bir oturuma dön" },
    };
    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  }

  if (resume) {
    const sessionData = sessionManager.load(resume);
    if (!sessionData) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            status: "error",
            error: "SESSION_NOT_FOUND",
            provided: resume,
            hint: "reset({ listSessions: true }) ile kayıtlı oturumları görüntüle",
          }),
        }],
        isError: true,
      };
    }

    resetCounter();
    const newGraph = new ThoughtGraph();
    if (sessionData.graphSnapshot) {
      const snapshot = sessionData.graphSnapshot as {
        nodes: [string, import("./core/types.js").ThoughtNode][];
        rootIds: string[];
        branches: string[];
      };
      newGraph.deserialize(snapshot);
    }
    Object.assign(graph, newGraph);
    metaState = createMetacognitiveState("sequential");
    problemStatement = sessionData.problem || null;

    const response: MCPResponse = {
      status: "ok",
      summary: `"${resume}" oturumu geri yüklendi — ${graph.size()} node ile devam ediliyor`,
      confidence: graph.getStats().avgConfidence,
      nextSuggested: { tool: "think", reason: "Oturuma devam et" },
    };
    return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
  }

  if (doSave) {
    const name = saveName || `session_${Date.now()}`;
    sessionManager.save(name, {
      id: name,
      name,
      problem: problemStatement ?? undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      graphSnapshot: graph.serialize(),
    });
  }

  resetCounter();
  const newGraph = new ThoughtGraph();
  Object.assign(graph, newGraph);

  metaState = createMetacognitiveState("sequential");
  problemStatement = problem || null;

  const response: MCPResponse = {
    status: "ok",
    summary: doSave
      ? `Oturum kaydedildi ve graph sıfırlandı${problem ? ` — Yeni problem: ${problem}` : ""}`
      : `Graph ve metacognitive state sıfırlandı${problem ? ` — Yeni problem: ${problem}` : ""}`,
    nextSuggested: { tool: "think", reason: "Yeni akıl yürütme oturumu başlat" },
  };
  return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
}

function handleVisualizeThoughtGraph(args: Record<string, unknown>) {
  const format = (args.format as string) || "ascii";
  const highlightPath = args.highlightPath as string | undefined;
  const showConfidence = (args.showConfidence as boolean) ?? true;

  try {
    let output: string;
    if (format === "svg") {
      output = visualizeAsSVG(graph, {
        showConfidence,
      });
    } else {
      output = visualizeAsASCII(graph);
    }

    return {
      content: [{
        type: "text",
        text: output,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Visualization error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

function handleSimulateDevilsAdvocate(args: Record<string, unknown>) {
  const rawNodeId = args.nodeId as string;
  const depth = (args.depth as number) || 2;
  const intensity = (args.intensity as string) || "moderate";

  if (!rawNodeId) {
    return { content: [{ type: "text", text: "Must specify nodeId" }], isError: true };
  }

  const nodeId = _resolveNodeId(rawNodeId);
  if (!nodeId) {
    return _nodeNotFoundResponse(rawNodeId);
  }

  try {
    const counterarguments = generateCounterarguments(graph, nodeId, {
      depth,
      intensity: intensity as any,
    });

    const createdNodes = applyCounterarguments(graph, counterarguments);

    const lines: string[] = [
      `Devil's Advocate Simulation for node ${nodeId}`,
      `Generated ${counterarguments.length} counterarguments with intensity: ${intensity}`,
      "",
      "Counterarguments added:",
      ...createdNodes.map(n => `  • [${n.id}] ${n.content.substring(0, 60)}...`),
      "",
      `Total graph nodes: ${graph.getStats().totalNodes}`,
    ];

    metaState = updateMetacognition(metaState, graph);

    return {
      content: [{
        type: "text",
        text: lines.join("\n"),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Devil's advocate error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

function handleCrossDisciplinarySynthesis(args: Record<string, unknown>) {
  const sourceDomains = args.sourceDomains as string[];
  const targetProblem = args.targetProblem as string;
  const maxAnalogies = (args.maxAnalogies as number) || 3;

  if (!sourceDomains || !targetProblem) {
    return { content: [{ type: "text", text: "Must specify sourceDomains and targetProblem" }], isError: true };
  }

  try {
    const analogies = generateCrossDomainAnalogies(sourceDomains, targetProblem, maxAnalogies);
    const createdNodes = applyAnalogiesToGraph(graph, analogies);

    const lines: string[] = [
      `Cross-Disciplinary Synthesis for: "${targetProblem}"`,
      `Source domains: ${sourceDomains.join(", ")}`,
      "",
      "Generated analogies:",
      ...analogies.map((a, i) => `  ${i + 1}. From ${a.sourceDomain}: ${a.insight.substring(0, 80)}...`),
      "",
      `Created ${createdNodes.length} new insight nodes.`,
    ];

    metaState = updateMetacognition(metaState, graph);

    return {
      content: [{
        type: "text",
        text: lines.join("\n"),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Cross-disciplinary synthesis error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

function handleTemporalProjection(args: Record<string, unknown>) {
  const rawNodeId = args.nodeId as string;
  const years = args.years as number;
  const scenario = (args.scenario as string) || "realistic";

  if (!rawNodeId || years === undefined) {
    return { content: [{ type: "text", text: "Must specify nodeId and years" }], isError: true };
  }

  const nodeId = _resolveNodeId(rawNodeId);
  if (!nodeId) {
    return _nodeNotFoundResponse(rawNodeId);
  }

  try {
    const projection = projectThoughtTemporally(graph, nodeId, years, scenario);
    const newNode = applyTemporalProjection(graph, projection);

    const lines: string[] = [
      `Temporal Projection of node ${nodeId}`,
      `Timeframe: ${years > 0 ? `${years} years forward` : `${-years} years backward`}`,
      `Scenario: ${scenario}`,
      "",
      `Projected content: ${projection.projectedContent.substring(0, 100)}...`,
      `Confidence: ${(projection.confidence * 100).toFixed(0)}% (original: ${(graph.getNode(nodeId)?.confidence || 0) * 100}%)`,
      `Change factors: ${projection.changeFactors.join(", ")}`,
      "",
      `New node created: ${newNode.id}`,
    ];

    metaState = updateMetacognition(metaState, graph);

    return {
      content: [{
        type: "text",
        text: lines.join("\n"),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Temporal projection error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

function handleEthicalFrameworkEvaluation(args: Record<string, unknown>) {
  const rawNodeId = args.nodeId as string;
  const frameworks = (args.frameworks as string[]) || ["deontological", "consequentialist", "virtue", "rights_based"];

  if (!rawNodeId) {
    return { content: [{ type: "text", text: "Must specify nodeId" }], isError: true };
  }

  const nodeId = _resolveNodeId(rawNodeId);
  if (!nodeId) {
    return _nodeNotFoundResponse(rawNodeId);
  }

  try {
    const evaluations = evaluateEthically(graph, nodeId, frameworks);
    const node = graph.getNode(nodeId);
    if (node) {
      applyEthicalEvaluation(node, evaluations);
    }

    const lines: string[] = [
      `Ethical Evaluation of node ${nodeId}`,
      `Frameworks applied: ${frameworks.join(", ")}`,
      "",
    ];

    evaluations.forEach(evalItem => {
      lines.push(`• ${evalItem.framework.toUpperCase()}: ${(evalItem.alignmentScore * 100).toFixed(0)}% alignment`);
      lines.push(`  Assessment: ${evalItem.assessment.substring(0, 80)}...`);
      if (evalItem.concerns.length > 0) {
        lines.push(`  Concerns: ${evalItem.concerns.join(", ")}`);
      }
      lines.push("");
    });

    metaState = updateMetacognition(metaState, graph);

    return {
      content: [{
        type: "text",
        text: lines.join("\n"),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Ethical evaluation error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

function handleEmotionalIntelligenceAnalysis(args: Record<string, unknown>) {
  const text = args.text as string;
  const context = args.context as string | undefined;
  const perspectiveTaking = (args.perspectiveTaking as number) ?? 0.7;

  if (!text) {
    return { content: [{ type: "text", text: "Must specify text" }], isError: true };
  }

  try {
    const analysis = analyzeEmotionalIntelligence(text, context, perspectiveTaking);

    const lines: string[] = [
      `Emotional Intelligence Analysis`,
      `Text sample: "${text.substring(0, 80)}${text.length > 80 ? "..." : ""}"`,
      context ? `Context: ${context}` : `Context: General`,
      `Perspective-taking level: ${(perspectiveTaking * 100).toFixed(0)}%`,
      "",
      `Primary emotion: ${analysis.primaryEmotion}`,
      `Secondary emotions: ${analysis.secondaryEmotions.join(", ")}`,
      `Emotional intensity: ${(analysis.emotionalIntensity * 100).toFixed(0)}%`,
      `Sentiment: ${analysis.sentimentScore > 0.3 ? "Positive" : analysis.sentimentScore < -0.3 ? "Negative" : "Neutral"} (${analysis.sentimentScore.toFixed(2)})`,
      `Empathy score: ${(analysis.empathyScore * 100).toFixed(0)}%`,
      `Persuasion effectiveness: ${(analysis.persuasionScore * 100).toFixed(0)}%`,
      "",
    ];

    if (analysis.stakeholderAnalysis.length > 0) {
      lines.push("Stakeholder emotion analysis:");
      analysis.stakeholderAnalysis.forEach(sa => {
        lines.push(`  • ${sa.stakeholder}: ${sa.likelyEmotion} (intensity: ${(sa.intensity * 100).toFixed(0)}%)`);
      });
      lines.push("");
    }

    if (analysis.recommendations.length > 0) {
      lines.push("Recommendations:");
      analysis.recommendations.forEach(rec => {
        lines.push(`  • ${rec}`);
      });
    }

    return {
      content: [{
        type: "text",
        text: lines.join("\n"),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Emotional intelligence analysis error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

function handleExplainDecision(args: Record<string, unknown>) {
  const rawNodeId = args.nodeId as string;
  const detailLevelRaw = (args.detailLevel as string) || "detailed";
  const includeCounterfactuals = (args.includeCounterfactuals as boolean) ?? true;
  
  const validDetailLevels = ["simple", "detailed", "technical"] as const;
  const detailLevel = validDetailLevels.includes(detailLevelRaw as any) 
    ? (detailLevelRaw as "simple" | "detailed" | "technical")
    : "detailed";

  if (!rawNodeId) {
    return { content: [{ type: "text", text: "Must specify nodeId" }], isError: true };
  }

  const nodeId = _resolveNodeId(rawNodeId);
  if (!nodeId) {
    return _nodeNotFoundResponse(rawNodeId);
  }

  try {
    const explanation = explainDecision(graph, nodeId, detailLevel, includeCounterfactuals);
    const formatted = formatExplanation(explanation, detailLevel);

    return {
      content: [{
        type: "text",
        text: formatted,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Decision explanation error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

function handleSocialImpactAnalysis(args: Record<string, unknown>) {
  const rawNodeId = args.nodeId as string;
  const stakeholders = (args.stakeholders as string[]) || ["customers", "employees", "investors", "community"];

  if (!rawNodeId) {
    return { content: [{ type: "text", text: "Must specify nodeId" }], isError: true };
  }

  const nodeId = _resolveNodeId(rawNodeId);
  if (!nodeId) {
    return _nodeNotFoundResponse(rawNodeId);
  }

  try {
    const assessment = analyzeSocialImpact(graph, nodeId, stakeholders);
    
    // Apply to node if it exists
    const node = graph.getNode(nodeId);
    if (node) {
      node.socialImpact = {
        stakeholderEmotions: new Map(
          assessment.stakeholderAnalyses.map(sa => [sa.stakeholder, sa.likelyEmotion])
        ),
        groupCohesionScore: assessment.groupCohesionScore,
        persuasionEffectiveness: assessment.persuasionEffectiveness,
        ethicalAlignment: assessment.ethicalAlignment[0] || {
          framework: "deontological",
          assessment: "No ethical evaluation",
          alignmentScore: 0.5,
          concerns: [],
        },
      };
    }

    const lines: string[] = [
      `Social Impact Analysis for node ${nodeId}`,
      `Stakeholders: ${stakeholders.join(", ")}`,
      "",
      `Group Cohesion Score: ${(assessment.groupCohesionScore * 100).toFixed(0)}%`,
      `Persuasion Effectiveness: ${(assessment.persuasionEffectiveness * 100).toFixed(0)}%`,
      "",
      "Stakeholder Analysis:",
    ];

    assessment.stakeholderAnalyses.forEach(sa => {
      lines.push(`• ${sa.stakeholder}:`);
      lines.push(`  Emotion: ${sa.likelyEmotion} (intensity: ${(sa.intensity * 100).toFixed(0)}%)`);
      lines.push(`  Impact: ${sa.impact}`);
      if (sa.concerns.length > 0) {
        lines.push(`  Concerns: ${sa.concerns.join(", ")}`);
      }
      lines.push(`  Communication: ${sa.suggestedCommunication}`);
      lines.push("");
    });

    if (assessment.ethicalAlignment.length > 0) {
      lines.push("Ethical Alignment:");
      assessment.ethicalAlignment.forEach(ea => {
        lines.push(`  • ${ea.framework}: ${(ea.alignmentScore * 100).toFixed(0)}%`);
      });
      lines.push("");
    }

    if (assessment.recommendations.length > 0) {
      lines.push("Recommendations:");
      assessment.recommendations.forEach(rec => {
        lines.push(`  • ${rec}`);
      });
    }

    metaState = updateMetacognition(metaState, graph);

    return {
      content: [{
        type: "text",
        text: lines.join("\n"),
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Social impact analysis error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

// ============================================================================
// Prompt Optimizer (Node Zero) Handler
// ============================================================================

function handleOptimizePrompt(args: Record<string, unknown>) {
  const originalPrompt = args.originalPrompt as string;
  const userContext = args.userContext as PromptOptimizerInput["userContext"] || {};
  const conversationHistory = args.conversationHistory as PromptOptimizerInput["conversationHistory"];
  const optimizationLevel = (args.optimizationLevel as string) || "standard";
  const targetModel = (args.targetModel as string) || "generic";
  const autoRoute = (args.autoRoute as boolean) || false;

  if (!originalPrompt || originalPrompt.trim().length === 0) {
    return { content: [{ type: "text", text: "Must specify originalPrompt" }], isError: true };
  }

  try {
    // Step 1: Check if optimization is needed
    const optimizationCheck = shouldOptimizePrompt(originalPrompt, conversationHistory);
    
    if (!optimizationCheck.shouldOptimize) {
      return {
        content: [{
          type: "text",
          text: [
            `=== Prompt Optimizer (Node Zero) ===`,
            ``,
            `Status: SKIP - ${optimizationCheck.reason}`,
            ``,
            `Recommendation:`,
            `  Strategy: ${optimizationCheck.recommendation?.primaryStrategy}`,
            `  Auto-Execute: ${optimizationCheck.recommendation?.autoExecute}`,
            ``,
            `Original prompt is clear enough for direct processing.`,
          ].join("\n"),
        }],
      };
    }

    // Step 2: Create Node Zero state
    metaState = createNodeZeroState();

    // Step 3: Build input
    const input: PromptOptimizerInput = {
      originalPrompt: originalPrompt.trim(),
      userContext,
      conversationHistory,
      optimizationLevel: optimizationLevel as PromptOptimizerInput["optimizationLevel"],
      targetModel: targetModel as PromptOptimizerInput["targetModel"],
    };

    // Step 4: Apply PromptOptimizer
    const ctx: StrategyContext = {
      graph,
      currentStrategy: "hybrid" as Strategy,
      problem: originalPrompt,
      parentNodeId: null,
      branch: "node-zero",
      tags: ["prompt-optimizer", "entry-point"],
    };

    const result = applyPromptOptimizer(ctx, input);

    // Step 5: Add nodes to graph
    for (const node of result.nodes) {
      graph.addNode(node);
    }

    for (const edge of result.edgeTypes) {
      const fromNode = graph.getNode(edge.from);
      if (fromNode) {
        addEdge(fromNode, edge.to, edge.type);
      }
    }

    // Step 6: Route based on optimization result
    if (result.optimizationOutput.routingRecommendation) {
      metaState = routeOptimizedPrompt(
        result.optimizationOutput.routingRecommendation,
        metaState
      );
    }

    // Step 7: Auto-route if requested
    let autoRouteResult = "";
    if (autoRoute && result.optimizationOutput.routingRecommendation?.autoExecute) {
      const routing = result.optimizationOutput.routingRecommendation;
      autoRouteResult = `\n\n🚦 AUTO-ROUTING ACTIVATED\n  → Next strategy: ${routing.primaryStrategy}\n  → Suggested nodes: ${routing.suggestedNodes.join(", ") || "None"}`;
    }

    // Build output
    const opt = result.optimizationOutput;
    const lines: string[] = [
      `=== Prompt Optimizer (Node Zero) v2.0 ===`,
      ``,
      `📊 INPUT ANALYSIS`,
      `  Domain: ${opt.inputAnalysis.domainCategory}`,
      `  Complexity: ${opt.inputAnalysis.complexityScore}/10`,
      `  Ambiguity: ${(opt.inputAnalysis.ambiguityLevel * 100).toFixed(0)}%`,
      ``,
      `🎯 CORE INTENT`,
      `  Primary Goal: ${opt.coreIntent.primaryGoal}`,
      `  Format: ${opt.coreIntent.desiredFormat}`,
      `  Success Criteria:`,
      ...opt.coreIntent.successCriteria.map(c => `    • ${c}`),
      ``,
    ];

    if (opt.missingContext.criticalGaps.length > 0) {
      lines.push(`⚠️  MISSING CONTEXT`);
      opt.missingContext.criticalGaps.forEach((gap, i) => {
        lines.push(`  ${i + 1}. ${gap.gap}`);
        lines.push(`     Why it matters: ${gap.whyItMatters}`);
      });
      lines.push(``);
    }

    if (opt.missingContext.suggestedClarifications.length > 0) {
      lines.push(`💡 SUGGESTED CLARIFICATIONS`);
      opt.missingContext.suggestedClarifications.forEach((clar, i) => {
        lines.push(`  ${i + 1}. [${clar.priority.toUpperCase()}] ${clar.question}`);
      });
      lines.push(``);
    }

    lines.push(
      `✨ SUPER PROMPT (Optimized)`,
      `  Strategy: ${opt.enhancedPrompt.reasoningStrategy}`,
      `  Capabilities: ${opt.enhancedPrompt.requiredCapabilities.join(", ")}`,
      `  Depth: ${opt.enhancedPrompt.outputSpecifications.depthLevel}`,
      `  Structure: ${opt.enhancedPrompt.outputSpecifications.structure.join(" → ")}`,
      ``,
      `--- BEGIN SUPER PROMPT ---`,
      opt.enhancedPrompt.superPrompt,
      `--- END SUPER PROMPT ---`,
      ``,
      `🚦 ROUTING RECOMMENDATION`,
      `  Primary Strategy: ${opt.routingRecommendation.primaryStrategy}`,
      `  Suggested Nodes: ${opt.routingRecommendation.suggestedNodes.join(", ") || "None"}`,
      `  Auto-Execute: ${opt.routingRecommendation.autoExecute}`,
      ``,
      `📈 METRICS`,
      `  Optimization Score: ${(opt.enhancedPrompt.superPrompt.length / originalPrompt.length).toFixed(2)}x expansion`,
      `  Nodes Created: ${result.nodes.length}`,
      `  Confidence: ${(result.nodes[result.nodes.length - 1]?.confidence * 100 || 0).toFixed(0)}%`
    );

    if (autoRouteResult) {
      lines.push(autoRouteResult);
    }

    lines.push(
      ``,
      `💡 TIP: Use this super prompt with 'think' tool and strategy '${opt.routingRecommendation.primaryStrategy}'`
    );

    return {
      content: [{
        type: "text",
        text: lines.join("\n"),
      }],
    };

  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Prompt optimization error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

function handleHelp(args: Record<string, unknown>) {
  const category = (args.category as string) || "all";

  const toolGroups = {
    core: {
      label: "Temel Araçlar",
      description: "Gunluk kullanım icin",
      tools: [
        { name: "think", purpose: "Dusunce grafigine yeni dusunce ekle", quickStart: 'think({ content: "...", strategy: "sequential" })' },
        { name: "evaluate", purpose: "Mevcut dusunceleri degerlendir ve critique al", quickStart: "evaluate({ critique: true })" },
        { name: "metacog", purpose: "Akil yurutme surecini izle, strateji degistir", quickStart: 'metacog({ action: "auto_update" })' },
        { name: "graph", purpose: "Dusunce grafigini gorsellestir ve sorgula", quickStart: 'graph({ action: "visualize" })' },
        { name: "prune", purpose: "Cikmaz ve gereksiz dusunceleri temizle", quickStart: 'prune({ action: "analyze" })' },
        { name: "reset", purpose: "Yeni oturum baslat veya kaydedilmis oturuma don", quickStart: 'reset({ problem: "Sorunum..." })' },
        { name: "conclude", purpose: "Tum analizi ozetle ve sonuc cikar", quickStart: 'conclude({ detailLevel: "detailed" })' },
      ],
    },
    advanced: {
      label: "Gelismis Araclar",
      description: "Derin analiz icin",
      tools: [
        { name: "visualize_thought_graph", purpose: "Grafigi SVG/ASCII olarak render et" },
        { name: "simulate_devils_advocate", purpose: "Dusunceye karsi argumanlar uret" },
        { name: "cross_disciplinary_synthesis", purpose: "Farkli alanlardan icgoru sentezle" },
        { name: "temporal_projection", purpose: "Dusunceleri gelecek/geomise yansit" },
        { name: "ethical_framework_evaluation", purpose: "Etik cercevelerle degerlendirme" },
        { name: "emotional_intelligence_analysis", purpose: "Duygusal ton ve dinamikleri analiz et" },
        { name: "explain_decision", purpose: "Karar yolunu insan diline cevir" },
        { name: "social_impact_analysis", purpose: "Paydas ve sosyal etki analizi" },
        { name: "optimize_prompt", purpose: "PromptOptimizer (Node Zero) ile prompt optimize et" },
      ],
    },
    workflow: {
      label: "Onerilen Akislar",
      workflows: [
        {
          name: "Hizli Karar",
          steps: [
            'reset({ problem: "Kararim..." })',
            'think({ content: "Secenek A", strategy: "parallel", parallel: [...] })',
            "evaluate({ critique: true })",
            "conclude()",
          ],
        },
        {
          name: "Derin Analiz",
          steps: [
            'reset({ problem: "..." })',
            'think({ strategy: "first_principles", ... })',
            'think({ strategy: "counterfactual", ... })',
            'simulate_devils_advocate({ nodeId: "best" })',
            "evaluate({ findGaps: true })",
            'metacog({ action: "auto_update" })',
            'prune({ action: "prune" })',
            "conclude({ includeCounterfactuals: true })",
          ],
        },
        {
          name: "Cikmaz Asma",
          steps: [
            'metacog({ action: "report" })',
            'metacog({ action: "switch", strategy: "parallel" })',
            'cross_disciplinary_synthesis({ sourceDomains: [...], targetProblem: "..." })',
            'think({ strategy: "abductive", ... })',
          ],
        },
      ],
    },
  };

  const result: Record<string, unknown> = { status: "ok" };

  if (category === "all" || category === "core") {
    result.core = toolGroups.core;
  }
  if (category === "all" || category === "advanced") {
    result.advanced = toolGroups.advanced;
  }
  if (category === "all" || category === "workflow") {
    result.workflow = toolGroups.workflow;
  }

  result.summary = "deep-thinker MCP — 17 arac, 9+1 strateji, 3 onerilen akis";
  result.nextSuggested = { tool: "think", reason: "Akil yurutmeye basla" };

  return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
}

function _deriveActionItems(
  topConclusions: import("./core/types.js").ThoughtNode[],
  bestPath: import("./core/types.js").ThoughtNode[]
): Array<{ action: string; priority: string; basedOn: string }> {
  const items: Array<{ action: string; priority: string; basedOn: string }> = [];
  for (const node of topConclusions) {
    items.push({
      action: `Investigate: ${node.content.substring(0, 80)}`,
      priority: node.confidence > 0.8 ? "high" : node.confidence > 0.5 ? "medium" : "low",
      basedOn: node.id,
    });
  }
  for (const node of bestPath.filter(n => n.type === "insight")) {
    items.push({
      action: `Leverage insight: ${node.content.substring(0, 80)}`,
      priority: "medium",
      basedOn: node.id,
    });
  }
  return items;
}

function handleConclude(args: Record<string, unknown>) {
  const detailLevel = (args.detailLevel as string) || "detailed";
  const includeCounterfactuals = (args.includeCounterfactuals as boolean) ?? false;
  const format = (args.format as string) || "structured";

  const stats = graph.getStats();
  const bestPath = graph.getBestPath();
  const allLeaves = graph.getLeaves();

  const topConclusions = allLeaves
    .filter(n => n.type === "conclusion" || n.confidence > 0.7)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  const pruneReport = prunerReport(graph);

  const strategiesUsed = Object.entries(stats.strategyDistribution)
    .filter(([, v]) => v > 0)
    .map(([k]) => k);

  const response: MCPResponse = {
    status: "ok",
    summary: `${stats.totalNodes} dusunce, ${stats.branches.length} dal, ${strategiesUsed.join("+")} stratejileriyle analiz tamamlandi`,
    confidence: stats.avgConfidence,
    data: {
      conclusion: {
        primaryFinding: topConclusions[0]?.content ?? "Henuz net bir sonuc yok",
        confidence: topConclusions[0]?.confidence ?? 0,
        supportingEvidence: topConclusions.slice(1).map(n => ({
          content: n.content,
          confidence: n.confidence,
          type: n.type,
        })),
      },
      reasoning: {
        strategiesUsed,
        keyInsights: bestPath.filter(n => n.type === "insight").map(n => n.content),
        critiques: bestPath.filter(n => n.type === "critique").map(n => n.content),
      },
      actionItems: _deriveActionItems(topConclusions, bestPath),
      graphHealth: {
        totalThoughts: stats.totalNodes,
        deadEnds: (pruneReport.match(/\d+ dead end/) ?? [])[0] ?? "0",
        avgConfidence: stats.avgConfidence,
        recommendation: stats.avgConfidence < 0.5 ? "Prune calistirmaminiz onerilir" : "Graf saglikli gorunuyor",
      },
      detailLevel,
      format,
      includeCounterfactuals,
    },
    nextSuggested: stats.avgConfidence < 0.5
      ? { tool: "prune", params: { action: "prune" }, reason: "Temizlik sonrasi daha net sonuc alinabilir" }
      : { tool: "reset", params: { save: true }, reason: "Analizi kaydetmeyi unutmayin" },
  };

  return { content: [{ type: "text", text: JSON.stringify(response, null, 2) }] };
}

// ============================================================================
// Auto-Optimization Middleware (Optional)
// ============================================================================

/**
 * Automatically runs prompt optimization on the first 'think' call
 * if the prompt appears to need optimization.
 */
let hasRunInitialOptimization = false;

function maybeAutoOptimize(prompt: string): string {
  // Only auto-optimize on first call and if enabled
  if (hasRunInitialOptimization) {
    return prompt;
  }
  
  hasRunInitialOptimization = true;
  
  const classification = classifyUserIntent(prompt);
  
  if (classification.type === "optimization_needed" && classification.confidence > 0.5) {
    // Could trigger auto-optimization here
    // For now, just log the classification
    console.error(`[Auto-Optimize] Prompt classified as needing optimization (confidence: ${classification.confidence.toFixed(2)})`);
  }
  
  return prompt;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("deep-thinker MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
