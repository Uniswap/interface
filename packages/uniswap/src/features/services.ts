import { FetchError } from '@universe/api'
import type { JupiterOrderUrlParams } from '@universe/api/src/clients/jupiter/types'
import { useMemo } from 'react'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isL2ChainId } from 'uniswap/src/features/chains/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getEVMTradeRepository } from 'uniswap/src/features/repositories'
import { GetQuoteRequestResult } from 'uniswap/src/features/transactions/swap/hooks/useTrade/createGetQuoteRequestArgs'
import { createEVMTradeService } from 'uniswap/src/features/transactions/swap/services/tradeService/evmTradeService'
import { createSolanaTradeService } from 'uniswap/src/features/transactions/swap/services/tradeService/svmTradeService'
import {
  createTradeService,
  TradeService,
} from 'uniswap/src/features/transactions/swap/services/tradeService/tradeService'
import { UseTradeArgs } from 'uniswap/src/features/transactions/swap/types/trade'
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

function onTradeError(
  error: Error,
  ctx: {
    input: UseTradeArgs
    quoteRequestArgs?: GetQuoteRequestResult | JupiterOrderUrlParams // TODO(SWAP-383): Remove JupiterOrderUrlParams from union once Solana trade repo is implemented
  },
): void {
  // Error logging
  // We use DataDog to catch network errors on Mobile
  if ((!isMobileApp || !(error instanceof FetchError)) && !ctx.input.isUSDQuote) {
    getLogger().error(error, {
      tags: { file: 'packages/uniswap/src/features/services.ts', function: 'onTradeError' },
      extra: { ...ctx.quoteRequestArgs },
    })
  }
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
    onTradeError,
  })

  const svmTradeService = createSolanaTradeService({
    // tradeRepository: getSolanaTradeRepository(), // TODO(SWAP-383): build Solana Trade Repository
    onTradeError,
  })

  return createTradeService({
    serviceByPlatform: {
      [Platform.EVM]: evmTradeService,
      [Platform.SVM]: svmTradeService,
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
