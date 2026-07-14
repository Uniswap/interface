/**
 * HookSwap Terminal — Vesting ABIs (manager + per-schedule child).
 *
 * Minimal, hand-written ABIs matching the EXACT signatures of the deployed contracts
 * (`contracts/vesting/src/HookSwapVestingManager.sol` + `HookSwapVesting.sol`). Consumed by
 * `useCreateVesting` / `useMySchedules` via wagmi's `useReadContract(s)` / `useWriteContract`.
 * The ERC-20 side (decimals / symbol / allowance / approve) reuses viem's `erc20Abi`.
 *
 * FACTS-ONLY: every entry mirrors a real function / event on the contract.
 *
 * Manager (`HookSwapVestingManager`):
 *   • `createVesting(token, beneficiary, amount, startTime, cliffDuration, duration) payable`
 *     — deploys a `HookSwapVesting` child and PULLS `amount` from the caller via
 *     `safeTransferFrom` → the caller must `approve(manager, amount)` FIRST. `amount > 0`.
 *     `startTime` is an absolute unix timestamp; `cliffDuration` / `duration` are seconds
 *     relative to it (child requires `duration > 0` and `cliffDuration <= duration`).
 *   • `getSchedulesForAddress(address) view returns (uint256[])` — schedule ids indexed under
 *     BOTH the beneficiary and the creator, so one read serves both roles.
 *   • `getScheduleData(id) view returns (id, token, beneficiary, creator, start, cliff,
 *     duration, totalAmount, released, contractAddress)` — proxies the child's view.
 *   • `vestingCount() view` / `vestingFee() view` / `feeReceiver() view` — registry + the
 *     optional native fee (0 = free), forwarded as `value` on create.
 *
 * Child (`HookSwapVesting`):
 *   • `releasable() view` — vested-but-unreleased tokens, claimable right now.
 *   • `vestedAmount(uint64 timestamp) view` — cliff + linear curve at a timestamp.
 *   • `release()` — beneficiary-ONLY; transfers all releasable tokens to the beneficiary.
 *   • `getScheduleData() view` — same 10-field tuple as the manager's proxy.
 */

/** Shared 10-field schedule tuple returned by both `getScheduleData` views. */
const scheduleDataOutputs = [
  { name: 'id', type: 'uint256' },
  { name: 'token', type: 'address' },
  { name: 'beneficiary', type: 'address' },
  { name: 'creator', type: 'address' },
  { name: 'start', type: 'uint64' },
  { name: 'cliff', type: 'uint64' },
  { name: 'duration', type: 'uint64' },
  { name: 'totalAmount', type: 'uint256' },
  { name: 'released', type: 'uint256' },
  { name: 'contractAddress', type: 'address' },
] as const

export const vestingManagerAbi = [
  {
    type: 'function',
    name: 'createVesting',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'beneficiary', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'startTime', type: 'uint64' },
      { name: 'cliffDuration', type: 'uint64' },
      { name: 'duration', type: 'uint64' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getSchedulesForAddress',
    stateMutability: 'view',
    inputs: [{ name: 'address_', type: 'address' }],
    outputs: [{ type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'getScheduleData',
    stateMutability: 'view',
    inputs: [{ name: 'id_', type: 'uint256' }],
    outputs: scheduleDataOutputs,
  },
  {
    type: 'function',
    name: 'getVestingAddress',
    stateMutability: 'view',
    inputs: [{ name: 'id_', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'vestingCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'vestingFee',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'feeReceiver',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'event',
    name: 'VestingCreated',
    inputs: [
      { name: 'id', type: 'uint256', indexed: true },
      { name: 'child', type: 'address', indexed: true },
      { name: 'token', type: 'address', indexed: false },
      { name: 'beneficiary', type: 'address', indexed: true },
      { name: 'creator', type: 'address', indexed: false },
    ],
    anonymous: false,
  },
] as const

export const vestingChildAbi = [
  {
    type: 'function',
    name: 'releasable',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'vestedAmount',
    stateMutability: 'view',
    inputs: [{ name: 'timestamp', type: 'uint64' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'release',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getScheduleData',
    stateMutability: 'view',
    inputs: [],
    outputs: scheduleDataOutputs,
  },
  {
    type: 'event',
    name: 'Released',
    inputs: [{ name: 'amount', type: 'uint256', indexed: false }],
    anonymous: false,
  },
] as const
