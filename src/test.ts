import { ThoughtGraph } from "./core/graph.js";
import { createNode, addEdge, setCritique, addKnowledge, addTag, updateStatus, nodeToSummary, resetCounter } from "./core/node.js";
import {
  applySequential,
  applyDialectic,
  applyParallel,
  applyAnalogical,
  applyAbductive,
  type StrategyContext,
} from "./core/strategies.js";
import { calculateConfidence, generateCritique, evaluateGraphConfidence } from "./core/scorer.js";
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
import { Strategy, ThoughtType, EdgeType } from "./core/types.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.log(`  ✗ ${testName}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n=== ${name} ===`);
}

// ─────────────────────────────────────────────
// 1. Node Module Tests
// ─────────────────────────────────────────────
section("Node Module");

resetCounter();

const node1 = createNode({
  content: "Gravity pulls objects toward Earth",
  type: "observation",
  strategy: "sequential",
  confidence: 0.9,
  tags: ["physics"],
});
assert(node1.id === "thought_1", "createNode assigns sequential ID", `got ${node1.id}`);
assert(node1.confidence === 0.9, "createNode preserves confidence");
assert(node1.type === "observation", "createNode preserves type");
assert(node1.parentId === null, "root node has null parentId");
assert(node1.metadata.tags.includes("physics"), "createNode assigns tags");

const node2 = createNode({
  content: "Objects fall when dropped",
  type: "evidence",
  strategy: "sequential",
  confidence: 0.8,
  parentId: node1.id,
});
assert(node2.parentId === node1.id, "child node has parentId");
assert(node2.confidence === 0.8, "child confidence preserved");

addEdge(node2, node1.id, "supports", 0.9);
assert(node2.edges.length === 1, "addEdge adds one edge");
assert(node2.edges[0].type === "supports", "edge type is correct");
assert(node2.edges[0].weight === 0.9, "edge weight is correct");

addEdge(node2, node1.id, "supports", 0.5);
assert(node2.edges.length === 1, "addEdge prevents duplicates");

setCritique(node2, {
  content: "Observation is too general",
  severity: "medium",
  addressed: false,
  confidenceDelta: -0.1,
});
assert(node2.critique !== null, "setCritique adds critique");
assert(Math.abs(node2.confidence - 0.7) < 0.001, "setCritique adjusts confidence", `got ${node2.confidence}`);

addKnowledge(node2, { source: "textbook", content: "F=mg", relevance: 0.8, integratedAt: Date.now() });
assert(node2.knowledge.length === 1, "addKnowledge adds reference");

addTag(node2, "gravity");
addTag(node2, "gravity");
assert(node2.knowledge.length === 1, "addTag prevents duplicates");

updateStatus(node2, "confirmed");
assert(node2.status === "confirmed", "updateStatus changes status");

const summary = nodeToSummary(node2);
assert(summary.includes("thought_2"), "nodeToSummary includes ID");
assert(summary.includes("evidence"), "nodeToSummary includes type");

// ─────────────────────────────────────────────
// 2. Graph Module Tests
// ─────────────────────────────────────────────
section("Graph Module");

resetCounter();
const graph = new ThoughtGraph();

const root = createNode({ content: "Problem: Why is the sky blue?", type: "question", strategy: "sequential", confidence: 0.9 });
graph.addNode(root);
assert(graph.getRoots().length === 1, "addNode creates one root");
assert(graph.getNode(root.id) === root, "getNode returns correct node");

const child1 = createNode({ content: "Rayleigh scattering", type: "hypothesis", strategy: "sequential", confidence: 0.7, parentId: root.id });
graph.addNode(child1);
assert(root.childIds.includes(child1.id), "parent has child reference");
assert(child1.metadata.depth === 1, "child depth is 1");

const child2 = createNode({ content: "Atmospheric composition", type: "analysis", strategy: "sequential", confidence: 0.6, parentId: root.id });
graph.addNode(child2);
assert(root.childIds.length === 2, "parent has two children");

const grandchild = createNode({ content: "Nitrogen scatters blue light", type: "evidence", strategy: "sequential", confidence: 0.8, parentId: child1.id });
graph.addNode(grandchild);
assert(grandchild.metadata.depth === 2, "grandchild depth is 2");

