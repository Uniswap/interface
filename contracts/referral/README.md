# HookSwap Referral Router

HookSwap's own on-chain referral / affiliate fee system — HookSwap's version of the
LiquidCore referral model, built on HookSwap's own v2+v3+Universal-Router stack.

Partners register a referral **code** mapped to a **claim wallet**. Swaps routed
through `HookSwapReferralRouter.swapExactInput(...)` with that code skim a small,
capped fee (taken in the **input** token) and attribute it to the code. The fee
accrues per `(code, token)` and is later withdrawn to the code's claim wallet.

## Model

1. **Register** — a partner calls `registerCode(code, claimWallet)`. First-come,
   first-served: registering an already-taken code reverts. `code` is a `bytes32`
   (typically `keccak256("MY_CODE")`).
2. **Route swaps** — the interface (downstream, once live swaps land) routes a
   referral swap through `swapExactInput(tokenIn, tokenOut, feeTier, amountIn,
   amountOutMin, recipient, refCode)`:
   - Pulls `amountIn` of `tokenIn` from the caller (`SafeERC20.safeTransferFrom`).
   - Computes `fee = amountIn * defaultFeeBps / 10000` **only** if `refCode` is
     registered. Unregistered / zero code ⇒ `fee = 0` and the full amount swaps
     (the swap still works; there is just no referral skim).
   - Accrues `fee` to `accrued[refCode][tokenIn]` (and bumps `totalAccrued[tokenIn]`).
   - Approves HookSwap's **SwapRouter02** for `amountIn - fee` and calls
     `exactInputSingle` (v3 exact-input, single hop) with `recipient = recipient`,
     `amountOutMinimum = amountOutMin`, `sqrtPriceLimitX96 = 0`. Approval is reset
     to 0 afterward.
3. **Claim** — anyone may call `claim(code, token)`; the accrued balance is sent to
   the code's registered claim wallet (permissionless trigger, non-custodial
   destination) and zeroed. `claimable(code, token)` is a view of the pending amount.

## Fee cap

- `defaultFeeBps` is the referral fee in basis points, applied on the input token.
- Hard cap: `MAX_FEE_BPS = 100` (1%). The constructor and `setDefaultFeeBps` both
  revert if the value exceeds the cap. `setDefaultFeeBps` is callable by the owner
  or the configured `feeAdmin`.

## Admin rescue (cannot drain referral balances)

`rescueToken(token, to, amount)` (owner only) can move **only the surplus** above
`totalAccrued[token]` — i.e. tokens accidentally sent in, never accrued referral
fees. The contract tracks `totalAccrued` per token and enforces
`amount <= balance - totalAccrued[token]`.

## Per-chain deploy

Constructor: `(address swapRouter02, uint256 defaultFeeBps, address feeAdmin)`.

Use the chain's deployed **SwapRouter02** address from
`contracts/deployments/<chain>.json` → `"swapRouter02"`. For example, Ink / MegaETH /
Robinhood share the deterministic `swapRouter02` `0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4`;
HyperEVM / Tempo / XLayer have their own (see their JSON files).

The deployer becomes the `Ownable` owner (`msg.sender` in the constructor).

```
forge build        # from contracts/referral/ — self-contained, no remappings
```

Self-contained: `IERC20`, `Context`, `ReentrancyGuard`, `SafeERC20`, `Ownable` are
all vendored under this folder (no OpenZeppelin import). `foundry.toml` mirrors the
locker suite (solc 0.8.24, optimizer 200, evm `paris`).

## Frontend integration — function signatures

The interface will call:

- `registerCode(bytes32 code, address claimWallet)`
- `swapExactInput(address tokenIn, address tokenOut, uint24 feeTier, uint256 amountIn, uint256 amountOutMin, address recipient, bytes32 refCode) returns (uint256 amountOut)`
- `claimable(bytes32 code, address token) view returns (uint256)`
- `claim(bytes32 code, address token)`

Supporting: `codeOwner(bytes32) view returns (address)`,
`setClaimWallet(bytes32 code, address newWallet)`,
`setDefaultFeeBps(uint256)`, `setFeeAdmin(address)`, `rescueToken(address,address,uint256)`.

## v1 scope & follow-ups

**v1 handles only:** exact-input, single-hop, ERC-20 token in.

Not yet supported (follow-ups):
- Native ETH in (would need `WETH` wrapping / `payable` path).
- Multi-hop routes (`exactInput` with an encoded path).
- Exact-output swaps.
- Per-code fee overrides (v1 uses a single `defaultFeeBps` for all codes).

## Status / audit

**NOT audited.** Needs a fresh security audit before any mainnet use. The referral
router is **downstream of live swaps** — the interface must actually route swaps
through this contract for it to earn fees, which depends on the outstanding
live-swaps work (dependency-override forks, routing/Trading-API adapter, hosted RPC,
and on-chain liquidity). Until then this suite compiles and is deploy-ready but not
wired into the app.
