# HookSwap Documentation

HookSwap is a multi-chain decentralized exchange (DEX) running on **its own deployed
contracts** — a full **v2 (constant-product AMM) + v3 (concentrated liquidity) +
Universal Router** stack across multiple production chains.

- **App:** https://hookswap.org · **Docs:** https://docs.hookswap.org
- **Protocols:** v2 + v3. HookSwap ships **v2 and v3 pools only** (no v4) — build against
  v2/v3 flows.
- **Contracts:** HookSwap-owned deployments with canonical init-code hashes; only the
  factory/manager addresses differ per chain. See
  [contract addresses](./developers/contract-addresses.md).

---

## Documentation tracks

| Track | For | Start here |
|---|---|---|
| **[Users](./users/README.md)** | Traders and liquidity providers using the app | [Getting started](./users/getting-started.md) |
| **[Developers / Integrators](./developers/README.md)** | Launchpads, SDK consumers, anyone integrating | [Overview](./developers/overview.md) · [Contract addresses](./developers/contract-addresses.md) |

---

## Features

- **Swap** — market & limit orders routed across v2 + v3 pools, with MEV protection.
- **Pools & Liquidity** — provide concentrated (v3) or full-range (v2) liquidity and earn fees.
- **Positions** — track and manage your open liquidity positions and uncollected fees.
- **Token & LP Locker** — lock ERC-20 tokens, v2 LP tokens, or v3 position NFTs until a chosen
  unlock time; v3 locks keep earning trading fees while the principal stays locked. Live on all
  supported chains.
- **Referrals** — register a referral code and earn a share of the swap fee on trades routed with
  your link.
- **Markets & Analytics** — pools ranked by TVL, volume, and APR, with live price charts and
  protocol-wide metrics.
- **Multi-chain** — one terminal across every HookSwap chain (see [Chains](./users/chains.md)).
