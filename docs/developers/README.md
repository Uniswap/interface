# HookSwap for Developers & Integrators

Reference for launchpads, SDK consumers, and anyone integrating with HookSwap.

| Page | What it covers |
|---|---|
| [Overview](./overview.md) | Architecture, the deployed stack, canonical init-code hashes |
| [Contract addresses](./contract-addresses.md) | **The canonical address reference** — every deployed contract per chain |
| [Launchpad integration](./launchpad-integration.md) | Create + seed a pool so a token becomes routable (v2 + v3 flows) |
| [SDK](./sdk.md) | The HookSwap SDK — chain IDs + per-chain HookSwap addresses |
| [Routing](./routing.md) | The HookSwap Trading API; how quoting works |
| [Data API](./data-api.md) | Public read-only REST/JSON for pools, tokens, search & protocol stats (`data.hookswap.org`) |

## Key facts

- HookSwap = **own v2 + v3 + Universal Router** deployments. **No v4, no hooks** on any chain.
- **Init-code hashes are canonical** and identical on every chain — only factory/manager
  **addresses** differ. So SDK forks need only address swaps, not hash changes.
  - v2 pair: `0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f`
  - v3 pool: `0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54`
- **Permit2** is the canonical CREATE2 deployment `0x000000000022D473030F116dDEE9F6B43aC78BA3`
  on every chain.
- Machine-readable address map for integrators:
  [`launchpad-integration/addresses.json`](../../launchpad-integration/addresses.json).
