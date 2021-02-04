import BigNumber from 'bignumber.js'
import { Token } from 'dxswap-sdk'

interface Reward {
  amount: string
  token: Token
}

interface Distribution {
  rewards: Reward[]
}

interface AggregatedDistributionData {
  id: string
  token0: Token
  distributions: Distribution[]
}

interface Bundle {
  ethPrice: string
}

interface AggregatedQueryResult {
  aggregatedToken0DistributionDatas: AggregatedDistributionData[]
  bundles: Bundle[]
}

interface ParsedAggregationData {
  id: string
  relatedToken: Token
  usdRewards: BigNumber
}
