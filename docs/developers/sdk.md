# SDKs

HookSwap consumes the standard Uniswap SDKs, but pointed at **HookSwap's deployed addresses**
and taught the HookSwap chain IDs. This is done through the `HooksOS/sdks` fork plus a
dependency override in this repo.

## The override — `@uniswap/sdk-core` → HookSwap

Only **`@uniswap/sdk-core`** is overridden. It is the single source of truth for chain IDs and
per-chain contract addresses; both `@uniswap/v2-sdk` and `@uniswap/v3-sdk` read their factory /
router addresses **from sdk-core** at runtime, so overriding sdk-core alone propagates HookSwap
addresses through the whole SDK stack.

- `v2-sdk`: `FACTORY_ADDRESS_MAP = V2_FACTORY_ADDRESSES` (imported from sdk-core).
- `v3-sdk`: pool address computed from a `factoryAddress` sourced from sdk-core's
  `CHAIN_TO_ADDRESSES_MAP`. **Init-code hashes stay canonical** (unchanged) — only the factory
  addresses were swapped, which is exactly what the fork does.

Overriding `v2-sdk`/`v3-sdk` directly would fail because they declare `@uniswap/sdk-core:
"workspace:*"`; `sdk-core` is a clean leaf (no `workspace:*` deps) so a `file:` override installs
cleanly. Full rationale: [`DEPENDENCY-OVERRIDE.md`](../../DEPENDENCY-OVERRIDE.md).

## Mechanism (committed)

`package.json` → `resolutions` (bun honors this key):

```jsonc
"resolutions": {
  "@uniswap/sdk-core": "file:../sdks/sdks/sdk-core"   // was "7.17.0"
}
```

The fork lives at `../sdks/sdks/sdk-core` (a bun monorepo at
`C:/Users/avone/OneDrive/Desktop/HokkOS/sdks`), fork version `7.18.0` (satisfies the `^7.17.0`
peer ranges of dependent packages).

**Status:** applied as a **bridge** — the fork's built `dist/` was synced directly into the
already-installed `node_modules/@uniswap/sdk-core`, so the running dev app resolves HookSwap
addresses immediately (disk was ~96% full, so a full `bun install` was deferred). A clean
`bun install` to formalize the `file:` resolution in `bun.lock` is still **TODO** (when disk
frees to ~8-10 GB).

Validated at runtime — `require('@uniswap/sdk-core')` returns HookSwap addresses, e.g.:
- `ROBINHOOD.v3CoreFactoryAddress = 0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3`
- `MEGAETH.swapRouter02Address = 0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4`
- `V2_FACTORY[HYPEREVM] = 0xB92598Fa464B96FEC394a17A269Ad18060Ec60B2`

## Chain IDs

The sdk-core fork defines the HookSwap chains in its `ChainId` enum:

| Chain | ChainId |
|---|---|
| HyperEVM | 999 |
| X Layer | 196 |
| MegaETH | 4326 |
| Tempo | 4217 |
| Robinhood | 4663 |
| Ink | 57073 |
| Sepolia | 11155111 |

## Consuming the SDKs elsewhere

If another service needs the same addresses (e.g. the smart-order-router or the Trading API
adapter in embed mode), it must apply the **same override** from its own install — the interface
override does not reach other repos. Options:

1. Add `@uniswap/sdk-core` (+ `@uniswap/smart-order-router`, `ethers@^5` as needed) and override
   `@uniswap/*` to the HooksOS forks via npm `overrides` or a git URL.
2. If you republish the forks under `@hookswap/*`, you'd repoint imports across consumers — the
   faster path is keeping the `@uniswap/*` names and overriding to the forks (no import churn).

The routing stack's wiring is covered in [routing.md](./routing.md). Fork inventory:
[`FORK-LIST.md`](../../FORK-LIST.md).
