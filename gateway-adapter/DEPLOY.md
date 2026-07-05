# HookSwap gateway-schema adapter — VPS deploy runbook

This service makes the HookSwap interface read pool/token/price data from HookSwap's **own**
v3-subgraph, by serving the exact **gateway GraphQL schema** the interface calls
(`AWS_API_ENDPOINT` → Apollo `HttpLink`, verified in `apps/web/src/config.ts` +
`apps/web/src/appGraphql/data/apollo/client.ts`). Operations a v3-subgraph can't serve
(balances, NFTs, token CMS, v2/v4) are proxied to Uniswap's real gateway. Uniswap's hosted gateway
only serves Uniswap chains — this replaces it for the 7 HookSwap chains.

> **Deploy target: a single Linux VPS** (not AWS). graphql-yoga long-running Node server,
> containerized (Docker) or under pm2, behind nginx + TLS. It sits on the **same VPS / Docker
> network** as the `graph-node` from `v3-subgraph/hookswap/SELF-HOST.md`.

Everything up to **[REGGIE — CREDENTIAL/INFRA]** markers is code+config already in this repo.

---

## 0. Architecture

```
HookSwap interface (browser)
   │  POST https://gateway.hookswap.org/v1/graphql   (gateway GraphQL schema)
   ▼
nginx (TLS, certbot) ──► gateway-adapter (this service, graphql-yoga, :4000)
                              │
                onParams router: all root fields subgraph-backed?
                     │yes                             │no
                     ▼                                ▼
        resolvers → per-chain v3-subgraph      proxy verbatim → UPSTREAM_GATEWAY_URL
        (graph-node :8000, SELF-HOST.md)        (real Uniswap gateway) → return as-is
```

- **Subgraph-backed** (implemented): `topV3Pools`, `v3Pool`, `v3PoolsForTokenPair`, `v3Transactions`,
  `token`, `tokens`, `topTokens`, `isV3SubgraphStale`, plus the args-bearing field resolvers on
  `V3Pool` (transactions / ticks / priceHistory / historicalVolume / cumulativeVolume /
  totalLiquidityPercentChange24h), `Token` (market / v3Transactions), and `TokenMarket` (price / tvl /
  fdv / volume / historicalVolume / historicalTvl / priceHistory / ohlc / pricePercentChange /
  priceHighLow). See `README.md` → resolver coverage. Remaining gaps are TODO there.
- **Proxied** (default for everything else): balances, NFTs, token projects/CMS, v2/v4, convert,
  search. No data is fabricated — if `UPSTREAM_GATEWAY_URL` is unset, those return a GraphQL error.

This adapter depends on the **graph-node** stack being up first (that stack indexes the on-chain
pools). Bring up graph-node per `v3-subgraph/hookswap/SELF-HOST.md`, deploy the 7 subgraphs, THEN
this adapter.

---

## 1. Provision / reuse the VPS  **[REGGIE — INFRA: VPS + domain]**

