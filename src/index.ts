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
      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("deep-thinker MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
