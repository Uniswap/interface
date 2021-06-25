import { Interface } from '@ethersproject/abi'

import STAKING_REWARDS_ABI from './StakingRewards.json'

export const STAKING_REWARDS_INTERFACE = new Interface(STAKING_REWARDS_ABI)
