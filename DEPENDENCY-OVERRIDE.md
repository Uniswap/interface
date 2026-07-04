# Dependency override — @uniswap/* → HooksOS forks (HookSwap deployed addresses)

This makes the HookSwap interface (and every `@uniswap/*` consumer inside it) resolve
**HookSwap's own deployed contract addresses** instead of Uniswap's canonical mainnet
addresses. Without this, the app quotes/builds swaps against Uniswap Labs contracts that
do not exist on the HookSwap chains.

## What was overridden

Only **`@uniswap/sdk-core`** — the single source of truth for chain IDs and per-chain
contract addresses. Both `@uniswap/v2-sdk` and `@uniswap/v3-sdk` read their per-chain
factory/router addresses **from sdk-core** at runtime, so overriding sdk-core alone
propagates HookSwap addresses to the whole SDK stack:

- `v2-sdk`: `FACTORY_ADDRESS_MAP = V2_FACTORY_ADDRESSES` (imported from sdk-core).
- `v3-sdk`: pool address computed from a `factoryAddress` the interface sources from
  sdk-core's `CHAIN_TO_ADDRESSES_MAP`. Init-code hashes stay canonical (unchanged), so
  only the factory **addresses** needed swapping — exactly what the fork does.

This also avoids a hard blocker: `v2-sdk`/`v3-sdk` declare `@uniswap/sdk-core: "workspace:*"`,
so a `file:` override of *those* packages would fail to resolve outside the sdks monorepo.
`sdk-core` is a clean leaf (no `workspace:*` deps) → its `file:` override installs cleanly.

## Mechanism (committed)

`package.json` → `resolutions` (bun honors this key; it already pinned sdk-core here):

```jsonc
"resolutions": {
  ...
  "@uniswap/sdk-core": "file:../sdks/sdks/sdk-core",   // was "7.17.0"
  ...
}
```

The fork lives at `../sdks/sdks/sdk-core` relative to this repo
(`C:/Users/avone/OneDrive/Desktop/HokkOS/sdks` — a bun monorepo; sub-packages under
`sdks/sdks/<name>`, already built with `dist/`). Fork version is `7.18.0` (satisfies the
`^7.17.0` peer ranges of dependent packages).

## Why `resolutions`/`file:` and not `patchedDependencies`

Considered a `bun patch` of the installed sdk-core dist. Rejected because **almost every
compiled file differs** between the published `7.17.0` and the fork `7.18.0` (build +
version noise, not just addresses) → the patch would be a near-total-dist replacement,
large and brittle across future version bumps. A `file:` resolution swaps the whole package
cleanly and tracks the fork as it is rebuilt. `sdk-core` being a dependency-leaf makes this
safe.

## Applied now (bridge) vs. needs clean install

Disk was ~96% full (~4 GB free) when this landed, so a full `bun install` (which re-resolves
the whole Uniswap monorepo tree) was too risky. Instead, the fork's built `dist/` (and
`package.json`) were synced directly into the already-installed
`node_modules/@uniswap/sdk-core` so the running dev app resolves HookSwap addresses
**immediately**. There is only **one** (hoisted) copy of sdk-core in the tree, so all
consumers pick it up.

- **Validated (runtime):** `require('@uniswap/sdk-core')` now returns HookSwap addresses,
  e.g. `ROBINHOOD.v3CoreFactoryAddress = 0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3`,
  `MEGAETH.swapRouter02Address = 0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4`,
  `V2_FACTORY[HYPEREVM] = 0xB92598Fa464B96FEC394a17A269Ad18060Ec60B2`, plus INK/XLAYER/SEPOLIA.

- **TODO (when disk frees to ~8-10 GB):** run a clean `bun install` from the repo root so
  bun.lock records the `file:` resolution and re-links the fork authoritatively (formalizes
  the manual sync). Nothing else needs to change.

## Routing stack (separate repos — not covered here)

This override covers the **interface**. The routing stack consumes `@uniswap/*` from its
own installs and must be pointed at the forks separately:

- `smart-order-router` fork — swap factory/router/quoter addresses in its `addresses.ts`
  and add the HookSwap chains (per the deploy plan in `CLAUDE.md` / `FORK-LIST.md`).
- `routing-api` fork — same address wiring; already scaffolded (HooksOS/routing-api).

These are tracked in `CLAUDE.md` ("Quoting gap") and are not localhost blockers for the
interface itself.
