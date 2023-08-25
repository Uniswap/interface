import { QueryHookOptions } from '@apollo/client'
import { TradeType } from '@uniswap/sdk-core'
import { BigNumber } from 'ethers'
import { useMemo } from 'react'
import { serializeError } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { ChainId } from 'wallet/src/constants/chains'
import { MAX_AUTO_SLIPPAGE_TOLERANCE } from 'wallet/src/constants/transactions'
import { useRestQuery } from 'wallet/src/data/rest'
import { transformQuoteToTrade } from 'wallet/src/features/transactions/swap/routeUtils'
import { PermitSignatureInfo } from 'wallet/src/features/transactions/swap/usePermit2Signature'
import { SwapRouterNativeAssets } from 'wallet/src/utils/currencyId'
import { QuoteRequest, QuoteResponse, TradeQuoteResult } from './types'

const DEFAULT_DEADLINE_S = 60 * 30 // 30 minutes in seconds

const protocols: string[] = ['v2', 'v3', 'mixed']

// error string hardcoded in @uniswap/routing-api
export const SWAP_NO_ROUTE_ERROR = 'NO_ROUTE'
// error string hardcoded in @uniswap/api
// https://github.com/Uniswap/api/blob/main/bin/stacks/api-v1.ts#L234
export const API_RATE_LIMIT_ERROR = 'TOO_MANY_REQUESTS'

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
}

export function useQuoteQuery(
  request: TradeQuoteRequest | undefined,
  { pollInterval }: QueryHookOptions
): ReturnType<typeof useRestQuery<TradeQuoteResult>> {
  const params: QuoteRequest | undefined = useMemo(() => {
    if (!request) return undefined

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
      configs: [
        {
          protocols,
          routingType: 'CLASSIC',
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
    }
  }, [request])

  const result = useRestQuery<QuoteResponse, QuoteRequest | Record<string, never>>(
    '/v2/quote',
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
      logger.error(new Error('Error in Routing API response'), {
        tags: {
          file: 'routingApi',
          function: 'quote',
          error: serializeError(result.error.message),
        },
      })
    }

    if (result.data && !result.data.quote) {
      logger.error(new Error('Unexpected empty Routing API response'), {
        tags: {
          file: 'routingApi',
          function: 'quote',
        },
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
