# Example: Breaking Through a Reasoning Dead End

This example demonstrates the **metacognitive engine** detecting a stuck state and suggesting a strategy switch.

## Problem

"Is serverless architecture cost-effective for our workload?"

## The Problem: Getting Stuck

### Steps 1-3: Sequential reasoning going nowhere

```
Tool: think
{ "content": "Is serverless cost-effective for our workload?", "type": "question", "confidence": 0.5 }

Tool: think
{ "content": "Serverless charges per invocation — could be expensive at high volume", "type": "analysis", "confidence": 0.5 }

Tool: think
{ "content": "But serverless eliminates server management overhead", "type": "analysis", "confidence": 0.5 }
```

Notice: confidence stays at 0.5 — no progress.

### Step 4: Metacognitive engine detects the problem

```
Tool: metacog
{ "action": "auto_update" }
```

Output:
```
=== Auto Metacognitive Update ===
Strategy: sequential → sequential

⚠ STUCK: confidence has not improved for 3 steps
Cognitive Load: 20%
Confidence Trend: stable

💡 Action: [switch_strategy] Try parallel exploration to discover alternative paths
  Suggested Strategy: parallel
```

### Step 5: Switch strategy — break the impasse

```
Tool: metacog
{ "action": "switch", "strategy": "parallel", "reason": "Break through impasse — explore cost dimensions independently" }
```

### Step 6: Parallel exploration

```
Tool: think
{
  "strategy": "parallel",
  "parallel": [
    { "content": "Compute cost: $0.00001667/GB-sec × our 500GB-sec avg = $0.0083/invocation", "type": "evidence", "confidence": 0.8 },
    { "content": "DevOps savings: 0.5 FTE × $120K/yr = $60K/yr saved", "type": "evidence", "confidence": 0.7 },
    { "content": "Cold start latency: p95 800ms vs containers p95 50ms", "type": "evidence", "confidence": 0.85 },
    { "content": "Scaling: auto-scales to 10K concurrent vs manual capacity planning", "type": "evidence", "confidence": 0.75 }
  ]
}
```

### Step 7: Dialectic — resolve cost vs savings

```
Tool: think
{
  "strategy": "dialectic",
  "dialectic": {
    "thesis": "Serverless saves $60K/yr in DevOps and eliminates capacity planning",
    "antithesis": "At our 10M monthly invocations, compute cost is $83K/yr plus cold start latency risk",
    "synthesis": "Use serverless for async/event-driven workloads (60% of traffic), containers for latency-sensitive APIs (40%)"
  },
  "confidence": 0.78
}
```

### Step 8: Conclude

```
Tool: think
{
  "content": "Hybrid approach: serverless for async jobs and event processing ($60K DevOps savings, acceptable latency), containers for customer-facing APIs (low latency, predictable cost). Net savings: ~$35K/yr after compute costs.",
  "type": "conclusion",
  "confidence": 0.8
}
```

## Key Takeaway

Without the metacognitive engine, the reasoning would have stayed at 0.5 confidence indefinitely. The system detected stagnation and suggested parallel exploration, which broke the deadlock and led to a concrete conclusion.
