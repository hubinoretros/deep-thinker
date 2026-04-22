# deep-thinker

[![CI](https://github.com/hubinoretros/deep-thinker/actions/workflows/ci.yml/badge.svg)](https://github.com/hubinoretros/deep-thinker/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/deep-thinker.svg)](https://www.npmjs.com/package/deep-thinker)
[![npm downloads](https://img.shields.io/npm/dt/deep-thinker.svg)](https://www.npmjs.com/package/deep-thinker)
[![license](https://img.shields.io/github/license/hubinoretros/deep-thinker.svg)](https://github.com/hubinoretros/deep-thinker/blob/master/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/hubinoretros/deep-thinker.svg)](https://github.com/hubinoretros/deep-thinker/stargazers)

Advanced cognitive thinking MCP server with DAG-based thought graph, multiple reasoning strategies, metacognition, and self-evaluation.

A significant evolution beyond sequential-thinking MCP, providing structured deep reasoning with graph-based thought management.

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
- **5 Reasoning Strategies** — Sequential, Dialectic (thesis→antithesis→synthesis), Parallel, Analogical, Abductive (inference to best explanation)
- **Confidence Scoring** — Multi-factor confidence evaluation with support/contradiction analysis, depth penalties, and knowledge integration boosts
- **Self-Critique** — Automatic critique generation with severity levels and confidence adjustments
- **Metacognitive Engine** — Detects stuck states, stagnation, declining confidence; suggests strategy switches and corrective actions
- **Knowledge Integration** — Attach external knowledge to thoughts, detect gaps, validate consistency across sources
- **Thought Pruning** — Dead-end detection, redundancy removal, deep unproductive branch elimination, path optimization
- **High-IQ Reasoning Enhancements** — 8 new tools for advanced cognition: visualization, devil's advocate, cross-disciplinary synthesis, temporal projection, ethical evaluation, emotional intelligence analysis, decision explanation, social impact analysis
- **Emotional Intelligence** — Analyze emotional tone, empathy, persuasion effectiveness, stakeholder emotions
- **Ethical Frameworks** — Evaluate through deontological, consequentialist, virtue ethics, rights-based perspectives
- **Cross-Domain Synthesis** — Combine insights from biology, economics, physics, psychology, computer science, art
- **Temporal Reasoning** — Project thoughts into future/past scenarios with optimistic, pessimistic, realistic, disruptive scenarios
- **Social Impact Modeling** — Analyze stakeholder emotions, group cohesion, persuasion effectiveness, ethical alignment
- **Uncertainty Quantification** — Confidence intervals, probability distributions, sensitivity analysis for robust decisions
- **Multi-Language Support** — Thoughts in English, Turkish, German, French, Spanish, Japanese, Chinese, Russian
- **Meta-Cognitive Layers** — Recursive reasoning across 5 levels of meta-cognition

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

## Tools

### `think`

Add a thought to the cognitive graph using a reasoning strategy.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content` | string | Yes | The thought content |
| `type` | string | No | Thought type: `hypothesis`, `analysis`, `evidence`, `conclusion`, `question`, `assumption`, `insight`, `critique`, `synthesis`, `observation` |
| `strategy` | string | No | Strategy: `sequential`, `dialectic`, `parallel`, `analogical`, `abductive` |
| `confidence` | number | No | Initial confidence 0-1 (default: 0.5) |
| `parentId` | string | No | Parent node ID (default: last leaf) |
| `branch` | string | No | Branch name for parallel exploration |
| `tags` | string[] | No | Tags for categorization |
| `edgeTo` | object | No | Explicit edge: `{ targetId, type }` |
| `dialectic` | object | No | Dialectic mode: `{ thesis, antithesis?, synthesis? }` |
| `parallel` | array | No | Parallel mode: `[{ content, type, confidence }]` |
| `analogical` | object | No | Analogical mode: `{ sourceDomain, mapping, projectedConclusion }` |
| `abductive` | object | No | Abductive mode: `{ observation, explanations[], bestExplanation? }` |
| `knowledge` | object | No | Attach knowledge: `{ source, content, relevance }` |

**Strategy details:**

- **Sequential** — Linear chain: each thought derives from the previous
- **Dialectic** — Thesis → Antithesis → Synthesis pattern to resolve contradictions
- **Parallel** — Explore multiple independent branches simultaneously
- **Analogical** — Map patterns from a known domain to the current problem
- **Abductive** — Generate hypotheses and infer the best explanation

**Edge types:** `derives_from`, `contradicts`, `supports`, `refines`, `challenges`, `synthesizes`, `parallels`, `abstracts`, `instantiates`

### `evaluate`

Evaluate the thinking process with confidence scoring, critique, and graph health analysis.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | No | Specific node to evaluate (default: entire graph) |
| `critique` | boolean | No | Generate self-critique (default: true) |
| `findGaps` | boolean | No | Find knowledge gaps (default: false) |
| `validateKnowledge` | boolean | No | Validate knowledge consistency (default: false) |

### `metacog`

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

### `graph`

Query and visualize the thought graph.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `visualize`, `stats`, `path`, `node`, `branches`, `best_path`, `leaves` |
| `nodeId` | string | No | Node ID (for `path`, `node` actions) |
| `targetId` | string | No | Target ID (for `path` action) |

### `prune`

Prune and optimize the thought graph.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `analyze` (report only), `prune` (execute), `optimize_path`, `prune_node` |
| `nodeId` | string | No | Node to prune (for `prune_node`) |
| `reason` | string | No | Reason (for `prune_node`) |

### `reset`

Reset the thought graph and start a fresh session.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `problem` | string | No | New problem statement |

## Enhanced Tools (High-IQ Reasoning)

### `visualize_thought_graph`

Generate visual representation of the thought graph as SVG or ASCII.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `format` | string | No | `svg`, `ascii`, or `tree` (default: ascii) |
| `highlightPath` | string | No | Path between two node IDs (format: `fromId-toId`) |
| `showConfidence` | boolean | No | Show confidence scores (default: true) |

### `simulate_devils_advocate`

Generate counterarguments and opposing viewpoints for a given thought.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Target node ID to challenge |
| `depth` | number | No | Levels of counterarguments (1-5, default: 2) |
| `intensity` | string | No | `mild`, `moderate`, or `aggressive` (default: moderate) |

### `cross_disciplinary_synthesis`

Combine insights from multiple domains to generate novel perspectives.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sourceDomains` | string[] | Yes | Domains to draw analogies from (e.g., `["biology", "economics", "art"]`) |
| `targetProblem` | string | Yes | Problem to apply cross-domain insights to |
| `maxAnalogies` | number | No | Max analogies to generate (1-10, default: 3) |

### `temporal_projection`

Project thoughts into future or past scenarios.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Root node ID to project from |
| `years` | number | Yes | Years forward (positive) or backward (negative) |
| `scenario` | string | No | `optimistic`, `pessimistic`, `realistic`, `disruptive` (default: realistic) |

### `ethical_framework_evaluation`

Evaluate a thought or decision through multiple ethical frameworks.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node ID to evaluate ethically |
| `frameworks` | string[] | No | Which frameworks: `deontological`, `consequentialist`, `virtue`, `rights_based` (default: all) |

### `emotional_intelligence_analysis`

Analyze emotional tone, stakeholder emotions, and social dynamics.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Text to analyze for emotional content |
| `context` | string | No | Context (e.g., `team meeting`, `customer feedback`, `crisis situation`) |
| `perspectiveTaking` | number | No | Level of perspective-taking 0-1 (default: 0.7) |

### `explain_decision`

Generate human-understandable explanation of a decision path.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Decision/conclusion node ID to explain |
| `detailLevel` | string | No | `simple`, `detailed`, `technical` (default: detailed) |
| `includeCounterfactuals` | boolean | No | Show what-if scenarios (default: true) |

### `social_impact_analysis`

Analyze social impact, stakeholder emotions, group cohesion, and persuasion effectiveness.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nodeId` | string | Yes | Node ID to analyze for social impact |
| `stakeholders` | string[] | No | Stakeholder groups (default: `["customers", "employees", "investors", "community"]`) |

## Usage Examples

### Sequential Reasoning

```
think: "Should we use microservices?" → type: question, confidence: 0.9
think: "Monolith has deployment bottlenecks" → type: analysis, confidence: 0.7
think: "Team lacks DevOps capacity for microservices" → type: evidence, confidence: 0.8
evaluate: → overall confidence 0.73
metacog: auto_update → strategy: sequential, progress: normal
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

### Parallel Exploration

```
think: {
  strategy: "parallel",
  parallel: [
    { content: "Team expertise in Docker/K8s", type: "evidence", confidence: 0.8 },
    { content: "Limited DevOps capacity", type: "evidence", confidence: 0.6 },
    { content: "Budget allows hiring", type: "evidence", confidence: 0.4 }
  ]
}
```

### Abductive Reasoning

```
think: {
  strategy: "abductive",
  abductive: {
    observation: "The grass is wet",
    explanations: [
      { content: "It rained", plausibility: 0.8 },
      { content: "Sprinklers were on", plausibility: 0.6 }
    ],
    bestExplanation: "It rained"
  },
  confidence: 0.8
}
```

### Metacognitive Guidance

```
metacog: { action: "auto_update" }
→ ⚠ Stuck: confidence has not improved for 3 steps
→ 💡 Action: [switch_strategy] Try parallel exploration
→   Suggested Strategy: parallel

metacog: { action: "switch", strategy: "parallel", reason: "Break through impasse" }
→ Strategy switched: sequential → parallel
```

### Pruning

```
prune: { action: "analyze" }
→ Dead Ends: 2
  [thought_7] confidence=0.15: Bad idea...
  [thought_9] confidence=0.10: Another dead end...
→ Redundant Branch Groups: 1
  Keep [thought_5], prune [thought_6]: Redundant analysis...
→ Total prunable: 3 node(s)

prune: { action: "prune" }
→ Pruned 3 node(s) in 3 operations
```

## Architecture

```
src/
├── index.ts          MCP server & tool handlers
└── core/
    ├── types.ts      Type definitions & constants
    ├── node.ts       ThoughtNode CRUD operations
    ├── graph.ts      DAG-based thought graph
    ├── strategies.ts 5 reasoning strategy implementations
    ├── scorer.ts     Confidence scoring & self-critique
    ├── metacog.ts    Metacognitive engine
    ├── knowledge.ts  Knowledge integration & validation
    └── pruner.ts     Dead-end/redundancy detection & pruning
```

## Comparison with sequential-thinking

| Feature | sequential-thinking | deep-thinker |
|---------|-------------------|--------------|
| Thought structure | Linear chain | DAG (branch/merge/cross-edges) |
| Strategies | Sequential only | 5 strategies (sequential, dialectic, parallel, analogical, abductive) |
| Confidence | Basic thought number | Multi-factor scoring with trend analysis |
| Self-critique | None | Automatic with severity levels |
| Metacognition | None | Stuck detection, strategy suggestions, auto-switching |
| Knowledge | None | External references, gap detection, consistency validation |
| Pruning | None | Dead-end, redundancy, path optimization |
| Graph queries | Linear review | Visualization, best path, branch analysis, statistics |

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
node dist/test.js
```

118 tests covering all modules: Node, Graph, Strategies, Scorer, Metacog, Knowledge, Pruner, Integration, Edge Cases.

## Documentation

- [Architecture Deep Dive](docs/architecture.md) — how the DAG, scoring, metacog, and pruning work internally
- [Strategy Selection Guide](docs/strategy-guide.md) — when to use each strategy and how to combine them

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. PRs welcome — especially new reasoning strategies and MCP tool ideas.

## License

MIT
