# SDK

The **HookSwap SDK** gives integrators the HookSwap chain IDs and the per-chain deployed
contract addresses (v2/v3 factories, routers, position manager, Universal Router, Permit2). It is
the single source of truth the app and tooling use to resolve addresses per chain.

For most integrations you don't need the SDK at all — the machine-readable
[`addresses.json`](../../launchpad-integration/addresses.json) plus the
[contract addresses](./contract-addresses.md) reference cover everything needed to point calls at
HookSwap. Use the SDK when you want typed helpers for pool-address computation and route encoding.

## What the SDK provides

- **Chain IDs** for every HookSwap chain (table below).
- **Per-chain addresses** — v2 factory/router, v3 factory, NonfungiblePositionManager,
  SwapRouter02, QuoterV2, Universal Router, Permit2.
- **Canonical init-code hashes** — identical on every chain, so pool/pair addresses are
  computable off-chain with `getCreate2Address(factory, salt, initCodeHash)`. See
  [overview](./overview.md#init-code-hashes).

Only the **factory / manager addresses** differ per chain; the init-code hashes and the
computation logic are the same everywhere.

## Chain IDs

| Chain | chainId |
|---|---|
| HyperEVM | 999 |
| X Layer | 196 |
| MegaETH | 4326 |
| Tempo | 4217 |
| Robinhood | 4663 |
| Ink | 57073 |
| Sepolia (testnet) | 11155111 |

## Consuming addresses in your own service

If your own backend needs the same addresses (e.g. a quoting service or a launchpad worker),
import the per-chain map directly from [`addresses.json`](../../launchpad-integration/addresses.json)
— it carries the deployed addresses, init-code hashes, and fee tiers per chain. This is the
simplest, dependency-free way to stay in sync with HookSwap's deployments.

The routing stack's wiring is covered in [routing.md](./routing.md).
