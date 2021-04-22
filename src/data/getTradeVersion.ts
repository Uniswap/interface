import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Version } from '../hooks/useToggledVersion'

export function getTradeVersion(trade?: V2Trade): Version | undefined {
  if (!trade) return undefined
  return Version.v2
}
