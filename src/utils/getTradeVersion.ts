import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { Version } from '../hooks/useToggledVersion'

export function getTradeVersion(trade?: V2Trade | V3Trade): Version | undefined {
  if (!trade) return undefined
  if (trade instanceof V2Trade) return Version.v2
  if (trade instanceof V3Trade) return Version.v3
  throw new Error('Unknown trade type')
}
