import { BigNumber } from 'ethers'
import { ProMMPoolData } from 'state/prommPools/hooks'
import { PositionDetails } from 'types/position'

export interface UserPositionFarm extends PositionDetails {
  stakedLiquidity: BigNumber
  rewardPendings: []
}

export interface ProMMFarm {
  pid: number
  poolAddress: string
  totalLiqStake: BigNumber
  startTime: number
  endTime: number
  vestingDuration: number
  rewardTokens: string[]
  totalRewardUnclaimeds: BigNumber[]
  userDepositedNFTs: UserPositionFarm[]
  token0: string
  token1: string
  feeTier: number
  baseL: BigNumber
  reinvestL: BigNumber
  sqrtP: BigNumber
  currentTick: number
  rewardLocker: string
  feeTarget: BigNumber
}

export interface ProMMFarmResponse {
  poolAddress: string
  totalLiqStake: BigNumber
  startTime: number
  endTime: number
  vestingDuration: number
  rewardTokens: string[]
  totalRewardUnclaimeds: BigNumber[]
  poolInfo: ProMMPoolData
  feeTarget: BigNumber
}
