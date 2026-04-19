# Strategy Selection Guide

## When to Use Each Strategy

### Sequential
**Best for:** Step-by-step logic, mathematical proofs, linear processes

**Use when:**
- Each step clearly follows from the previous one
- There's a known procedure to follow
- You're building a chain of evidence

**Example:** "First we check the logs, then we identify the error, then we trace the code path, then we find the bug"

---

### Dialectic
**Best for:** Resolving contradictions, evaluating trade-offs, debates

**Use when:**
- There are clear opposing viewpoints
- You're weighing pros and cons
- A decision has strong arguments on both sides
- You've detected contradictions in your reasoning

**Example:** "Microservices improve scalability (thesis) BUT add operational complexity (antithesis) THEREFORE use modular monolith (synthesis)"

**Tip:** The metacognitive engine will automatically suggest dialectic when it detects excessive contradictions.

---

### Parallel
**Best for:** Exploring multiple options, comparing alternatives, brainstorming

**Use when:**
- You want to evaluate several hypotheses simultaneously
- Different aspects of a problem need independent analysis
- You're unsure which direction to take

**Example:** "Let's explore 3 possible explanations for the bug at the same time"

**Tip:** Use parallel when sequential reasoning hits a dead end — the metacognitive engine will suggest this.

---

### Analogical
**Best for:** Novel problems, cross-domain reasoning, pattern matching

**Use when:**
- You have a known solution in one domain and want to apply it to a new domain
- The current problem resembles something you've solved before
- You need to project from the known to the unknown

**Example:** "mRNA vaccines use LNP delivery (source) → similar mechanism could work for CRISPR (mapping) → LNP-CRISPR is feasible but needs nuclear entry (projection)"

**Tip:** Analogical reasoning is powerful but risky — always validate the projection with evidence.

---

### Abductive
**Best for:** Root cause analysis, debugging, "what happened?" questions

**Use when:**
- You have an observation and need to explain it
- Multiple possible explanations exist
- You need to infer the most likely cause
- Debugging incidents, medical diagnosis, forensic analysis

**Example:** "The grass is wet (observation) → it rained (0.8) or sprinklers (0.6) → it rained (best explanation)"

**Tip:** Abductive reasoning naturally follows from observation. Start with the observation, generate hypotheses, then gather evidence to identify the best one.

---

## Strategy Switching Flow

```
Start → Sequential
  │
  ├─ Contradictions found? → Dialectic
  │     │
  │     └─ Resolved? → Sequential or Conclude
  │
  ├─ Stuck / stagnation? → Parallel
  │     │
  │     └─ Multiple viable paths? → Continue Parallel or Dialectic
  │
  ├─ Novel problem? → Analogical
  │     │
  │     └─ Analogy validated? → Sequential to confirm
  │
  └─ Need explanation? → Abductive
        │
        └─ Best explanation found? → Sequential to verify
```

## Combining Strategies

The most powerful approach is combining strategies:

1. **Abductive → Dialectic**: Generate hypotheses, then debate them
2. **Parallel → Dialectic**: Explore options, then resolve trade-offs
3. **Analogical → Sequential**: Map from known domain, then verify step by step
4. **Sequential → Metacog → Switch**: Let the system tell you when to change

The metacognitive engine handles this automatically — it monitors your reasoning and suggests when to switch.
