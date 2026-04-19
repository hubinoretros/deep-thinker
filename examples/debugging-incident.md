# Example: Debugging a Production Incident

Use deep-thinker with **abductive strategy** to diagnose why a production service is returning 500 errors.

## Problem

"The checkout service is returning 500 errors intermittently since the last deploy."

## Step-by-step Session

### 1. Frame the observation

```
Tool: think
{
  "strategy": "abductive",
  "abductive": {
    "observation": "Checkout service returns HTTP 500 intermittently since deploy v2.3.1 at 14:30 UTC",
    "explanations": [
      { "content": "Database connection pool exhausted — new code opens more connections", "plausibility": 0.7 },
      { "content": "Memory leak in new payment validation module", "plausibility": 0.5 },
      { "content": "External payment gateway timeout cascading to 500", "plausibility": 0.4 },
      { "content": "Race condition in new concurrent order processing", "plausibility": 0.6 }
    ]
  },
  "confidence": 0.6
}
```

### 2. Add evidence for top hypothesis

```
Tool: think
{
  "content": "DB connection pool shows 48/50 connections in use, up from 12/50 before deploy",
  "type": "evidence",
  "confidence": 0.85,
  "knowledge": {
    "source": "Datadog metrics dashboard",
    "content": "Connection pool usage spiked from 24% to 96% after v2.3.1 deploy",
    "relevance": 0.95
  }
}
```

### 3. Add contradicting evidence

```
Tool: think
{
  "content": "Payment gateway response times are normal (120ms avg, no timeouts)",
  "type": "evidence",
  "confidence": 0.9,
  "edgeTo": {
    "targetId": "thought_1",
    "type": "contradicts"
  }
}
```

### 4. Evaluate and critique

```
Tool: evaluate
{
  "nodeId": "thought_1",
  "critique": true
}
```

Output:
```
Confidence: 0.78
Critique [medium]: Hypothesis has supporting evidence but hasn't been confirmed with code review
Recommendation: Good confidence — consider synthesis or moving toward conclusion
```

### 5. Abductive conclusion — best explanation

```
Tool: think
{
  "strategy": "abductive",
  "abductive": {
    "observation": "DB connections exhausted after v2.3.1",
    "explanations": [
      { "content": "New OrderValidator class opens a connection per validation instead of pooling", "plausibility": 0.9 }
    ],
    "bestExplanation": "New OrderValidator bypasses connection pool, opening raw connections per request"
  },
  "confidence": 0.85
}
```

### 6. Verify with knowledge

```
Tool: evaluate
{
  "validateKnowledge": true
}
```

### 7. Conclude with action

```
Tool: think
{
  "content": "Root cause: OrderValidator in v2.3.1 opens direct DB connections instead of using the pool. Fix: refactor to use connection pool. Hotfix: increase pool size to 100 temporarily.",
  "type": "conclusion",
  "confidence": 0.85
}
```

## Result

Structured incident diagnosis with hypothesis generation, evidence evaluation, contradiction tracking, and a confirmed root cause with remediation steps.
