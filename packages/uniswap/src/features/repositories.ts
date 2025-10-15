import { fetchIndicativeQuote, fetchQuote } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  createTradeRepository,
  type TradeRepository,
} from 'uniswap/src/features/transactions/swap/services/tradeService/tradeRepository'
import { logger } from 'utilities/src/logger/logger'

/**
 * Repositories
 *
 * This is where we _create_ instances of repositories that are used in services/hooks/etc.
 *
 * List of repositories:
 * - Trade Repository (formerly Quote Repository)
 */

/**
 * Trade Repository
 *
 * @returns A trade repository that can be used to fetch quotes from the trading API.
 */
export function getTradeRepository(): TradeRepository {
  return createTradeRepository({
    fetchQuote,
    fetchIndicativeQuote,
    logger,
  })
}