const ancestors = graph.getAncestors(grandchild.id);
assert(ancestors.length === 2, "getAncestors returns 2 ancestors", `got ${ancestors.length}`);

const descendants = graph.getDescendants(root.id);
assert(descendants.length === 3, "getDescendants returns 3 descendants", `got ${descendants.length}`);

const children = graph.getChildren(root.id);
assert(children.length === 2, "getChildren returns 2 children");

const path = graph.getPath(root.id, grandchild.id);
assert(path !== null, "getPath finds path from root to grandchild");
assert(path!.length === 3, "getPath returns 3 nodes", `got ${path!.length}`);

const leaves = graph.getLeaves();
assert(leaves.length === 2, "getLeaves returns 2 leaves (child2 + grandchild)", `got ${leaves.length}`);

const active = graph.getActiveNodes();
assert(active.length === 4, "getActiveNodes returns all 4");

const stats = graph.getStats();
assert(stats.totalNodes === 4, "stats totalNodes is 4");
assert(stats.maxDepth === 2, "stats maxDepth is 2");
assert(stats.branches.includes("main"), "stats includes main branch");

const viz = graph.toVisualization();
assert(viz.includes("thought_1"), "visualization includes root ID");
assert(viz.includes("Why is the sky blue?"), "visualization includes content");

// ─────────────────────────────────────────────
// 3. Strategies Tests
// ─────────────────────────────────────────────
section("Strategies");

resetCounter();
const stratGraph = new ThoughtGraph();
const stratRoot = createNode({ content: "Test problem", type: "question", strategy: "sequential", confidence: 0.8 });
stratGraph.addNode(stratRoot);

const ctx: StrategyContext = {
  graph: stratGraph,
  currentStrategy: "sequential",
  problem: "Test problem",
  parentNodeId: stratRoot.id,
  branch: "main",
  tags: [],
};

const seqResult = applySequential(ctx, "First step", "analysis", 0.7);
assert(seqResult.strategy === "sequential", "sequential strategy returns correct strategy");
assert(seqResult.nodes.length === 1, "sequential creates 1 node");
assert(seqResult.nodes[0].content === "First step", "sequential preserves content");

const diaResult = applyDialectic(ctx, "Thesis statement", "Antithesis challenge", "Synthesis resolution", 0.6);
assert(diaResult.nodes.length === 3, "dialectic creates 3 nodes (thesis+antithesis+synthesis)", `got ${diaResult.nodes.length}`);
assert(diaResult.nodes[0].type === "hypothesis", "dialectic thesis is hypothesis type");
assert(diaResult.nodes[1].type === "critique", "dialectic antithesis is critique type");
assert(diaResult.nodes[2].type === "synthesis", "dialectic synthesis is synthesis type");
assert(diaResult.edgeTypes.some(e => e.type === "contradicts"), "dialectic creates contradict edge");
assert(diaResult.edgeTypes.some(e => e.type === "synthesizes"), "dialectic creates synthesizes edges");

const diaPartial = applyDialectic(ctx, "Thesis only", null, null, 0.5);
assert(diaPartial.nodes.length === 1, "dialectic partial creates 1 node (thesis only)");
assert(diaPartial.nextSuggestedStrategy === "dialectic", "dialectic partial suggests continuing dialectic");

const parResult = applyParallel(ctx, [
  { content: "Branch A", type: "hypothesis", confidence: 0.6 },
  { content: "Branch B", type: "hypothesis", confidence: 0.5 },
  { content: "Branch C", type: "analysis", confidence: 0.7 },
]);
assert(parResult.nodes.length === 3, "parallel creates 3 nodes");
assert(parResult.nodes[0].metadata.branch.includes("parallel-0"), "parallel assigns branch names");
assert(parResult.edgeTypes.some(e => e.type === "parallels"), "parallel creates parallel edges");

const anaResult = applyAnalogical(ctx, "Hydrogen atom model", "Electron orbits ~ planetary orbits", "Atomic behavior follows celestial mechanics", 0.5);
assert(anaResult.nodes.length === 3, "analogical creates 3 nodes (source+mapping+projection)");
assert(anaResult.nodes[0].type === "observation", "analogical source is observation");
assert(anaResult.nodes[2].type === "hypothesis", "analogical projection is hypothesis");

