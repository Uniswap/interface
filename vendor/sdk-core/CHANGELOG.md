# @uniswap/sdk-core

## 7.18.0

### Minor Changes

- 4263dcf: Add Ink chain and Universal Router deployment config (v2.2.0 router also exposed as v2.1.1)

## 7.17.0

### Minor Changes

- ca82bac: Add Robinhood (4663) and Arc (5042) chain and Universal Router deployment config.

  Also corrects `ChainId.ROBINHOOD` from `46630` to `4663` to match the canonical Robinhood
  mainnet chain ID used across Uniswap's backend and the contracts deployments repo. Robinhood
  had no addresses wired up previously, so this is shipped as a minor bump.

## 7.16.1

### Patch Changes

- Add mainnet permissioned V4 position manager address and update sepolia permissioned V4 position manager address (perm-pool redeploy)

## 7.16.0

### Minor Changes

- Add UniversalRouterVersion V2_2_0 (Sepolia) with permissioned-pool support

## 7.15.0

### Minor Changes

- 0e30be1: Add MegaETH chain and Universal Router deployment config

## 7.13.0

### Minor Changes

- 58a58d0: Migrate build system from TSDX to tsc with separate CJS/ESM/types outputs. The new `exports` field ensures correct module resolution for all standard consumers (`import`/`require` of the package root). Deep subpath imports (e.g., `@uniswap/sdk-core/dist/...`) are no longer supported — all public APIs are re-exported from the package entry point. `tslib` is now a runtime dependency (required by `importHelpers`). Minimum Node.js version is now 18.

## 7.12.2

### Patch Changes

- 1779ed4: Test changeset workflow with dummy comment addition
