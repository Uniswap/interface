# Architecture overview

HookSwap is the Uniswap-interface monorepo, rebranded, pointed at **HookSwap's own deployed
contracts**, and served by a **self-hosted** routing backend (Uniswap's hosted Trading API
only serves Uniswap chains).

## Request flow

```
HookSwap interface (browser)
   │  POST https://trading.hookswap.xyz/v1/quote     (Trading API schema)
   ▼
Trading API adapter  (Node/Express, self-hosted on a VPS)
   │   embeds (or proxies) the smart-order-router
   ▼
smart-order-router (HooksOS fork)  ── reads pools + reserves via per-chain JSON-RPC
   ▼
HookSwap on-chain contracts:  v2 pools · v3 pools · Universal Router · Permit2
```

- The interface does **not** compute routes itself — it calls a Trading API endpoint.
- HookSwap replaces Uniswap's hosted endpoint with its own **Trading API adapter**, which
  computes routes with the **smart-order-router** against HookSwap's deployed pools.
- Quotes/swaps are then executed on-chain through the **Universal Router** (+ Permit2 for
  approvals).

See [routing.md](./routing.md) for the adapter details.

## The fork stack (HooksOS/*)

15 Uniswap repos were forked into the `HooksOS` GitHub org. Relevant to integrators:

| Layer | Repo(s) | Role |
|---|---|---|
| Contracts (deployed) | `v2-core`, `v2-periphery`, `v3-core`, `v3-periphery`, `swap-router-contracts`, `universal-router`, `permit2` | The on-chain stack. Deployed as-is (canonical bytecode). |
| SDKs | `sdks` (monorepo: `sdk-core`, `v2-sdk`, `v3-sdk`, `router-sdk`, `universal-router-sdk`, `permit2-sdk`) | Teaches chain IDs + HookSwap addresses. See [sdk.md](./sdk.md). |
| Routing | `smart-order-router`, `routing-api` | Pathfinding + quoting. Self-hosted. See [routing.md](./routing.md). |
| Indexing | `v2-subgraph`, `v3-subgraph` | Pool/liquidity indexers feeding the router. |
| Assets | `token-lists`, `default-token-list`, `assets` | Token metadata + logos. |
| Frontend | `HookSwap` (this repo — fork of `Uniswap/interface`) | The rebranded app. |

**Intentionally NOT forked:** `v4-core`, `v4-periphery`, `v4-sdk` — v4/hooks are excluded.
Full list: [`FORK-LIST.md`](../../FORK-LIST.md).

## Canonical bytecode → canonical init-code hashes

HookSwap deploys **standard Uniswap bytecode**, so the pair/pool **init-code hashes are the
canonical Uniswap values and identical on every chain**:

| | Init code hash |
|---|---|
| v2 pair | `0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f` |
| v3 pool | `0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54` |

Consequence: the SDK/SOR forks only needed **factory/manager addresses** swapped in — the
hashes are untouched. You can compute pool/pair addresses off-chain deterministically with
`getCreate2Address(factory, salt, initCodeHash)`.

## What is and isn't done

- **Done:** contracts deployed on all 6 chains; interface rebrand + address override (bridge).
- **In progress:** the routing backend (adapter `EmbedRoutingProvider` is a marked TODO),
  self-hosted subgraphs, and on-chain liquidity. Until those land, quotes 404. See the
  [go-live checklist](../operators/go-live-checklist.md).