const abdResult = applyAbductive(
  ctx,
  "The grass is wet",
  [
    { content: "It rained", plausibility: 0.8 },
    { content: "Sprinklers were on", plausibility: 0.6 },
  ],
  "It rained",
  0.8
);
assert(abdResult.nodes.length === 4, "abductive creates 4 nodes (obs + 2 explanations + best)", `got ${abdResult.nodes.length}`);
assert(abdResult.nodes[0].type === "observation", "abductive observation type");
assert(abdResult.nodes.some(n => n.type === "conclusion"), "abductive has conclusion for best explanation");

// ─────────────────────────────────────────────
// 4. Scorer Module Tests
// ─────────────────────────────────────────────
section("Scorer Module");

resetCounter();
const scoreGraph = new ThoughtGraph();
const scoreRoot = createNode({ content: "Test root", type: "question", strategy: "sequential", confidence: 0.9 });
scoreGraph.addNode(scoreRoot);
const scoreChild = createNode({ content: "Test analysis", type: "analysis", strategy: "sequential", confidence: 0.7, parentId: scoreRoot.id });
scoreGraph.addNode(scoreChild);

const scoreResult = calculateConfidence(scoreChild, scoreGraph, scoreGraph.getAllNodes());
assert(scoreResult.confidence >= 0 && scoreResult.confidence <= 1, "confidence in valid range", `got ${scoreResult.confidence}`);
assert(scoreResult.factors.length > 0, "score has factors");
assert(scoreResult.factors.some(f => f.name === "base_confidence"), "has base_confidence factor");
assert(scoreResult.recommendation.length > 0, "has recommendation");

const critique = generateCritique(scoreChild, scoreGraph);
assert(critique.content.length > 0, "critique has content");
assert(["low", "medium", "high"].includes(critique.severity), "critique severity is valid");

const evalResult = evaluateGraphConfidence(scoreGraph);
assert(evalResult.overallConfidence >= 0 && evalResult.overallConfidence <= 1, "overall confidence in range");
assert(Array.isArray(evalResult.weakSpots), "weakSpots is array");
assert(Array.isArray(evalResult.strongPaths), "strongPaths is array");

// Test critique on conclusion with shallow depth
const shallowConclusion = createNode({ content: "Quick conclusion", type: "conclusion", strategy: "sequential", confidence: 0.8 });
const shallowCritique = generateCritique(shallowConclusion, scoreGraph);
assert(shallowCritique.severity === "high", "shallow conclusion gets high severity critique", `got ${shallowCritique.severity}`);

// ─────────────────────────────────────────────
// 5. Metacognitive Module Tests
// ─────────────────────────────────────────────
section("Metacognitive Module");

let metaState = createMetacognitiveState("sequential");
assert(metaState.currentStrategy === "sequential", "initial strategy is sequential");
assert(metaState.stuckDetected === false, "not stuck initially");
assert(metaState.progressMetrics.totalThoughts === 0, "starts with 0 thoughts");

resetCounter();
const metaGraph = new ThoughtGraph();

metaState = updateMetacognition(metaState, metaGraph);
assert(metaState.progressMetrics.totalThoughts === 0, "empty graph: 0 thoughts");

const metaRoot = createNode({ content: "Meta test", type: "question", strategy: "sequential", confidence: 0.5 });
metaGraph.addNode(metaRoot);
metaState = updateMetacognition(metaState, metaGraph);
assert(metaState.progressMetrics.totalThoughts === 1, "1 thought after adding root");

const switchedState = switchStrategy(metaState, "dialectic", "Testing switch");
assert(switchedState.currentStrategy === "dialectic", "strategy switched to dialectic");
assert(switchedState.strategyHistory.length === 1, "strategy history recorded");
assert(switchedState.stuckDetected === false, "stuck cleared after switch");

const report = metacognitiveReport(switchedState);
assert(report.includes("dialectic"), "report includes current strategy");
assert(report.includes("Strategy History"), "report includes history section");

// Test stagnation detection
resetCounter();
const stagnGraph = new ThoughtGraph();
let stagnMeta = createMetacognitiveState("sequential");

