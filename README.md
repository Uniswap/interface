# Uniswap Labs Interface

Welcome! This repo is a [monorepo](https://monorepo.tools) that contains both the web and mobile code. We have two sections below for familiarizing yourself with each.

Uniswap is an open source protocol for decentralized exchange of Ethereum tokens.

- Website: [uniswap.org](https://uniswap.org/)
- Interface: [app.uniswap.org](https://app.uniswap.org)
- Docs: [uniswap.org/docs/](https://docs.uniswap.org/)
- Twitter: [@Uniswap](https://twitter.com/Uniswap)
- Reddit: [/r/Uniswap](https://www.reddit.com/r/Uniswap/)
- Email: [contact@uniswap.org](mailto:contact@uniswap.org)
- Discord: [Uniswap](https://discord.gg/FCfyBSbCU5)
- Whitepapers:
  - [V1](https://hackmd.io/C-DvwDSfSxuh-Gd4WKE_ig)
  - [V2](https://uniswap.org/whitepaper.pdf)
  - [V3](https://uniswap.org/whitepaper-v3.pdf)

---

# Web

[![codecov](https://codecov.io/gh/Uniswap/interface/branch/main/graph/badge.svg?token=YVT2Y86O82)](https://codecov.io/gh/Uniswap/interface)

[![Unit Tests](https://github.com/Uniswap/interface/actions/workflows/unit-tests.yaml/badge.svg)](https://github.com/Uniswap/interface/actions/workflows/unit-tests.yaml)
[![Integration Tests](https://github.com/Uniswap/interface/actions/workflows/integration-tests.yaml/badge.svg)](https://github.com/Uniswap/interface/actions/workflows/integration-tests.yaml)
[![Lint](https://github.com/Uniswap/interface/actions/workflows/lint.yml/badge.svg)](https://github.com/Uniswap/interface/actions/workflows/lint.yml)
[![Release](https://github.com/Uniswap/interface/actions/workflows/release.yaml/badge.svg)](https://github.com/Uniswap/interface/actions/workflows/release.yaml)
[![Crowdin](https://badges.crowdin.net/uniswap-interface/localized.svg)](https://crowdin.com/project/uniswap-interface)

## Accessing the Uniswap Interface

To access the Uniswap Interface, use an IPFS gateway link from the
[latest release](https://github.com/Uniswap/uniswap-interface/releases/latest),
or visit [app.uniswap.org](https://app.uniswap.org).

## Unsupported tokens

Check out `useUnsupportedTokenList()` in [src/state/lists/hooks.ts](./src/state/lists/hooks.ts) for blocking tokens in your instance of the interface.

You can block an entire list of tokens by passing in a tokenlist like [here](./src/constants/lists.ts)

## Contributions

For steps on local deployment, development, and code contribution, please see [CONTRIBUTING](./CONTRIBUTING.md).

#### PR Title
Your PR title must follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#summary), and should start with one of the following [types](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#type):

- build: Changes that affect the build system or external dependencies (example scopes: yarn, eslint, typescript)
- ci: Changes to our CI configuration files and scripts (example scopes: vercel, github, cypress)
- docs: Documentation only changes
- feat: A new feature
- fix: A bug fix
- perf: A code change that improves performance
- refactor: A code change that neither fixes a bug nor adds a feature
- style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- test: Adding missing tests or correcting existing tests

Example commit messages:

- feat: adds support for gnosis safe wallet
- fix: removes a polling memory leak
- chore: bumps redux version

Other things to note:

- Please describe the change using verb statements (ex: Removes X from Y)
- PRs with multiple changes should use a list of verb statements
- Add any relevant unit / integration tests
- Changes will be previewable via vercel. Non-obvious changes should include instructions for how to reproduce them


## Accessing Uniswap V2

The Uniswap Interface supports swapping, adding liquidity, removing liquidity and migrating liquidity for Uniswap protocol V2.

- Swap on Uniswap V2: <https://app.uniswap.org/swap?use=v2>
- View V2 liquidity: <https://app.uniswap.org/pools/v2>
- Add V2 liquidity: <https://app.uniswap.org/add/v2>
- Migrate V2 liquidity to V3: <https://app.uniswap.org/migrate/v2>

## Accessing Uniswap V1

The Uniswap V1 interface for mainnet and testnets is accessible via IPFS gateways
linked from the [v1.0.0 release](https://github.com/Uniswap/uniswap-interface/releases/tag/v1.0.0).

---

# Mobile (Wallet)

This repository contains code for the Uniswap Wallet and is in transition to a monorepo to share code across platforms!

## Getting Started

### Prerequisites / Setup

First, read and follow the instructions of the individual apps in this repository to install prerequisites to run these apps.

- [Mobile](apps/mobile/README.md)
- [Web](apps/web/README.md)

### Quickstart

There is a convenience command for setting up once you have installed the correct software. Before running ensure you installed and login to the [1Password CLI](https://1password.com/downloads/command-line/). Then run the following commands:

```bash
yarn lfg
```

This will generate all files needed for both mobile and extension and build both projects (web code and iOS app to simulator)

### Running

To run a product command, run `yarn {product} {command}`. e.g:

```bash
## Mobile pod installation, iOS installation and launching
yarn mobile pod
yarn mobile ios
yarn mobile start

# Extension start
yarn web start
```

## 🗂 Directory Structure

### apps/

Where all app entry points should live. App specific startup instructions should live in the associated application.

### config/

Shared infrastructure packages and configurations.

### packages/

Store all product related shared packages code here. Packages should be broken down by specific product. For non-product specific code, split into separate yet widely scoped packages rather than small packages.

---

## Using `packages/ui`

See the [Readme for UI](https://github.com/Uniswap/wallet-internal/blob/main/packages/ui/README.md).

---

## Monorepo Background

This monorepo has been forked forked from [pax-k/pax-react-native-starter](https://github.com/pax-k/pax-react-native-starter/blob/main/README.md>)

This monorepo is the result of:

- initial scaffold using `npm create tamagui` (see the [docs](https://tamagui.dev/))
- getting some inspiration from `tamagui-kitchen-sync` for adding Storybook to it ([link](https://github.com/dohomi/tamagui-kitchen-sink))
- adding `turbo` as a build and task runner cache system ([link](https://turbo.build/repo))
- using `Yarn Workspaces` with plugins ([docs](https://classic.yarnpkg.com/lang/en/docs/workspaces/))
- tweaking `tsconfig.json` and `package.json` for each workspace package to glue them together nicely with TypeScript Project References and Path Aliases ([docs](https://www.typescriptlang.org/docs/handbook/project-references.html)). One useful trick was to define path aliases with the same name as the ones defied by the workspace packages; this way, the code editor will jump on click to source, instead of node_modules
- setting up `build`, `format`, `lint`, `typecheck` for each package
- overall nutting and bolting everything together
