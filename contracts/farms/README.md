# HookSwap Staking Farms

Self-service **staking farms** for HookSwap — a port of the canonical Synthetix
`StakingRewards.sol` (the reward-per-token-stored streaming staking contract) plus
a factory that lets anyone spin up and fund a farm in one transaction.

Stake any ERC-20 (a plain token **or** a HookSwap v2 LP-pair token — an LP token is
itself an ERC-20, so this works as an LP farm unchanged) and earn a second ERC-20
streamed linearly over a fixed reward period.

## Contracts

### `src/StakingRewards.sol`

A per-farm staking pool. One farm = one `(stakingToken, rewardToken)` pair.

- **Constructor:** `(address owner, address rewardsDistribution, address rewardToken, address stakingToken)`.
- **Users:** `stake(uint256)`, `withdraw(uint256)`, `getReward()`, `exit()`.
- **Accounting views:** `earned(address)`, `rewardPerToken()`, `lastTimeRewardApplicable()`,
  `getRewardForDuration()`, plus `rewardRate`, `periodFinish`, `rewardsDuration`,
  `totalSupply()`, `balanceOf(address)`, `rewardsToken`, `stakingToken`,
  `rewardsDistribution`.
- **Funding:** `notifyRewardAmount(uint256)` — gated to `rewardsDistribution`;
  (re)starts / extends the linear stream. Reward tokens must already sit in the
  contract before this is called.
- **Admin (`owner`):** `setRewardsDuration(uint256)` (only while no period is
  active; also callable by `rewardsDistribution` so the factory can set it at
  creation), `setRewardsDistribution(address)` (reassign the funder — e.g. from
  the factory to the owner for later top-ups), `recoverERC20(address,uint256)`
  (rescue stray tokens; **cannot** pull the staking token).

The reward math (`rewardPerToken` / `earned` / the `updateReward` accumulator) is
the audited Synthetix logic, unchanged.

### `src/StakingRewardsFactory.sol`

One-transaction, permissionless farm launcher.

- `createAndFund(address stakingToken, address rewardToken, uint256 rewardAmount, uint256 duration) returns (address farm)`
  1. deploys `new StakingRewards(msg.sender, address(this), rewardToken, stakingToken)`
     → **owner = creator**, **rewardsDistribution = factory**;
  2. pulls `rewardAmount` of `rewardToken` from the creator via `transferFrom`
     (the creator must `approve` the factory first) straight into the new farm;
  3. calls `setRewardsDuration(duration)` then `notifyRewardAmount(rewardAmount)`
     (the factory is `rewardsDistribution`, so it is authorized);
  4. records the farm and emits `FarmCreated(farm, stakingToken, rewardToken)`.
- Enumeration: `allFarms()`, `farmsLength()`, `farmAt(uint256)`.

> Because the factory is only the initial `rewardsDistribution`, a creator who wants
> to top up rewards later calls `farm.setRewardsDistribution(<self>)` (owner only),
> then funds the farm and calls `notifyRewardAmount` directly.

## Synthetix → 0.8.24 port notes

The original Synthetix `StakingRewards` targets Solidity 0.5.16. Changes made:

- **Removed `SafeMath`.** 0.8.x has built-in checked arithmetic, so every
  `.add/.sub/.mul/.div` becomes native `+ - * /` (same overflow-revert behavior).
  The formulas are byte-for-byte identical — only the arithmetic *syntax* changed.
- **Replaced the Synthetix mix-ins.** `Owned` + `RewardsDistributionRecipient` +
  `Pausable` → the vendored {Ownable} (owner passed to the constructor) plus an
  inline `rewardsDistribution` gate. `Pausable` is dropped (not needed for the
  self-service factory model).
- **Vendored, self-contained deps.** `IERC20`, `SafeERC20`, `ReentrancyGuard`,
  `Context`, `Ownable` live under `./library` — no OpenZeppelin / external
  `forge install`. (`forge-std` under `./lib` is used only by the deploy script.)
- **0.8 correctness.** Explicit visibility, `pragma ^0.8.24`, checked math relied on
  for the `withdraw`/`_balances` underflow guard.
- `setRewardsDuration` accepts the owner **or** `rewardsDistribution` (the original
  is owner-only) so the factory can configure duration at creation.

`forge build` emits `block-timestamp` lint warnings on the three time comparisons —
these are inherent to Synthetix's time-based streaming and are expected/harmless.

## Build

```
cd contracts/farms
forge build        # self-contained; solc 0.8.24, optimizer 200, evm paris
```

Mirrors the locker / referral suites (same `foundry.toml` shape). `src = "src"`;
vendored deps under `library/`; `forge-std` under `lib/` for the script only.

## Deploy (Reggie)

Deploy the **factory** once per chain; individual farms are then created
client-side through it.

```
forge script script/DeployFarmsFactory.s.sol \
  --rpc-url <rpc> --private-key <key> --broadcast
```

Record the deployed factory address in
`contracts/deployments/robinhood-farms.json` → `"stakingRewardsFactory"`.

## Frontend integration — function signatures

Factory:
- `createAndFund(address stakingToken, address rewardToken, uint256 rewardAmount, uint256 duration) returns (address farm)`
- `allFarms() view returns (address[])`, `farmsLength() view returns (uint256)`, `farmAt(uint256) view returns (address)`

Per farm:
- `stake(uint256)`, `withdraw(uint256)`, `getReward()`, `exit()`
- `earned(address) view returns (uint256)`, `rewardPerToken() view returns (uint256)`,
  `balanceOf(address) view returns (uint256)`, `totalSupply() view returns (uint256)`
- `rewardRate() / periodFinish() / rewardsDuration() / lastTimeRewardApplicable()` views

## Status / audit

**NOT audited.** The Synthetix original is battle-tested, but this 0.8.24 port and
the factory wrapper need a fresh review before mainnet use with real value. Kit
compiles and is deploy-ready; farms are only useful once the staking/reward tokens
(e.g. HookSwap v2 LP tokens) exist on the target chain.
