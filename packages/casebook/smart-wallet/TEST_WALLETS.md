# Smart Wallet — test wallet legend

Cases reference wallets by **symbolic alias only**. No mnemonics, private keys, or address
secrets appear in this catalog. Real seed phrases stay in the QA vault / Testlio TL handoff,
keyed by the same alias.

Scheme: `TW-SMARTWALLET-NN`.

| Alias | Description (funding / delegation state / chains) |
|-------|----------------------------------------------------|
| `TW-SMARTWALLET-01` | Fresh EOA, funded with native ETH + USDC on Ethereum mainnet, **not yet delegated** (used to exercise first-time delegation activation via swap, on mobile and extension). |
| `TW-SMARTWALLET-02` | EOA already **delegated to the Uniswap delegatee** on mainnet, funded with USDC (used for the subsequent-swap / no re-delegation path and the disable-with-delegations flows). |
| `TW-SMARTWALLET-03` | Pre-delegated wallet funded with native ETH on Base and Unichain (used for Flashblocks fast-confirmation swaps). |
| `TW-SMARTWALLET-04` | EOA carrying an **active non-Uniswap delegation** (used for the "Smart wallet features unavailable" state). |
| `TW-SMARTWALLET-05` | EOA funded across multiple networks (Unichain, Base, Arbitrum, Optimism, BNB, Polygon, Zora) for per-chain delegation smoke; after the per-chain smoke it is delegated on those chains and doubles as the delegated baseline on non-Flashblocks chains. |
| `TW-SMARTWALLET-06` | EOA funded with native ETH on Base and Unichain, **not delegated** (Flashblocks non-delegated comparison baseline). |
