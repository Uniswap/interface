# HookSwap Token Factory

Self-service, **fixed-supply ERC-20** creation for HookSwap. Anyone can call
`createToken(...)` to deploy a fresh standard ERC-20 whose entire supply is minted
to the caller, and the factory records every token in an enumerable index the
UI / indexer can list.

This is a **contract kit only** — build + deploy instructions. It does not touch
the frontend, is not broadcast here, and does not depend on any other
`contracts/` directory.

## Layout

```
token-factory/
├── foundry.toml                     # solc 0.8.24, optimizer 200, evm paris, self-contained
├── src/
│   ├── HookSwapERC20.sol            # fixed-supply ERC-20 (no public mint)
│   ├── HookSwapTokenFactory.sol     # createToken() + enumerable index + optional fee
│   ├── library/
│   │   ├── Context.sol              # vendored (msg.sender helper)
│   │   └── Ownable.sol              # vendored single-owner access control
│   └── vendor/
│       └── Script.sol               # vendored minimal forge scripting shim
├── script/
│   └── DeployTokenFactory.s.sol     # forge deploy script
└── README.md
```

Fully self-contained: no `lib/` submodule, no `forge install`, no external
OpenZeppelin. The ERC-20 is written from scratch (modelled on
`../seed/src/MockERC20.sol`) and the access-control / scripting primitives are
vendored — the same pattern as the sibling `referral/` and `locker/` kits.

## Contracts

### `HookSwapERC20`
Clean fixed-supply ERC-20:

```solidity
constructor(string name, string symbol, uint8 decimals, uint256 supply, address owner)
```

- Mints the **entire `supply`** (base units, already scaled by `10**decimals`) to
  `owner` at construction.
- Standard ERC-20 surface: `name` / `symbol` / `decimals` / `totalSupply` /
  `balanceOf` / `transfer` / `approve` / `transferFrom` / `allowance` +
  `Transfer` / `Approval` events.
- **No `mint` function** — supply is fixed for the life of the token.

### `HookSwapTokenFactory`

```solidity
function createToken(string name, string symbol, uint8 decimals, uint256 supply)
  external payable returns (address token)
```

- Does `new HookSwapERC20(name, symbol, decimals, supply, msg.sender)` — a plain
  `new` deploy (no clones/proxies) so the bytecode verifies cleanly on a block
  explorer.
- Records the token in `_allTokens` (creation order) + `_tokensByCreator[creator]`,
  exposed via `allTokens()`, `allTokensLength()`, `tokenAt(i)`,
  `tokensByCreator(creator)` for the UI/indexer to enumerate.
- Emits `event TokenCreated(address indexed token, address indexed creator, string name, string symbol)`.
- Optional native **`createFee`** forwarded to **`feeReceiver`** (mirrors the
  locker fee pattern). **Defaults to 0 (free)**; owner can adjust via
  `setCreateFee` / `setFeeReceiver`. Overpayment is refunded.

## Build

```bash
cd contracts/token-factory
forge build
```

Compiles clean with the pinned toolchain (solc 0.8.24, optimizer 200, evm paris).

## Deploy (Reggie broadcasts)

The deploy script reads `CREATE_FEE` / `FEE_RECEIVER` from the environment
(`vm.envOr`, same as `DeployLockers.s.sol`):

```bash
CREATE_FEE=0 FEE_RECEIVER=0x<receiver> \
forge script script/DeployTokenFactory.s.sol \
  --rpc-url <rpc> --private-key <key> --broadcast
```

- `CREATE_FEE` — native-token fee to create a token, in wei (default `0` = free).
- `FEE_RECEIVER` — address that receives create fees (default: the broadcaster).

After broadcasting, **record the deployed factory address** in
`contracts/deployments/robinhood.json` under the `tokenFactory` key so the
frontend / indexer can pick it up.
