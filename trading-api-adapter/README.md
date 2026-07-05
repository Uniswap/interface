# HookSwap Trading API adapter

A small, self-contained **Node/Express** service that speaks the exact **Uniswap Trading API**
schema the HookSwap interface calls, and computes routes with HookSwap's own smart-order-router
against HookSwap's own pools. It exists because Uniswap's hosted Trading API
(`trading.gateway.uniswap.org`) only serves Uniswap chains — the HookSwap interface needs its
**own** Trading API endpoint for chains 4326 / 4663 / 57073 / 196 / 999 / 4217 / 11155111.

> **Status: scaffold.** The HTTP contract, request validation, response translation, chain
> config (real deployed addresses), and both routing modes' wiring are real and typed. The
> in-process route computation (`EmbedRoutingProvider`) is a marked TODO; use PROXY mode
> (`ROUTING_API_URL`) against a deployed routing-api until it's filled in. **No quote numbers
> are ever fabricated** — with no backend, `/v1/quote` returns a Trading-API-shaped 404.
>
> Dependencies are **not installed** in this checkout (disk-constrained). `npm install` happens
> on the VPS at deploy time — see [DEPLOY.md](./DEPLOY.md).

## The contract this fulfills

The interface's trading client (`packages/api/src/clients/trading/createTradingApiClient.ts`)
calls, under a `/v1` prefix (`TradingApiClient.getApiPathPrefix`):

| Interface call | HTTP | This adapter |
|---|---|---|
| `fetchQuote` | `POST /v1/quote` | **implemented** → routes via SOR, returns `ClassicQuote` (routing=CLASSIC) |
| `fetchSwappableTokens` | `GET /v1/swappable_tokens?tokenIn=&tokenInChainId=` | **implemented** (returns wrapped-native; TODO full token list) |
| `fetchSwap` | `POST /v1/swap` | **TODO** (assemble Universal Router calldata) |
| `fetchCheckApproval` | `POST /v1/check_approval` | **TODO** (Permit2/ERC20 allowance check) |
| `submitOrder`/`fetchOrders`/plan/wallet/* | various | out of scope (UniswapX / 4337 / 7702 — not used by classic v2/v3 swaps) |

`POST /v1/quote` request (subset used): `type` (EXACT_INPUT|EXACT_OUTPUT), `amount`
(base units), `tokenIn`/`tokenOut`, `tokenInChainId`/`tokenOutChainId`, `swapper`,
`slippageTolerance`, `protocols`, `recipient`. Response: `{ requestId, routing:"CLASSIC",
quote:{ input, output, route[][], gasUseEstimate, ... }, permitData:null }`. Full field list in
[`src/tradingApiTypes.ts`](./src/tradingApiTypes.ts) (mirrors the interface's generated models).

## Layout

```
src/
  tradingApiTypes.ts  Trading API schema subset (mirror of interface's generated models)
  chains.ts           per-chain config w/ REAL deployed addresses (from contracts/deployments/*)
  routingClient.ts    RoutingProvider: (A) PROXY deployed routing-api  (B) EMBED SOR [TODO]  (none)
  translate.ts        routing-api classic response  ->  Trading API ClassicQuote (no fabrication)
  handlers.ts         validate + dispatch: handleQuote / handleSwappableTokens / handleHealth
  server.ts           Express host (mounts /v1/* and /*, CORS, /health)
config/
  rpc.example.env     COMMITTED template (placeholders, WEB3_RPC_<chainId>)
  rpc.env             GITIGNORED real values (Infura key + public RPCs)
Dockerfile, docker-compose.yml, DEPLOY.md
```

## Run (after `npm install` on a machine with disk)

```bash
cp .env.example .env && cp config/rpc.example.env config/rpc.env   # fill Infura key
npm install && npm run build && npm start     # or: docker compose up -d --build
curl -s localhost:4000/health
```

Point the interface at it via `apps/web/.env.local`:
```
TRADING_API_URL_OVERRIDE="https://trading.hookswap.org"
```
See [DEPLOY.md](./DEPLOY.md) for the full VPS runbook (nginx, TLS, systemd/pm2, liquidity gate).
