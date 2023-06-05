---
title: A look at our monorepo
author: Justin Domingue
date: 2023-06-02
extensions: []
styles: {}
---

<!-- stop -->

# Workspaces

<!-- stop -->

[yarn workspaces](https://yarnpkg.com/features/workspaces) allow multiple projects to live together in the **same repository AND to cross-reference each other** (any modification to one's source code being instantly applied to the others)

<!-- stop -->

## How to declare workspaces?

```
wallet-internal/package.json
---
"workspaces": [
  "apps/*",
  "packages/*",
  "config/*"
]
```
<!-- stop -->

# Nested Workspaces

Nested workspaces link back to root and can cross-reference each other.

<!-- stop -->

`workspace:^` range resolves dependencies locally only:

<!-- stop -->

```
wallet-internal/apps/mobile/package.json
---
{
  name: "mobile",
  ...
  "dependencies": {
    "packages/ui": "^",
    "packages/wallet": "^",
    "config/tsconfig": "^",
  }
}
```

<!-- stop -->

### Benefits

- single `yarn install` from root lets us dedupe `node_modules`
- only the dependencies depended upon by a workspace can be accessed
- if the package manager was to resolve a range that a workspace could satisfy, it will prefer the workspace resolution over the remote resolution if possible

<!-- stop -->

## Downsides

* Performance: monorepos tend to get **big** and **slow** and require specific tooling.
* Developer experience challenges

# Optimizing developer experience

<!-- stop --> 

## Smart Build system

[Turborepo](https://turbo.build/repo) creates a dependency tree between apps and packages which allows tooling to understand what needs to be tested and rebuilt on file changes.

* **Computation caching**: cache file or artifacts already built
* **Parallel task execution**
* **Remote caching** (*in consideration*)

<!-- stop -->

## Dependency installation

[PNpm](https://pnpm.io/benchmarks): drop-in replacement to install dependencies globally and symlink them (up to 3x faster) (*in consideration*)

# Wallet monorepo

```
  ┌─apps─────────────┐       ┌─packages──────────┐
  │  ┌───────────┐   │       │  ┌───────────┐    │
  │  │apps/mobile│   │       │  │packages/ui│    │
  │  └───────────┘   ├───────►  └──────▲────┘    │
  │                  │       │         │         │
  │ ┌──────────────┐ │       │ ┌───────┴───────┐ │
  │ │apps/extension│ │       │ │packages/wallet│ │
  │ └──────────────┘ │       │ └───────────────┘ │
  └────────────────┬─┘       └─┬─────────────────┘
                   │           │
                   │           │
         ┌─config──▼───────────▼──┐
         │     ┌───────────┐      │
         │     │config/jest│      │
         │     └───────────┘      │
         │ ┌────────────────────┐ │
         │ │config/eslint-config│ │
         │ └────────────────────┘ │
         └────────────────────────┘
```

# A Look Around

Let's look around the repo live!

# Our experience so far / what we learned

<!-- stop -->

- sharing packages works best when your editor is aware / not pulling from remote installations constantly / can typecheck all usage at once
- npm link support not existing in react native prevents building seamless tooling
- semantic versioning is nice in theory to prevent bugs from spreading but is realistically hard to test at a per app level
- automated unit and integration testing will continue to become more important as we share more and more code to ensure no regressions / bugs are introduced
- bringing in one file quickly brings a lot more shared code in - we'll likely be able to decouple some of our business logic through these shared code migrationss

# What's next?

<!-- stop -->

Short/medium term:

- continue feature development on extension and migrating shared code
- break out more engrained functionality such as analytics
- continue work on ui package capabilities and API to be at parity / matching the mobile API when possible

<!-- stop -->

Long term:

- migrate mobile over to using the UI package as much as possible
- break down utilities that are not wallet specific into their own packages
- explore sharing with interface
- look into migrating packages into the monorepo (analytics, conedison utilities merged in with existing wallet utilities)

<!-- stop -->

# End
