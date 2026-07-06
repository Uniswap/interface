# Routing & quoting

The HookSwap interface does **not** compute routes itself — it calls a **Trading API** endpoint.
HookSwap runs its **own** Trading API, which computes routes against HookSwap's own on-chain
v2/v3 pools and returns quotes to the app.

## How quoting works

```
HookSwap interface  ──POST /v1/quote (Trading API schema)──►  HookSwap Trading API
                                                                      │
                                                                      ▼
                                    per-chain JSON-RPC + on-chain HookSwap v2/v3 pools
```

- The Trading API fulfills the exact schema the interface calls (`POST /v1/quote`,
  `GET /v1/swappable_tokens`, …), under a `/v1` prefix.
- It carries the **real deployed addresses** per chain (from `contracts/deployments/*`).
- **No quote numbers are ever fabricated** — with no liquidity to route against, `/v1/quote`
  returns a Trading-API-shaped `404 NO_ROUTE_FOUND`.

## Trading API surface

| Interface call | HTTP | Status |
|---|---|---|
| `fetchQuote` | `POST /v1/quote` | routes across HookSwap v2/v3 pools, returns a classic quote |
| `fetchSwappableTokens` | `GET /v1/swappable_tokens` | implemented (wrapped-native; full token list TODO) |
| `fetchSwap` | `POST /v1/swap` | **TODO** (assemble Universal Router calldata) |
| `fetchCheckApproval` | `POST /v1/check_approval` | **TODO** (Permit2 / ERC-20 allowance) |
| Gasless / account-abstraction endpoints | various | out of scope (classic v2/v3 only) |

## Pointing the interface at the Trading API

Set the endpoint override in the web-app env so the app calls the HookSwap Trading API (the
interface auto-appends `/v1`):

```bash
# apps/web/.env.local  (gitignored)
TRADING_API_URL_OVERRIDE="https://trading.hookswap.org"
```

Rebuild/restart after setting it.

## Why launchpad token/WETH pools auto-route

HookSwap routing discovers routes by walking pools connected to base/connector tokens —
principally each chain's **WETH / wrapped-native**. So a new **`token → WETH`** pool is
immediately routable once it holds liquidity. Arbitrary **`token → USDC`** (non-WETH) pairs are
only found for multi-hop routing once they've been **indexed** — see the launchpad
[graduation pattern](./launchpad-integration.md#recommended-graduation-pattern).

## The hard gate: liquidity

Even fully wired, quotes return `404 NO_ROUTE_FOUND` until real v2/v3 pools with liquidity exist
on a chain. Routing reads reserves by address — empty pools mean no route. Liquidity must be
seeded first for a given chain/pair to be quotable.
