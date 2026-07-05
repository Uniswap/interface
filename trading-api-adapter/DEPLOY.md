# HookSwap Trading API adapter — VPS deploy runbook

This service makes the HookSwap interface able to quote/swap against HookSwap's **own**
routing, by exposing the exact **Trading API** schema the interface calls
(`POST /v1/quote`, `GET /v1/swappable_tokens`, …) and computing routes with the HookSwap
smart-order-router. Uniswap's hosted Trading API only serves Uniswap chains — this replaces it
for the 7 HookSwap chains.

> **Deploy target: a single Linux VPS** (not AWS). Plain long-running Node/Express server,
> containerized (Docker) or run under pm2, behind nginx + TLS. There is **no** AWS/CDK step for
> this adapter. (Upstream `routing-api` is an AWS-CDK/Lambda app; if you ever want *that* on
> AWS, see its own repo README — but for a VPS use **Option B / embed** below and skip it.)

Everything up to the point marked **[REGGIE — CREDENTIAL]** is code+config already in this repo.
The credential-gated actions are called out explicitly.

---

## 0. Architecture & the routing decision (pick one)

```
HookSwap interface (browser)
     │  POST https://trading.hookswap.org/v1/quote   (Trading API schema)
     ▼
nginx (TLS, certbot)  ──►  trading-api-adapter  (this service, Node/Express, :4000)
                                   │
                     ┌─────────────┴─────────────┐
        Option A: PROXY            Option B: EMBED  ◄── RECOMMENDED for a single VPS
        HTTP GET a VPS-hosted      import @uniswap/smart-order-router (HooksOS fork)
        routing-api /quote         and run AlphaRouter in-process (no extra service)
                                   │
                                   ▼
                    per-chain JSON-RPC (WEB3_RPC_<chainId>) + on-chain HookSwap v2/v3 pools
```

- **Option B (embed) — recommended.** One process. The adapter imports the HooksOS
  `@uniswap/smart-order-router` fork and computes routes directly against the deployed
  contracts + RPC. Avoids standing up routing-api's AWS-oriented wrapper on a VPS.
  Status in this repo: the provider interface + translation are done; the actual SOR call is a
  clearly-marked **TODO** in `src/routingClient.ts` (`EmbedRoutingProvider`). Implementing it =
  add the 3 deps + dependency-override (below) and fill the ~30 lines sketched in that stub.
- **Option A (proxy).** Keep routing-api as a separate service and point `ROUTING_API_URL` at
  it. routing-api upstream is AWS-CDK/Lambda; to run it on a VPS you wrap its exported quote
  handler in a small Express server (map HTTP → Lambda `event`) — see routing-api/hookswap
  README §6. More moving parts than embed.

Until whichever backend is wired, `/v1/quote` returns a proper Trading-API `404 NO_ROUTE_FOUND`
— **never a fabricated price.**

---

## 1. Provision the VPS  **[REGGIE — CREDENTIAL: VPS + domain]**

- A Linux VPS (Ubuntu 22.04+), a DNS A-record for the adapter host, e.g. `trading.hookswap.org`.
- Install: `git`, `nginx`, `certbot` (`python3-certbot-nginx`), and **either** Docker
  (`docker` + `docker compose`) **or** Node 20 + `pm2` (`npm i -g pm2`).

```bash
sudo apt update && sudo apt install -y git nginx python3-certbot-nginx
# Docker route:
curl -fsSL https://get.docker.com | sh
# ...or Node route:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs && sudo npm i -g pm2
```

## 2. Get the code + env

```bash
git clone <HookSwap repo> hookswap && cd hookswap/trading-api-adapter
cp .env.example .env
cp config/rpc.example.env config/rpc.env   # then put the real Infura key in it (see §3)
```

Edit `.env`:
- `ROUTING_MODE=embed` (Option B) **or** `ROUTING_API_URL=http://127.0.0.1:4001` (Option A).
- `CORS_ALLOW_ORIGIN=https://hookswap.org` (the interface origin; `http://localhost:3000` for local).
- `PORT=4000`.

## 3. RPC config  **[REGGIE — CREDENTIAL: Infura key]**

`config/rpc.env` is **gitignored** (never committed). It carries `WEB3_RPC_<chainId>`:

