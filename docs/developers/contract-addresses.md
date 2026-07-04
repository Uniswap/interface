# Contract addresses

The canonical address reference for the HookSwap stack. Values are pulled **verbatim** from
`contracts/deployments/*.json` (HookSwap-owned deploys) and, for Sepolia, from
`@uniswap/sdk-core` / canonical Uniswap. A machine-readable copy lives at
[`launchpad-integration/addresses.json`](../../launchpad-integration/addresses.json).

- **Deployer** (all 6 custom chains): `0xc14C897c6bff88a5Eeac31F795693b9230205125`
- **Permit2** (every chain, canonical CREATE2): `0x000000000022D473030F116dDEE9F6B43aC78BA3`
- **Init code hashes** (canonical, identical everywhere):
  - v2 pair: `0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f`
  - v3 pool: `0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54`

## Deterministic group — MegaETH (4326), Robinhood (4663), Ink (57073)

These three were deployed from a nonce-0 deployer, so **v2/v3/router addresses are identical**
across all three. Only WETH differs.

| Contract | Address |
|---|---|
| v2Factory | `0xD1Cf664944173140AFc302c169eFD55c24966B45` |
| v2Router02 | `0xBe3729d06E3A17F3c7c5ac394c7bCbe138B6EEFA` |
| v3Factory | `0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3` |
| NonfungiblePositionManager | `0xbd817036c5bF69Cb27D3A342129e39f9f908577d` |
| SwapRouter02 | `0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4` |
| QuoterV2 | `0x15cD41B273865feD20BC8B5cDF4423D7678ac78E` |
| UniversalRouter | `0x3D30133F4d4A80684F02d8310faF572E3dc193b3` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| **WETH** — MegaETH (4326) | `0x4200000000000000000000000000000000000006` |
| **WETH** — Ink (57073) | `0x4200000000000000000000000000000000000006` |
| **WETH** — Robinhood (4663) | `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73` |

Shared v3 periphery (identical across the deterministic group):

| Contract | Address |
|---|---|
| multicall2 | `0xfEb3eA6212761c1891389e77ee5Bf27c3b385E1A` |
| proxyAdmin | `0xA24cD888adAF42011a49d8Eaedb2Fe751C54e7E2` |
| tickLens | `0xf248c369C125094cDB95E8AbeE095c11758C8F14` |
| v3Migrator | `0x45DB3eaE624dBcA631A9C6C1406DA0B8F6Fb275A` |
| v3Staker | `0xD412b66afAd16a247a12a1eF31A1c6d37BBb9B6f` |

## Unique addresses — XLayer (196), HyperEVM (999), Tempo (4217)

Deployed at a **non-zero** deployer nonce, so addresses differ per chain. **Read them
per-chain — do not assume the deterministic set.**

| Contract | XLayer (196) | HyperEVM (999) | Tempo (4217) |
|---|---|---|---|
| v2Factory | `0xD1Cf664944173140AFc302c169eFD55c24966B45` | `0xB92598Fa464B96FEC394a17A269Ad18060Ec60B2` | `0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4` |
| v2Router02 | `0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3` | `0xbd817036c5bF69Cb27D3A342129e39f9f908577d` | `0x6d8a0783213B3b06648DB3708a89732af3661005` |
| v3Factory | `0xAB34Bb3767020059A35e71D03f13E9e4fbCD07aC` | `0x45DB3eaE624dBcA631A9C6C1406DA0B8F6Fb275A` | `0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3` |
| NonfungiblePositionManager | `0x45DB3eaE624dBcA631A9C6C1406DA0B8F6Fb275A` | `0x86426094d82bC1fd40F0901965b23D30837Dc66b` | `0xbd817036c5bF69Cb27D3A342129e39f9f908577d` |
| SwapRouter02 | `0x3D30133F4d4A80684F02d8310faF572E3dc193b3` | `0xD96fc9629AFaf325fCdd7F98Dc9b8dc2165adcBB` | `0x3D30133F4d4A80684F02d8310faF572E3dc193b3` |
| QuoterV2 | `0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4` | `0x3b5a01Efc59f3465b8Eb04697f97CFE0BA700D9D` | `0x15cD41B273865feD20BC8B5cDF4423D7678ac78E` |
| UniversalRouter | `0x6d8a0783213B3b06648DB3708a89732af3661005` | `0xD9d4795F2A12305a12C36455ADAD011F2D6143AB` | `0x62aE013cb2b232C20094B466C94bb39714eF661E` |
| Permit2 | `0x0000…78BA3` | `0x0000…78BA3` | `0x0000…78BA3` |
| WETH / wrapped | `0xe538905cf8410324e03A5A23C1c177a474D59b2b` (WOKB) | `0x5555555555555555555555555555555555555555` (WHYPE) | `0xBbBcC62853a5fA27b93d6Bab3E6F7ce841E25Df2` (WETH9¹) |

¹ **Tempo has no native-gas wrapper.** Gas is paid in `pathUSD` (ERC-20). This WETH9 address is
only the router/periphery constructor arg — do **not** use `addLiquidityETH` / `msg.value` on
Tempo. Use token/token pairs against `pathUSD` or another ERC-20 quote asset.

**Chain-specific deploy notes** (from the deployment records):
- **HyperEVM (999):** addresses are non-deterministic (deployer nonce ≠ 0). Big-blocks mode was
  enabled on the deployer (Hyperliquid `evmUserModify`) to fit the large deploy txs.
- **XLayer (196):** the canonical `v2Factory` (`0xD1Cf66…`, nonce 0) is the one used everywhere;
  a duplicate factory at `0xBe3729d0…` was accidentally created at nonce 1 and is **unused/harmless**.
  Because that nonce was consumed, all downstream addresses are shifted by one and differ from the
  deterministic group.
- **Tempo (4217):** deployed at deployer nonce 15→18; all txs landed at the 20 gwei network floor.

## Sepolia (11155111) — testnet, canonical Uniswap

HookSwap reuses Uniswap's canonical Sepolia deployment for testing (no HookSwap deploy).

| Contract | Address |
|---|---|
| v2Factory | `0xF62c03E08ada871A0bEb309762E260a7a6a880E6` |
| v2Router02 | `0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3` |
| v3Factory | `0x0227628f3F023bb0B980b67D528571c95c6DaC1c` |
| NonfungiblePositionManager | `0x1238536071E1c677A632429e3655c799b22cDA52` |
| SwapRouter02 | `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E` |
| QuoterV2 | `0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3` |
| UniversalRouter (v2_0) | `0x3a9d48ab9751398bbfa63ad67599bb04e4bdf98b` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| WETH | `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` |

## v3 fee tiers

| Fee | Meaning | tickSpacing |
|---|---|---|
| `100` | 0.01% | 1 |
| `500` | 0.05% | 10 |
| `3000` | 0.30% | 60 |
| `10000` | 1.00% | 200 |

`tickLower` / `tickUpper` must be multiples of the pool's `tickSpacing`, or `mint` reverts.

> If a chain is ever redeployed, regenerate `launchpad-integration/addresses.json` from the
> updated `contracts/deployments/*.json` and update this page.
