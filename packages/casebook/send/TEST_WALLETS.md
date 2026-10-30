# Send — test wallet legend (secret-free)

Symbolic aliases only. **No mnemonics, private keys, or secrets live here** — real
secrets stay in the QA vault / Testlio TL handoff, keyed by the same alias.

| Alias | Description |
|-------|-------------|
| `TW-SEND-01` | Funded test wallet: native ETH + at least one ERC-20 (e.g. DAI/USDC) balance on Ethereum mainnet and Base. Used as the sender in transfer flows. |
| `TW-SEND-02` | Recipient test wallet with a resolvable ENS name and a unitag. Never controls the app under test; used to validate recipient resolution and self-send detection. |
| `TW-SEND-03` | Holder of a permissioned (allowlist-gated) token; allowlist membership toggled per case to exercise sender/recipient gating. |
