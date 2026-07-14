# HookSwap Vesting Suite

Self-service token vesting for HookSwap. Native-token **fee-enabled** (optional),
self-contained (no external Solidity dependencies), and built to compile clean
under Foundry (`solc 0.8.24`).

The design is **isomorphic to the `contracts/locker/` kit**: a manager acts as
factory + registry, spawning one per-schedule child contract per vesting grant
and indexing it in an on-chain address search index, so the same discovery
pattern works. Where the locker holds a balance until an unlock time, a vesting
schedule streams it out on a **cliff + linear** curve.

> **Provenance / license.** The release curve (`vestedAmount` / `_vestingSchedule`)
> is forked from OpenZeppelin `VestingWallet` / `VestingWalletCliff` (MIT). The
> manager/child topology and the native-fee model mirror the OnlyMoons-derived
> `HookSwapTokenLockerManager` (GPL-3.0). Contracts carry `GPL-3.0` SPDX ids; the
> vendored `library/*` helpers keep their original MIT ids.

---

## Contracts

| File | What it does |
|---|---|
| `src/HookSwapVestingManager.sol` | Factory + registry. `createVesting(...)` (payable) charges an optional native fee, deploys one `HookSwapVesting` child per schedule, funds it via `transferFrom`, and indexes the schedule id under **both** the beneficiary and the creator. |
| `src/HookSwapVesting.sol` | Per-schedule child. Custodies a single ERC-20 balance and releases it to a fixed beneficiary on a cliff + linear curve. Beneficiary-only `release()`. Non-revocable (Phase 1). |
| `library/Ownable.sol` | Single-owner access control for the manager's fee setters (OnlyMoons-derived, GPL-3.0). |
| `library/Context.sol` | `_msgSender()` base (OpenZeppelin, MIT). |
| `library/IERC20.sol` | Minimal ERC-20 interface (MIT). |
| `library/ReentrancyGuard.sol` | OpenZeppelin-style `nonReentrant` guard (MIT). |

---

## Vesting curve (raw token units, no rounding tricks)

`vestedAmount(t)`, forked from OZ `VestingWallet._vestingSchedule` with a cliff gate:

- **`t < start + cliffDuration`** → `0` (nothing vested during the cliff)
- **`start + cliffDuration <= t < start + duration`** → `total * (t - start) / duration`
  (linear from `start`, so the cliff releases a lump `total * cliff / duration` at cliff end)
- **`t >= start + duration`** → `total` (fully vested)

`releasable()` = `vestedAmount(block.timestamp) - released`. `release()` transfers
`releasable()` to the beneficiary and bumps `released`.

**Timestamps.** `createVesting`'s `startTime` is an **absolute unix timestamp**;
`cliffDuration` and `duration` are **relative durations (seconds)** measured from
`startTime`. `duration > 0` and `cliffDuration <= duration` are enforced.

---

## Registry / on-chain discovery

Same shape as the locker's `getTokenLockersForAddress`:

- `createVesting` pushes the new schedule id into `_schedulesForAddress[beneficiary]`
  and `_schedulesForAddress[creator]` (deduped when they are the same address).
- `getSchedulesForAddress(address) → uint256[]` — every schedule id an address is
  the beneficiary or creator of.
- `getScheduleData(uint256 id)` → `(id, token, beneficiary, creator, start, cliff,
  duration, totalAmount, released, contractAddress)` — delegates to the child (so
  `released` is live).
- `getVestingAddress(uint256 id) → address`, `vestingCount() → uint256`.
- `VestingCreated(id, child, token, beneficiary, creator)` event on each create.

---

## Fee model (optional, mirrors the locker)

- `createVesting` is **`payable`**. `_collectFee()` requires `msg.value >= vestingFee`.
- If `vestingFee > 0`, the fee is forwarded to `feeReceiver` via a low-level `call`;
  **any overpayment is refunded** to the caller.
- `setVestingFee(uint256)` / `setFeeReceiver(address)` are **`onlyOwner`** (the
  deployer, not individual beneficiaries). `feeReceiver` cannot be the zero address;
  it defaults to the deployer when constructed with `address(0)`.
- Default fee is **0** (free) — the vesting fee is opt-in per deploy.
- Views: `vestingFee()`, `feeReceiver()`. Events: `VestingFeeUpdated`,
  `FeeReceiverUpdated`, `VestingFeePaid`.

Constructor: `constructor(uint256 vestingFee_, address feeReceiver_)`.

---

## Build

Self-contained — no `forge install` needed.

```bash
cd contracts/vesting
forge build
```

Compiles with Solc 0.8.24, `Compiler run successful!`. The only output is the
lint-only `erc20-unchecked-transfer` warnings, inherited from the same raw-transfer
style as the locker kit (kept for consistency with the audited base).

---

## Deploy (Reggie runs this — kit is keyless)

```bash
cd contracts/vesting
VESTING_FEE=0 FEE_RECEIVER=0x... \
  forge script script/DeployVesting.s.sol:DeployVesting \
  --rpc-url <chain rpc> --private-key <key> --broadcast
```

`VESTING_FEE` in wei (native token; default `0`), `FEE_RECEIVER` defaults to the
broadcaster. Or `forge create src/HookSwapVestingManager.sol:HookSwapVestingManager
--constructor-args <vestingFeeWei> <feeReceiver>`.

**After deploy, record the address** in `contracts/deployments/robinhood-vesting.json`
under `vestingManager` (launch scope is Robinhood 4663 only).

---

## ⚠️ Audit note — get a fresh review before mainnet value

New, unaudited HookSwap code. The vesting curve is standard OZ `VestingWallet`
math, but the manager/child wiring and fee model are new. Obtain a security review
before vesting real value on mainnet. Phase 1 is intentionally non-revocable (no
revoke/clawback path).
