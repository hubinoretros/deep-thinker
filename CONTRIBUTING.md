# Contributing to deep-thinker

Thank you for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/hubinoretros/deep-thinker.git
cd deep-thinker
npm install
npm run build
```

## Running Tests

```bash
npm run build
node dist/test.js
```

All 118 tests must pass before submitting a PR.

## Making Changes

1. Fork the repository
2. Create a feature branch: `git checkout -b my-feature`
3. Make your changes in `src/`
4. Add/update tests in `src/test.ts`
5. Build: `npm run build`
6. Run tests: `node dist/test.js`
7. Commit with a clear message
8. Push and create a PR

## Code Style

- TypeScript strict mode
- No comments unless absolutely necessary for complex logic
- Follow existing patterns in the codebase
- All new features must include tests

## Adding a New Reasoning Strategy

1. Add the strategy type to `src/core/types.ts`
2. Implement in `src/core/strategies.ts` following the `StrategyResult` pattern
3. Add to the `think` tool handler in `src/index.ts`
4. Add tests in `src/test.ts`
5. Update README with the new strategy

## Adding a New Tool

1. Define parameters and add to `ListToolsRequestSchema` handler in `src/index.ts`
2. Implement the handler function
3. Add to the `CallToolRequestSchema` switch
4. Add tests
5. Update README
