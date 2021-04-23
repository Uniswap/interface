import { Interface } from '@ethersproject/abi'
import { abi as STAKING_REWARDS_ABI } from '@uniswap/liquidity-staker/build/StakingRewards.json'

const STAKING_REWARDS_INTERFACE = new Interface(STAKING_REWARDS_ABI)

export { STAKING_REWARDS_INTERFACE }
