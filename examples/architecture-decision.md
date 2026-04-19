# Example: Software Architecture Decision

Use deep-thinker with **dialectic strategy** to evaluate whether to migrate from monolith to microservices.

## Problem

"Should we migrate our monolithic application to microservices?"

## Step-by-step Session

### 1. Frame the question

```
Tool: think
{
  "content": "Should we migrate from monolith to microservices?",
  "type": "question",
  "confidence": 0.9
}
```

### 2. Sequential analysis

```
Tool: think
{
  "content": "Current monolith has deployment bottlenecks — one team's change blocks another's release",
  "type": "analysis",
  "confidence": 0.8,
  "strategy": "sequential"
}
```

### 3. Dialectic reasoning — resolve the core tension

```
Tool: think
{
  "strategy": "dialectic",
  "dialectic": {
    "thesis": "Microservices improve deployment independence and scalability",
    "antithesis": "Microservices add operational complexity, network latency, and debugging difficulty",
    "synthesis": "Adopt a modular monolith — independent modules within a single deployable unit"
  },
  "confidence": 0.75
}
```

### 4. Parallel exploration — evaluate team readiness

```
Tool: think
{
  "strategy": "parallel",
  "parallel": [
    { "content": "Team has Docker/K8s experience", "type": "evidence", "confidence": 0.7 },
    { "content": "No dedicated DevOps engineer", "type": "evidence", "confidence": 0.8 },
    { "content": "Budget allows hiring 2 more engineers", "type": "evidence", "confidence": 0.5 }
  ]
}
```

### 5. Add knowledge from an expert source

```
Tool: think
{
  "content": "Martin Fowler recommends starting with monolith first",
  "type": "assumption",
  "confidence": 0.6,
  "knowledge": {
    "source": "Martin Fowler - MonolithFirst",
    "content": "Don't start with microservices — start with monolith, then extract services as boundaries become clear",
    "relevance": 0.9
  }
}
```

### 6. Evaluate the reasoning so far

```
Tool: evaluate
{
  "findGaps": true,
  "validateKnowledge": true
}
```

Output:
```
Overall Confidence: 72%
Weak Spots:
  [thought_5] conf=0.50: Budget analysis lacks detail
Knowledge Gaps:
  [thought_5] (fact) Assumption "Budget allows..." lacks factual support
```

### 7. Metacognitive check

```
Tool: metacog
{
  "action": "auto_update"
}
```

Output:
```
Strategy: sequential → sequential
Progress: Normal
Cognitive Load: 33%
Confidence Trend: rising
```

### 8. Conclude

```
Tool: think
{
  "content": "Adopt modular monolith now. Revisit microservices when: (1) DevOps capacity reaches 3+ engineers, (2) module boundaries are stable, (3) independent scaling becomes necessary",
  "type": "conclusion",
  "confidence": 0.82
}
```

### 9. View the final graph

```
Tool: graph
{
  "action": "best_path"
}
```

### 10. Prune any dead ends

```
Tool: prune
{
  "action": "prune"
}
```

## Result

A well-reasoned decision with multiple perspectives, evidence evaluation, expert knowledge integration, and a concrete conclusion with conditions for revisiting.
