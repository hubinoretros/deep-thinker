# deep-thinker

[![CI](https://github.com/hubinoretros/deep-thinker/actions/workflows/ci.yml/badge.svg)](https://github.com/hubinoretros/deep-thinker/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/deep-thinker.svg)](https://www.npmjs.com/package/deep-thinker)
[![npm downloads](https://img.shields.io/npm/dt/deep-thinker.svg)](https://www.npmjs.com/package/deep-thinker)
[![license](https://img.shields.io/github/license/hubinoretros/deep-thinker.svg)](https://github.com/hubinoretros/deep-thinker/blob/master/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/hubinoretros/deep-thinker.svg)](https://github.com/hubinoretros/deep-thinker/stargazers)

Advanced cognitive thinking MCP server with DAG-based thought graph, **10 reasoning strategies** (including auto-selection), **17 tools**, node aliases, session persistence, structured responses, and intelligent error handling.

A significant evolution beyond sequential-thinking MCP, providing structured deep reasoning with graph-based thought management, schema validation, and intelligent strategy selection.

## Quick Start

```bash
npx deep-thinker
```

```json
{
  "mcpServers": {
    "deep-thinker": {
      "command": "npx",
      "args": ["-y", "deep-thinker"]
    }
  }
}
```

## Examples

| Example | Strategy | Use Case |
|---------|----------|----------|
| [Architecture Decision](examples/architecture-decision.md) | Dialectic + Parallel | Monolith vs microservices |
| [Debugging Incident](examples/debugging-incident.md) | Abductive | Production 500 errors |
| [Feature Prioritization](examples/feature-prioritization.md) | Parallel + Dialectic | Q3 roadmap planning |
| [Scientific Hypothesis](examples/scientific-hypothesis.md) | Analogical + Abductive | LNP delivery for CRISPR |
| [Breaking Dead Ends](examples/breaking-dead-end.md) | Metacognitive switch | Serverless cost analysis |

## Features

- **DAG-Based Thought Graph** — Thoughts form a directed acyclic graph with branching, merging, and cross-edges (not just a linear chain)
- **10 Reasoning Strategies** — Sequential, Dialectic (thesis→antithesis→synthesis), Parallel, Analogical, Abductive, **First Principles** (deconstruct to fundamentals), **Counterfactual** (what-if with ripple effects), **Systems Thinking** (feedback loops & leverage points), **MCTS** (Monte Carlo optimization), **Auto** (intelligent auto-selection based on content and graph state)
- **Node Aliases** — Use `"last"`, `"best"`, `"root"` instead of cryptic node IDs for any nodeId parameter
- **Structured Responses** — All tool responses return consistent `MCPResponse` JSON with `status`, `summary`, `confidence`, `nextSuggested` action
- **Session Persistence** — Auto-saves thought graph to `~/.deep-thinker/sessions/`; resume across MCP restarts with `reset({ resume: "name" })`
- **Friendly Error Messages** — Zod validation errors translated to human-readable hints (e.g., `"confidence 0 ile 1 arasında..."`)
- **Confidence Scoring** — Multi-factor confidence evaluation with support/contradiction analysis, depth penalties, and knowledge integration boosts
- **Self-Critique** — Automatic critique generation with severity levels and confidence adjustments
- **Metacognitive Engine** — Detects stuck states, stagnation, declining confidence; suggests strategy switches and corrective actions
- **Knowledge Integration** — Attach external knowledge to thoughts, detect gaps, validate consistency across sources
- **Thought Pruning** — Dead-end detection, redundancy removal, deep unproductive branch elimination, path optimization
- **help Tool** — Discover all 17 tools grouped by category (core/advanced/workflow) with quick-start examples
- **conclude Tool** — Comprehensive graph summary with primaryFinding, actionItems, graphHealth, and nextSuggested
- **High-IQ Reasoning Enhancements** — 8 advanced tools: visualization, devil's advocate, cross-disciplinary synthesis, temporal projection, ethical evaluation, emotional intelligence analysis, decision explanation, social impact analysis
- **Emotional Intelligence** — Analyze emotional tone, empathy, persuasion effectiveness, stakeholder emotions
- **Ethical Frameworks** — Evaluate through deontological, consequentialist, virtue ethics, rights-based perspectives
- **Cross-Domain Synthesis** — Combine insights from biology, economics, physics, psychology, computer science, art
- **Temporal Reasoning** — Project thoughts into future/past scenarios with optimistic, pessimistic, realistic, disruptive scenarios
- **Social Impact Modeling** — Analyze stakeholder emotions, group cohesion, persuasion effectiveness, ethical alignment
- **Uncertainty Quantification** — Confidence intervals, probability distributions, sensitivity analysis for robust decisions
- **Multi-Language Support** — Thoughts in English, Turkish, German, French, Spanish, Japanese, Chinese, Russian
- **Meta-Cognitive Layers** — Recursive reasoning across 5 levels of meta-cognition
- **PromptOptimizer (Node Zero)** — Entry point that transforms vague prompts into optimized Super Prompts with automatic strategy routing

## Installation

### Global

```bash
npm install -g deep-thinker
```

### npx (no install)

```bash
npx deep-thinker
```

## MCP Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "deep-thinker": {
      "command": "npx",
      "args": ["-y", "deep-thinker"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "deep-thinker": {
      "command": "deep-thinker"
    }
  }
}
```

### Other MCP Clients

The server communicates over stdio. Point your MCP client to the `deep-thinker` command or `node path/to/dist/index.js`.

## Response Format

All tool responses follow the `MCPResponse` structure:

```json
{
  "status": "ok | error | warning",
  "nodeId": "thought_3",
  "summary": "sequential stratejisiyle \"Should we use microservices?...\" eklendi",
  "confidence": 0.75,
  "data": { "...": "tool-specific data" },
  "nextSuggested": {
    "tool": "evaluate",
    "params": { "critique": true },
    "reason": "Düşük confidence — değerlendirme önerilir"
  },
  "warnings": ["Stuck detected: ..."]
}
```

The `nextSuggested` field always recommends the next logical step, making it easy to chain tool calls without guessing.

## Node Aliases

Instead of looking up cryptic node IDs, use aliases for any `nodeId`, `parentId`, or `targetId` parameter:

| Alias | Resolves To |
|-------|-------------|
| `"last"` | Most recently added node (insertion order) |
| `"best"` | Node with highest confidence score |
| `"root"` | First node with no incoming edges |

```
evaluate({ nodeId: "last" })                              → evaluates the latest thought
simulate_devils_advocate({ nodeId: "best", depth: 2 })    → challenges the strongest thought
graph({ action: "path", nodeId: "root", targetId: "best" }) → traces from root to best conclusion
```

## Session Persistence

Thought graphs are automatically saved after every `think` call. Sessions are stored in `~/.deep-thinker/sessions/`.

```javascript
// Save current session explicitly
reset({ save: true, saveName: "my-analysis" })

// List saved sessions
reset({ listSessions: true })

// Resume a saved session after MCP restart
reset({ resume: "my-analysis" })
```

## Tools

### Core Tools

#### `think`

Add a thought to the cognitive graph using a reasoning strategy.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | The thought content |
| `type` | string | No | Thought type: `hypothesis`, `analysis`, `evidence`, `conclusion`, `question`, `assumption`, `insight`, `critique`, `synthesis`, `observation` |
| `strategy` | string | No | Strategy: `sequential`, `dialectic`, `parallel`, `analogical`, `abductive`, `first_principles`, `counterfactual`, `systems_thinking`, `mcts`, **`auto`** |
| `confidence` | number | No | Initial confidence 0-1 (default: 0.5) |
| `parentId` | string | No | Parent node ID or alias (default: last leaf) |
| `branch` | string | No | Branch name for parallel exploration |
| `tags` | string[] | No | Tags for categorization |
| `edgeTo` | object | No | Explicit edge: `{ targetId, type }` |
| `dialectic` | object | No | Dialectic mode: `{ thesis, antithesis?, synthesis? }` |
| `parallel` | array | No | Parallel mode: `[{ content, type, confidence }]` |
| `analogical` | object | No | Analogical mode: `{ sourceDomain, mapping, projectedConclusion }` |
| `abductive` | object | No | Abductive mode: `{ observation, explanations[], bestExplanation? }` |
| `firstPrinciples` | object | No | First Principles mode: `{ problem, assumptions?, depth?, domain? }` |
| `counterfactual` | object | No | Counterfactual mode: `{ currentState?, variablesToChange, rippleDepth? }` |
| `systemsThinking` | object | No | Systems Thinking mode: `{ systemDescription?, components, focusArea? }` |
| `mcts` | object | No | MCTS mode: `{ problem?, possibleActions, numSimulations? }` |
| `knowledge` | object | No | Attach knowledge: `{ source, content, relevance }` |

**Strategy details:**

| Strategy | Description | Best For |
|----------|-------------|----------|
| **Sequential** | Linear chain: each thought derives from the previous | Step-by-step reasoning |
| **Dialectic** | Thesis → Antithesis → Synthesis pattern to resolve contradictions | Resolving conflicts |
| **Parallel** | Explore multiple independent branches simultaneously | Brainstorming options |
| **Analogical** | Map patterns from a known domain to the current problem | Cross-domain insights |
| **Abductive** | Generate hypotheses and infer the best explanation | Root cause analysis |
| **First Principles** | Deconstruct to fundamental truths, challenge assumptions | Breaking conventions |
| **Counterfactual** | "What-if" scenarios with multi-stage ripple effects | Risk/impact analysis |
| **Systems Thinking** | Feedback loops, leverage points, emergent properties | Complex systems |
| **MCTS** | Monte Carlo Tree Search for optimal decision selection | Optimization problems |
| **Auto** | Automatically selects strategy based on content signals and graph context | Hands-off reasoning |

**How `auto` strategy works:**

The `auto` strategy analyzes your content for keywords and the current graph state:
- Content with "why"/"neden"/"how"/"nasıl" → `abductive`
- Content with "if"/"eğer"/"what if"/"varsayalım" → `counterfactual`
- Content with "vs"/"veya"/"compare"/"karşılaştır" → `dialectic`
- Content with "system"/"sistem"/"loop"/"döngü" → `systems_thinking`
- Content with "fundamental"/"temel"/"assumption"/"varsayım" → `first_principles`
- Low avg confidence + many nodes → `parallel` (break through impasse)
- First thought → `sequential`
- After 4+ sequential thoughts → `dialectic` (introduce opposing view)
- Default → `sequential`

**Edge types:** `derives_from`, `contradicts`, `supports`, `refines`, `challenges`, `synthesizes`, `parallels`, `abstracts`, `instantiates`

#### `evaluate`

Evaluate the thinking process with confidence scoring, critique, and graph health analysis.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | No | Specific node to evaluate (accepts aliases: `last`, `best`, `root`) |
| `critique` | boolean | No | Generate self-critique (default: true) |
| `findGaps` | boolean | No | Find knowledge gaps (default: false) |
| `validateKnowledge` | boolean | No | Validate knowledge consistency (default: false) |

#### `metacog`

Metacognitive operations — monitor and control the thinking process.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `report` = full state, `switch` = change strategy, `auto_update` = let system analyze |
| `strategy` | string | No | New strategy (for `switch` action) |
| `reason` | string | No | Reason for switching (for `switch` action) |

The metacognitive engine automatically:
- Detects stagnation (confidence not improving)
- Detects declining confidence trends
- Detects excessive contradictions
- Suggests strategy switches, pruning, backtracking, or concluding

#### `graph`

Query and visualize the thought graph.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `visualize`, `stats`, `path`, `node`, `branches`, `best_path`, `leaves` |
| `nodeId` | string | No | Node ID or alias (for `path`, `node` actions) |
| `targetId` | string | No | Target ID or alias (for `path` action) |

#### `prune`

Prune and optimize the thought graph.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `analyze` (report only), `prune` (execute), `optimize_path`, `prune_node` |
| `nodeId` | string | No | Node to prune — accepts aliases (for `prune_node`) |
| `reason` | string | No | Reason (for `prune_node`) |

#### `reset`

Reset the thought graph and start a fresh session, save, or resume a saved session.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `problem` | string | No | New problem statement |
| `save` | boolean | No | Save current session before resetting (default: false) |
| `saveName` | string | No | Name for saved session (recommended if save: true) |
| `resume` | string | No | Resume a previously saved session by name |
| `listSessions` | boolean | No | List all saved sessions |

#### `conclude`

Analyze the entire thought graph and produce a comprehensive summary-conclusion with action items and graph health report.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `detailLevel` | string | No | `brief`, `detailed`, `technical` (default: detailed) |
| `includeCounterfactuals` | boolean | No | Include counterfactual analysis (default: false) |
| `format` | string | No | `prose`, `structured`, `executive` (default: structured) |

**Response includes:**
- `primaryFinding` — Top conclusion with confidence
- `supportingEvidence` — Additional high-confidence nodes
- `strategiesUsed` — Which strategies contributed
- `keyInsights` — Insight-type nodes from the best path
- `actionItems` — Prioritized actions derived from conclusions
- `graphHealth` — Node count, dead ends, avg confidence, recommendation
- `nextSuggested` — Logical next step (prune if unhealthy, save if done)

#### `help`

Discover deep-thinker tools and learn usage workflows.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | `all`, `core`, `advanced`, `workflow` (default: all) |

**Categories:**
- **core** — 7 daily-use tools (think, evaluate, metacog, graph, prune, reset, conclude)
- **advanced** — 8 deep-analysis tools (visualization, devil's advocate, cross-disciplinary, temporal, ethical, emotional, explanation, social impact, prompt optimizer)
- **workflow** — 3 recommended workflows:
  - *Quick Decision* — reset → think parallel → evaluate → conclude
  - *Deep Analysis* — reset → first_principles → counterfactual → devil's advocate → evaluate → metacog → prune → conclude
  - *Breaking Dead Ends* — metacog report → switch strategy → cross-disciplinary → abductive

### Enhanced Tools (High-IQ Reasoning)

#### `visualize_thought_graph`

Generate visual representation of the thought graph as SVG or ASCII.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | No | `svg`, `ascii`, or `tree` (default: ascii) |
| `highlightPath` | string | No | Path between two node IDs (format: `fromId-toId`) |
| `showConfidence` | boolean | No | Show confidence scores (default: true) |

#### `simulate_devils_advocate`

Generate counterarguments and opposing viewpoints for a given thought.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Target node ID or alias (`last`, `best`, `root`) |
| `depth` | number | No | Levels of counterarguments (1-5, default: 2) |
| `intensity` | string | No | `mild`, `moderate`, or `aggressive` (default: moderate) |

#### `cross_disciplinary_synthesis`

Combine insights from multiple domains to generate novel perspectives.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sourceDomains` | string[] | Yes | Domains to draw analogies from (e.g., `["biology", "economics", "art"]`) |
| `targetProblem` | string | Yes | Problem to apply cross-domain insights to |
| `maxAnalogies` | number | No | Max analogies to generate (1-10, default: 3) |

#### `temporal_projection`

Project thoughts into future or past scenarios.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Root node ID or alias |
| `years` | number | Yes | Years forward (positive) or backward (negative) |
| `scenario` | string | No | `optimistic`, `pessimistic`, `realistic`, `disruptive` (default: realistic) |

#### `ethical_framework_evaluation`

Evaluate a thought or decision through multiple ethical frameworks.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node ID or alias |
| `frameworks` | string[] | No | Which frameworks: `deontological`, `consequentialist`, `virtue`, `rights_based` (default: all) |

#### `emotional_intelligence_analysis`

Analyze emotional tone, stakeholder emotions, and social dynamics.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Text to analyze for emotional content |
| `context` | string | No | Context (e.g., `team meeting`, `customer feedback`, `crisis situation`) |
| `perspectiveTaking` | number | No | Level of perspective-taking 0-1 (default: 0.7) |

#### `explain_decision`

Generate human-understandable explanation of a decision path.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Decision/conclusion node ID or alias |
| `detailLevel` | string | No | `simple`, `detailed`, `technical` (default: detailed) |
| `includeCounterfactuals` | boolean | No | Show what-if scenarios (default: true) |

#### `social_impact_analysis`

Analyze social impact, stakeholder emotions, group cohesion, and persuasion effectiveness.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node ID or alias |
| `stakeholders` | string[] | No | Stakeholder groups (default: `["customers", "employees", "investors", "community"]`) |

#### `optimize_prompt`

PromptOptimizer (Node Zero) — transform vague prompts into optimized Super Prompts with strategy routing.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `originalPrompt` | string | Yes | User's raw, potentially vague prompt |
| `userContext` | object | No | `{ expertiseLevel, domainKnowledge[], preferences }` |
| `conversationHistory` | array | No | Previous messages for context (max 20) |
| `optimizationLevel` | string | No | `light`, `standard`, `aggressive` (default: standard) |
| `targetModel` | string | No | `claude`, `gpt4`, `gpt35`, `local`, `generic` (default: generic) |
| `autoRoute` | boolean | No | Auto-route to recommended strategy (default: false) |

## Usage Examples

### Auto Strategy Selection (New!)

```
think: { content: "Eğer mikroservis kullansaydık ne olurdu?" }
→ Auto-selects strategy: counterfactual (detected "Eğer" = "if" signal)

think: { content: "Why is the server crashing?" }
→ Auto-selects strategy: abductive (detected "why" signal)

think: { content: "Monolith vs microservices?" }
→ Auto-selects strategy: dialectic (detected "vs" comparison signal)
```

### Sequential Reasoning

```
think: "Should we use microservices?" → type: question, confidence: 0.9
think: "Monolith has deployment bottlenecks" → type: analysis, confidence: 0.7
think: "Team lacks DevOps capacity for microservices" → type: evidence, confidence: 0.8
evaluate: { nodeId: "last", critique: true }
→ { status: "ok", confidence: 0.73, nextSuggested: { tool: "metacog" } }
```

### Dialectic Reasoning

```
think: {
  strategy: "dialectic",
  dialectic: {
    thesis: "Microservices improve scalability",
    antithesis: "But add operational complexity",
    synthesis: "Use modular monolith as middle ground"
  },
  confidence: 0.75
}
```

### Using Node Aliases

```
evaluate({ nodeId: "last" })                              → evaluate latest thought
simulate_devils_advocate({ nodeId: "best", depth: 3 })    → challenge strongest thought
graph({ action: "path", nodeId: "root", targetId: "best" }) → trace reasoning path
think({ parentId: "root", content: "Alternative..." })    → branch from root
```

### Session Save & Resume

```
// Work on a problem...
think({ content: "Analysis...", strategy: "auto" })
think({ content: "Another insight..." })

// Save before closing
reset({ save: true, saveName: "architecture-review" })

// ... MCP restarts ...

// Resume exactly where you left off
reset({ resume: "architecture-review" })
→ { status: "ok", summary: "architecture-review oturumu geri yüklendi — 5 node ile devam ediliyor" }
```

### First Principles Reasoning

```
think: {
  strategy: "first_principles",
  firstPrinciples: {
    problem: "How to improve battery efficiency?",
    assumptions: ["Batteries must use lithium", "Charging takes hours"],
    depth: 3,
    domain: "physics"
  }
}
→ Creates: Problem → Assumptions Challenged → Fundamental Truths → Reconstructed Solution
```

### Counterfactual (What-If) Analysis

```
think: {
  strategy: "counterfactual",
  counterfactual: {
    currentState: "Office-based work with 5-day commute",
    variablesToChange: [
      { variable: "work_location", currentValue: "office", hypotheticalValue: "remote", impactWeight: 0.9 },
      { variable: "commute_days", currentValue: 5, hypotheticalValue: 0, impactWeight: 0.8 }
    ],
    timeHorizon: "medium_term",
    rippleDepth: 3
  }
}
→ Creates: Baseline → Variable Changes → Stage 1/2/3 Ripple Effects → Scenarios → Risk Analysis
```

### Systems Thinking

```
think: {
  strategy: "systems_thinking",
  systemsThinking: {
    systemDescription: "Software development team dynamics",
    components: [
      { name: "FeatureBacklog", type: "stock", description: "Pending work" },
      { name: "DeveloperCapacity", type: "stock", description: "Available developers" },
      { name: "CodeReviews", type: "flow", description: "Review process" },
      { name: "Quality", type: "converter", description: "Quality gates" }
    ],
    focusArea: "feedback_loops"
  }
}
→ Creates: System Overview → Components → Feedback Loops → Leverage Points → Recommendations
```

### MCTS (Monte Carlo Tree Search)

```
think: {
  strategy: "mcts",
  mcts: {
    problem: "Which architecture pattern to choose?",
    possibleActions: [
      { id: "microservices", description: "Microservices architecture", estimatedReward: 0.7 },
      { id: "monolith", description: "Monolithic architecture", estimatedReward: 0.5 },
      { id: "modular", description: "Modular monolith", estimatedReward: 0.8 }
    ],
    numSimulations: 100,
    pruningThreshold: 0.2
  }
}
→ Creates: Root → Actions → Simulations → Pruning Analysis → Optimal Path
```

### Conclude Analysis

```
conclude({ detailLevel: "detailed" })
→ {
  status: "ok",
  summary: "12 dusunce, 3 dal, sequential+counterfactual stratejileriyle analiz tamamlandi",
  data: {
    conclusion: { primaryFinding: "...", confidence: 0.85 },
    actionItems: [{ action: "Investigate...", priority: "high" }, ...],
    graphHealth: { totalThoughts: 12, avgConfidence: 0.72, recommendation: "Graf saglikli gorunuyor" }
  },
  nextSuggested: { tool: "reset", params: { save: true }, reason: "Analizi kaydetmeyi unutmayin" }
}
```

### Metacognitive Guidance

```
metacog: { action: "auto_update" }
→ Stuck detected + suggested action in nextSuggested

metacog: { action: "switch", strategy: "parallel", reason: "Break through impasse" }
→ Strategy switched + next step recommended
```

### Pruning

```
prune: { action: "analyze" }
→ Dead Ends, Redundant Branches, Total prunable count

prune: { action: "prune" }
→ Nodes pruned + metacog updated + nextSuggested
```

### Getting Help

```
help()                    → all tools, all categories, all workflows
help({ category: "core" })     → 7 core tools with quick-start examples
help({ category: "advanced" }) → 9 advanced tools
help({ category: "workflow" }) → 3 recommended workflows
```

## Friendly Error Messages

When validation fails, you get human-readable errors instead of raw Zod output:

```
think({ confidence: 1.5 })
→ {
  status: "error",
  error: "VALIDATION_ERROR",
  message: "\"confidence\" parametresinde hata: ...",
  field: "confidence",
  hint: "confidence 0 ile 1 arasında bir sayı olmalı. Örnek: confidence: 0.7"
}

evaluate({ nodeId: "nonexistent" })
→ {
  status: "error",
  error: "NODE_NOT_FOUND",
  provided: "nonexistent",
  hint: "Geçerli alias'lar: \"last\", \"best\", \"root\" veya graph aracıyla node ID alın"
}
```

## Architecture

```
src/
├── index.ts                         MCP server & 17 tool handlers
├── test.ts                          Core functionality tests (118 tests)
├── test_enhanced_strategies.ts      Strategy tests (13 tests)
├── core/
│   ├── types.ts                     Type definitions, MCPResponse, NextAction
│   ├── schemas.ts                   Zod validation schemas (10 strategies incl. auto)
│   ├── node.ts                      ThoughtNode CRUD operations
│   ├── graph.ts                     DAG-based thought graph + resolveNodeId + aliases
│   ├── strategies.ts               10 reasoning strategies + selectStrategy (auto)
│   ├── scorer.ts                    Confidence scoring & self-critique
│   ├── metacog.ts                   Metacognitive engine with smart triggers
│   ├── knowledge.ts                 Knowledge integration & validation
│   ├── pruner.ts                    Dead-end/redundancy detection & pruning
│   ├── session.ts                   Session persistence (save/load/resume)
│   └── errors.ts                    Friendly error formatting (Zod + unknown)
└── enhancements/
    ├── visualization.ts            SVG & ASCII graph visualization
    ├── devils_advocate.ts           Counterargument generation
    ├── cross_disciplinary.ts        Cross-domain analogy engine
    ├── temporal_projection.ts       Future/past thought projection
    ├── ethical_evaluation.ts         4 ethical frameworks
    ├── emotional_intelligence.ts    Emotion & sentiment analysis
    ├── explanation.ts               Decision explainability
    └── social_impact.ts             Stakeholder & social impact
```

## What's New in v3.0.0

| Feature | Description |
|---------|-------------|
| **Node Aliases** | Use `"last"`, `"best"`, `"root"` instead of node IDs for all nodeId params |
| **MCPResponse** | Structured JSON responses with `status`, `summary`, `confidence`, `nextSuggested` |
| **Session Persistence** | Auto-save to `~/.deep-thinker/sessions/`, resume across restarts |
| **Friendly Errors** | Zod errors → human-readable hints with field-specific guidance |
| **help Tool** | 3-category tool discovery with workflow examples |
| **conclude Tool** | Graph summary with primaryFinding, actionItems, graphHealth |
| **strategy: auto** | Automatic strategy selection based on content keywords + graph state |

## Comparison with sequential-thinking

| Feature | sequential-thinking | deep-thinker |
|---------|-------------------|--------------|
| Thought structure | Linear chain | DAG (branch/merge/cross-edges) |
| Strategies | Sequential only | **10 strategies** (incl. auto-selection) |
| Schema Validation | None | **Zod schemas for all strategies** |
| Confidence | Basic thought number | Multi-factor scoring with trend analysis |
| Self-critique | None | Automatic with severity levels |
| Metacognition | None | Stuck detection, smart strategy triggers, auto-switching |
| Knowledge | None | External references, gap detection, consistency validation |
| Pruning | None | Dead-end, redundancy, path optimization |
| Graph queries | Linear review | Visualization, best path, branch analysis, statistics |
| Node references | By ID only | **Aliases: last, best, root** |
| Response format | Plain text | **Structured MCPResponse with nextSuggested** |
| Session persistence | None | **Auto-save, save/load/resume** |
| Error messages | Raw errors | **Human-readable with hints** |
| Tool discovery | None | **help tool with categories & workflows** |
| Conclusion | Manual review | **conclude tool with actionItems** |
| Strategy selection | Manual only | **auto strategy based on content** |

## Development

```bash
git clone https://github.com/hubinoretros/deep-thinker.git
cd deep-thinker
npm install
npm run build
npm start
```

## Testing

```bash
npm run build
npm test
```

131 tests covering all modules: Node, Graph, 10 Strategies (including auto), Scorer, Metacog, Knowledge, Pruner, Integration, Edge Cases, Schema Validation.

## Documentation

- [Architecture Deep Dive](docs/architecture.md) — how the DAG, scoring, metacog, and pruning work internally
- [Strategy Selection Guide](docs/strategy-guide.md) — when to use each strategy and how to combine them

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. PRs welcome — especially new reasoning strategies and MCP tool ideas.

## License

MIT
