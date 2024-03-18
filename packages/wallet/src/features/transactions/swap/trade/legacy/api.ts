import { ApolloError, QueryHookOptions } from '@apollo/client'
import { TradeType } from '@uniswap/sdk-core'
import { BigNumber } from 'ethers'
import { useMemo } from 'react'
import { ROUTING_API_PATH } from 'uniswap/src/data/constants'
import { useRestQuery } from 'uniswap/src/data/rest'
import { GqlResult } from 'uniswap/src/data/types'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS, inXMinutesUnix } from 'utilities/src/time/time'
import { ChainId } from 'wallet/src/constants/chains'
import { MAX_AUTO_SLIPPAGE_TOLERANCE } from 'wallet/src/constants/transactions'
import { transformQuoteToTrade } from 'wallet/src/features/transactions/swap/trade/legacy/routeUtils'
import {
  QuoteRequest,
  QuoteResponse,
  TradeQuoteResult,
} from 'wallet/src/features/transactions/swap/trade/legacy/types'
import {
  DEFAULT_SWAP_VALIDITY_TIME_MINS,
  SWAP_QUOTE_POLL_INTERVAL_MS,
} from 'wallet/src/features/transactions/swap/trade/tradingApi/hooks/useTradingApiTrade'
import { PermitSignatureInfo } from 'wallet/src/features/transactions/swap/usePermit2Signature'
import { SwapRouterNativeAssets } from 'wallet/src/utils/currencyId'

const protocols: string[] = ['v2', 'v3', 'mixed']

// error strings hardcoded in @uniswap/unified-routing-api
// https://github.com/Uniswap/unified-routing-api/blob/020ea371a00d4cc25ce9f9906479b00a43c65f2c/lib/util/errors.ts#L4
export const SWAP_QUOTE_ERROR = 'QUOTE_ERROR'

// client side error code for when the api returns an empty response
export const NO_QUOTE_DATA = 'NO_QUOTE_DATA'

export const API_RATE_LIMIT_ERROR = 'TOO_MANY_REQUESTS'

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
  { pollInterval }: Pick<QueryHookOptions, 'pollInterval'>
): GqlResult<TradeQuoteResult> {
  const params: QuoteRequest | undefined = useMemo(() => {
    if (!request) {
      return undefined
    }

    const {
      amount,
      deadline = DEFAULT_SWAP_VALIDITY_TIME_MINS * 60, // What router calls `deadline` is an offset interval expressed in seconds NOT a unix timestamp
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

  const internalPollInterval = pollInterval ?? SWAP_QUOTE_POLL_INTERVAL_MS

  const result = useRestQuery<QuoteResponse, QuoteRequest | Record<string, never>>(
    ROUTING_API_PATH,
    params ?? {},
    ['quote', 'routing'],
    {
      pollInterval: internalPollInterval,
      // We set the `ttlMs` to 15 seconds longer than the poll interval so that there's more than enough time for a refetch to complete before we clear the stale data.
      // If the user loses internet connection (or leaves the app and comes back) for longer than this,
      // then we clear stale data and show a big loading spinner in the swap review screen.
      ttlMs: internalPollInterval + ONE_SECOND_MS * 15,
      clearIfStale: true,
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

      const { slippageTolerance, deadline } = params?.configs[0] ?? {}

      const txDeadlineOffsetInMins = deadline
        ? Math.round(deadline / 60)
        : DEFAULT_SWAP_VALIDITY_TIME_MINS

      const trade = transformQuoteToTrade(
        tokenInIsNative,
        tokenOutIsNative,
        tradeType,
        inXMinutesUnix(txDeadlineOffsetInMins),
        slippageTolerance,
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
    params,
  ])
}
