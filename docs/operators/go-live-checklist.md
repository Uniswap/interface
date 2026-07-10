# Go-live checklist

The honest end-to-end sequence from "contracts deployed" to "a real swap executes". Each step
notes what's **done**, what's **code work**, and what's **credential- or capital-gated** (needs
Reggie: keys, gas, VPS, domain, Infura, seed capital).

## Where we are

- ✅ **Contracts deployed** on all 6 custom chains; Sepolia canonical.
  ([contract-addresses.md](../developers/contract-addresses.md))
- ✅ **Interface** rebranded + address override applied (bridge). Terminal redesign in progress.
- ✅ **Routing backend** live in embed mode at `trading.hookswap.org` (`EmbedRoutingProvider` implemented); quotes gated on pool liquidity.
- ⏳ **Subgraphs** forked, not yet self-hosted per chain.
- ⏳ **Liquidity** — the real launch blocker.

## The sequence

### 1. Formalize the SDK override — [code]
Run a clean `bun install` from the repo root so `bun.lock` records the `file:` resolution for
`@uniswap/sdk-core` and re-links the fork authoritatively (currently a manual dist sync).
Gated only on disk freeing to ~8-10 GB. See [developers/sdk.md](../developers/sdk.md).

### 2. Stand up the routing adapter — [credential: VPS + domain + Infura] + [code]
- Provision the VPS + DNS + TLS; put the Infura key in `config/rpc.env`.
- Choose **embed** mode (`EmbedRoutingProvider.quoteExactRoute` is already implemented — just
  apply the SOR dependency override + `npm install`), **or** run `routing-api` in **proxy** mode.
- Verify `GET /health` returns `routingMode: embed|proxy`.
- Full steps: [run-routing.md](./run-routing.md).

### 3. (Optional for launch) self-host subgraphs — [code + infra]
Deploy the v2/v3 subgraph forks per chain and wire `SUBGRAPH_URL_<chainId>` into the router. Can be
deferred initially — WETH-connected pools route without it. See [run-indexer.md](./run-indexer.md).

### 4. Seed at least one base pair per chain — [capital / on-chain action]
Empty pools quote nothing. Seed a `token/WETH` (or launchpad-supplied) pool with **usable**
liquidity (~$200–500/side for a v3 concentrated position) on each chain you're launching. Sepolia
is free (faucet + `MINT`). See [seed-liquidity.md](./seed-liquidity.md).
> This is the real launch blocker — code being wired does not create routes; liquidity does.

### 5. Point the interface at the adapter — [code/config]
Set `TRADING_API_URL_OVERRIDE="https://trading.hookswap.org"` in the prod web env; rebuild/restart.
See [run-the-app.md](./run-the-app.md) and [developers/routing.md](../developers/routing.md).

### 6. Verify a real swap — [validation]
On a seeded chain (start with **Sepolia**, then a custom chain):
1. `GET /v1/quote` returns a `CLASSIC` quote (not `404 NO_ROUTE_FOUND`) for the seeded pair.
2. Connect a wallet in the app, get a live quote for that pair, and execute a small swap.
3. Confirm it lands on-chain via the chain's explorer ([chains](../users/chains.md)).

## Credential / capital-gated summary (for Reggie)

| Gate | Needed for |
|---|---|
| Deployer key + gas per chain | Contract deploys (done) and seeding |
| VPS + DNS + TLS | Routing adapter (step 2), app hosting |
| Infura key | Sepolia RPC in the routing adapter |
| Routing backend code (embed SOR) or routing-api | Live quotes (step 2) |
| Seed capital (~$200–500/side/chain) | Real liquidity (step 4) — the launch blocker |
| Interface prod env override | Wiring the app to HookSwap routing (step 5) |

Once steps 1–5 are done for a chain and step 6 passes, that chain is live.