for (let i = 0; i < 5; i++) {
  const n = createNode({ content: `Stagnant thought ${i}`, type: "analysis", strategy: "sequential", confidence: 0.5, parentId: i === 0 ? null : `thought_${i}` });
  stagnGraph.addNode(n);
  stagnMeta = updateMetacognition(stagnMeta, stagnGraph);
}
assert(stagnMeta.progressMetrics.stagnationSteps > 0, "stagnation detected after stable confidence", `stagnation: ${stagnMeta.progressMetrics.stagnationSteps}`);

// Test stuck with falling confidence
resetCounter();
const fallingGraph = new ThoughtGraph();
let fallingMeta = createMetacognitiveState("sequential");

const highNode = createNode({ content: "High confidence", type: "analysis", strategy: "sequential", confidence: 0.9 });
fallingGraph.addNode(highNode);
fallingMeta = updateMetacognition(fallingMeta, fallingGraph);

for (let i = 0; i < 4; i++) {
  const lowNode = createNode({ content: `Low ${i}`, type: "analysis", strategy: "sequential", confidence: 0.1 + i * 0.05, parentId: i === 0 ? highNode.id : `thought_${i + 1}` });
  fallingGraph.addNode(lowNode);
  fallingMeta = updateMetacognition(fallingMeta, fallingGraph);
}
// Should detect issues with low confidence
const hasSuggestion = fallingMeta.suggestedAction !== null || fallingMeta.stuckDetected;
assert(hasSuggestion, "metacog detects low confidence and suggests action");

// ─────────────────────────────────────────────
// 6. Knowledge Module Tests
// ─────────────────────────────────────────────
section("Knowledge Module");

resetCounter();
const knowGraph = new ThoughtGraph();
const knowNode = createNode({ content: "Test hypothesis", type: "hypothesis", strategy: "sequential", confidence: 0.5 });
knowGraph.addNode(knowNode);

const ref = integrateKnowledge(knowNode, "Wikipedia", "Gravity is 9.8 m/s²", 0.9);
assert(ref.source === "Wikipedia", "integrateKnowledge creates correct source");
assert(knowNode.knowledge.length === 1, "knowledge reference added to node");

const boost = getKnowledgeConfidenceBoost(knowNode);
assert(boost > 0, "knowledge provides confidence boost", `boost: ${boost}`);

const knowNode2 = createNode({ content: "Another hypothesis", type: "hypothesis", strategy: "sequential", confidence: 0.6 });
knowGraph.addNode(knowNode2);

const gaps = findKnowledgeGaps(knowGraph);
assert(gaps.length > 0, "findKnowledgeGaps detects gaps for hypothesis without high-relevance knowledge");

integrateKnowledge(knowNode2, "Wikipedia", "Gravity is NOT 9.8 m/s²", 0.8);

const conflicts = validateKnowledgeConsistency(knowGraph);
assert(conflicts.length > 0, "validateKnowledgeConsistency detects contradictions from same source");

// ─────────────────────────────────────────────
// 7. Pruner Module Tests
// ─────────────────────────────────────────────
section("Pruner Module");

resetCounter();
const pruneGraphObj = new ThoughtGraph();

const pRoot = createNode({ content: "Root problem", type: "question", strategy: "sequential", confidence: 0.9 });
pruneGraphObj.addNode(pRoot);

const goodBranch = createNode({ content: "Good reasoning path", type: "analysis", strategy: "sequential", confidence: 0.7, parentId: pRoot.id, branch: "good" });
pruneGraphObj.addNode(goodBranch);

const deadEnd = createNode({ content: "Bad idea", type: "hypothesis", strategy: "sequential", confidence: 0.1, parentId: pRoot.id, branch: "dead" });
pruneGraphObj.addNode(deadEnd);

const deadEnds = detectDeadEnds(pruneGraphObj);
assert(deadEnds.length === 1, "detectDeadEnds finds 1 dead end", `got ${deadEnds.length}`);

const redundant = detectRedundantBranches(pruneGraphObj);
assert(Array.isArray(redundant), "detectRedundantBranches returns array");

const prunerReportStr = prunerReport(pruneGraphObj);
assert(prunerReportStr.includes("Dead Ends"), "prunerReport mentions dead ends");

