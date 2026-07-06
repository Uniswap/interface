# Architecture overview

HookSwap is a multi-chain DEX running on **its own deployed contracts**, served by a
**self-hosted** routing backend.

## Request flow

```
HookSwap interface (browser)
   │  POST https://trading.hookswap.org/v1/quote     (Trading API schema)
   ▼
HookSwap Trading API  (self-hosted)
   │   computes routes against HookSwap's on-chain pools via per-chain JSON-RPC
   ▼
HookSwap on-chain contracts:  v2 pools · v3 pools · Universal Router · Permit2
```

- The interface does **not** compute routes itself — it calls a Trading API endpoint.
- HookSwap's Trading API computes routes against HookSwap's deployed pools and returns quotes.
- Quotes/swaps are then executed on-chain through the **Universal Router** (+ Permit2 for
  approvals).

See [routing.md](./routing.md) for the Trading API details, and
[contract addresses](./contract-addresses.md) for the deployed stack per chain.

## What HookSwap deploys

On every chain HookSwap owns a full **v2 + v3 + Universal Router** stack:

- v2 factory + router
- v3 factory + periphery (NonfungiblePositionManager, QuoterV2, tick lens, migrator, multicall)
- SwapRouter02 + Universal Router
- Permit2 (the canonical CREATE2 deployment, identical address everywhere)

**No v4 / no hooks** on any chain — pool creation uses the classic v2 `createPair` and v3
`NonfungiblePositionManager` paths.

## Init-code hashes

The pair/pool **init-code hashes are canonical and identical on every chain**:

| | Init code hash |
|---|---|
| v2 pair | `0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f` |
| v3 pool | `0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54` |

Consequence: only **factory/manager addresses** differ per chain — the hashes are untouched. You
can compute pool/pair addresses off-chain deterministically with
`getCreate2Address(factory, salt, initCodeHash)`.

## What is and isn't done

- **Done:** contracts deployed on all 6 custom chains (Sepolia reuses the canonical testnet
  stack); the rebranded interface pointed at HookSwap addresses.
- **In progress:** the routing backend, indexing, and on-chain liquidity. Until those land for a
  given chain/pair, quotes return `404 NO_ROUTE_FOUND`.
