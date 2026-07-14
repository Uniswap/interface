/**
 * HookSwap Terminal — Airdrop ABIs (factory + per-airdrop MerkleDistributor child).
 *
 * Minimal, hand-written ABIs matching the EXACT signatures of the deployed contracts
 * (`contracts/airdrop/src/MerkleDistributorFactory.sol` + `MerkleDistributor.sol`). Consumed by
 * `useAirdrop` via wagmi's `useReadContract` / `useWriteContract`. The ERC-20 side
 * (decimals / symbol / balanceOf / transfer) reuses viem's `erc20Abi`.
 *
 * FACTS-ONLY: every entry mirrors a real function / event on the contract.
 *
 * Factory (`MerkleDistributorFactory`):
 *   • `createDistributor(token, merkleRoot) returns (address distributor)` — deploys a fresh
 *     `MerkleDistributor` (one token + one immutable root) and records it. Funding is SEPARATE
 *     and permissionless: after creation the creator does a plain `token.transfer(distributor,
 *     total)` (no allowance / approve — the distributor never pulls).
 *   • `allDistributors() view returns (address[])` / `distributorsLength() view` /
 *     `distributors(uint256) view` — the creation-ordered registry.
 *   • `DistributorCreated(distributor indexed, token indexed, merkleRoot, creator indexed)` —
 *     emitted BY the factory on each create (the distributor address is the first indexed topic).
 *
 * Child (`MerkleDistributor`, a 0.8-port of Uniswap's merkle-distributor):
 *   • `claim(index, account, amount, merkleProof)` — verifies the sorted-pair merkle proof
 *     against the immutable `merkleRoot`, checks the claim bitmap, and `safeTransfer`s `amount`
 *     of `token` to `account`. Reverts on double-claim ("Drop already claimed.") or bad proof
 *     ("Invalid proof."). `amount` is in the token's base units (wei).
 *   • `isClaimed(index) view` — true once `index` has been claimed (packed-bitmap read).
 *   • `token() view` / `merkleRoot() view` — the airdropped ERC-20 + the committed root.
 */

export const merkleDistributorFactoryAbi = [
  {
    type: 'function',
    name: 'createDistributor',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'merkleRoot', type: 'bytes32' },
    ],
    outputs: [{ name: 'distributor', type: 'address' }],
  },
  {
    type: 'function',
    name: 'allDistributors',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'distributorsLength',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'distributors',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'event',
    name: 'DistributorCreated',
    inputs: [
      { name: 'distributor', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: true },
      { name: 'merkleRoot', type: 'bytes32', indexed: false },
      { name: 'creator', type: 'address', indexed: true },
    ],
    anonymous: false,
  },
] as const

export const merkleDistributorAbi = [
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'index', type: 'uint256' },
      { name: 'account', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'merkleProof', type: 'bytes32[]' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'isClaimed',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'token',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'merkleRoot',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bytes32' }],
  },
  {
    type: 'event',
    name: 'Claimed',
    inputs: [
      { name: 'index', type: 'uint256', indexed: false },
      { name: 'account', type: 'address', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
] as const
