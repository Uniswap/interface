# Test wallet legend — swap.core

Symbolic aliases only. **No mnemonics, private keys, or address secrets live here.**
Real seed phrases stay in the QA vault / Testlio TL handoff, keyed by the same alias
(scheme `TW-<AREA>-NN` per the seeding blueprint).

| Alias | Description (funding / chains / state) |
|-------|----------------------------------------|
| `TW-SWAPCORE-01` | Funded mainnet wallet holding native ETH + USDC (general exact-input swap + fees). Also funded on Base/Unichain for the mobile smoke. |
| `TW-SWAPCORE-02` | Wallet holding DAI with **zero** ERC20→Permit2 approve allowance (0-approve allowance flow). |
| `TW-SWAPCORE-03` | Wallet holding USDC/USDT with **zero or stale** Permit2 permit allowance (0-permit / expired / insufficient-permit flow). |
| `TW-SWAPCORE-04` | Wallet holding native ETH and WETH for wrap/unwrap round-trips and WETH-input UniswapX/limit orders. |
| `TW-SWAPCORE-05` | Wallet funded to trade a fee-on-transfer (FOT) token (buy + sell slippage variants, Unibot/Bullet). |
| `TW-SWAPCORE-06` | Wallet on a testnet (Sepolia/Unichain Sepolia) with testnet-mode enabled. |
| `TW-SWAPCORE-07` | Pre-delegated / sponsored-eligible wallet on Base/Unichain (sponsored + Flashblocks core). |
