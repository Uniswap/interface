import { useMemo } from 'react'
import { useTradingApiSwappableTokensQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiSwappableTokensQuery'
import { ChainId } from 'uniswap/src/data/tradingApi/__generated__'
import {
  NATIVE_ADDRESS_FOR_TRADING_API,
  toTradingApiSupportedChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { UniverseChainId } from 'uniswap/src/types/chains'

const FALLBACK_NUM_CHAINS = 8

export function useNumBridgingChains(): number {
  const { data: bridgingTokens } = useTradingApiSwappableTokensQuery({
    params: {
      tokenIn: NATIVE_ADDRESS_FOR_TRADING_API,
      tokenInChainId: ChainId._1,
    },
  })

  const chainSet = useMemo(() => new Set(bridgingTokens?.tokens.map((t) => t.chainId)), [bridgingTokens])

  return chainSet.size + 1 ?? FALLBACK_NUM_CHAINS
}

export function useIsBridgingChain(chainId: UniverseChainId): boolean {
  const { data: bridgingTokens } = useTradingApiSwappableTokensQuery({
    params: {
      tokenIn: NATIVE_ADDRESS_FOR_TRADING_API,
      tokenInChainId: ChainId._1,
    },
  })

  const chainSet = useMemo(() => new Set(bridgingTokens?.tokens.map((t) => t.chainId)), [bridgingTokens])

  const chainIdForTradingApi = toTradingApiSupportedChainId(chainId)
  return chainIdForTradingApi !== undefined && chainSet.has(chainIdForTradingApi)
}
