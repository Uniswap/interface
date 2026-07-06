# FAQ

### Is HookSwap live?

The **contracts are deployed** on all 6 custom chains (and Sepolia uses canonical Uniswap).
But a working end-to-end swap also needs two things that are still in progress:

1. the **routing backend** (HookSwap's Trading API) online, and
2. **real liquidity** in the pools.

Until both are true for a given chain/pair, the app may show **no route / no price**. HookSwap
does not fabricate quotes — a missing route means there is genuinely nothing to route against.

### Which chains are supported?

HyperEVM (999), MegaETH (4326), Robinhood Chain (4663), Ink (57073), X Layer (196), Tempo
(4217), and Sepolia testnet (11155111). See [Chains](./chains.md).

### What are the fees?

Trading fees go to liquidity providers:

- **v2 pools:** 0.30% flat.
- **v3 pools:** the pool's fee tier — 0.01%, 0.05%, 0.30%, or 1.00%.

Plus network gas in the chain's native token (on Tempo, gas is paid in the `pathUSD` ERC-20).

### Is it audited?

HookSwap does **not** publish its own independent audit. The contracts are deployed from
**standard, widely-audited v2 / v3 / Universal Router bytecode** — battle-tested code used across
the industry — with only the factory/manager **addresses** and deploy configuration being
HookSwap-specific. That is the honest security posture: proven bytecode, but no separate HookSwap
audit claim.

### What wallets are supported?

Standard EVM wallets via injected providers and WalletConnect (MetaMask, Coinbase Wallet,
Rainbow, Ledger, etc.). Approvals use **Permit2** (the canonical deployment, same address on
every chain). Some hosted login options (e.g. Privy) are not configured in the current build.

### Does HookSwap have hooks or v4?

**No.** Despite the name, HookSwap ships **v2 + v3 only**. There is no v4 PoolManager and no
hooks deployed on any HookSwap chain. The "hook-native" branding is aspirational; those surfaces
are gated off in the UI until a v4 stack is ever deployed. Do not attempt v4 flows — they do not
exist on-chain.

### Why does a token I launched not show up for routing?

Routing auto-discovers pools paired against the chain's **WETH / wrapped-native**. A brand-new
`token → WETH` pool is immediately routable. Arbitrary `token → USDC` (non-WETH) pairs are only
routed if indexed by HookSwap's subgraph. Launchpads should pair against WETH — see
[developers/launchpad-integration.md](../developers/launchpad-integration.md).

### Is my money safe?

HookSwap is non-custodial — you trade from your own wallet and it never holds your funds. As
with any DEX, you bear smart-contract and market risk. New pools can be thin (high price
impact / volatile pricing); check price impact before large trades.
