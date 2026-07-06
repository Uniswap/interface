# Getting started

## What is HookSwap?

HookSwap is a decentralized exchange (DEX) for swapping tokens and providing liquidity
across several EVM chains. It runs the proven **constant-product (v2)** and
**concentrated-liquidity (v3)** automated-market-maker model on **HookSwap's own deployed
contracts**, with swaps routed through a **Universal Router**.

- **Two pool types:** v2 (simple constant-product pools) and v3 (concentrated liquidity
  with fee tiers). See [Liquidity](./liquidity.md).
- **Self-custody:** you trade directly from your own wallet. HookSwap never holds your funds.
- **No hooks / no v4.** Despite the name, HookSwap ships v2 + v3 only — there are no
  v4 pools or hooks on any HookSwap chain. See the [FAQ](./faq.md).

## Connect a wallet

HookSwap works with standard EVM wallets via injected providers and WalletConnect:

1. Open the app at **https://hookswap.org** (or your local dev build at `http://localhost:3000`).
2. Click **Connect** and pick your wallet (e.g. MetaMask "Installed", Coinbase Wallet,
   WalletConnect QR, Rainbow, Ledger).
3. Approve the connection in your wallet.
4. Switch to one of the [supported chains](./chains.md) — the app will prompt you to add or
   switch networks if needed.

> Injected and WalletConnect wallets are supported. Some hosted login options (e.g. Privy
> email/social login) are not configured in the current build.

## Supported chains

HookSwap is deployed on 6 production chains plus Sepolia testnet:

| Chain | chainId | Native token |
|---|---|---|
| HyperEVM | 999 | HYPE |
| MegaETH | 4326 | ETH |
| Robinhood Chain | 4663 | ETH |
| Ink | 57073 | ETH |
| X Layer | 196 | OKB |
| Tempo | 4217 | USD (pathUSD, gas paid in an ERC-20) |
| Sepolia (testnet) | 11155111 | ETH |

Full details — RPCs, explorers, wrapped-native tokens — are in [Chains](./chains.md).

## Next steps

- [How to swap](./swapping.md)
- [How to add liquidity](./liquidity.md)
