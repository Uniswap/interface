import { Interface } from 'ethers/lib/utils'
import STAKING_REWARDS_ABI from './StakingRewards.json'

export const STAKING_REWARDS_INTERFACE = new Interface(STAKING_REWARDS_ABI)
