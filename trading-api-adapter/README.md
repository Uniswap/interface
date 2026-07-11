# HookSwap Trading API adapter

A small, self-contained **Node/Express** service that speaks the exact **Uniswap Trading API**
schema the HookSwap interface calls, and computes routes with HookSwap's own smart-order-router
against HookSwap's own pools. It exists because Uniswap's hosted Trading API
(`trading.gateway.uniswap.org`) only serves Uniswap chains — the HookSwap interface needs its
**own** Trading API endpoint for chains 4326 / 4663 / 57073 / 196 / 999 / 4217 / 11155111.

> **Status: implemented & deployed.** The HTTP contract, request validation, response
> translation, chain config (real deployed addresses), and both routing modes are real and
> typed. The in-process route computation (`EmbedRoutingProvider`) is fully implemented; the
> adapter runs live in EMBED mode (`ROUTING_MODE=embed`) at `trading.hookswap.org`. PROXY mode
> (`ROUTING_API_URL`, against a deployed routing-api) remains available as an alternative.
> **No quote numbers are ever fabricated** — with no route/liquidity, `/v1/quote` returns a
> Trading-API-shaped 404.
>
> Dependencies are **not installed** in this checkout (disk-constrained). `npm install` happens
> on the VPS at deploy time — see [DEPLOY.md](./DEPLOY.md).

## The contract this fulfills

The interface's trading client (`packages/api/src/clients/trading/createTradingApiClient.ts`)
calls, under a `/v1` prefix (`TradingApiClient.getApiPathPrefix`):

| Interface call | HTTP | This adapter |
|---|---|---|
| `fetchQuote` | `POST /v1/quote` | **implemented** → routes via SOR, returns `ClassicQuote` (routing=CLASSIC) |
| `fetchIndicativeQuote` | `POST /v1/indicative_quote` (also served at `/v1/quote` w/ `routingPreference=FASTEST`) | **implemented** → same real routing + `QuoteResponse` shape as `/quote` (drives the "Fetching best price…" display) |
| `fetchSwappableTokens` | `GET /v1/swappable_tokens?tokenIn=&tokenInChainId=` | **implemented** (returns wrapped-native; TODO full token list) |
| `fetchSwap` | `POST /v1/swap` | **implemented** → re-quotes with recipient, returns real Universal Router calldata (`methodParameters`) |
| `fetchCheckApproval` | `POST /v1/check_approval` | **implemented** → reads the real on-chain ERC20→Permit2 allowance; returns `approval:null` if sufficient, else an `approve(permit2, MaxUint256)` tx |
| `submitOrder`/`fetchOrders`/plan/wallet/* | various | out of scope (UniswapX / 4337 / 7702 — not used by classic v2/v3 swaps) |

`POST /v1/check_approval` request (subset): `walletAddress`, `token` (input token, or native
sentinel `0x0000…`/`0xEeee…`), `amount` (base units), `chainId`. Response:
`{ requestId, approval, cancel }` where `approval` is `null` when no approval is needed (native,
or existing allowance ≥ `amount`) — the interface's `useTokenApprovalInfo` branches on
`approval === null`. When insufficient, `approval` is a real ERC20 `approve(Permit2, MaxUint256)`
transaction (`{ to: token, from: walletAddress, data, value:"0", chainId }`); `cancel` is always
`null` (this adapter never revokes). Any failure returns a Trading-API-shaped JSON error, never HTML.

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
  routingClient.ts    RoutingProvider: (A) PROXY deployed routing-api  (B) EMBED SOR [implemented]  (none)
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
