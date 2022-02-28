import { Interface } from '@ethersproject/abi'

import MOOLA_STAKING_REWARDS_ABI from './MoolaStakingRewards.json'

export const MOOLA_STAKING_REWARDS_INTERFACE = new Interface(MOOLA_STAKING_REWARDS_ABI)
