import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { TradeType } from '@uniswap/sdk-core'
import { config } from 'src/config'
import { ChainId } from 'src/constants/chains'
import { DEFAULT_DEADLINE_S, DEFAULT_SLIPPAGE_TOLERANCE } from 'src/constants/misc'
import { uniswapUrls } from 'src/constants/urls'
import { QuoteResult, TradeQuoteResult } from 'src/features/routing/types'
import { transformQuoteToTrade } from 'src/features/transactions/swap/routeUtils'
import { serializeQueryParams } from 'src/features/transactions/swap/utils'
import { SwapRouterNativeAssets } from 'src/utils/currencyId'

const protocols: string[] = ['v2', 'v3']

const DEFAULT_QUERY_PARAMS = {
  protocols: protocols.map((p) => p.toLowerCase()).join(','),
  // example other params
  // forceCrossProtocol: 'true',
  // minSplits: '5',
}

// error string hardcoded in @uniswap/routing-api
export const SWAP_NO_ROUTE_ERROR = 'NO_ROUTE'
// error string hardcoded in @uniswap/api
// https://github.com/Uniswap/api/blob/main/bin/stacks/api-v1.ts#L234
export const API_RATE_LIMIT_ERROR = 'TOO_MANY_REQUESTS'

export const routingApi = createApi({
  reducerPath: 'routingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: uniswapUrls.routingApiUrl,
    prepareHeaders: (headers) => {
      // TODO remove once routing api officially supports mobile
      // spoof origin to go around server permissions
      headers.set('Origin', config.uniswapAppUrl)
      return headers
    },
  }),
  endpoints: (build) => ({
    quote: build.query<
      TradeQuoteResult,
      {
        amount: string
        deadline?: number
        fetchSimulatedGasLimit?: boolean
        recipient?: string
        slippageTolerance?: number
        tokenInAddress: string
        tokenInChainId: ChainId
        tokenOutAddress: string
        tokenOutChainId: ChainId
        type: 'exactIn' | 'exactOut'
      }
    >({
      query: ({
        amount,
        deadline = DEFAULT_DEADLINE_S,
        fetchSimulatedGasLimit,
        recipient,
        slippageTolerance = DEFAULT_SLIPPAGE_TOLERANCE,
        tokenInAddress,
        tokenInChainId,
        tokenOutAddress,
        tokenOutChainId,
        type,
      }) =>
        `quote?${serializeQueryParams({
          ...DEFAULT_QUERY_PARAMS,
          amount,
          tokenInAddress,
          tokenInChainId,
          tokenOutAddress,
          tokenOutChainId,
          type,
          ...(recipient
            ? {
                recipient,
                slippageTolerance,
                deadline,
              }
            : {}),
          ...(recipient && fetchSimulatedGasLimit ? { simulateFromAddress: recipient } : {}),
        })}`,
      transformResponse: (result: QuoteResult, _, arg): TradeQuoteResult => {
        // TODO: we shouldn't rely on any of the request arguments and transform the data with only response data
        // Must figure out how to determine whether requested assets are native given the router always returns
        // wrapped token addresses
        const { tokenInAddress, tokenOutAddress, type } = arg
        const tradeType = type === 'exactIn' ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT
        const tokenInIsNative = Object.values(SwapRouterNativeAssets).includes(
          tokenInAddress as SwapRouterNativeAssets
        )
        const tokenOutIsNative = Object.values(SwapRouterNativeAssets).includes(
          tokenOutAddress as SwapRouterNativeAssets
        )
        const trade = transformQuoteToTrade(tokenInIsNative, tokenOutIsNative, tradeType, result)
        return {
          trade,
          simulationError: result.simulationError,
          gasUseEstimate: result.gasUseEstimate,
        }
      },
    }),
  }),
})

export const { useQuoteQuery } = routingApi
