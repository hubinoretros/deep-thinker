# Example: Scientific Hypothesis Evaluation

Use deep-thinker with **analogical strategy** to evaluate whether a new drug delivery mechanism could work based on similar proven approaches.

## Problem

"Could lipid nanoparticle delivery work for CRISPR gene therapy, similar to how it works for mRNA vaccines?"

## Step-by-step Session

### 1. Analogical reasoning — map from known to unknown

```
Tool: think
{
  "strategy": "analogical",
  "analogical": {
    "sourceDomain": "mRNA vaccines (Pfizer/Moderna) using lipid nanoparticles for delivery",
    "mapping": "LNP protects payload → delivers to cells via endocytosis → releases payload in cytoplasm. CRISPR-Cas9 is a larger payload but same delivery mechanism could apply.",
    "projectedConclusion": "LNP delivery of CRISPR-Cas9 ribonucleoprotein complexes is feasible, but payload size and nuclear entry are additional challenges"
  },
  "confidence": 0.55
}
```

### 2. Add supporting evidence

```
Tool: think
{
  "content": "Intellia Therapeutics reported successful in vivo CRISPR editing via LNP in clinical trials (NTLA-2001)",
  "type": "evidence",
  "confidence": 0.85,
  "knowledge": {
    "source": "NEJM 2021 - Gillmore et al.",
    "content": "NTLA-2001 demonstrated 87-93% reduction in TTR protein via LNP-delivered CRISPR in Phase 1",
    "relevance": 0.95
  }
}
```

### 3. Add contradicting evidence

```
Tool: think
{
  "content": "CRISPR-Cas9 RNP is ~160kDa vs mRNA at ~30kDa — LNP packaging efficiency drops significantly for larger payloads",
  "type": "evidence",
  "confidence": 0.7,
  "edgeTo": {
    "targetId": "thought_1",
    "type": "challenges"
  }
}
```

### 4. Abductive — what's the best explanation for the clinical success?

```
Tool: think
{
  "strategy": "abductive",
  "abductive": {
    "observation": "NTLA-2001 succeeded clinically despite larger payload size",
    "explanations": [
      { "content": "Modified LNP formulation with ionizable lipids optimized for larger cargo", "plausibility": 0.8 },
      { "content": "Lower dose needed because CRISPR permanently edits vs mRNA is transient", "plausibility": 0.7 },
      { "content": "Liver-targeted delivery is easier — LNPs naturally accumulate in liver", "plausibility": 0.85 }
    ],
    "bestExplanation": "Liver tropism of LNPs + permanent editing effect means much lower effective dose needed"
  },
  "confidence": 0.78
}
```

### 5. Evaluate knowledge consistency

```
Tool: evaluate
{
  "validateKnowledge": true,
  "findGaps": true
}
```

Output:
```
Knowledge Gaps:
  [thought_1] (principle) Analogical projection lacks principled justification for non-liver targets
No knowledge conflicts detected.
```

### 6. Conclude with caveats

```
Tool: think
{
  "content": "LNP-CRISPR delivery is proven for liver targets. Extrapolation to other organs requires: (1) targeting ligand development, (2) improved packaging for larger payloads, (3) nuclear entry mechanisms. The analogy from mRNA vaccines holds for delivery mechanism but not for intracellular trafficking beyond the liver.",
  "type": "conclusion",
  "confidence": 0.72
}
```

## Result

Structured scientific reasoning with analogical mapping, clinical evidence, contradiction handling, and a nuanced conclusion with clear next-step requirements.
