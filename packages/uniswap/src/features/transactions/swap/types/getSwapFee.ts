// import { Percent } from '@uniswap/sdk-core'
// import { DiscriminatedQuoteResponse } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { SwapFee } from 'uniswap/src/features/transactions/swap/types/trade'
// import { logger } from 'utilities/src/logger/logger'

export function getSwapFee(): SwapFee | undefined {
  // Frontend fees are disabled - always return undefined
  return undefined
}
