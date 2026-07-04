# HookSwap Documentation

HookSwap is a multi-chain decentralized exchange (DEX) — a rebrand and fork of the
Uniswap interface running on **HookSwap's own deployed contracts**. It ships a full
**Uniswap v2 (constant-product AMM) + v3 (concentrated liquidity) + Universal Router**
stack across 6 production chains, plus **Sepolia** (canonical Uniswap) for testing.

- **Name / URL:** HookSwap · https://hookswap.xyz
- **Contracts:** HookSwap-owned deployments of canonical Uniswap v2/v3/Universal Router
  bytecode (so init-code hashes stay canonical; only the factory/manager addresses differ).
- **UI:** the Uniswap-interface fork, rebranded to HookSwap ("Terminal" redesign in progress).
- **Routing:** self-hosted (a Trading API adapter + smart-order-router fork) — Uniswap's
  hosted Trading API does not serve custom chains.

> **About the name — no hooks, no v4.** Despite "HookSwap", the product ships **v2 + v3
> only**. There is **no Uniswap v4, no PoolManager, and no hooks** deployed on any HookSwap
> chain. The "hook-native" branding is aspirational and is gated off in the UI until a v4
> stack is ever deployed. Do not build against v4 flows — they do not exist on-chain.

---

## Documentation tracks

| Track | For | Start here |
|---|---|---|
| **[Users](./users/README.md)** | Traders and liquidity providers using the app | [Getting started](./users/getting-started.md) |
| **[Developers / Integrators](./developers/README.md)** | Launchpads, SDK consumers, anyone integrating | [Overview](./developers/overview.md) · [Contract addresses](./developers/contract-addresses.md) |
| **[Operators](./operators/README.md)** | Whoever deploys and runs the HookSwap stack | [Go-live checklist](./operators/go-live-checklist.md) |

---

## Current status (honest summary)

| Component | Status |
|---|---|
| Interface rebrand + reskin | Done (title/meta/URLs/i18n/theme). Terminal redesign in progress. |
| Contracts (v2 + v3 + Universal Router) | **Deployed** on all 6 custom chains; Sepolia uses canonical Uniswap. See [contract-addresses.md](./developers/contract-addresses.md). |
| SDK address override (`@uniswap/sdk-core` → HookSwap) | Applied as a bridge in the interface; a clean `bun install` still pending. |
| Routing backend (Trading API adapter + SOR) | **Scaffolded, not yet live.** In-process route computation (`EmbedRoutingProvider`) is a marked TODO. Until it runs, quotes return a Trading-API `404 NO_ROUTE_FOUND` — never a fabricated price. |
| Subgraph / indexer | Fork exists (HooksOS/v2-subgraph, v3-subgraph); self-hosting per chain still to do. |
| On-chain liquidity | **The real launch blocker.** Empty pools quote nothing. Needs one base pair per chain (seed kit) and/or launchpad-supplied pools. |

**Bottom line:** the contracts are live, but a working end-to-end swap still requires the
routing backend running **and** real liquidity in pools. See the
[go-live checklist](./operators/go-live-checklist.md) for the exact sequence.
