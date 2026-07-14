# HookSwap Multisender (Disperse)

HookSwap's batch-send / "disperse" utility — send one ERC-20 (or the native currency) to
**many recipients in a single transaction**. The lightest utility in the self-service
suite: a fork of the canonical, public-domain [Disperse.app](https://disperse.app)
contract, modernised to solc 0.8.24 and matched to the HookSwap kit conventions.

## Model (trustless + minimal)

`Disperse` is **stateless** — no storage, no owner, no admin, no fees. There is nothing to
configure and no privileged party. It **never custodies funds**:

- `disperseToken(IERC20 token, address[] recipients, uint256[] amounts)` — loops
  `token.safeTransferFrom(msg.sender, recipients[i], amounts[i])`, pulling tokens **per
  recipient** straight from the caller. The contract never holds a balance. Uses
  `SafeERC20` so non-standard tokens (e.g. USDT, which returns no bool) work. The caller
  must first approve this contract for **at least `sum(amounts)`** via a plain ERC-20
  allowance (**no Permit2**).
- `disperseEther(address[] recipients, uint256[] amounts) payable` — loops
  `recipients[i].call{value: amounts[i]}("")`, then refunds any unused `msg.value` dust
  back to `msg.sender` so the contract retains no balance.

Both revert on a length mismatch (`LengthMismatch`), an empty recipient list
(`EmptyRecipients`), or a failed native transfer (`EtherTransferFailed`).

## Build

Self-contained: `IERC20` + `SafeERC20` are vendored under `./library` (no OpenZeppelin
import). The only external dependency is `forge-std` for the deploy script.

```sh
cd contracts/multisender
forge install foundry-rs/forge-std   # populates ./lib (gitignored)
forge build                          # solc 0.8.24, optimizer 200, evm paris
```

`foundry.toml` mirrors the locker suite (`src = "."`, `forge-std` remapping).

## Deploy (Reggie broadcasts — no funded key in-repo)

No constructor args. On Robinhood (4663):

```sh
forge script script/DeployMultisender.s.sol \
  --rpc-url https://rpc.mainnet.chain.robinhood.com \
  --private-key <key> --broadcast
```

or the equivalent one-shot:

```sh
forge create src/Disperse.sol:Disperse \
  --rpc-url https://rpc.mainnet.chain.robinhood.com --private-key <key>
```

After deploy, record the address in `contracts/deployments/robinhood.json` as `"disperse"`
(or a sidecar `contracts/deployments/robinhood-multisender.json`) **and** fill it into
`apps/web/src/terminal/multisender/addresses.ts` (`DISPERSE_ADDRESSES`). The Multisender
screen then lights up automatically; until then it renders an honest "not deployed" state.

## Frontend integration — function signatures

The interface calls:

- `disperseToken(address token, address[] recipients, uint256[] amounts)`
- `disperseEther(address[] recipients, uint256[] amounts)` (payable, `value = sum(amounts)`)

Supporting reads use the standard `erc20Abi` (`approve` / `allowance` / `decimals` /
`symbol` / `balanceOf`). See `apps/web/src/terminal/multisender/`.

## Status / audit

**NOT audited.** Needs a fresh security audit before mainnet use. The contract is
deliberately tiny and stateless, but the disperse pattern still moves user funds — do not
skip the audit. This kit compiles and is deploy-ready but not yet deployed.