Reuse the same VPS as `trading-api-adapter` and `graph-node`. Add a DNS A-record for the gateway
host, e.g. `gateway.hookswap.org`. Install `git`, `nginx`, `certbot`, and **either** Docker **or**
Node 20 + `pm2` (same as the trading adapter's DEPLOY.md §1).

## 2. Bring up graph-node + deploy the subgraphs FIRST  **[INFRA]**

Follow `v3-subgraph/hookswap/SELF-HOST.md` end to end. Result: graph-node serves one GraphQL URL per
chain at `http://<vps>:8000/subgraphs/name/hookswap-v3-<chain>` (chains: sepolia, ink, megaeth,
robinhood, xlayer, hyperevm, tempo). Confirm each is syncing before pointing the adapter at it.

## 3. Get the code + env

```bash
git clone <HookSwap repo> hookswap && cd hookswap/gateway-adapter
cp .env.example .env
```

Edit `.env`:
- `SUBGRAPH_URL_<chainId>` — one per chain. If graph-node runs in the SAME docker network, the
  `.env.example` defaults (`http://graph-node:8000/subgraphs/name/hookswap-v3-<chain>`) work as-is.
  If graph-node is a separate host/port, use its reachable URL (e.g. `http://127.0.0.1:8000/...`).
  Leaving a chain's `SUBGRAPH_URL_*` **unset** means its `topV3Pools`/`v3Pool`/`token` calls proxy
  upstream instead (honest fallback, no fabrication).
- `UPSTREAM_GATEWAY_URL=https://beta.gateway.uniswap.org/v1/graphql` (the proxy target for
  unimplemented ops). Set to `""` to hard-disable proxying (unimplemented ops then GraphQL-error).
- `CORS_ALLOW_ORIGIN=https://hookswap.org` (interface origin; `http://localhost:3000` for local).
- `GRAPHQL_ENDPOINT=/v1/graphql` (keep — the interface's `AWS_API_ENDPOINT` ends in `/v1/graphql`).
- `PORT=4000`.

## 4. Run the service

**Docker (recommended):**
```bash
# join the graph-node network so SUBGRAPH_URL_* hostnames resolve (see docker-compose.yml comments)
docker compose --env-file .env up -d --build
curl -s http://127.0.0.1:4000/health   # {"status":"ok","upstreamConfigured":true,"subgraphChains":[...]}
```

**pm2 (no Docker):**
```bash
npm install          # first time only (deferred in this repo — installs happen here)
npm run build
pm2 start ecosystem.config.js --update-env
pm2 save && pm2 startup   # persist across reboots
```

`systemd` alternative — identical to `trading-api-adapter/DEPLOY.md` §4 with
`WorkingDirectory=.../gateway-adapter`, `ExecStart=/usr/bin/node dist/server.js`,
`EnvironmentFile=.../gateway-adapter/.env`.

## 5. nginx reverse proxy + TLS  **[REGGIE — CREDENTIAL: domain/DNS]**

`/etc/nginx/sites-available/gateway.hookswap.org`:
```nginx
server {
  server_name gateway.hookswap.org;
  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/gateway.hookswap.org /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d gateway.hookswap.org
```

## 6. Point the interface at the adapter — THE ONE INTERFACE CHANGE

In `apps/web/.env.local` (gitignored) set the gateway endpoint override:

```bash
# apps/web/.env.local
AWS_API_ENDPOINT="https://gateway.hookswap.org/v1/graphql"
```

`apps/web/src/config.ts` reads `AWS_API_ENDPOINT` (`?? REACT_APP_AWS_API_ENDPOINT`) into
`awsApiEndpoint`, which is the Apollo `HttpLink` uri. Rebuild/restart the web app after setting it.
Leave it **unset** to keep the app on Uniswap's default gateway (don't break current dev).

## 7. Schema sync note

`schema.graphql` in this dir is a **copy** of
`packages/api/src/clients/graphql/schema.graphql` (1598 lines). The adapter serves it verbatim so the
interface's generated queries validate. If the interface's gateway schema changes (Uniswap upstream
bump), re-copy it:
```bash
cp ../packages/api/src/clients/graphql/schema.graphql ./schema.graphql
```
Then re-run `npm run build`. (One caveat: if HyperEVM (999) queries flow through this gateway path,
add `HYPEREVM` to the served schema's `enum Chain` — it is not in the committed enum yet; see
`src/chains.ts` note.)

## 8. Extension point — implement a new subgraph-backed operation

To move an operation from "proxied" to "subgraph-backed" (README has the TODO list of candidates):

1. **`src/translate.ts`** — add a mapper from the subgraph entity to the gateway output shape.
   Match the EXACT field names/types the interface's query doc selects (see
   `packages/api/src/clients/graphql/web/*.graphql`) against the gateway type in `schema.graphql`.
2. **`src/resolvers.ts`** — add the `Query.<field>` resolver (query the subgraph via
   `querySubgraph`, then map), plus any args-bearing field resolvers.
3. **`src/resolvers.ts`** — add the root field name to `LOCAL_QUERY_FIELDS`. This is what flips the
   `onParams` router from "proxy" to "serve locally" for that op.
4. `npm run build` + smoke-test with the interface's real query document + variables against
   `http://127.0.0.1:4000/v1/graphql`; compare shape to the upstream gateway's response.

Rule: never invent a value with no subgraph source — return `null` (interface degrades) or leave the
op proxied.

## 9. Data gate — indexed pools + seeded liquidity  **[REGGIE — on-chain action]**

Subgraph-backed responses are only as complete as what graph-node has indexed. Empty pools = empty
`topV3Pools`. USD/TVL/volume metrics need `STABLE_TOKEN_POOL` set per chain in the subgraph config
(SELF-HOST.md §6) once a WETH/USD pool is seeded. Seed liquidity per chain before GA.

---

## Credential / infra-gated checklist (everything left for Reggie)
- [ ] **VPS + DNS** — host + A-record `gateway.hookswap.org` (§1, §5).
- [ ] **graph-node + 7 subgraphs deployed** — per v3-subgraph/hookswap/SELF-HOST.md (§2).
- [ ] **`.env`** — `SUBGRAPH_URL_<id>` (×7), `UPSTREAM_GATEWAY_URL`, `CORS_ALLOW_ORIGIN` (§3).
- [ ] **TLS** — certbot cert for the domain (§5).
- [ ] **Interface override** — set `AWS_API_ENDPOINT` in prod web env (§6).
- [ ] **Indexed pools + liquidity** — seed pools; set `STABLE_TOKEN_POOL` for USD metrics (§9).
