# Supported chains

HookSwap is deployed on 6 production chains, plus **Sepolia** for testing. Values below come from
the in-app chain configs and the deployment records (`contracts/deployments/*.json`).

| Chain | chainId | Native token | Wrapped native | Layer | Explorer | Default public RPC |
|---|---|---|---|---|---|---|
| **HyperEVM** | 999 (`0x3E7`) | HYPE | WHYPE `0x5555…5555` | L1 | https://hyperevmscan.io/ | `https://rpc.hyperliquid.xyz/evm` |
| **MegaETH** | 4326 | ETH | WETH `0x4200…0006` | L2 | https://megaeth.blockscout.com/ | `https://mainnet.megaeth.com/rpc` |
| **Robinhood Chain** | 4663 (`0x1237`) | ETH | WETH `0x0Bd7…AD73` | L2 | https://robinscan.io/ | `https://rpc.mainnet.chain.robinhood.com` |
| **Ink** | 57073 | ETH | WETH `0x4200…0006` | L2 | https://explorer.inkonchain.com/ | `https://rpc-gel.inkonchain.com` |
| **X Layer** | 196 | OKB | WOKB `0xe538…9b2b` | L2 | https://web3.okx.com/explorer/x-layer/ | `https://xlayer.drpc.org` |
| **Tempo** | 4217 | USD (pathUSD)¹ | WETH9 arg only¹ | L1 | https://explore.tempo.xyz/ | `https://rpc.tempo.xyz` |
| **Sepolia** (testnet) | 11155111 | ETH | WETH `0xfFf9…6B14` | testnet | Etherscan (Sepolia) | Infura (`https://sepolia.infura.io/v3/<key>`) |

¹ **Tempo** pays gas in `pathUSD` (an ERC-20), not a native coin. It has **no native-gas
wrapper** — the WETH9 address in the deployment is only a router/periphery constructor
argument. In the app, Tempo's `wrappedNativeCurrency` is intentionally left unset. Trade and
LP token/token pairs (against pathUSD or another ERC-20), never native-gas flows.

## Testnets

- **Robinhood testnet:** chainId 46630 (`0xB5E6`), RPC `https://rpc.testnet.chain.robinhood.com`,
  explorer `https://explorer.testnet.chain.robinhood.com`.
- **HyperEVM testnet:** chainId 998 (`0x3E6`), RPC `https://rpc.hyperliquid-testnet.xyz/evm`.
- **Sepolia** (11155111) is the primary test chain; it uses the canonical Uniswap deployment.

## Notes

- Public RPCs are rate-limited and are expected to move to dedicated nodes for production
  traffic. Sepolia uses a hosted RPC; the 6 custom chains use public RPCs.
- **v4/hooks are not deployed on any chain.** Some chain config files carry a `supportsV4`
  flag, but no v4 PoolManager or hook contracts exist on HookSwap — only v2 + v3 + Universal
  Router. See the [FAQ](./faq.md).
