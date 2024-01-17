import { ApolloError, QueryHookOptions } from '@apollo/client'
import { TradeType } from '@uniswap/sdk-core'
import { BigNumber } from 'ethers'
import { useMemo } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { ChainId } from 'wallet/src/constants/chains'
import { MAX_AUTO_SLIPPAGE_TOLERANCE } from 'wallet/src/constants/transactions'
import { useRestQuery } from 'wallet/src/data/rest'
import { GqlResult } from 'wallet/src/features/dataApi/types'
import { transformQuoteToTrade } from 'wallet/src/features/transactions/swap/routeUtils'
import { PermitSignatureInfo } from 'wallet/src/features/transactions/swap/usePermit2Signature'
import { SwapRouterNativeAssets } from 'wallet/src/utils/currencyId'
import { QuoteRequest, QuoteResponse, TradeQuoteResult } from './types'

const DEFAULT_DEADLINE_S = 60 * 30 // 30 minutes in seconds

const protocols: string[] = ['v2', 'v3', 'mixed']

// error strings hardcoded in @uniswap/unified-routing-api
// https://github.com/Uniswap/unified-routing-api/blob/020ea371a00d4cc25ce9f9906479b00a43c65f2c/lib/util/errors.ts#L4
export const SWAP_QUOTE_ERROR = 'QUOTE_ERROR'

// client side error code for when the api returns an empty response
export const NO_QUOTE_DATA = 'NO_QUOTE_DATA'

export const API_RATE_LIMIT_ERROR = 'TOO_MANY_REQUESTS'

export const ROUTING_API_PATH = '/v2/quote'

export enum RoutingIntent {
  Pricing = 'pricing',
  Quote = 'quote',
}

export interface TradeQuoteRequest {
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
  loggingProperties: {
    isUSDQuote?: boolean
  }
  sendPortionEnabled?: boolean
  intent: RoutingIntent
}

export function useQuoteQuery(
  request: TradeQuoteRequest | undefined,
  { pollInterval }: QueryHookOptions
): GqlResult<TradeQuoteResult> {
  const params: QuoteRequest | undefined = useMemo(() => {
    if (!request) {
      return undefined
    }

    const {
      amount,
      deadline = DEFAULT_DEADLINE_S,
      enableUniversalRouter,
      fetchSimulatedGasLimit,
      recipient,
      permitSignatureInfo,
      slippageTolerance = MAX_AUTO_SLIPPAGE_TOLERANCE,
      tokenInAddress,
      tokenInChainId,
      tokenOutAddress,
      tokenOutChainId,
      type,
      sendPortionEnabled,
    } = request

    const recipientParams = recipient
      ? {
          recipient,
          slippageTolerance,
          deadline,
        }
      : undefined

    const simulatedParams =
      recipient && fetchSimulatedGasLimit ? { simulateFromAddress: recipient } : undefined

    // permit2 signature data if applicable
    const permit2Params = permitSignatureInfo
      ? {
          permitSignature: permitSignatureInfo.signature,
          permitAmount: BigNumber.from(permitSignatureInfo.permitMessage.details.amount).toString(),
          permitExpiration: BigNumber.from(
            permitSignatureInfo.permitMessage.details.expiration
          ).toString(),
          permitSigDeadline: BigNumber.from(
            permitSignatureInfo.permitMessage.sigDeadline
          ).toString(),
          permitNonce: BigNumber.from(permitSignatureInfo.permitMessage.details.nonce).toString(),
        }
      : undefined

    return {
      tokenInChainId,
      tokenIn: tokenInAddress,
      tokenOutChainId,
      tokenOut: tokenOutAddress,
      amount,
      type: type === 'exactIn' ? 'EXACT_INPUT' : 'EXACT_OUTPUT',
      slippageTolerance,
      configs: [
        {
          protocols,
          routingType: 'CLASSIC',
          enableFeeOnTransferFeeFetching: true,
          // Quotes sometimes fail in the api when universal router is enabled, disable for USD quotes
          // https://linear.app/uniswap/issue/MOB-1068/update-pricing-request-for-usd-quotes
          enableUniversalRouter: request.loggingProperties.isUSDQuote
            ? false
            : enableUniversalRouter,
          ...recipientParams,
          ...simulatedParams,
          ...permit2Params,
        },
      ],
      // We want to either send `true` or nothing,
      // because we do not want to expose this field until it's enabled
      ...(sendPortionEnabled ? { sendPortionEnabled: true } : {}),
    }
  }, [request])

  const result = useRestQuery<QuoteResponse, QuoteRequest | Record<string, never>>(
    ROUTING_API_PATH,
    params ?? {},
    ['quote', 'routing'],
    {
      pollInterval,
      ttlMs: ONE_MINUTE_MS,
      skip: !request,
      notifyOnNetworkStatusChange: true,
    }
  )

  return useMemo(() => {
    if (result.error && request?.loggingProperties?.isUSDQuote) {
      logger.error(result.error, { tags: { file: 'routingApi', function: 'quote' } })
    }

    if (result.data && !result.data.quote) {
      logger.error(new Error('Unexpected empty Routing API response'), {
        tags: { file: 'routingApi', function: 'quote' },
        extra: {
          quoteRequestParams: params,
        },
      })
    }

    if (result.data?.quote) {
      const tradeType = request?.type === 'exactIn' ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT
      const tokenInIsNative = Object.values(SwapRouterNativeAssets).includes(
        request?.tokenInAddress as SwapRouterNativeAssets
      )
      const tokenOutIsNative = Object.values(SwapRouterNativeAssets).includes(
        request?.tokenOutAddress as SwapRouterNativeAssets
      )
      const trade = transformQuoteToTrade(
        tokenInIsNative,
        tokenOutIsNative,
        tradeType,
        request?.deadline,
        request?.slippageTolerance,
        result.data.quote
      )

      // If `transformQuoteToTrade` returns a `null` trade, it means we have a non-null quote, but no routes.
      // Manually match the api quote error.
      if (!trade) {
        return {
          ...result,
          data: undefined,
          error: new ApolloError({
            errorMessage: SWAP_QUOTE_ERROR,
          }),
        }
      }

      return {
        ...result,
        data: {
          trade,
          simulationError: result.data.quote.simulationError,
          gasUseEstimate: result.data.quote.gasUseEstimate,
          timestamp: Date.now(),
        },
      }
    }

    // MOB(1193): Better handle Apollo 404s
    // https://github.com/apollographql/apollo-link-rest/pull/142/files#diff-018e2012bf1dae58fa1e87509b038abf51ace54994e63239343d717fb9a2d037R995
    // apollo-link-rest swallows 404 response errors, and instead just returns null data
    // Until we can parse response errors correctly, just manually create error.
    if (result.data === null && !result.error) {
      return {
        ...result,
        data: undefined,
        error: new ApolloError({
          errorMessage: NO_QUOTE_DATA,
        }),
      }
    }

    return { ...result, data: undefined }
  }, [
    result,
    request?.loggingProperties?.isUSDQuote,
    request?.type,
    request?.tokenInAddress,
    request?.tokenOutAddress,
    request?.deadline,
    request?.slippageTolerance,
    params,
  ])
}
