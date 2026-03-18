import { useMemo } from 'react'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getEVMTradeRepository } from 'uniswap/src/features/repositories'
import { useWithQuoteLogging } from 'uniswap/src/features/transactions/swap/hooks/useTrade/logging'
import { createEVMTradeService } from 'uniswap/src/features/transactions/swap/services/tradeService/evmTradeService'
import { createSolanaTradeService } from 'uniswap/src/features/transactions/swap/services/tradeService/svmTradeService'
import {
  createTradeService,
  TradeService,
} from 'uniswap/src/features/transactions/swap/services/tradeService/tradeService'
import { getMinAutoSlippageToleranceL2 } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { getLogger } from 'utilities/src/logger/logger'

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

  const evmTradeService = createEVMTradeService({
    tradeRepository: getEVMTradeRepository(),
    getIsUniswapXSupported,
    getEnabledChains,
    getIsL2ChainId: (chainId?: UniverseChainId) => (chainId ? isL2ChainId(chainId) : false),
    getMinAutoSlippageToleranceL2,
    logger: getLogger(),
  })

  const svmTradeService =
    createSolanaTradeService(
      // { tradeRepository: getSolanaTradeRepository() } // TODO(SWAP-383): build Solana Trade Repository
    )

  return createTradeService({
    serviceByPlatform: {
      [Platform.EVM]: evmTradeService,
      [Platform.SVM]: svmTradeService,
    },
  })
}

export function useTradeService(): TradeService {
  const withQuoteLogging = useWithQuoteLogging()
  const getIsUniswapXSupported = useUniswapContextSelector((state) => state.getIsUniswapXSupported)
  const enabledChains = useEnabledChains()

  return useMemo(() => {
    const baseService = getTradeService({
      getIsUniswapXSupported: getIsUniswapXSupported ?? ((): boolean => false),
      getEnabledChains: () => enabledChains.chains,
    })

    return withQuoteLogging(baseService)
  }, [getIsUniswapXSupported, enabledChains, withQuoteLogging])
}