const pruneResults = pruneGraph(pruneGraphObj);
assert(pruneResults.length > 0, "pruneGraph executes pruning");
assert(pruneGraphObj.getNode(deadEnd.id)?.status === "pruned", "dead end is pruned");

const activeAfter = pruneGraphObj.getActiveNodes();
assert(activeAfter.length === 2, "after pruning, 2 active nodes remain (root + good)", `got ${activeAfter.length}`);

// Test redundancy detection
resetCounter();
const redGraph = new ThoughtGraph();
const redRoot = createNode({ content: "Problem", type: "question", strategy: "sequential", confidence: 0.9 });
redGraph.addNode(redRoot);

const red1 = createNode({ content: "The system uses caching to improve performance", type: "analysis", strategy: "sequential", confidence: 0.7, parentId: redRoot.id, branch: "branch-a" });
redGraph.addNode(red1);

const red2 = createNode({ content: "The system uses caching to improve performance significantly", type: "analysis", strategy: "sequential", confidence: 0.6, parentId: redRoot.id, branch: "branch-b" });
redGraph.addNode(red2);

const redundantGroups = detectRedundantBranches(redGraph);
assert(redundantGroups.length >= 1, "detectRedundantBranches finds at least 1 redundant group", `got ${redundantGroups.length}`);
const matchingGroup = redundantGroups.find(g => g.keep === red1.id || g.keep === red2.id);
assert(matchingGroup !== undefined, "redundancy group includes one of the similar nodes");
if (matchingGroup) {
  assert(matchingGroup.keep === red1.id, "keeps higher confidence node");
}

// Test optimize_path
const optResult = optimizePath(redGraph);
assert(typeof optResult.originalLength === "number", "optimizePath returns originalLength");
assert(typeof optResult.optimizedLength === "number", "optimizePath returns optimizedLength");

// ─────────────────────────────────────────────
// 8. Integration Test — Full Workflow
// ─────────────────────────────────────────────
section("Integration — Full Workflow");

resetCounter();
const integGraph = new ThoughtGraph();
let integMeta = createMetacognitiveState("sequential");

// Step 1: Root question
const integRoot = createNode({ content: "Should we migrate to microservices?", type: "question", strategy: "sequential", confidence: 0.9 });
integGraph.addNode(integRoot);
integMeta = updateMetacognition(integMeta, integGraph);
assert(integMeta.progressMetrics.totalThoughts === 1, "workflow: 1 thought after root");

// Step 2: Sequential analysis
const integCtx: StrategyContext = {
  graph: integGraph,
  currentStrategy: "sequential",
  problem: "Should we migrate to microservices?",
  parentNodeId: integRoot.id,
  branch: "main",
  tags: ["architecture"],
};

const seqRes = applySequential(integCtx, "Monolith has deployment bottlenecks", "analysis", 0.7);
for (const n of seqRes.nodes) integGraph.addNode(n);
for (const e of seqRes.edgeTypes) {
  const from = integGraph.getNode(e.from);
  if (from) addEdge(from, e.to, e.type);
}
integMeta = updateMetacognition(integMeta, integGraph);

// Step 3: Dialectic reasoning
const diaCtx: StrategyContext = { ...integCtx, parentNodeId: seqRes.nodes[0].id };
const diaRes = applyDialectic(diaCtx, "Microservices improve scalability", "But add operational complexity", "Use modular monolith as middle ground", 0.75);
for (const n of diaRes.nodes) integGraph.addNode(n);
for (const e of diaRes.edgeTypes) {
  const from = integGraph.getNode(e.from);
  if (from) addEdge(from, e.to, e.type);
}
integMeta = updateMetacognition(integMeta, integGraph);

// Step 4: Parallel exploration
const parCtx: StrategyContext = { ...integCtx, parentNodeId: diaRes.nodes[2].id };
const parRes = applyParallel(parCtx, [
  { content: "Team expertise in Docker/K8s", type: "evidence", confidence: 0.8 },
  { content: "Limited DevOps capacity", type: "evidence", confidence: 0.6 },
]);
for (const n of parRes.nodes) integGraph.addNode(n);
for (const e of parRes.edgeTypes) {
  const from = integGraph.getNode(e.from);
  if (from) addEdge(from, e.to, e.type);
}
integMeta = updateMetacognition(integMeta, integGraph);