| Chain | chainId | RPC | Provider |
|-------|---------|-----|----------|
| Sepolia | 11155111 | `https://sepolia.infura.io/v3/<INFURA_KEY>` | **Infura** (replace `<INFURA_KEY>`) |
| MegaETH | 4326 | `https://mainnet.megaeth.com/rpc` | public — replace w/ dedicated node later |
| Robinhood | 4663 | `https://rpc.mainnet.chain.robinhood.com` | public — dedicated later |
| Ink | 57073 | `https://rpc-gel.inkonchain.com` | public — dedicated later |
| XLayer | 196 | `https://xlayer.drpc.org` | public — dedicated later |
| HyperEVM | 999 | `https://rpc.hyperliquid.xyz/evm` | public — dedicated later |
| Tempo | 4217 | `https://rpc.tempo.xyz` | public — dedicated later |

Infura does **not** serve the 6 custom chains — keep their public RPCs (swap to a dedicated /
self-run node when traffic justifies it). The pre-filled `config/rpc.env` already contains the
provided Infura key; if you're bootstrapping fresh, copy from `config/rpc.example.env` and
replace `<INFURA_KEY>`.

## 4. Run the service

**Docker (recommended):**
```bash
docker compose --env-file .env up -d --build
curl -s http://127.0.0.1:4000/health   # {"status":"ok","routingMode":"embed"|"proxy"|"none",...}
```

**pm2 (no Docker):**
```bash
npm install          # first time only (deferred in this repo — installs happen here)
npm run build
pm2 start dist/server.js --name hookswap-trading-api --update-env
pm2 save && pm2 startup   # persist across reboots
```

A `systemd` unit alternative (`/etc/systemd/system/hookswap-trading-api.service`):
```ini
[Unit]
Description=HookSwap Trading API adapter
After=network.target
[Service]
WorkingDirectory=/home/ubuntu/hookswap/trading-api-adapter
EnvironmentFile=/home/ubuntu/hookswap/trading-api-adapter/.env
EnvironmentFile=/home/ubuntu/hookswap/trading-api-adapter/config/rpc.env
ExecStart=/usr/bin/node dist/server.js
Restart=always
User=ubuntu
[Install]
WantedBy=multi-user.target
```
`sudo systemctl enable --now hookswap-trading-api`

## 5. nginx reverse proxy + TLS  **[REGGIE — CREDENTIAL: domain/DNS]**

`/etc/nginx/sites-available/trading.hookswap.org`:
```nginx
server {
  server_name trading.hookswap.org;
  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/trading.hookswap.org /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d trading.hookswap.org    # provisions + auto-renews TLS
```

## 6. Point the interface at the adapter

In the interface (`apps/web`), set the override so it calls this host instead of Uniswap's
hosted Trading API. See `apps/web/.env.local` (gitignored) for the commented entry added by this
change:

```bash
# apps/web/.env.local
TRADING_API_URL_OVERRIDE="https://trading.hookswap.org"
```

The interface auto-appends `/v1` (see `TradingApiClient` `getApiPathPrefix`), so it will call
`https://trading.hookswap.org/v1/quote`. Leave this **unset** to keep the app on Uniswap's
default (do not break current dev). Rebuild/restart the web app after setting it.

## 7. (Option B embed) apply the SOR dependency override  **[code, no creds]**

If you chose `ROUTING_MODE=embed`, before `npm install`:
1. Add to `package.json` deps: `@uniswap/smart-order-router`, `@uniswap/sdk-core`, `ethers@^5`.
2. Override both `@uniswap/*` to the HooksOS forks (which define ChainId 999/4663/4326/57073/
   196/4217 and carry the deployed addresses) via npm `overrides` or a git URL — the SAME
   override routing-api needs (see `routing-api/hookswap/README.md` §3).
3. Implement `EmbedRoutingProvider.quoteExactRoute` per the TODO in `src/routingClient.ts`.

## 8. THE HARD GATE — liquidity  **[REGGIE — on-chain action]**

Even fully wired, **quotes return `404 NO_ROUTE_FOUND` until real V2/V3 pools with liquidity
exist** on each chain. The static on-chain router discovers pools by address and reads reserves;
empty pools = no route. Seed liquidity (own seed + LP incentives) per chain before GA. This is
the real launch blocker, not the code.

---

## Credential-gated checklist (everything left for Reggie)
- [ ] **VPS + DNS** — provision host, A-record `trading.hookswap.org` (§1, §5).
- [ ] **Infura key** — put real key in `config/rpc.env` for Sepolia (§3). (Provided key already
      placed there; rotate if leaked.)
- [ ] **TLS** — `certbot` cert for the domain (§5).
- [ ] **Routing backend** — implement embed SOR (§7) *or* deploy routing-api + set `ROUTING_API_URL` (§0/A).
- [ ] **Interface override** — set `TRADING_API_URL_OVERRIDE` in prod web env (§6).
- [ ] **Liquidity** — seed pools on each chain (§8).
- [ ] *(optional)* dedicated RPC nodes for the 6 custom chains (§3).
