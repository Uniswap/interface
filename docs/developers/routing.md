# Routing & quoting

The HookSwap interface does **not** compute routes itself — it calls a **Trading API** endpoint.
Uniswap's hosted Trading API (`trading.gateway.uniswap.org`) only serves Uniswap chains, so
HookSwap runs its **own** Trading API adapter that computes routes with the smart-order-router
against HookSwap's own pools.

## How quoting works

```
interface  ──POST /v1/quote (Trading API schema)──►  trading-api-adapter
                                                          │
                                        ┌─────────────────┴─────────────────┐
                              Option A: PROXY                    Option B: EMBED (recommended)
                              HTTP GET a hosted routing-api      import smart-order-router (fork),
                              /quote                             run AlphaRouter in-process
                                                          │
                                                          ▼
                                       per-chain JSON-RPC + on-chain HookSwap v2/v3 pools
```

- The adapter fulfills the exact schema the interface calls (`POST /v1/quote`,
  `GET /v1/swappable_tokens`, …), under a `/v1` prefix.
- It carries the **real deployed addresses** per chain (from `contracts/deployments/*`).
- **No quote numbers are ever fabricated** — with no backend wired, `/v1/quote` returns a
  Trading-API-shaped `404 NO_ROUTE_FOUND`.

Source: [`trading-api-adapter/`](../../trading-api-adapter/) —
[`README.md`](../../trading-api-adapter/README.md),
[`DEPLOY.md`](../../trading-api-adapter/DEPLOY.md).

## Trading API surface

| Interface call | HTTP | Adapter status |
|---|---|---|
| `fetchQuote` | `POST /v1/quote` | implemented → routes via SOR, returns `ClassicQuote` (routing=CLASSIC) |
| `fetchSwappableTokens` | `GET /v1/swappable_tokens` | implemented (returns wrapped-native; full token list TODO) |
| `fetchSwap` | `POST /v1/swap` | **TODO** (assemble Universal Router calldata) |
| `fetchCheckApproval` | `POST /v1/check_approval` | **TODO** (Permit2 / ERC-20 allowance) |
| UniswapX / 4337 / 7702 endpoints | various | out of scope (classic v2/v3 only) |

## Pointing the interface at the adapter

Set the override in the web app env so it calls the HookSwap adapter instead of Uniswap's hosted
API (the interface auto-appends `/v1`):

```bash
# apps/web/.env.local  (gitignored)
TRADING_API_URL_OVERRIDE="https://trading.hookswap.org"
```

Leave it **unset** to keep the app on Uniswap's default. Rebuild/restart after setting it.

## Why launchpad token/WETH pools auto-route

The smart-order-router discovers routes by walking pools connected to base/connector tokens —
principally each chain's **WETH / wrapped-native**. So a new **`token → WETH`** pool is
immediately routable once it holds liquidity. Arbitrary **`token → USDC`** (non-WETH) pairs are
only found for multi-hop routing if the **subgraph** has indexed them — see
[operators/run-indexer.md](../operators/run-indexer.md) and the launchpad
[graduation pattern](./launchpad-integration.md#recommended-graduation-pattern).

## Current status & the hard gate

- **Adapter status: scaffold.** The HTTP contract, validation, response translation, chain
  config (real addresses), and both routing modes' wiring are real and typed. The in-process
  route computation (`EmbedRoutingProvider.quoteExactRoute` in `src/routingClient.ts`) is a
  **marked TODO** — implementing it = add the 3 deps + the sdk-core override and fill the ~30
  sketched lines. Until then, use PROXY mode against a deployed routing-api.
- **The hard gate is liquidity.** Even fully wired, quotes return `404 NO_ROUTE_FOUND` until real
  v2/v3 pools with liquidity exist on each chain. The router reads reserves by address — empty
  pools = no route. Seed liquidity first (see [seed-liquidity.md](../operators/seed-liquidity.md)).

For running the routing backend on a VPS, see [operators/run-routing.md](../operators/run-routing.md).
