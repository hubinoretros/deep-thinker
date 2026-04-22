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
  type StrategyContext,
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
} from "./core/types.js";

// Enhanced capabilities
import { visualizeAsSVG, visualizeAsASCII } from "./enhancements/visualization.js";
import { generateCounterarguments, applyCounterarguments } from "./enhancements/devils_advocate.js";
import { generateCrossDomainAnalogies, applyAnalogiesToGraph } from "./enhancements/cross_disciplinary.js";
import { projectThoughtTemporally, applyTemporalProjection } from "./enhancements/temporal_projection.js";
import { evaluateEthically, applyEthicalEvaluation } from "./enhancements/ethical_evaluation.js";
import { analyzeEmotionalIntelligence } from "./enhancements/emotional_intelligence.js";
import { explainDecision, formatExplanation } from "./enhancements/explanation.js";
import { analyzeSocialImpact } from "./enhancements/social_impact.js";

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
            enum: ["sequential", "dialectic", "parallel", "analogical", "abductive"],
            description: "Reasoning strategy to use (default: current strategy from metacognition)",
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
            enum: ["sequential", "dialectic", "parallel", "analogical", "abductive"],
            description: "New strategy (for switch action)",
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
        "Reset the thought graph and metacognitive state. Start a fresh reasoning session.",
      inputSchema: {
        type: "object",
        properties: {
          problem: {
            type: "string",
            description: "New problem statement for this session",
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
      default:
        return { content: [{ type: "text", text: `Unknown tool: ${toolName}` }], isError: true };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
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

function handleThink(args: Record<string, unknown>) {
  const content = args.content as string;
  const strategy = (args.strategy as Strategy) || metaState.currentStrategy;
  const type = (args.type as ThoughtType) || "analysis";
  const confidence = (args.confidence as number) ?? 0.5;
  const parentId = (args.parentId as string) || (args.parentId === undefined ? _getLastLeafId() : null);
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

  const lines: string[] = [
    `✦ Thought added: ${mainNode.id}`,
    `  Strategy: ${result.strategy} | Type: ${mainNode.type} | Confidence: ${mainNode.confidence.toFixed(2)}`,
    `  Reasoning: ${result.reasoning}`,
    `  Nodes created: ${result.nodes.length}`,
  ];

  if (metaState.stuckDetected) {
    lines.push("");
    lines.push(`⚠ Stuck detected: ${metaState.stuckReason}`);
  }

  if (metaState.suggestedAction) {
    lines.push(`💡 Suggested: [${metaState.suggestedAction.type}] ${metaState.suggestedAction.description}`);
    if (metaState.suggestedAction.suggestedStrategy) {
      lines.push(`   → Try strategy: ${metaState.suggestedAction.suggestedStrategy}`);
    }
  }

  if (result.nextSuggestedStrategy) {
    lines.push(`📋 Next step: Continue with ${result.nextSuggestedStrategy} strategy`);
  }

  return { content: [{ type: "text", text: lines.join("\n") }] };
}

function handleEvaluate(args: Record<string, unknown>) {
  const nodeId = args.nodeId as string | undefined;
  const doCritique = (args.critique as boolean) ?? true;
  const doFindGaps = (args.findGaps as boolean) ?? false;
  const doValidate = (args.validateKnowledge as boolean) ?? false;

  const lines: string[] = ["=== Evaluation Report ==="];

  if (nodeId) {
    const node = graph.getNode(nodeId);
    if (!node) {
      return { content: [{ type: "text", text: `Node ${nodeId} not found` }], isError: true };
    }

    const score = calculateConfidence(node, graph, graph.getAllNodes());
    lines.push(`Node: ${nodeId} | Type: ${node.type} | Strategy: ${node.strategy}`);
    lines.push(`Confidence: ${score.confidence.toFixed(2)}`);
    lines.push("");
    lines.push("Scoring Factors:");
    for (const factor of score.factors) {
      const sign = factor.contribution >= 0 ? "+" : "";
      lines.push(`  ${factor.name}: ${sign}${factor.contribution.toFixed(3)} — ${factor.description}`);
    }
    lines.push(`Recommendation: ${score.recommendation}`);

    if (doCritique) {
      const critique = generateCritique(node, graph);
      setCritique(node, critique);
      lines.push("");
      lines.push(`Critique [${critique.severity}]: ${critique.content}`);
      lines.push(`Confidence adjustment: ${critique.confidenceDelta >= 0 ? "+" : ""}${critique.confidenceDelta.toFixed(2)}`);
      lines.push(`Updated confidence: ${node.confidence.toFixed(2)}`);
    }
  } else {
    const evaluation = evaluateGraphConfidence(graph);
    lines.push(`Overall Confidence: ${(evaluation.overallConfidence * 100).toFixed(0)}%`);
    lines.push("");

    if (evaluation.weakSpots.length > 0) {
      lines.push("Weak Spots:");
      for (const ws of evaluation.weakSpots) {
        lines.push(`  [${ws.nodeId}] conf=${ws.confidence.toFixed(2)}: ${ws.issue}`);
      }
    } else {
      lines.push("No weak spots detected.");
    }

    lines.push("");
    if (evaluation.strongPaths.length > 0) {
      lines.push("Strong Reasoning Paths:");
      for (const sp of evaluation.strongPaths) {
        lines.push(`  Path [${sp.nodeIds.join("→")}] avg confidence=${sp.avgConfidence.toFixed(2)}`);
      }
    } else {
      lines.push("No strong paths identified yet.");
    }
  }

  if (doFindGaps) {
    const gaps = findKnowledgeGaps(graph);
    lines.push("");
    if (gaps.length > 0) {
      lines.push("Knowledge Gaps:");
      for (const gap of gaps) {
        lines.push(`  [${gap.nodeId}] (${gap.missingType}) ${gap.description}`);
      }
    } else {
      lines.push("No knowledge gaps detected.");
    }
  }

  if (doValidate) {
    const conflicts = validateKnowledgeConsistency(graph);
    lines.push("");
    if (conflicts.length > 0) {
      lines.push("Knowledge Conflicts:");
      for (const c of conflicts) {
        lines.push(`  [${c.node1}] ↔ [${c.node2}]: ${c.conflict}`);
      }
    } else {
      lines.push("No knowledge conflicts detected.");
    }
  }

  return { content: [{ type: "text", text: lines.join("\n") }] };
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
      const fromId = args.nodeId as string;
      const toId = args.targetId as string;
      if (!fromId || !toId) {
        return { content: [{ type: "text", text: "Must specify both nodeId and targetId for path action" }], isError: true };
      }
      const path = graph.getPath(fromId, toId);
      if (!path) {
        return { content: [{ type: "text", text: `No path found from ${fromId} to ${toId}` }] };
      }
      const lines = path.map((n) => `[${n.id}] ${n.type}(${(n.confidence * 100).toFixed(0)}%) ${n.content.substring(0, 60)}`);
      return { content: [{ type: "text", text: `Path (${path.length} nodes):\n${lines.join("\n→ ")}` }] };
    }

    case "node": {
      const nodeId = args.nodeId as string;
      if (!nodeId) {
        return { content: [{ type: "text", text: "Must specify nodeId" }], isError: true };
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
      const nodeId = args.nodeId as string;
      const reason = (args.reason as string) || "Manual prune";
      if (!nodeId) {
        return { content: [{ type: "text", text: "Must specify nodeId" }], isError: true };
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

  resetCounter();
  const newGraph = new ThoughtGraph();
  Object.assign(graph, newGraph);

  metaState = createMetacognitiveState("sequential");
  problemStatement = problem || null;

  const lines: string[] = ["Graph and metacognitive state reset."];
  if (problemStatement) {
    lines.push(`New problem: ${problemStatement}`);
  }
  return { content: [{ type: "text", text: lines.join("\n") }] };
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
  const nodeId = args.nodeId as string;
  const depth = (args.depth as number) || 2;
  const intensity = (args.intensity as string) || "moderate";

  if (!nodeId) {
    return { content: [{ type: "text", text: "Must specify nodeId" }], isError: true };
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
  const nodeId = args.nodeId as string;
  const years = args.years as number;
  const scenario = (args.scenario as string) || "realistic";

  if (!nodeId || years === undefined) {
    return { content: [{ type: "text", text: "Must specify nodeId and years" }], isError: true };
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
  const nodeId = args.nodeId as string;
  const frameworks = (args.frameworks as string[]) || ["deontological", "consequentialist", "virtue", "rights_based"];

  if (!nodeId) {
    return { content: [{ type: "text", text: "Must specify nodeId" }], isError: true };
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
  const nodeId = args.nodeId as string;
  const detailLevelRaw = (args.detailLevel as string) || "detailed";
  const includeCounterfactuals = (args.includeCounterfactuals as boolean) ?? true;
  
  // Validate detailLevel
  const validDetailLevels = ["simple", "detailed", "technical"] as const;
  const detailLevel = validDetailLevels.includes(detailLevelRaw as any) 
    ? (detailLevelRaw as "simple" | "detailed" | "technical")
    : "detailed";

  if (!nodeId) {
    return { content: [{ type: "text", text: "Must specify nodeId" }], isError: true };
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
  const nodeId = args.nodeId as string;
  const stakeholders = (args.stakeholders as string[]) || ["customers", "employees", "investors", "community"];

  if (!nodeId) {
    return { content: [{ type: "text", text: "Must specify nodeId" }], isError: true };
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("deep-thinker MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
