import { BigintIsh, Currency, CurrencyAmount, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { BigNumber } from 'ethers'

import { PositionDetails } from 'types/position'

export interface UserPositionFarm extends PositionDetails {
  stakedLiquidity: BigNumber
  rewardPendings: []
}

export interface FarmingPool {
  id: string
  pid: string
  startTime: number
  endTime: number
  feeTarget: string
  vestingDuration: number
  rewardTokens: Currency[]
  totalRewards: Array<CurrencyAmount<Currency>>
  token0: Currency
  token1: Currency
  pool: Pool
  poolAddress: string
  poolTvl: number
  feesUSD: number
  tvlToken0: TokenAmount
  tvlToken1: TokenAmount
  stakedTvl?: number // optional as it exists in V2 only
  apr?: number // optional as it exists in V2 only
  poolAPR?: number // optional as it exists in V2 only
}
export interface ElasticFarm {
  id: string // fair launch contract
  rewardLocker: string
  pools: Array<FarmingPool>
}

interface PositionConstructorArgs {
  nftId: BigNumber
  pool: Pool
  tickLower: number
  tickUpper: number
  liquidity: BigintIsh
}
export class NFTPosition extends Position {
  readonly nftId: BigNumber
  constructor({ nftId, pool, liquidity, tickLower, tickUpper }: PositionConstructorArgs) {
    super({ pool, liquidity, tickUpper, tickLower })
    this.nftId = nftId
  }
}

export interface UserInfo {
  depositedPositions: NFTPosition[]
  joinedPositions: {
    [pid: string]: NFTPosition[]
  }
  rewardPendings: {
    [pid: string]: Array<CurrencyAmount<Currency>>
  }
  rewardByNft: {
    [pid_nftId: string]: Array<CurrencyAmount<Currency>>
  }
}

export interface UserFarmInfo {
  [farmContract: string]: UserInfo
}
