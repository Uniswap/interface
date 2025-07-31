import { DiscriminatedQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { GasEstimate } from 'uniswap/src/data/tradingApi/types'

export function getGasEstimate(data: DiscriminatedQuoteResponse | null): GasEstimate | undefined {
  if (!data?.quote || !('gasEstimates' in data.quote) || !data.quote.gasEstimates) {
    return undefined
  }

  return data.quote.gasEstimates[0]
}
