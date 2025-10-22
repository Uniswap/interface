import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@uniswap/router-sdk'
import ms from 'ms'
import {
  ClassicAPIConfig,
  GetQuoteArgs,
  INTERNAL_ROUTER_PREFERENCE_PRICE,
  QuoteIntent,
  QuoteMethod,
  QuoteState,
  RouterPreference,
  RoutingConfig,
  TradeResult,
  UniswapXConfig,
  UniswapXPriorityOrdersConfig,
  UniswapXv2Config,
  UniswapXv3Config,
  URAQuoteResponse,
  URAQuoteType,
} from 'state/routing/types'
import { isExactInput, transformQuoteToTrade } from 'state/routing/utils'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logSwapQuoteFetch } from 'uniswap/src/features/transactions/swap/analytics'
import { logger } from 'utilities/src/logger/logger'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'

const UNISWAP_GATEWAY_DNS_URL = process.env.REACT_APP_UNISWAP_GATEWAY_DNS
if (UNISWAP_GATEWAY_DNS_URL === undefined) {
  throw new Error(`UNISWAP_GATEWAY_DNS_URL must be defined environment variables`)
}

const protocols: Protocol[] = [Protocol.V2, Protocol.V3, Protocol.MIXED]

// routing API quote query params: https://github.com/Uniswap/routing-api/blob/main/lib/handlers/quote/schema/quote-schema.ts
const DEFAULT_QUERY_PARAMS = {
  // this should be removed once BE fixes issue where enableUniversalRouter is required for fees to work
  enableUniversalRouter: true,
}

function getRoutingAPIConfig(args: GetQuoteArgs): RoutingConfig {
  const { account, uniswapXForceSyntheticQuotes, routerPreference, protocolPreferences, routingType } = args

  const uniswapX: UniswapXConfig = {
    useSyntheticQuotes: uniswapXForceSyntheticQuotes,
    swapper: account,
    routingType: URAQuoteType.DUTCH_V1,
  }

  const uniswapXPriorityOrders: UniswapXPriorityOrdersConfig = {
    routingType: URAQuoteType.PRIORITY,
    swapper: account,
  }

  const uniswapXv2: UniswapXv2Config = {
    useSyntheticQuotes: uniswapXForceSyntheticQuotes,
    swapper: account,
    routingType: URAQuoteType.DUTCH_V2,
  }

  const uniswapXv3: UniswapXv3Config = {
    useSyntheticQuotes: uniswapXForceSyntheticQuotes,
    swapper: account,
    routingType: URAQuoteType.DUTCH_V3,
  }

  const classic: ClassicAPIConfig = {
    ...DEFAULT_QUERY_PARAMS,
    protocols: protocolPreferences && protocolPreferences.length > 0 ? protocolPreferences : protocols,
    routingType: URAQuoteType.CLASSIC,
    recipient: account,
    enableFeeOnTransferFeeFetching: true,
  }

  if (
    // If the user has opted out of UniswapX during the opt-out transition period, we should respect that preference and only request classic quotes.
    routerPreference === RouterPreference.API ||
    routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE ||
    routingType === URAQuoteType.CLASSIC
  ) {
    return [classic]
  }

  let uniswapXConfig: UniswapXConfig | UniswapXPriorityOrdersConfig | UniswapXv2Config | UniswapXv3Config
  switch (routingType) {
    case URAQuoteType.PRIORITY:
      uniswapXConfig = uniswapXPriorityOrders
      break
    case URAQuoteType.DUTCH_V3:
      uniswapXConfig = uniswapXv3
      break
    case URAQuoteType.DUTCH_V2:
      uniswapXConfig = uniswapXv2
      break
    default:
      uniswapXConfig = uniswapX
  }

  return [uniswapXConfig, classic]
}

export const routingApi = createApi({
  reducerPath: 'routingApi',
  baseQuery: fetchBaseQuery(),
  endpoints: (build) => ({
    getQuote: build.query<TradeResult, GetQuoteArgs>({
      // eslint-disable-next-line max-params
      async queryFn(args, _api, _extraOptions, fetch) {
        logSwapQuoteFetch({
          chainId: args.tokenInChainId,
          isUSDQuote: args.routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE,
        })
        const {
          tokenInAddress: tokenIn,
          tokenInChainId,
          tokenOutAddress: tokenOut,
          tokenOutChainId,
          amount,
          tradeType,
          sendPortionEnabled,
        } = args
        const requestBody = {
          tokenInChainId,
          tokenIn,
          tokenOutChainId,
          tokenOut,
          amount,
          sendPortionEnabled,
          type: isExactInput(tradeType) ? 'EXACT_INPUT' : 'EXACT_OUTPUT',
          intent: args.routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE ? QuoteIntent.Pricing : QuoteIntent.Quote,
          configs: getRoutingAPIConfig(args),
          useUniswapX: args.routerPreference === RouterPreference.X,
          swapper: args.account,
        }
        try {
          const response = await fetch({
            method: 'POST',
            url: `${UNISWAP_GATEWAY_DNS_URL}/quote`,
            body: JSON.stringify(requestBody),
            headers: {
              'x-request-source': REQUEST_SOURCE,
            },
          })
          if (response.error) {
            try {
              // cast as any here because we do a runtime check on it being an object before indexing into .errorCode
              const errorData = response.error.data as { errorCode?: string; detail?: string }
              // NO_ROUTE should be treated as a valid response to prevent retries.
              if (
                typeof errorData === 'object' &&
                (errorData.errorCode === 'NO_ROUTE' || errorData.detail === 'No quotes available')
              ) {
                sendAnalyticsEvent(InterfaceEventName.NoQuoteReceivedFromRoutingAPI, {
                  requestBody,
                  response,
                  routerPreference: args.routerPreference,
                })
                return {
                  data: { state: QuoteState.NOT_FOUND },
                }
              }
            } catch {
              throw response.error
            }
          }

          const uraQuoteResponse = response.data as URAQuoteResponse
          const tradeResult = await transformQuoteToTrade({
            args,
            data: uraQuoteResponse,
            quoteMethod: QuoteMethod.ROUTING_API,
          })
          return { data: { ...tradeResult } }
        } catch (error: any) {
          logger.warn(
            'routing/slice',
            'queryFn',
            `GetQuote failed on Unified Routing API, falling back to client: ${
              error?.message ?? error?.detail ?? error
            }`,
          )
        }

        return {
          data: { state: QuoteState.NOT_FOUND },
        }
      },
      keepUnusedDataFor: ms(`10s`),
      extraOptions: {
        maxRetries: 0,
      },
    }),
  }),
})

export const { useGetQuoteQuery } = routingApi
export const useGetQuoteQueryState = routingApi.endpoints.getQuote.useQueryState
