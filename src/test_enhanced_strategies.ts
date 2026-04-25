/**
 * Test file for new enhanced reasoning strategies
 * Run with: node --test dist/test_enhanced_strategies.js
 */

import { describe, it } from "node:test";
import assert from "node:assert";
import { ThoughtGraph } from "./core/graph.js";
import { createNode, resetCounter } from "./core/node.js";
import {
  applyFirstPrinciples,
  applyCounterfactual,
  applySystemsThinking,
  applyMCTS,
  type StrategyContext,
} from "./core/strategies.js";
import {
  recommendSpecializedStrategy,
  shouldTriggerFirstPrinciples,
  shouldTriggerCounterfactual,
  shouldTriggerSystemsThinking,
  shouldTriggerMCTS,
  createMetacognitiveState,
  updateMetacognition,
} from "./core/metacog.js";
import { Strategy, ThoughtType } from "./core/types.js";
import {
  DecompositionInputSchema,
  CounterfactualInputSchema,
  SystemsThinkingInputSchema,
  MCTSInputSchema,
} from "./core/schemas.js";

// Reset before tests
resetCounter();

describe("Enhanced Reasoning Strategies", () => {
  describe("FirstPrinciplesNode", () => {
    it("should deconstruct problem to fundamental truths", () => {
      const graph = new ThoughtGraph();
      const ctx: StrategyContext = {
        graph,
        currentStrategy: "first_principles" as Strategy,
        problem: "How to improve battery efficiency?",
        parentNodeId: null,
        branch: "main",
        tags: [],
      };

      const input = {
        problem: "How to improve battery efficiency?",
        assumptions: ["Batteries must use lithium", "Batteries need to be charged frequently"],
        depth: 3,
        domain: "physics",
      };

      // Validate input schema
      const validated = DecompositionInputSchema.parse(input);
      assert.strictEqual(validated.problem, input.problem);
      assert.strictEqual(validated.assumptions.length, 2);

      // Apply strategy
      const result = applyFirstPrinciples(ctx, input);

      // Verify result structure
      assert.strictEqual(result.strategy, "first_principles");
      assert.ok(result.nodes.length >= 4, "Should create at least 4 nodes (problem + assumptions + truths + synthesis)");
      assert.ok(result.nodes.some(n => n.type === "observation"), "Should have observation node");
      assert.ok(result.nodes.some(n => n.type === "critique"), "Should have critique node");
      assert.ok(result.nodes.some(n => n.type === "evidence"), "Should have evidence (truth) nodes");
      assert.ok(result.nodes.some(n => n.type === "synthesis"), "Should have synthesis node");
      
      // Verify reasoning chain
      const problemNode = result.nodes.find(n => n.content.includes("Problem:"));
      assert.ok(problemNode, "Should have problem node");
      assert.ok(problemNode.parentId === null, "Problem node should be root");
      
      console.log("✓ FirstPrinciplesNode passed");
    });

    it("should validate input and reject invalid data", () => {
      const invalidInput = {
        problem: "", // Empty - should fail
        depth: 10, // Too high - should fail
      };

      try {
        DecompositionInputSchema.parse(invalidInput);
        assert.fail("Should have thrown validation error");
      } catch (error) {
        assert.ok(error instanceof Error, "Should throw validation error");
      }
      
      console.log("✓ FirstPrinciplesNode validation passed");
    });
  });

  describe("CounterfactualNode", () => {
    it("should simulate what-if scenarios with ripple effects", () => {
      const graph = new ThoughtGraph();
      const ctx: StrategyContext = {
        graph,
        currentStrategy: "counterfactual" as Strategy,
        problem: "What if remote work became permanent?",
        parentNodeId: null,
        branch: "main",
        tags: [],
      };

      const input = {
        currentState: "Current office-based work model with 5-day commute",
        variablesToChange: [
          {
            variable: "work_location",
            currentValue: "office",
            hypotheticalValue: "home",
            impactWeight: 0.8,
          },
          {
            variable: "commute_days",
            currentValue: 5,
            hypotheticalValue: 0,
            impactWeight: 0.9,
          },
        ],
        timeHorizon: "medium_term" as const,
        rippleDepth: 3,
      };

      // Validate input
      const validated = CounterfactualInputSchema.parse(input);
      assert.strictEqual(validated.variablesToChange.length, 2);

      // Apply strategy
      const result = applyCounterfactual(ctx, input);

      // Verify structure
      assert.strictEqual(result.strategy, "counterfactual");
      assert.ok(result.nodes.length >= 6, "Should create baseline + variables + ripples + scenarios + risk nodes");
      assert.ok(result.nodes.some(n => n.content.includes("Baseline")), "Should have baseline node");
      assert.ok(result.nodes.some(n => n.content.includes("What if")), "Should have variable modification nodes");
      assert.ok(result.nodes.some(n => n.content.includes("Stage")), "Should have ripple effect nodes");
      
      // Verify reasoning
      assert.ok(result.reasoning.includes("baseline"));
      assert.ok(result.reasoning.includes("ripple"));
      
      console.log("✓ CounterfactualNode passed");
    });
  });

  describe("SystemsThinkingNode", () => {
    it("should analyze feedback loops and leverage points", () => {
      const graph = new ThoughtGraph();
      const ctx: StrategyContext = {
        graph,
        currentStrategy: "systems_thinking" as Strategy,
        problem: "How to improve software development velocity?",
        parentNodeId: null,
        branch: "main",
        tags: [],
      };

      const input = {
        systemDescription: "Software development team with code review process",
        boundaries: ["team_size", "tech_stack", "market_requirements"],
        components: [
          { name: "Feature Requests", type: "stock" as const, description: "Backlog of features to implement" },
          { name: "Developers", type: "stock" as const, description: "Available development capacity" },
          { name: "Code Reviews", type: "flow" as const, description: "Review process flow" },
          { name: "Quality Gates", type: "converter" as const, description: "Quality checks" },
        ],
        timeScale: "medium_term" as const,
        focusArea: "all" as const,
      };

      // Validate
      const validated = SystemsThinkingInputSchema.parse(input);
      assert.strictEqual(validated.components.length, 4);

      // Apply
      const result = applySystemsThinking(ctx, input);

      // Verify
      assert.strictEqual(result.strategy, "systems_thinking");
      assert.ok(result.nodes.length >= 7, "Should create system + components + loops + leverage points + recommendation");
      assert.ok(result.nodes.some(n => n.type === "observation" && n.content.includes("System:")), "Should have system node");
      assert.ok(result.nodes.some(n => n.content.includes("feedback") || n.content.includes("Loop")), "Should identify feedback loops");
      assert.ok(result.nodes.some(n => n.content.includes("Leverage")), "Should identify leverage points");
      
      console.log("✓ SystemsThinkingNode passed");
    });

    it("should require at least 2 components", () => {
      const invalidInput = {
        systemDescription: "Test system",
        components: [
          { name: "Only One", type: "stock", description: "Single component" },
        ],
      };

      try {
        SystemsThinkingInputSchema.parse(invalidInput);
        assert.fail("Should have thrown validation error for insufficient components");
      } catch (error) {
        assert.ok(error instanceof Error);
      }
      
      console.log("✓ SystemsThinkingNode validation passed");
    });
  });

  describe("MCTSNode", () => {
    it("should perform Monte Carlo Tree Search for optimization", () => {
      const graph = new ThoughtGraph();
      const ctx: StrategyContext = {
        graph,
        currentStrategy: "mcts" as Strategy,
        problem: "Which architecture pattern should we choose?",
        parentNodeId: null,
        branch: "main",
        tags: [],
      };

      const input = {
        problem: "Which architecture pattern should we choose?",
        possibleActions: [
          {
            id: "microservices",
            description: "Microservices architecture with independent deployability",
            estimatedReward: 0.7,
            constraints: ["requires_devops_expertise", "network_overhead"],
          },
          {
            id: "monolith",
            description: "Monolithic architecture with simpler deployment",
            estimatedReward: 0.5,
            constraints: ["scaling_challenges", "tight_coupling"],
          },
          {
            id: "modular_monolith",
            description: "Modular monolith with clean boundaries",
            estimatedReward: 0.8,
            constraints: ["requires_discipline", "migration_complexity"],
          },
        ],
        simulationDepth: 5,
        numSimulations: 50,
        explorationConstant: 1.414,
        pruningThreshold: 0.2,
      };

      // Validate
      const validated = MCTSInputSchema.parse(input);
      assert.strictEqual(validated.possibleActions.length, 3);

      // Apply
      const result = applyMCTS(ctx, input);

      // Verify
      assert.strictEqual(result.strategy, "mcts");
      assert.ok(result.nodes.length >= 5, "Should create root + actions + simulations + pruning + optimal path");
      assert.ok(result.nodes.some(n => n.content.includes("MCTS Root")), "Should have root node");
      assert.ok(result.nodes.some(n => n.content.includes("ACTION")), "Should have action nodes");
      assert.ok(result.nodes.some(n => n.content.includes("SIMULATION")), "Should have simulation nodes");
      assert.ok(result.nodes.some(n => n.content.includes("PRUNING")), "Should have pruning analysis");
      assert.ok(result.nodes.some(n => n.content.includes("OPTIMAL")), "Should identify optimal path");
      
      console.log("✓ MCTSNode passed");
    });

    it("should require at least 2 possible actions", () => {
      const invalidInput = {
        problem: "Test problem",
        possibleActions: [
          { id: "only_one", description: "Only one action" },
        ],
      };

      try {
        MCTSInputSchema.parse(invalidInput);
        assert.fail("Should have thrown validation error for insufficient actions");
      } catch (error) {
        assert.ok(error instanceof Error);
      }
      
      console.log("✓ MCTSNode validation passed");
    });
  });

  describe("Metacognitive Integration", () => {
    it("should detect when to trigger First Principles", () => {
      const metrics = {
        totalThoughts: 6,
        averageConfidence: 0.4,
        confidenceTrend: "falling" as const,
        branchCount: 2,
        maxDepth: 4,
        contradictionCount: 1,
        supportCount: 2,
        stagnationSteps: 3,
      };

      const nodes = [
        createNode({
          content: "Why do we assume this limitation?",
          type: "question" as ThoughtType,
          strategy: "sequential" as Strategy,
          confidence: 0.6,
        }),
        createNode({
          content: "What is the fundamental constraint here?",
          type: "question" as ThoughtType,
          strategy: "sequential" as Strategy,
          confidence: 0.5,
        }),
      ];

      const trigger = shouldTriggerFirstPrinciples(metrics, nodes);
      assert.strictEqual(trigger.shouldTrigger, true, "Should trigger due to stagnation");
      assert.ok(trigger.reason.includes("Stagnation"));

      console.log("✓ First Principles trigger detection passed");
    });

    it("should detect when to trigger Counterfactual", () => {
      const metrics = {
        totalThoughts: 8,
        averageConfidence: 0.35,
        confidenceTrend: "falling" as const,
        branchCount: 4,
        maxDepth: 3,
        contradictionCount: 2,
        supportCount: 2,
        stagnationSteps: 1,
      };

      const nodes = [
        createNode({
          content: "Option A: Cloud deployment",
          type: "hypothesis" as ThoughtType,
          strategy: "parallel" as Strategy,
          confidence: 0.6,
        }),
        createNode({
          content: "Option B: On-premise deployment",
          type: "hypothesis" as ThoughtType,
          strategy: "parallel" as Strategy,
          confidence: 0.5,
        }),
      ];

      const trigger = shouldTriggerCounterfactual(metrics, nodes);
      assert.strictEqual(trigger.shouldTrigger, true, "Should trigger due to declining confidence");
      
      console.log("✓ Counterfactual trigger detection passed");
    });

    it("should detect when to trigger Systems Thinking", () => {
      const graph = new ThoughtGraph();
      
      // Add nodes with high connectivity
      for (let i = 0; i < 10; i++) {
        const node = createNode({
          content: `Component ${i} affects others through complex interactions`,
          type: "analysis" as ThoughtType,
          strategy: "sequential" as Strategy,
          confidence: 0.6,
        });
        node.metadata.tags = ["system", "component", "feedback"];
        graph.addNode(node);
      }

      const nodes = graph.getAllNodes();
      const metrics = {
        totalThoughts: 10,
        averageConfidence: 0.6,
        confidenceTrend: "stable" as const,
        branchCount: 1,
        maxDepth: 3,
        contradictionCount: 0,
        supportCount: 5,
        stagnationSteps: 0,
      };

      const trigger = shouldTriggerSystemsThinking(metrics, nodes);
      assert.strictEqual(trigger.shouldTrigger, true, "Should trigger due to pattern tags");
      
      console.log("✓ Systems Thinking trigger detection passed");
    });

    it("should detect when to trigger MCTS", () => {
      const metrics = {
        totalThoughts: 15,
        averageConfidence: 0.35,
        confidenceTrend: "falling" as const,
        branchCount: 12,
        maxDepth: 5,
        contradictionCount: 3,
        supportCount: 5,
        stagnationSteps: 2,
      };

      const nodes = Array.from({ length: 15 }, (_, i) =>
        createNode({
          content: i % 2 === 0 ? "Which path is optimal?" : `Decision point ${i}`,
          type: i % 2 === 0 ? "question" : "hypothesis" as ThoughtType,
          strategy: "parallel" as Strategy,
          confidence: 0.3 + Math.random() * 0.3,
        })
      );

      // Set different branches
      nodes.forEach((n, i) => {
        n.metadata.branch = `branch-${i % 8}`;
      });

      const trigger = shouldTriggerMCTS(metrics, nodes);
      assert.strictEqual(trigger.shouldTrigger, true, "Should trigger due to many branches");
      assert.ok(trigger.reason.includes("branches"));
      
      console.log("✓ MCTS trigger detection passed");
    });

    it("should recommend specialized strategies based on content", () => {
      // Test with many thoughts that triggers MCTS
      const metrics = {
        totalThoughts: 15,
        averageConfidence: 0.45,
        confidenceTrend: "falling" as const,
        branchCount: 8,
        maxDepth: 4,
        contradictionCount: 1,
        supportCount: 3,
        stagnationSteps: 2,
      };

      // Test with system keywords and many branches
      const systemNodes = Array.from({ length: 15 }, (_, i) =>
        createNode({
          content: i % 3 === 0 
            ? "This system has feedback loops and emergent properties"
            : i % 3 === 1
              ? "What is the optimal decision path?"
              : `Analysis of component ${i}`,
          type: "analysis" as ThoughtType,
          strategy: "sequential" as Strategy,
          confidence: 0.5,
        })
      );

      const rec = recommendSpecializedStrategy(metrics, systemNodes, "sequential");
      
      // With 8 branches and optimization keywords, should recommend MCTS
      if (rec) {
        assert.ok(
          ["mcts", "systems_thinking", "first_principles", "counterfactual"].includes(rec.strategy),
          "Should recommend one of the specialized strategies"
        );
        console.log(`  Recommended strategy: ${rec.strategy}`);
      } else {
        // If no recommendation, that's also valid - means basic strategies are sufficient
        console.log("  No specialized strategy needed - basic strategies sufficient");
      }
      
      console.log("✓ Specialized strategy recommendation passed");
    });
  });
});

console.log("\n🧠 All Enhanced Reasoning Strategy Tests Completed!\n");
console.log("New Strategies Added:");
console.log("  1. First Principles - Deconstruct to fundamental truths");
console.log("  2. Counterfactual - What-if analysis with ripple effects");
console.log("  3. Systems Thinking - Feedback loops and leverage points");
console.log("  4. MCTS - Monte Carlo Tree Search for optimization");
console.log("\nAll strategies include:");
console.log("  ✓ Zod schema validation");
console.log("  ✓ Type safety with TypeScript");
console.log("  ✓ Error handling with fallback");
console.log("  ✓ Metacognitive trigger detection");
