# Deploying the HookSwap data-api (VPS)

Same pattern as `trading-api-adapter` and the trading service already live on the VPS
(`15.204.8.186`): a long-running Node process managed by **systemd**, behind **nginx** on a
dedicated subdomain (`data.hookswap.org`), TLS via certbot. **Not** Vercel/AWS.

Ports in play: trading adapter = `:4090`, other HookOS platform app = `:4000`, **data-api = `:4092`**.

## 0. Build

```bash
cd ~/data-api            # this repo's data-api/ dir, checked out on the VPS
npm install              # deps are NOT committed (disk-constrained checkout)
npm run typecheck        # optional but recommended — verifies against the proto .d.ts
npm run build            # tsc -> dist/
```

`@uniswap/client-data-api` (0.0.113) is a normal npm dependency — it installs cleanly; no
vendored/forked package or symlink gymnastics (unlike the SOR in the trading adapter).

## 1. Env

```bash
cp .env.example .env
# edit .env:
#   PORT=4092
#   CORS_ALLOW_ORIGIN=https://hookswap.org
#   WEB3_RPC_<chainId>=<hosted RPC>   (optional; public fallbacks used otherwise)
```

Reminder (learned on the trading adapter): if you load env via systemd `EnvironmentFile`, keep each
value on its own line with **no trailing inline `# comment`** — systemd does not strip them and the
comment becomes part of the value. The `.env.example` here already follows that.

## 2. systemd unit

`/etc/systemd/system/hookswap-data-api.service`:

```ini
[Unit]
Description=HookSwap data-api (Connect-RPC, on-chain current-state)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/data-api
EnvironmentFile=/home/ubuntu/data-api/.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now hookswap-data-api
curl -s http://127.0.0.1:4092/health   # -> {"status":"ok", "implemented":["listTokens","listTopPools"], ...}
```

(pm2 alternative: `pm2 start ecosystem.config.js --update-env` after `npm run build`.)

## 3. nginx + TLS (`data.hookswap.org`)

The server tolerates any path prefix (it slices requests down to the bare
`/data.v1.DataApiService/...` Connect path), so nginx can proxy the whole subdomain straight through
— no path rewriting needed:

```nginx
server {
    server_name data.hookswap.org;

    location / {
        proxy_pass http://127.0.0.1:4092;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Connect unary is plain HTTP/1.1 POST/GET; no special upgrade needed.
    }
}
```

```bash
sudo certbot --nginx -d data.hookswap.org
```

Verify end-to-end:

```bash
curl -X POST https://data.hookswap.org/data.v1.DataApiService/ListTopPools \
  -H 'Content-Type: application/json' -d '{"chainIds":[4663]}'
# -> the seeded Robinhood WETH/tHOOK pool (token0/token1/feeTier), stats omitted (Phase 1).
```

## 4. Point the interface at it  (FOLLOW-UP — not done in this task)

The interface resolves its v2 Connect transport base URL in
`packages/uniswap/src/constants/urls.ts`:

```ts
dataApiBaseUrlV2: overrides.apiBaseUrlV2Override || getCloudflareApiBaseUrl({ flow: TrafficFlows.DataApi, postfix: 'v2' })
```

and `overrides.apiBaseUrlV2Override` is fed from the env var **`API_BASE_URL_V2_OVERRIDE`**
(`packages/config/src/BaseConfig.ts:64`).

Two ways to wire the frontend to this service — pick one:

- **Option A (quickest, blunt): set `API_BASE_URL_V2_OVERRIDE=https://data.hookswap.org/v2`** in the
  web build env. This redirects **both** `dataApiBaseUrlV2` *and* the generic `apiBaseUrlV2` (the
  uniswap v2 REST transport used by search etc.) to this host. That's fine for Phase 1 — this server
  implements `DataApiService`; other v2 services would 404/return empty. The interface's Markets,
  token pickers, and Explore start reading real HookSwap data. Trailing `/v2` is harmless (the
  server strips any prefix).

- **Option B (surgical, recommended for prod): redirect ONLY the data-api.** Add a dedicated
  override (e.g. `DATA_API_BASE_URL_V2_OVERRIDE`) in `BaseConfig.ts` + `UniswapUrlOverrides`, and
  change the `dataApiBaseUrlV2` line to prefer it:
  `dataApiBaseUrlV2: overrides.dataApiBaseUrlV2Override || overrides.apiBaseUrlV2Override || getCloudflareApiBaseUrl({...})`.
  Then set `DATA_API_BASE_URL_V2_OVERRIDE=https://data.hookswap.org/v2` and leave the other v2
  services on their existing backend. This is a small interface change (a HookSwap fork, so editing
  these config files is allowed) — intentionally **left as a follow-up**, not done in this task.

After wiring, rebuild + redeploy the SPA using the pinned VPS toolchain recipe (see the repo's
[[deploy-on-vps]] memory / CLAUDE.md) and confirm the Markets screen shows the Robinhood pool.

## What ships live in Phase 1 vs. later

- **Live now:** token lists (native + wrapped-native + seeded ERC-20s) and the v2 pool table
  (real, on-chain-discovered pools with real token pairs + fee tier). Value metrics (USD TVL,
  volume, APR, charts, portfolio) render honest "—"/empty.
- **Phase 2 (needs an event indexer + USD price oracle):** volume/TVL-in-USD, protocol stats,
  transactions/activity, portfolio balances & P/L, price history/charts. Those methods are already
  wired as valid empty stubs, so turning them on is additive — no interface change required beyond
  richer data.
