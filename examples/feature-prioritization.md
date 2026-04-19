# Example: Product Feature Prioritization

Use deep-thinker with **parallel strategy** to evaluate and prioritize feature candidates.

## Problem

"We have 5 feature requests — which should we build next quarter?"

## Step-by-step Session

### 1. Frame the problem

```
Tool: think
{
  "content": "Which features should we prioritize for Q3?",
  "type": "question",
  "confidence": 0.9
}
```

### 2. Parallel exploration — evaluate all candidates

```
Tool: think
{
  "strategy": "parallel",
  "parallel": [
    { "content": "AI-powered search: High user demand (340 requests), 3-month build, high technical risk", "type": "hypothesis", "confidence": 0.4 },
    { "content": "Bulk export: 120 requests, 2-week build, low risk, reduces churn", "type": "hypothesis", "confidence": 0.75 },
    { "content": "SSO integration: 80 requests but enterprise deals blocked without it ($200K pipeline)", "type": "hypothesis", "confidence": 0.8 },
    { "content": "Mobile app: Most requested (500+) but 6-month build, needs dedicated team", "type": "hypothesis", "confidence": 0.3 },
    { "content": "API v2: Technical debt, 0 user requests but enables 3rd party integrations", "type": "hypothesis", "confidence": 0.55 }
  ]
}
```

### 3. Add business knowledge

```
Tool: think
{
  "content": "Q3 revenue target requires closing 5 enterprise deals — all need SSO",
  "type": "evidence",
  "confidence": 0.9,
  "knowledge": {
    "source": "Sales pipeline report",
    "content": "5 enterprise deals ($40K-$80K ARR each) blocked by lack of SSO",
    "relevance": 0.95
  }
}
```

### 4. Dialectic — resolve the AI search vs SSO tension

```
Tool: think
{
  "strategy": "dialectic",
  "dialectic": {
    "thesis": "AI search has the highest user demand and is the most requested feature",
    "antithesis": "SSO directly unblocks $200K+ in revenue this quarter",
    "synthesis": "Build SSO first (2-week sprint, unblocks revenue), then start AI search in parallel with research phase"
  },
  "confidence": 0.82
}
```

### 5. Evaluate the full graph

```
Tool: evaluate
{
  "findGaps": true
}
```

Output:
```
Overall Confidence: 68%
Strong Paths:
  Path [thought_1→thought_9→thought_6] avg confidence=82%
Weak Spots:
  [thought_3] conf=0.30: Mobile app — low confidence due to resource constraints
```

### 6. Prune low-confidence options

```
Tool: prune
{
  "action": "analyze"
}
```

Output:
```
Dead Ends: 1
  [thought_3] confidence=0.30: Mobile app — insufficient resources for Q3
Total prunable: 1 node(s)
```

### 7. Conclude

```
Tool: think
{
  "content": "Q3 Priority: (1) SSO — 2 weeks, unblocks $200K+ pipeline. (2) Bulk export — 2 weeks, reduces churn. (3) API v2 — start in sprint 3. (4) AI search — begin research/design phase. (5) Mobile app — defer to Q4.",
  "type": "conclusion",
  "confidence": 0.84
}
```

## Result

Data-driven prioritization with business impact analysis, dialectic resolution of competing priorities, and pruning of infeasible options.
