import { BigNumber } from '@ethersproject/bignumber'
import { Incentive } from '../hooks/incentives/useAllIncentives'
import Stake from './stake'

export interface PositionDetails {
  nonce: BigNumber
  tokenId: BigNumber
  operator: string
  owner: string
  depositedInStaker: boolean
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: BigNumber
  feeGrowthInside0LastX128: BigNumber
  feeGrowthInside1LastX128: BigNumber
  tokensOwed0: BigNumber
  tokensOwed1: BigNumber
  incentives: Incentive[]
  stakes: Stake[]
}
