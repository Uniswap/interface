# HookSwap Locker Suite

Token, LP, and Uniswap-V3 position lockers for HookSwap. Native-token
**fee-enabled**, self-contained (no external Solidity dependencies), and built to
compile clean under Foundry (`solc 0.8.24`).

> **Provenance / license.** The v2 / ERC-20 locker (`HookSwapTokenLocker`),
> its manager, and the `Ownable` / `Util` helpers are **derived from OnlyMoons**
> (github.com/onlymoons-io/onlymoons), **GPL-3.0** — the SourceHat-audited
> `TokenLockerV1` / `TokenLockerManagerV1`. The audited **logic is preserved
> unchanged**; only branding/names were updated, plus the added lock fee on the
> manager. Every derived file keeps its `GPL-3.0` SPDX id and a one-line
> attribution comment. `HookSwapV3PositionLocker` is **new** HookSwap code.

---

## Contracts

| File | What it does |
|---|---|
| `HookSwapTokenLockerManager.sol` | Factory + registry for ERC-20 / v2-LP locks. Charges a native-token lock fee, spawns one `HookSwapTokenLocker` child per lock, and maintains an owner/token search index. Detects LP tokens and indexes their underlying pair. |
| `HookSwapTokenLocker.sol` | Per-lock child that custodies a single ERC-20 or v2-LP balance until `unlockTime`. Deposit/extend, withdraw after unlock, recover stray tokens/ETH, transferable ownership (notifies the manager to keep the index in sync). |
| `HookSwapV3PositionLocker.sol` | **New.** Locks Uniswap-V3 position NFTs (ERC-721 from the NonfungiblePositionManager). Same native-token fee model. Key feature: the owner can claim the position's accrued trading fees while the principal stays locked. |
| `Ownable.sol` | Single-owner access control (`onlyOwner`, transferable). Derived from OnlyMoons. |
| `Util.sol` | LP-token detection + LP data reads. Derived from OnlyMoons. |
| `library/Context.sol` | `_msgSender()` base (OpenZeppelin, MIT). |
| `library/IERC20.sol` | Minimal ERC-20 interface (MIT). |
| `library/Dex.sol` | Uniswap-V2 factory/pair/router interfaces (MIT). |
| `library/ReentrancyGuard.sol` | OpenZeppelin-style `nonReentrant` guard (MIT). |
| `library/IERC721Receiver.sol` | Minimal ERC-721 receiver interface (MIT). |

---

## Fee model (identical across both lockers)

- Creating a lock is **`payable`**. `_collectFee()` requires `msg.value >= lockFee`.
- If `lockFee > 0`, the fee is forwarded to `feeReceiver` via a low-level `call`.
- **Any overpayment is refunded** to the caller.
- `setLockFee(uint256)` and `setFeeReceiver(address)` are **`onlyOwner`** (contract
  deployer/owner, not the individual lock owners). `feeReceiver` cannot be the zero
  address; it defaults to the deployer when constructed with `address(0)`.
- Views: `lockFee()`, `feeReceiver()`. Events: `LockFeeUpdated`,
  `FeeReceiverUpdated`, `LockFeePaid`.

Constructor for both: `constructor(uint256 lockFee_, address feeReceiver_)`.

---

## v2 / ERC-20 vs. v3 — why two lockers

`HookSwapTokenLocker` holds **fungible** tokens (ERC-20 and Uniswap-V2 LP tokens,
which are themselves ERC-20). It cannot hold a Uniswap-V3 position, because a v3
concentrated-liquidity position is a **non-fungible ERC-721 NFT** minted by the
`NonfungiblePositionManager`, not a fungible balance.

`HookSwapV3PositionLocker` handles that NFT case:

- `lock(nftManager, tokenId, unlockTime)` — `payable`; charges the fee, then pulls
  the NFT in with `safeTransferFrom` (this contract implements `onERC721Received`).
- `collectFees(lockId)` — **the key v3 feature**: while locked, the lock owner
  calls `NonfungiblePositionManager.collect(...)` to sweep the position's accrued
  trading fees to themselves. **Principal (liquidity) stays locked**; only fees leave.
- `extend(lockId, newUnlockTime)` — new time must be `>=` current and in the future.
- `withdraw(lockId)` — after `unlockTime`, transfers the NFT back to the lock owner.
- `transferLockOwnership(lockId, newOwner)` — reassigns a lock, keeping the owner
  search index in sync.
- Views: `getLockData(lockId)`, `getLocksForAddress(address)`, `lockCount()`.
- `lock` / `withdraw` / `collectFees` are `nonReentrant`; mutating calls are gated
  by an `onlyLockOwner` modifier.

---

## Build

Self-contained — no `forge install` needed.

```bash
cd contracts/locker
forge build
```

Compiles 10 files with Solc 0.8.24, `Compiler run successful!`. The remaining
output is lint-only (`block-timestamp`, `erc20-unchecked-transfer`) inherited
from the audited OnlyMoons base logic, which is preserved verbatim.

---

## Per-chain deploy notes

Deploy on all 7 HookSwap chains with `forge create` (or a deploy script). Both
constructors take `(uint256 lockFee, address feeReceiver)` — pass the lock fee in
each chain's native token (wei) and the address that should collect fees. Use
`address(0)` for `feeReceiver` to default it to the deployer.

```bash
# example (token/LP manager)
forge create contracts/locker/HookSwapTokenLockerManager.sol:HookSwapTokenLockerManager \
  --rpc-url <chain rpc> --private-key <key> \
  --constructor-args <lockFeeWei> <feeReceiver>

# example (v3 position locker)
forge create contracts/locker/HookSwapV3PositionLocker.sol:HookSwapV3PositionLocker \
  --rpc-url <chain rpc> --private-key <key> \
  --constructor-args <lockFeeWei> <feeReceiver>
```

The `HookSwapTokenLockerManager` needs **no** external address — it detects v2 LP
tokens on its own. The **v3 locker is NOT constructed with an NPM address**;
callers pass the `NonfungiblePositionManager` address per `lock(...)` call. Read
each chain's NPM from `contracts/deployments/<chain>.json` → field
`nonfungiblePositionManager`:

| Chain (id) | NonfungiblePositionManager |
|---|---|
| Ink (57073) | `0xbd817036c5bF69Cb27D3A342129e39f9f908577d` |
| MegaETH (4326) | `0xbd817036c5bF69Cb27D3A342129e39f9f908577d` |
| Robinhood (4663) | `0xbd817036c5bF69Cb27D3A342129e39f9f908577d` |
| Tempo (4217) | `0xbd817036c5bF69Cb27D3A342129e39f9f908577d` |
| XLayer (196) | `0x45DB3eaE624dBcA631A9C6C1406DA0B8F6Fb275A` |
| HyperEVM (999) | `0x86426094d82bC1fd40F0901965b23D30837Dc66b` |
| Sepolia (11155111) | use the canonical Uniswap NPM (already in sdk-core) |

(Verify against the live JSON before each deploy — deterministic-address chains
share `0xbd81…577d`; nonce-shifted chains differ.)

---

## ⚠️ Audit note — get a fresh review before mainnet value

The audited OnlyMoons base was **modified**:

1. **Lock fee added** to the manager (changes the audited bytecode).
2. **Renamed** to HookSwap contract/interface names.
3. **New `HookSwapV3PositionLocker`** — entirely new, unaudited code.

The SourceHat audit covered the original OnlyMoons `TokenLockerV1` /
`TokenLockerManagerV1` bytecode and does **not** extend to these changes. Obtain a
fresh security review before locking real value on mainnet.
