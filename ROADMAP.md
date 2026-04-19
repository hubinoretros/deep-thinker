# Roadmap

## Short Term (v1.1)

- [ ] **Persistence** — Save and load thought graphs to/from JSON files for cross-session reasoning
- [ ] **Prompt templates** — Built-in prompts for common reasoning patterns (decision-making, debugging, analysis)
- [ ] **Export formats** — Export thought graph to Mermaid diagrams, Markdown, or SVG
- [ ] **Thought revision** — Revise a thought in-place while preserving the graph structure
- [ ] **Batch operations** — Add multiple thoughts in a single tool call

## Medium Term (v1.2)

- [ ] **Collaborative reasoning** — Multiple agents contributing to the same thought graph
- [ ] **Remote mode** — HTTP/SSE transport in addition to stdio
- [ ] **Graph search** — Semantic search across thoughts using embeddings
- [ ] **Auto-strategy** — Fully automatic strategy selection based on problem type
- [ ] **Reasoning patterns library** — Pre-built patterns for SWOT, 5 Whys, OODA loop, etc.

## Long Term (v2.0)

- [ ] **Visual dashboard** — Web UI for exploring thought graphs interactively
- [ ] **LLM-embedded reasoning** — Generate thoughts via LLM within the MCP server
- [ ] **Plugin system** — Custom edge types, scoring factors, and strategies via plugins
- [ ] **Cross-graph linking** — Connect thoughts across different problem graphs
- [ ] **Reasoning replay** — Step through the thinking process like a debugger
- [ ] **Confidence calibration** — Learn from feedback to improve confidence accuracy

## Contributing

See something you want to build? Check [CONTRIBUTING.md](CONTRIBUTING.md) and open a PR!

### Most Wanted Contributions

1. **Persistence layer** — highest user request
2. **Mermaid export** — makes thought graphs shareable
3. **New reasoning strategies** — inductive, deductive, heuristic
4. **Remote transport** — HTTP/SSE for cloud deployment
