# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-04-25

### ✨ New Feature: PromptOptimizerNode (Node Zero)

**The Entry Point for the Reasoning DAG**

Transform vague/incomplete prompts into optimized Super Prompts before routing to specialized strategies.

#### Features:
- **Input Analysis**: Detects domain, complexity, ambiguity level
- **Core Intent Extraction**: Identifies primary goals and success criteria
- **Missing Context Detection**: Finds gaps and suggests clarifications
- **Super Prompt Generation**: Creates detailed, structured prompts
- **Smart Routing**: Recommends optimal reasoning strategy chain

#### Usage:
```typescript
optimize_prompt: {
  originalPrompt: "How to improve our API?",
  optimizationLevel: "standard",
  autoRoute: true
}
```

#### Output:
- 📊 Input Analysis (domain, complexity, ambiguity)
- 🎯 Core Intent (goals, success criteria, format)
- ⚠️ Missing Context (gaps, assumptions)
- ✨ Super Prompt (fully optimized for downstream nodes)
- 🚦 Routing Recommendation (which strategies to use)

---

## [2.0.0] - 2026-04-25

### 🚀 Major Release - Enhanced Reasoning Strategies

This release introduces 4 powerful new reasoning strategies, bringing the total to 9 cognitive strategies.

### ✨ New Features

#### 4 New Reasoning Strategies

1. **FirstPrinciplesNode** (`first_principles`)
   - Deconstructs problems to fundamental, irreducible truths
   - Challenges and rejects conventional assumptions
   - Rebuilds solutions from verifiable first principles
   - Domain-aware (physics, economics, software, etc.)

2. **CounterfactualNode** (`counterfactual`)
   - "What-if" scenario simulation with multi-stage ripple effects
   - Variable manipulation with impact weighting
   - Generates optimistic, pessimistic, and most likely outcomes
   - Risk analysis and mitigation strategies

3. **SystemsThinkingNode** (`systems_thinking`)
   - Analyzes interconnected components and feedback loops
   - Identifies leverage points using Donella Meadows' framework
   - Detects emergent properties and system behaviors
   - Maps reinforcing and balancing feedback loops

4. **MCTSNode** (`mcts`) - Monte Carlo Tree Search
   - Optimal decision path selection through simulation
   - UCB1 scoring for exploration vs exploitation
   - Automatic pruning of low-reward paths
   - Statistical confidence scoring

### 🔧 Technical Improvements

- **Schema Validation**: All strategies use Zod for strict input/output validation
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Error Handling**: Robust try-catch with automatic fallback to sequential strategy
- **Metacognitive Integration**: Smart triggers detect when to use specialized strategies

### 📊 Metacognitive Enhancements

- `recommendSpecializedStrategy()`: Context-aware strategy recommendation
- `shouldTriggerFirstPrinciples()`: Detects assumption questioning
- `shouldTriggerCounterfactual()`: Detects what-if scenarios
- `shouldTriggerSystemsThinking()`: Detects system complexity patterns
- `shouldTriggerMCTS()`: Detects optimization problems with many branches

### 🛡️ Safety & Reliability

- Fallback mechanisms for all new strategies
- Schema validation prevents hallucinations
- Structured JSON outputs guaranteed
- Graceful degradation on errors

### 📁 New Files

- `src/core/schemas.ts`: Zod schema definitions for all strategies
- `src/test_enhanced_strategies.ts`: Comprehensive test suite

### 📝 Updated Files

- `src/core/types.ts`: Added new strategy types
- `src/core/strategies.ts`: Implemented 4 new strategy functions
- `src/core/metacog.ts`: Added trigger detection logic
- `src/core/graph.ts`: Updated strategy distribution tracking
- `src/index.ts`: MCP tool integration for new strategies

### 🧪 Testing

- 12 comprehensive tests for new strategies
- Schema validation tests
- Metacognitive trigger detection tests
- All tests passing ✓

---

## [1.1.0] - Previous Release

### Features
- Sequential, Dialectic, Parallel, Analogical, Abductive strategies
- Metacognitive monitoring and stuck detection
- Graph visualization and pruning
- Devil's advocate simulation
- Cross-disciplinary synthesis
- Temporal projection
- Ethical framework evaluation
- Emotional intelligence analysis
- Decision explanation
- Social impact analysis

---

## Migration Guide: 1.x → 2.0

### Breaking Changes
None. All existing APIs remain compatible.

### New Capabilities
To use new strategies, simply specify them in the `strategy` parameter:

```typescript
// First Principles
strategy: "first_principles",
firstPrinciples: {
  problem: "How to improve battery efficiency?",
  assumptions: ["Lithium is required"],
  depth: 3
}

// Counterfactual
strategy: "counterfactual",
counterfactual: {
  currentState: "Current work model",
  variablesToChange: [{variable: "location", currentValue: "office", hypotheticalValue: "remote"}]
}

// Systems Thinking
strategy: "systems_thinking",
systemsThinking: {
  systemDescription: "Development team",
  components: [...]
}

// MCTS
strategy: "mcts",
mcts: {
  problem: "Which architecture?",
  possibleActions: [...]
}
```

---

**Full Changelog**: https://github.com/hubinoretros/deep-thinker/compare/v1.1.0...v2.0.0
