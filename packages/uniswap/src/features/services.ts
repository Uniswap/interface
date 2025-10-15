import { useMemo } from 'react'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { FetchError } from 'uniswap/src/data/apiClients/FetchError'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { getTradeRepository } from 'uniswap/src/features/repositories'
import {
  createTradeService,
  TradeService,
} from 'uniswap/src/features/transactions/swap/services/tradeService/tradeService'
import { getMinAutoSlippageToleranceL2 } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { getLogger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'

/**
 * Services
 *
 * This is where we create instances of services that are used in hooks/components.
 * Services orchestrate business logic and use repositories for data access.
 *
 * List of services:
 * - Trade Service
 */

interface TradeServiceContext {
  // dependencies from React layer
  getIsUniswapXSupported?: (chainId?: number) => boolean
  getEnabledChains: () => UniverseChainId[]
}

/**
 * Trade Service
 *
 * Creates a trade service instance with the necessary dependencies.
 * Only requires minimal context from the React layer.
 *
 * @param ctx - Context containing React-layer dependencies
 * @returns A trade service that orchestrates the swap flow
 */
export function getTradeService(ctx: TradeServiceContext): TradeService {
  const { getIsUniswapXSupported, getEnabledChains } = ctx

  return createTradeService({
    tradeRepository: getTradeRepository(),
    getIsUniswapXSupported,
    getEnabledChains,
    getIsL2ChainId: (chainId?: UniverseChainId) => (chainId ? isL2ChainId(chainId) : false),
    getMinAutoSlippageToleranceL2,
    logger: getLogger(),
    onTradeError: (error, errorCtx) => {
      // Error logging
      // We use DataDog to catch network errors on Mobile
      if ((!isMobileApp || !(error instanceof FetchError)) && !errorCtx.input.isUSDQuote) {
        getLogger().error(error, {
          tags: { file: 'useTrade', function: 'quote' },
          extra: { ...errorCtx.quoteRequestArgs },
        })
      }
    },
  })
}

export function useTradeService(): TradeService {
  const getIsUniswapXSupported = useUniswapContextSelector((state) => state.getIsUniswapXSupported)
  const enabledChains = useEnabledChains()

  return useMemo(
    () =>
      getTradeService({
        getIsUniswapXSupported: getIsUniswapXSupported ?? ((): boolean => false),
        getEnabledChains: () => enabledChains.chains,
      }),
    [getIsUniswapXSupported, enabledChains],
  )
}
