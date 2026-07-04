# Run routing (Trading API adapter)

The Trading API adapter makes the interface able to quote/swap against HookSwap's own routing. It
exposes the exact **Trading API** schema the interface calls and computes routes with the HookSwap
smart-order-router. **Deploy target: a single Linux VPS** (not AWS).

Source + full runbook: [`trading-api-adapter/`](../../trading-api-adapter/) —
[`DEPLOY.md`](../../trading-api-adapter/DEPLOY.md), [`README.md`](../../trading-api-adapter/README.md).

## Routing modes

- **Option B — EMBED (recommended for a single VPS).** One process; the adapter imports the
  HooksOS `@uniswap/smart-order-router` fork and runs AlphaRouter in-process against the deployed
  contracts + RPC. The in-process call (`EmbedRoutingProvider`) is a **marked TODO** in
  `src/routingClient.ts`.
- **Option A — PROXY.** Keep `routing-api` as a separate service and set `ROUTING_API_URL`. Upstream
  routing-api is AWS-CDK/Lambda; on a VPS you wrap its quote handler in a small Express server.

Until a backend is wired, `/v1/quote` returns a proper `404 NO_ROUTE_FOUND` — never a fabricated price.

## 1. Provision the VPS  [CREDENTIAL: VPS + domain]

Ubuntu 22.04+, a DNS A-record (e.g. `trading.hookswap.xyz`). Install `git`, `nginx`, `certbot`, and
either Docker or Node 20 + `pm2`:

```bash
sudo apt update && sudo apt install -y git nginx python3-certbot-nginx
curl -fsSL https://get.docker.com | sh                    # Docker route
# ...or Node route:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs && sudo npm i -g pm2
```

## 2. Get the code + env

```bash
git clone <HookSwap repo> hookswap && cd hookswap/trading-api-adapter
cp .env.example .env
cp config/rpc.example.env config/rpc.env
```

Edit `.env`: `ROUTING_MODE=embed` (or `ROUTING_API_URL=http://127.0.0.1:4001` for proxy),
`CORS_ALLOW_ORIGIN=https://hookswap.xyz` (`http://localhost:3000` for local), `PORT=4000`.

## 3. RPC config  [CREDENTIAL: Infura key]

`config/rpc.env` is **gitignored**. It carries `WEB3_RPC_<chainId>`:

| Chain | chainId | RPC | Provider |
|---|---|---|---|
| Sepolia | 11155111 | `https://sepolia.infura.io/v3/<INFURA_KEY>` | **Infura** (replace `<INFURA_KEY>`) |
| MegaETH | 4326 | `https://mainnet.megaeth.com/rpc` | public |
| Robinhood | 4663 | `https://rpc.mainnet.chain.robinhood.com` | public |
| Ink | 57073 | `https://rpc-gel.inkonchain.com` | public |
| XLayer | 196 | `https://xlayer.drpc.org` | public |
| HyperEVM | 999 | `https://rpc.hyperliquid.xyz/evm` | public |
| Tempo | 4217 | `https://rpc.tempo.xyz` | public |

Infura does **not** serve the 6 custom chains — keep their public RPCs (swap to dedicated nodes as
traffic grows).

## 4. Run the service

**Docker (recommended):**
```bash
docker compose --env-file .env up -d --build
curl -s http://127.0.0.1:4000/health   # {"status":"ok","routingMode":"embed"|"proxy"|"none",...}
```

**pm2:**
```bash
npm install && npm run build
pm2 start dist/server.js --name hookswap-trading-api --update-env
pm2 save && pm2 startup
```

A `systemd` unit alternative is in [`DEPLOY.md`](../../trading-api-adapter/DEPLOY.md) §4.

> Dependencies are **not installed** in the checkout (disk-constrained); `npm install` happens on
> the VPS at deploy time.

## 5. nginx + TLS  [CREDENTIAL: domain/DNS]

Reverse-proxy `127.0.0.1:4000` and provision TLS:

```nginx
server {
  server_name trading.hookswap.xyz;
  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/trading.hookswap.xyz /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d trading.hookswap.xyz
```

## 6. Point the interface at the adapter

```bash
# apps/web/.env.local
TRADING_API_URL_OVERRIDE="https://trading.hookswap.xyz"
```
The interface auto-appends `/v1`, calling `https://trading.hookswap.xyz/v1/quote`. Leave unset to
keep Uniswap's default. Rebuild/restart the web app after setting it.

## 7. (Embed mode) apply the SOR dependency override  [code]

If `ROUTING_MODE=embed`, before `npm install`:
1. Add deps: `@uniswap/smart-order-router`, `@uniswap/sdk-core`, `ethers@^5`.
2. Override both `@uniswap/*` to the HooksOS forks (which define ChainId 999/4663/4326/57073/196/4217
   and carry the deployed addresses) — the same override the SDK stack uses
   ([developers/sdk.md](../developers/sdk.md)).
3. Implement `EmbedRoutingProvider.quoteExactRoute` per the TODO in `src/routingClient.ts`.

## 8. The hard gate — liquidity  [on-chain action]

Even fully wired, quotes return `404 NO_ROUTE_FOUND` until real v2/v3 pools with liquidity exist on
each chain. Seed liquidity first — see [seed-liquidity.md](./seed-liquidity.md).

## Credential-gated checklist

- [ ] VPS + DNS A-record (`trading.hookswap.xyz`)
- [ ] Infura key in `config/rpc.env` for Sepolia
- [ ] TLS cert via certbot
- [ ] Routing backend — implement embed SOR **or** deploy routing-api + set `ROUTING_API_URL`
- [ ] Interface override `TRADING_API_URL_OVERRIDE` in prod web env
- [ ] Liquidity seeded on each chain
- [ ] (optional) dedicated RPC nodes for the 6 custom chains
