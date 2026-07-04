# HookSwap for Operators

Everything needed to deploy and run the HookSwap stack. The deploy target for the app and
routing is a **Linux VPS** (not AWS); Sepolia uses **Infura**, the 6 custom chains use public
RPCs.

| Page | What it covers |
|---|---|
| [Deploy contracts](./deploy-contracts.md) | The Foundry/deploy-v3 kit + resolved per-chain pipeline |
| [Seed liquidity](./seed-liquidity.md) | The seed kit, minimum-liquidity guidance, Sepolia free demo |
| [Run the app](./run-the-app.md) | Build/run the interface; env; Windows/bun localhost bring-up |
| [Run routing](./run-routing.md) | The Trading API adapter on a VPS (Docker/pm2/nginx/certbot) |
| [Run the indexer](./run-indexer.md) | Self-hosting the v2/v3 subgraphs; wiring `SUBGRAPH_URL_<chainId>` |
| [Go-live checklist](./go-live-checklist.md) | The honest end-to-end sequence to a live swap |

## Where things stand

- **Contracts:** deployed on all 6 custom chains (Sepolia canonical). See
  [developers/contract-addresses.md](../developers/contract-addresses.md).
- **Routing backend + indexer + liquidity:** the remaining work before swaps quote live.
- Several steps are **credential- or capital-gated** (deployer key + gas, VPS + domain, Infura
  key, TLS, seed capital). Those are called out per page and in the
  [go-live checklist](./go-live-checklist.md).