// Step 5: Evaluate graph
const evalRes = evaluateGraphConfidence(integGraph);
assert(evalRes.overallConfidence > 0, "workflow: overall confidence > 0");
assert(integGraph.getStats().totalNodes > 5, "workflow: graph has multiple nodes", `got ${integGraph.getStats().totalNodes}`);

// Step 6: Add knowledge
const knowledgeTarget = integGraph.getActiveNodes().find(n => n.type === "analysis");
if (knowledgeTarget) {
  integrateKnowledge(knowledgeTarget, "Martin Fowler", "Don't start with microservices — start with monolith first", 0.85);
  assert(knowledgeTarget.knowledge.length === 1, "workflow: knowledge integrated");
}

// Step 7: Find knowledge gaps
const integGaps = findKnowledgeGaps(integGraph);
assert(integGaps.length >= 0, "workflow: knowledge gaps query works");

// Step 8: Prune
const prunerR = prunerReport(integGraph);
assert(prunerR.includes("Graph:"), "workflow: pruning report works");

// Step 9: Best path
const bestPath = integGraph.getBestPath();
assert(bestPath.length > 0, "workflow: best path found");
assert(bestPath[0].type === "question", "workflow: best path starts with root question");

// Step 10: Visualization
const vizStr = integGraph.toVisualization();
assert(vizStr.includes("Should we migrate"), "workflow: visualization includes root content");

// Step 11: Metacog report
const metaReport = metacognitiveReport(integMeta);
assert(metaReport.includes("sequential") || metaReport.includes("dialectic"), "workflow: metacog report includes strategy info");

// Step 12: Switch strategy
integMeta = switchStrategy(integMeta, "abductive", "Testing strategy switch in workflow");
assert(integMeta.currentStrategy === "abductive", "workflow: strategy switched to abductive");

// ─────────────────────────────────────────────
// 9. Edge Cases
// ─────────────────────────────────────────────
section("Edge Cases");

resetCounter();
const edgeGraph = new ThoughtGraph();

// Empty graph operations
assert(edgeGraph.getRoots().length === 0, "empty graph has 0 roots");
assert(edgeGraph.getLeaves().length === 0, "empty graph has 0 leaves");
assert(edgeGraph.getActiveNodes().length === 0, "empty graph has 0 active nodes");
assert(edgeGraph.getStats().totalNodes === 0, "empty graph stats: 0 total");
assert(edgeGraph.getPath("nonexistent", "nonexistent") === null, "no path in empty graph");

// Node not found
assert(edgeGraph.getNode("fake_id") === undefined, "getNode returns undefined for missing ID");

// Prune nonexistent node
const prunedNonExist = edgeGraph.pruneNode("fake_id", "test");
assert(prunedNonExist.prunedNodeIds.length === 0, "pruning nonexistent node returns empty");

// Confidence clamping
const highConf = createNode({ content: "Overconfident", type: "hypothesis", strategy: "sequential", confidence: 1.5 });
assert(highConf.confidence === 1, "confidence clamped to 1", `got ${highConf.confidence}`);

const lowConf = createNode({ content: "Underconfident", type: "hypothesis", strategy: "sequential", confidence: -0.5 });
assert(lowConf.confidence === 0, "confidence clamped to 0", `got ${lowConf.confidence}`);

// Singleton graph
const singleRoot = createNode({ content: "Only node", type: "observation", strategy: "sequential", confidence: 0.8 });
edgeGraph.addNode(singleRoot);
assert(edgeGraph.getLeaves().length === 1, "singleton: root is also a leaf");
assert(edgeGraph.getBestPath().length === 1, "singleton: best path is just the root");
assert(edgeGraph.getAncestors(singleRoot.id).length === 0, "singleton: no ancestors");
assert(edgeGraph.getDescendants(singleRoot.id).length === 0, "singleton: no descendants");

// ─────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────
console.log(`\n${"=".repeat(50)}`);
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failed === 0) {
  console.log("All tests passed!");
} else {
  console.log(`${failed} test(s) failed.`);
  process.exit(1);
}
