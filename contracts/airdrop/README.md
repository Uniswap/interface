# HookSwap Merkle Airdrop

Self-service, gas-efficient token airdrops for HookSwap. A fork of Uniswap's
[`merkle-distributor`](https://github.com/Uniswap/merkle-distributor), ported from
solc 0.6.x to **0.8.24** (SafeMath removed — 0.8.x has built-in overflow checks;
the Merkle-proof verification + claim bitmap are preserved unchanged).

Only claimers pay gas. The full recipient set is committed to a single 32-byte
**Merkle root** on-chain; each recipient submits a Merkle proof to claim their
allocation. A `MerkleDistributorFactory` lets any project spin up a new airdrop
from the UI in one transaction.

## Contracts

- **`src/MerkleDistributor.sol`** — one airdrop: one `token`, one immutable
  `merkleRoot`.
  - `constructor(address token, bytes32 merkleRoot)`
  - `claim(uint256 index, address account, uint256 amount, bytes32[] merkleProof)`
    — verifies the proof, checks the claim bitmap, transfers `amount` of `token`
    to `account` (`SafeERC20.safeTransfer`), emits `Claimed(index, account, amount)`.
    Reverts on double-claim (`"Drop already claimed."`) or bad proof
    (`"Invalid proof."`).
  - Views: `token()`, `merkleRoot()`, `isClaimed(uint256 index)`.
- **`src/MerkleDistributorFactory.sol`** — self-service registry.
  - `createDistributor(address token, bytes32 merkleRoot) returns (address distributor)`
    — deploys a `new MerkleDistributor`, records it, emits
    `DistributorCreated(distributor, token, merkleRoot, creator)`.
  - Views: `allDistributors()`, `distributorsLength()`, `distributors(uint256)`.
- **`script/DeployAirdropFactory.s.sol`** — deploys the factory once per chain.

## Lifecycle

1. **Build the tree (off-chain).** The frontend/CLI builds the Merkle tree from
   the `(index, account, amount)` recipient list and computes the `merkleRoot`.
   See the leaf format below — it MUST match this contract.
2. **Create** — one tx: `factory.createDistributor(token, merkleRoot)` → a fresh
   `MerkleDistributor`. (Anyone can create; funding is separate and permissionless.)
3. **Fund** — the creator transfers the total airdrop amount to the distributor:
   a plain `token.transfer(distributor, total)`. The distributor is non-custodial;
   it only ever pays out what a valid proof claims.
4. **Claim** — each recipient calls
   `claim(index, account, amount, merkleProof)` with the proof the frontend
   generates from the same tree. Double-claims are blocked by the on-chain bitmap.

## Leaf encoding (MUST match the frontend merkle builder)

The off-chain builder — built later — MUST produce leaves and internal nodes
exactly this way, or on-chain proofs will not verify:

- **Leaf:** `keccak256(abi.encodePacked(uint256 index, address account, uint256 amount))`
  - `index` — `uint256`, the recipient's unique position in the list.
  - `account` — `address` (20 bytes), the claimer.
  - `amount` — `uint256`, the token amount in the token's base units (wei).
  - `abi.encodePacked` = tight packing: 32-byte index ‖ 20-byte address ‖ 32-byte
    amount (84 bytes total), then `keccak256`.
- **Internal nodes:** OZ-style **sorted-pair** hashing — for each pair `(a, b)`,
  hash `keccak256(a ‖ b)` if `a <= b` else `keccak256(b ‖ a)`. Proofs are therefore
  direction-agnostic (no left/right flags needed). See `library/MerkleProof.sol`.

This matches `@uniswap/merkle-distributor`, so the Uniswap
`parse-balance-map` / `@uniswap/merkle-distributor` tree builder (or an
`ethers.solidityPackedKeccak256(["uint256","address","uint256"], [index, account, amount])`
+ sorted-pair `merkletreejs`) produces compatible roots and proofs.

## Layout

```
airdrop/
  foundry.toml                       # solc 0.8.24, optimizer 200, evm paris
  src/
    MerkleDistributor.sol            # the airdrop (fork of Uniswap's, 0.8.24)
    MerkleDistributorFactory.sol     # self-service factory + registry
  script/
    DeployAirdropFactory.s.sol       # deploy the factory once per chain
  library/                           # vendored deps — NO external forge install
    IERC20.sol
    SafeERC20.sol                    # non-standard-token-safe transfer (USDT etc.)
    MerkleProof.sol                  # OZ-style sorted-pair verifier
  lib/forge-std/                     # gitignored; forge-std for the deploy script only
```

Fully self-contained: `IERC20`/`SafeERC20`/`MerkleProof` are vendored under
`library/` (copied from `contracts/referral/library`). `forge-std` (used only by
the deploy script) lives in `lib/` and is gitignored, matching `contracts/locker`.

## Build

```
cd contracts/airdrop
forge build
```

Compiles clean with solc 0.8.24 (`Compiler run successful!`). The `forge-lint`
warnings that print (`incorrect-shift` on the `1 << bit` bitmap, `unchecked-call`
in `SafeERC20`) are style lints, not errors — both are the canonical Uniswap
patterns.

## Deploy (Reggie — separate; NOT part of this kit)

```
forge script script/DeployAirdropFactory.s.sol --rpc-url <rpc> --private-key <key> --broadcast
```

Deploy the **factory once** per chain, then record its address in
`contracts/deployments/robinhood-airdrop.json`:

```json
{ "merkleDistributorFactory": "0x..." }
```

Per-airdrop `MerkleDistributor`s are created **client-side** from the UI via
`createDistributor(token, merkleRoot)` and funded with a follow-up
`token.transfer(distributor, total)`. Launch scope is Robinhood (4663).
