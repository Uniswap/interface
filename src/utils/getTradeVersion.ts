import { Currency, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { Version } from '../hooks/useToggledVersion'

export function getTradeVersion(
  trade?: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType>
): Version | undefined {
  if (!trade) return undefined
  if (trade instanceof V2Trade) return Version.v2
  return Version.v3
}
