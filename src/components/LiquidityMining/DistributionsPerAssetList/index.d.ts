import BigNumber from 'bignumber.js'
import { Token } from 'dxswap-sdk'

interface RewardToken {
  derivedETH: string
}

interface Reward {
  amount: string
  token: RewardToken
}

interface Pair {
  token0: Token
  token1: Token
}

interface Distribution {
  id: string
  stakablePair: Pair
  rewards: Reward[]
}

interface AggregatedDistributionData {
  token0: Token
  distributions: Distribution[]
}

interface Bundle {
  ethPrice: string
}

interface DistributionsPerAssetQueryResult {
  aggregatedToken0DistributionData: AggregatedDistributionData
  bundles: Bundle[]
}

interface ParsedPerAssetData {
  id: string
  token0: Token
  token1: Token
  usdRewards: BigNumber
}
