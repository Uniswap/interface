# AGENTS.md

This file provides guidance to AI agents when working with code in this repository. Always run all tests, lint, and typecheck after making changes, and before considering a task to be 'complete'.

## Project Overview

Uniswap Universe is a monorepo containing all Uniswap front-end interfaces:

- **Web** (`apps/web/`) - Decentralized exchange web interface
- **Mobile** (`apps/mobile/`) - React Native app for iOS/Android
- **Extension** (`apps/extension/`) - Browser wallet extension

## Common Development Commands

### Setup

```bash
# Initial setup
bun install
bun local:check
bun config:login
```

### Development Servers

```bash
bun web dev        # Web with Vite
bun mobile ios          # iOS app
bun mobile android      # Android app
bun extension start     # Extension
```

### Building

```bash
bun web build:production    # Web production build
bun mobile ios:bundle            # iOS bundle
bun mobile android:release       # Android release
bun extension build:production   # Extension production
```

### Testing

```bash
bun g:test                      # Run all tests
bun g:test:changed              # Run tests for changed packages
bun web playwright:test         # Web E2E tests
bun mobile e2e                  # Mobile E2E tests
```

### Code Quality

```bash
bun g:lint:fix                  # Fix linting issues
bun g:typecheck                 # Type check all packages
bun g:format                    # Fix formatting
bun i18n:extract                # Extract localized strings (run after changing translations)
```

## Architecture Overview

### Monorepo Structure

- **NX** for build orchestration
- **Bun workspaces** for package management
- Shared code in `packages/` directory
- App-specific code in `apps/` directory

### Key Technologies

- **TypeScript** everywhere
- **React** for web/extension
- **React Native** for mobile
- **Redux Toolkit** for state management
- **Tamagui** for cross-platform UI components
- **Ethers.js/Viem** for blockchain interactions

### Code Organization Principles

#### Styling

- **ALWAYS** use `styled` from `ui/src` (never styled-components or direct Tamagui); UI components may use inline styling where appropriate
- Use theme tokens instead of hardcoded values
- Platform-specific files: `Component.ios.tsx`, `Component.android.tsx`, `Component.web.tsx`, `Component.native.tsx` (with stub files for platforms where specific implementation isn't needed)

#### State Management

- **Redux** for complex global state
- **Zustand** for simple global/shared state — do not use Jotai, we are migrating away from it. Flag any new Jotai usage in PRs and require Zustand instead.
- Keep state as local as possible
- No custom hooks for simple data fetching - use `useQuery`/`useMutation` directly

#### Component Structure

1. State declarations at top
2. Event handlers after state
3. Memoize properly, especially for anything that might be used in the React Native app
4. JSX at the end
5. Keep components under 250 lines

#### TypeScript Conventions

- Do not use `any`, prefer `unknown`
- Always consider strict mode
- Use explicit return types
- PascalCase for types/interfaces
- camelCase for variables/functions
- String enums with initializers

## Testing + Formatting Guidelines

- Test behaviors, not implementations
- Always update existing unit tests related to changes made
- Run tests before considering a task to be 'complete'
- Also run linting and typecheck before considering a task to be 'complete'
- Run `bun i18n:extract` after making changes to localized strings (e.g., using translation hooks like `useTranslation`)

## Critical Development Notes

1. **Environment Variables**: Override URLs in `.env.defaults.local` (mobile) or `.env` (extension)
2. **Pre-commit Hooks**: Use `--no-verify` to skip or set `export LEFTHOOK=0` to disable
3. **Python Setup**: Run `brew install python-setuptools` if you encounter Python module errors
4. **Mobile Development**: Always run `bun mobile pod` after dependency changes
5. **Bundle Size**: Monitor bundle size impacts when adding dependencies

## Package Dependencies

Core shared packages:

- `packages/ui/` - Cross-platform UI components and theme
- `packages/uniswap/` - Core business logic and utilities
- `packages/wallet/` - Wallet functionality
- `packages/utilities/` - Common utilities

## Blockchain Integration

- Support for multiple chains (Ethereum, Arbitrum, Optimism, etc.)
- Uniswap Protocol v2, v3, v4, and UniswapX support
- Multiple wallet providers (WalletConnect, Metamask, etc.)
- Transaction building and gas estimation

## Other Considerations

Be cognizant of the app or package within which a given change is being made. Be sure to reference that app or package's respective `AGENTS.md` file and other local configuration files, including (but not limited to): `package.json`, `tsconfig.json`, etc.


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors


<!-- nx configuration end-->

## Cursor Cloud specific instructions

### Environment

- Node.js v22.22.2 and Bun 1.3.11 are pre-installed and match `.nvmrc` / `.bun-version`.
- The `tsgo` binary is at `node_modules/.bin/tsgo` (not globally in PATH). The `bun g:typecheck` script handles this automatically.
- Set `export LEFTHOOK=0` to disable git hooks in Cloud Agent sessions (no TTY for interactive hooks).
- Set `export SKIP_CONFIG_PULL=true` to disable remote config fetching (no Okta auth for agents)
- All backend APIs are external (no local databases or Docker needed for development).

### Web App

- **Start dev server**: `bun web dev` → runs on `http://localhost:3000/`
- **Run tests**: `bunx nx run web:test -- --run` (317 test files, ~2.5 min)
- **Lint (fast)**: `bunx nx run web:format` (formatting) and `bunx nx run web:lint` (oxlint)
- **Typecheck**: `bun g:typecheck` runs `tsgo -b` globally (fastest). Per-project: `bunx nx run web:typecheck`.
- The `web:typecheck:cloud` target typechecks the `apps/web/functions/` (edge functions) separately and may fail independently of the main app.
- The web app loads live data from Uniswap's public APIs without requiring API keys for basic swap quotes and token exploration.

### Extension

- **Start dev server**: `bun extension dev` → WXT builds the extension and opens Chrome with it pre-loaded.
- A pre-built extension is available at `/var/tmp/stretch` and is already loaded in the default Chrome profile (`/home/ubuntu/.config/google-chrome`).
- The extension wallet is **already onboarded**. To unlock it, use the password from the `EXTENSION_UNLOCK_PASSWORD` environment variable.
- To type the password programmatically: write it to a temp file with `python3 -c "import os; open('/tmp/ext_pw.txt','w').write(os.environ['EXTENSION_UNLOCK_PASSWORD'])"`, then read/type from that file (the env var value is redacted in shell output but available to processes).
- The extension opens as a **side panel** in Chrome (not a popup). Click the Uniswap icon in the toolbar or use Ctrl+Shift+U.
- The wallet contains a small amount of ETH and cBTC on Ethereum mainnet.
- **Known limitation**: connecting the extension wallet to the web app on `localhost` does not currently work (the `externally_connectable` manifest only allows `app.uniswap.org` and staging origins).

### Gotchas

- `bun install` runs a `preinstall` script that validates Node/Bun versions and will fail if they don't match `.nvmrc` / `.bun-version`.
- The `postinstall` script runs `git config core.hooksPath .husky && bun g:prepare`. The `g:prepare` step (`nx run-many -t prepare`) generates codegen files needed for typecheck/build.
- Mobile requires native tooling (Xcode, CocoaPods, Android SDK) not available in Cloud Agent VMs.
- When running `bun extension dev`, WXT creates a `web-ext.config.ts` override file (gitignored) to customize browser startup behavior. You can set `startUrls`, `chromiumArgs`, or `WXT_NO_OPEN_BROWSER=true` as needed.
