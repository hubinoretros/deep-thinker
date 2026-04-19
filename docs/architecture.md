# Architecture Deep Dive

## How deep-thinker Works

### Core Concept: Thought Graph as a DAG

Traditional thinking tools use a linked list: thought_1 → thought_2 → thought_3. This is a **linear chain** with fundamental limitations:

- You can't explore two hypotheses simultaneously
- You can't merge insights from different paths
- You can't mark two thoughts as contradicting each other
- You can't go back and branch from an earlier thought

deep-thinker uses a **Directed Acyclic Graph (DAG)** where:

- Each thought is a **node** with a unique ID, type, confidence score, and metadata
- Relationships between thoughts are **typed edges** (derives_from, contradicts, supports, etc.)
- Nodes can have **multiple parents** (synthesis of several thoughts)
- Nodes can have **multiple children** (branching into parallel exploration)
- Cross-edges connect nodes across different branches

### Data Model

```
ThoughtNode {
  id: string                    // unique identifier
  content: string               // the thought text
  type: ThoughtType             // hypothesis | analysis | evidence | ...
  strategy: Strategy            // which reasoning strategy created this
  confidence: number            // 0-1 confidence score
  parentId: string | null       // direct parent in the tree
  childIds: string[]            // direct children
  edges: ThoughtEdge[]          // typed relationships to other nodes
  metadata: {
    createdAt: number           // timestamp
    depth: number               // tree depth from root
    branch: string              // named branch for parallel exploration
    tags: string[]              // user-defined tags
    revisionOf: string | null   // if this revises a previous thought
  }
  status: NodeStatus            // active | pruned | superseded | confirmed | contradted
  critique: Critique | null     // auto-generated self-critique
  knowledge: KnowledgeRef[]     // attached external knowledge
}
```

### Edge Types

| Edge | Meaning | Example |
|------|---------|---------|
| `derives_from` | This logically follows from target | "Therefore X" derives_from "If A then B" |
| `contradicts` | This contradicts target | "Tests show no improvement" contradicts "Feature will improve performance" |
| `supports` | This provides evidence for target | "Benchmark shows 30% speedup" supports "Algorithm is faster" |
| `refines` | This narrows or improves target | "Specifically for batch < 100" refines "Works for small batches" |
| `challenges` | This questions target's validity | "Sample size was only 10" challenges "Results are significant" |
| `synthesizes` | This combines multiple thoughts | "Hybrid approach" synthesizes [thesis, antithesis] |
| `parallels` | This runs alongside target | "Alternative: use caching" parallels "Approach: optimize query" |
| `abstracts` | This generalizes from target | "Pattern applies to all I/O" abstracts "Works for disk I/O" |
| `instantiates` | This is a specific case of target | "Redis caching" instantiates "Use caching" |

## Confidence Scoring Algorithm

Confidence is computed as a weighted sum of factors:

```
final_confidence = base_confidence
  + support_factor       // ancestor support edges × 0.05 (max +0.15)
  - contradiction_factor // ancestor contradict edges × 0.1 (max -0.2)
  - redundancy_factor    // similar existing thoughts × 0.05
  - depth_penalty        // depth × 0.01
  + knowledge_boost      // integrated knowledge relevance (max +0.15)
```

All confidence values are clamped to [0, 1].

## Metacognitive Engine

The metacognitive engine runs on every `updateMetacognition()` call and:

1. **Computes progress metrics** — total thoughts, average confidence, confidence trend, branch count, contradiction/support ratio, stagnation counter
2. **Detects stuck states** — checks for:
   - Stagnation: confidence hasn't improved for N steps (threshold: 3)
   - Declining trend: average confidence falling over time
   - Recent low confidence: last 3 thoughts all below 0.3
   - Excessive contradictions: contradict_count > 2 × support_count
3. **Diagnoses the reason** — generates a human-readable explanation
4. **Suggests corrective actions** — switch_strategy, backtrack, prune, deepen, broaden, conclude

### Strategy Selection Logic

```
IF contradictions > 2 × supports
  → suggest dialectic (resolve contradictions)
IF confidence falling AND current = sequential
  → suggest parallel (discover alternatives)
IF stagnation ≥ 3 AND depth < 3
  → suggest deepen (need more analysis)
IF branches > 5 AND avg_confidence < 0.5
  → suggest prune (remove dead ends)
IF avg_confidence > 0.8 AND depth ≥ 3
  → suggest conclude (ready to conclude)
IF stagnation ≥ 3
  → suggest broaden / abductive (new explanatory framework)
```

## Pruning Algorithm

Three detection mechanisms:

1. **Dead-end detection**: leaf nodes with confidence < 0.2, no supporting edges, no knowledge
2. **Redundancy detection**: nodes with Jaccard similarity > 0.7 of word sets, same type — keep highest confidence
3. **Deep unproductive branches**: branches where average confidence < 50% of graph average, and depth is within 2 of max depth

## Strategy Implementations

### Sequential
Creates a single node with a `derives_from` edge to the parent. Simple linear chain.

### Dialectic
Creates 1-3 nodes:
- **Thesis** (hypothesis) — always created
- **Antithesis** (critique) — created if provided, with `contradicts` edge to thesis
- **Synthesis** (synthesis) — created if provided, with `synthesizes` edges to both thesis and antithesis

### Parallel
Creates N nodes, each with `parallels` edges to parent and to the first sibling. Each gets its own named branch.

### Analogical
Creates 3 nodes:
- Source observation → Mapping analysis → Projected hypothesis
- Source and mapping connected with `derives_from`
- Projection has `abstracts` edge to source

### Abductive
Creates 2+N nodes:
- 1 observation node
- N hypothesis nodes with `instantiates` edges to observation
- 1 conclusion node (if best explanation given) with `derives_from` and `supports` edges
