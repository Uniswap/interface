/**
 * HookSwap Terminal — Farms ABIs (factory + per-farm StakingRewards child).
 *
 * Minimal, hand-written ABIs matching the EXACT signatures of the deployed contracts
 * (`contracts/farms/src/StakingRewardsFactory.sol` + `StakingRewards.sol`). Consumed by
 * `useCreateFarm` / `useFarm` via wagmi's `useReadContract(s)` / `useWriteContract`. The
 * ERC-20 side (decimals / symbol / allowance / approve) reuses viem's `erc20Abi`.
 *
 * FACTS-ONLY: every entry mirrors a real function / event on the contract.
 *
 * Factory (`StakingRewardsFactory`):
 *   • `createAndFund(stakingToken, rewardToken, rewardAmount, duration) returns (address farm)`
 *     — deploys a `StakingRewards` child and PULLS `rewardAmount` of `rewardToken` from the
 *     caller via `safeTransferFrom` → the caller must `approve(factory, rewardAmount)` FIRST.
 *     Reverts unless `stakingToken != rewardToken`, `rewardAmount > 0`, `duration > 0`
 *     (`duration` is the reward-stream length in SECONDS).
 *   • `allFarms() view returns (address[])` / `farmsLength() view` / `farmAt(uint256) view` —
 *     the creation-ordered registry of every farm this factory has deployed.
 *   • `FarmCreated(farm indexed, stakingToken indexed, rewardToken indexed)` — emitted BY the
 *     factory on each create (the farm address is the first indexed topic).
 *
 * Child (`StakingRewards`, a 0.8-port of Synthetix StakingRewards):
 *   • `stake(uint256)` — pulls the staking token via `transferFrom` (needs an allowance).
 *   • `withdraw(uint256)` — unstake previously-staked tokens.
 *   • `getReward()` — claim all pending rewards.
 *   • `exit()` — withdraw the full stake AND claim in one tx.
 *   • `earned(address) view` — reward accrued-but-unclaimed for an account.
 *   • `balanceOf(address) view` / `totalSupply() view` — staked balances.
 *   • `rewardRate() view` — reward tokens streamed per SECOND over the active period.
 *   • `periodFinish() view` — unix timestamp the current reward period ends.
 *   • `rewardsDuration() view` — the configured period length in seconds.
 *   • `rewardsToken() view` / `stakingToken() view` — the two ERC-20s.
 *   • `lastTimeRewardApplicable() view` — min(now, periodFinish).
 */

export const stakingRewardsFactoryAbi = [
  {
    type: 'function',
    name: 'createAndFund',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'stakingToken', type: 'address' },
      { name: 'rewardToken', type: 'address' },
      { name: 'rewardAmount', type: 'uint256' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [{ name: 'farm', type: 'address' }],
  },
  {
    type: 'function',
    name: 'allFarms',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'farmsLength',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'farmAt',
    stateMutability: 'view',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'event',
    name: 'FarmCreated',
    inputs: [
      { name: 'farm', type: 'address', indexed: true },
      { name: 'stakingToken', type: 'address', indexed: true },
      { name: 'rewardToken', type: 'address', indexed: true },
    ],
    anonymous: false,
  },
] as const

export const stakingRewardsAbi = [
  {
    type: 'function',
    name: 'stake',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getReward',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'exit',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'earned',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'rewardRate',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'periodFinish',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'rewardsDuration',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'rewardsToken',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'stakingToken',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'lastTimeRewardApplicable',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'Staked',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Withdrawn',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'RewardPaid',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'reward', type: 'uint256', indexed: false },
    ],
    anonymous: false,
  },
] as const
