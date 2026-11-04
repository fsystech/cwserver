# Contributing to cwserver

Thank you for your interest in contributing to **cwserver**! Contributions of all kinds are welcome, including bug fixes, feature improvements, documentation, performance optimizations, and test coverage.

Please take a moment to review these guidelines before submitting your contribution.

## 1. Code of Conduct

All contributors are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

We are committed to maintaining an open, respectful, and welcoming community.

## 2. Getting Started

### Prerequisites

Before contributing, ensure that you have:

- [Node.js](https://nodejs.org/) v22.20.0 or later.
- npm (included with Node.js).
- Git.

### Fork and Clone

1. Fork the [cwserver repository](https://github.com/fsystech/cwserver).
2. Clone your fork:

   ```bash
   git clone https://github.com/YOUR_USERNAME/cwserver.git
   ```

3. Navigate to the project directory:

   ```bash
   cd cwserver
   ```

4. Install dependencies:

   ```bash
   npm install
   ```

5. Create a working branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

Use descriptive branch names, such as:

- `feature/add-new-middleware`
- `fix/request-handling`
- `docs/update-api-documentation`
- `perf/optimize-response-processing`

## 3. Development Guidelines

Please follow these guidelines when modifying the source code.

### General

- Keep changes focused and avoid unrelated modifications.
- Preserve existing functionality and maintain backward compatibility wherever possible.
- Prefer simple, readable, and maintainable implementations.
- Avoid unnecessary dependencies.
- Consider performance and resource usage, especially in frequently executed request-processing paths.
- Handle errors consistently with the existing project conventions.
- Do not introduce breaking changes without clearly documenting them.

### TypeScript and JavaScript

- Follow the existing coding conventions and formatting.
- Use appropriate TypeScript types.
- Avoid unnecessary use of `any`.
- Use meaningful names for variables, functions, classes, and interfaces.
- Avoid unnecessary allocations and expensive operations in performance-critical paths.
- Ensure asynchronous operations handle errors appropriately.

### Documentation

- Add or update documentation whenever public APIs, functions, configuration options, or behavior change.
- Document functions using the existing documentation style.
- Include descriptions of parameters and return values where applicable.
- Keep comments accurate and synchronized with the implementation.
- Update README or relevant documentation when introducing new features.

### Dependencies

- Avoid adding dependencies unless they provide clear value.
- Prefer built-in Node.js functionality when practical.
- Explain the reason for introducing a new dependency in the pull request.

## 4. Testing and Quality Checks

Before submitting a pull request, run the available project checks:

### Build

```bash
npm run build
```

### Mocha Unit Tests

```bash
npm run test:mocha
```

### Test Coverage

```bash
npm run test:cov
```

### TSLint

```bash
npm run lint
```

Ensure that:

- Existing tests continue to pass.
- New functionality includes appropriate tests.
- Bug fixes include regression tests where practical.
- No unintended changes are introduced.
- Build and lint checks complete successfully.

If a check cannot be executed, mention the reason in your pull request.

## 5. Commit Guidelines

Write clear and descriptive commit messages.

Recommended format:

```text
<type>: <short description>
```

Examples:

```text
feat: add request timeout support
fix: resolve response header handling
docs: update middleware documentation
perf: optimize request processing
test: add server response tests
refactor: simplify route registration
```

Keep commits logically grouped and avoid including unrelated changes.

## 6. Submitting a Pull Request

When your changes are ready:

1. Ensure your working branch is up to date with the upstream repository.
2. Run the relevant build, test, coverage, and lint checks.
3. Commit your changes.
4. Push your branch to your fork.
5. Open a pull request against the upstream repository's default branch.

Use the repository's pull request template when submitting your contribution.

### Pull Request Requirements

Your pull request should:

- Have a clear and descriptive title.
- Explain the problem being addressed.
- Describe the changes made.
- Include relevant issue references, if applicable.
- Include test results.
- Identify any breaking changes.
- Include documentation updates where necessary.

Keep pull requests focused and reasonably sized to make reviews easier.

## 7. Reporting Bugs and Requesting Features

Before opening a new issue:

- Check whether a similar issue already exists.
- Provide sufficient information to reproduce the problem.
- Include relevant error messages and logs.
- Specify your Node.js version and operating system where relevant.

For feature requests, explain the use case and the expected behavior.

Use the appropriate GitHub issue template when available.

## 8. Review Process

Project maintainers may request changes, clarification, additional tests, or documentation updates during review.

Please:

- Respond constructively to review feedback.
- Keep discussions focused on technical matters.
- Update your pull request when changes are requested.
- Avoid force-pushing when it would unnecessarily disrupt an ongoing review.

Contributions will be merged when they meet the project's quality, compatibility, and maintenance requirements.

## 9. License

By submitting a contribution, you agree that your contribution will be licensed under the same license as the cwserver project.

You must have the legal right to submit the code, documentation, or other materials included in your contribution.

## 10. Thank You

Thank you for helping improve **cwserver**!

Every contribution, whether a bug report, documentation improvement, test, or code change, helps make the project better for everyone.

**Project:** [github.com/fsystech/cwserver](https://github.com/fsystech/cwserver)
