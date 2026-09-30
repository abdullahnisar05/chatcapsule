# Security

## Privacy model

ChatCapsule is a local-first viewer for Instagram exports. The core workflow is designed to process ZIP contents in the browser rather than sending archive data to a ChatCapsule backend.

Do not upload an export containing sensitive information to any service you do not trust.

## Reporting a vulnerability

Please report security vulnerabilities privately through the repository's GitHub security reporting channel rather than publishing exploit details in a public issue.

When reporting an issue, include the affected route or component, reproduction steps, expected impact, and the smallest relevant sample when possible.

## Dependency policy

Framework and dependency security releases are treated as production blockers. Before deployment, run the project's dependency audit and verify that the lockfile and package.json resolve to the intended patched versions.

ChatCapsule does not use `npm audit fix --force` as a routine maintenance strategy; dependency upgrades should be reviewed for breaking changes and verified by the typecheck, build, and smoke-test gates.
