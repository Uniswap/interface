# Run the indexer (subgraphs)

The smart-order-router discovers routable pools primarily by walking pools connected to each
chain's WETH/wrapped-native. For **full pool discovery** — arbitrary token/token pairs and
multi-hop routing — it needs a **subgraph** (pool/liquidity indexer) per chain. Without it, only
WETH-connected pools route.

## What's forked

Two subgraph repos were forked into the HooksOS org:

- `HooksOS/v2-subgraph` — indexes v2 pairs.
- `HooksOS/v3-subgraph` — indexes v3 pools/liquidity.

Each must be **configured with HookSwap's deployed factory addresses + the canonical init-code
hashes** (see [developers/contract-addresses.md](../developers/contract-addresses.md)) and deployed
**per chain**.

> **Not in this repo checkout.** The subgraph forks (and any `SELF-HOST.md` runbook) live in the
> HooksOS org, not in this interface repo — there was no subgraph self-host doc present here at the
> time of writing. Follow the fork's own README for the authoritative steps; the outline below is
> the standard graph-node self-host flow.

## Self-host outline (per chain)

1. **Run a graph-node** (with IPFS + a Postgres store) on the VPS, pointed at the chain's JSON-RPC
   (the same `WEB3_RPC_<chainId>` endpoints used by the routing adapter — see
   [run-routing.md](./run-routing.md#3-rpc-config)). Chains without a hosted Graph service must be
   self-indexed this way.
2. In each subgraph fork, set the **network config** for the target chain: the HookSwap
   `v2Factory` / `v3Factory` address, the factory **start block** (the deploy block), and the
   canonical init-code hash.
3. **Deploy** the subgraph to your graph-node (`graph create` + `graph deploy` against your node's
   admin endpoint) and let it sync from the start block.
4. Note the resulting **GraphQL query URL** for that chain's subgraph.

Repeat for each chain (v2 and v3 subgraphs) you want fully indexed.

## Wiring into routing

Point the smart-order-router / routing adapter at each chain's subgraph so it can enumerate pools
beyond the WETH-connected set. The router reads a per-chain subgraph URL — configure it via the
routing backend's env (e.g. `SUBGRAPH_URL_<chainId>` / the SOR's subgraph provider config) for each
chainId: `196`, `999`, `4217`, `4326`, `4663`, `57073`, and `11155111` (Sepolia).

Once wired, a `token → USDC` (non-WETH) pair that the subgraph has indexed becomes routable through
multi-hop paths; before that, only WETH-connected pools route (see
[developers/routing.md](../developers/routing.md#why-launchpad-tokenweth-pools-auto-route)).

## Status

- Subgraph forks exist; **per-chain deployment + wiring is still to do.**
- For an initial launch you can defer full indexing and rely on WETH-connected pool discovery
  (launchpads pair against WETH, so their tokens still route). Add subgraphs when you need deep
  token/token routing and full market/analytics data (the Terminal Markets/Analytics screens read
  subgraph aggregates — see [`TERMINAL-DESIGN.md`](../../TERMINAL-DESIGN.md)).
