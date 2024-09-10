// eslint-disable-next-line no-restricted-imports
import { Amount, PoolStats, TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { Percent } from '@uniswap/sdk-core'

type PricePoint = { timestamp: number; value: number }

export interface TokenStat
  extends Omit<TokenStats, 'volume1Hour' | 'volume1Day' | 'volume1Week' | 'volume1Month' | 'volume1Year'> {
  volume?: Amount
  priceHistory?: PricePoint[]
}

export interface PoolStat extends PoolStats {
  oneDayApr: Percent
}
