import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { TradeType } from '@uniswap/sdk-core'
import { BigNumber } from 'ethers'
import { config } from 'src/config'
import { ChainId } from 'src/constants/chains'
import { DEFAULT_SLIPPAGE_TOLERANCE } from 'src/constants/transactions'
import { uniswapUrls } from 'src/constants/urls'
import { QuoteResult, TradeQuoteResult } from 'src/features/routing/types'
import { transformQuoteToTrade } from 'src/features/transactions/swap/routeUtils'
import { PermitSignatureInfo } from 'src/features/transactions/swap/usePermit2Signature'
import { serializeQueryParams } from 'src/features/transactions/swap/utils'
import { SwapRouterNativeAssets } from 'src/utils/currencyId'

const DEFAULT_DEADLINE_S = 60 * 30 // 30 minutes in seconds

const protocols: string[] = ['v2', 'v3', 'mixed']

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
      // TODO: [MOB-3883] remove once routing api officially supports mobile
      // spoof origin to go around server permissions
      headers.set('Origin', config.uniswapAppUrl)
      headers.set('X-API-KEY', config.uniswapApiKey)
      return headers
    },
  }),
  endpoints: (build) => ({
    quote: build.query<
      TradeQuoteResult,
      {
        amount: string
        deadline?: number
        enableUniversalRouter: boolean
        fetchSimulatedGasLimit?: boolean
        recipient?: string
        slippageTolerance?: number
        tokenInAddress: string
        tokenInChainId: ChainId
        tokenOutAddress: string
        tokenOutChainId: ChainId
        type: 'exactIn' | 'exactOut'
        permitSignatureInfo?: PermitSignatureInfo | null
      }
    >({
      query: ({
        amount,
        deadline = DEFAULT_DEADLINE_S,
        enableUniversalRouter,
        fetchSimulatedGasLimit,
        recipient,
        permitSignatureInfo,
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
          enableUniversalRouter,
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
          // permit2 signature data if applicable
          ...(permitSignatureInfo
            ? {
                permitSignature: permitSignatureInfo.signature,
                permitAmount: BigNumber.from(
                  permitSignatureInfo.permitMessage.details.amount
                ).toString(),
                permitExpiration: BigNumber.from(
                  permitSignatureInfo.permitMessage.details.expiration
                ).toString(),
                permitSigDeadline: BigNumber.from(
                  permitSignatureInfo.permitMessage.sigDeadline
                ).toString(),
                permitNonce: BigNumber.from(
                  permitSignatureInfo.permitMessage.details.nonce
                ).toString(),
              }
            : {}),
        })}`,
      transformResponse: (result: QuoteResult, _, arg): TradeQuoteResult => {
        // TODO: [MOB-3897] we shouldn't rely on any of the request arguments and transform the data with only response data
        // Must figure out how to determine whether requested assets are native given the router always returns
        // wrapped token addresses
        const { tokenInAddress, tokenOutAddress, type, deadline, slippageTolerance } = arg
        const tradeType = type === 'exactIn' ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT
        const tokenInIsNative = Object.values(SwapRouterNativeAssets).includes(
          tokenInAddress as SwapRouterNativeAssets
        )
        const tokenOutIsNative = Object.values(SwapRouterNativeAssets).includes(
          tokenOutAddress as SwapRouterNativeAssets
        )
        const trade = transformQuoteToTrade(
          tokenInIsNative,
          tokenOutIsNative,
          tradeType,
          deadline,
          slippageTolerance,
          result
        )

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
