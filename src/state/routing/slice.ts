import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@uniswap/router-sdk'
import { TradeType } from '@uniswap/sdk-core'
import { AlphaRouter, ChainId } from '@uniswap/smart-order-router'
import { isUniswapXSupportedChain } from 'constants/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { getClientSideQuote, toSupportedChainId } from 'lib/hooks/routing/clientSideSmartOrderRouter'
import ms from 'ms.macro'
import { trace } from 'tracing/trace'

import { RoutingConfig, SwapRouterNativeAssets, TradeResult, URAQuoteResponse, URAQuoteType } from './types'
import { isExactInput, transformRoutesToTrade } from './utils'

export enum RouterPreference {
  X = 'uniswapx',
  API = 'api',
  CLIENT = 'client',
}

// This is excluded from `RouterPreference` enum because it's only used
// internally for token -> USDC trades to get a USD value.
export const INTERNAL_ROUTER_PREFERENCE_PRICE = 'price' as const

const routers = new Map<ChainId, AlphaRouter>()
function getRouter(chainId: ChainId): AlphaRouter {
  const router = routers.get(chainId)
  if (router) return router

  const supportedChainId = toSupportedChainId(chainId)
  if (supportedChainId) {
    const provider = RPC_PROVIDERS[supportedChainId]
    const router = new AlphaRouter({ chainId, provider })
    routers.set(chainId, router)
    return router
  }

  throw new Error(`Router does not support this chain (chainId: ${chainId}).`)
}

const CLIENT_PARAMS = {
  protocols: [Protocol.V2, Protocol.V3, Protocol.MIXED],
}

export interface GetQuoteArgs {
  tokenInAddress: string
  tokenInChainId: ChainId
  tokenInDecimals: number
  tokenInSymbol?: string
  tokenOutAddress: string
  tokenOutChainId: ChainId
  tokenOutDecimals: number
  tokenOutSymbol?: string
  amount: string
  account?: string
  routerPreference: RouterPreference | typeof INTERNAL_ROUTER_PREFERENCE_PRICE
  tradeType: TradeType
}

enum QuoteState {
  SUCCESS = 'Success',
  NOT_FOUND = 'Not found',
}

const protocols: Protocol[] = [Protocol.V2, Protocol.V3, Protocol.MIXED]

// routing API quote query params: https://github.com/Uniswap/routing-api/blob/main/lib/handlers/quote/schema/quote-schema.ts
const DEFAULT_QUERY_PARAMS = {
  protocols,
}

type GetAPIOrUniswapXQuoteArgs = Omit<GetQuoteArgs, 'routerPreference'> & {
  routerPreference: RouterPreference.API | RouterPreference.X
}

function isApiOrUniswapXQuote(args: GetQuoteArgs): args is GetAPIOrUniswapXQuoteArgs {
  return args.routerPreference === RouterPreference.API || args.routerPreference === RouterPreference.X
}

function getConfigByRouterPreference(args: GetAPIOrUniswapXQuoteArgs): RoutingConfig {
  const { account, routerPreference, tradeType, tokenOutAddress, tokenInAddress, tokenInChainId } = args
  const goudaDutchLimit = {
    offerer: account,
    // Protocol supports swap+send to different destination address, but
    // for now recipient === offerer
    recipient: account,
    routingType: URAQuoteType.DUTCH_LIMIT,
  }

  const classic = {
    ...DEFAULT_QUERY_PARAMS,
    routingType: URAQuoteType.CLASSIC,
  }

  const tokenInIsNative = Object.values(SwapRouterNativeAssets).includes(tokenInAddress as SwapRouterNativeAssets)
  const tokenOutIsNative = Object.values(SwapRouterNativeAssets).includes(tokenOutAddress as SwapRouterNativeAssets)

  // TODO (Gouda): Update this comment (polygon tbd, can you only do UniswapX?)
  // UniswapX doesn't support native out tokens, exact-out, or non-mainnet/polygon trades (yet),
  // so even if the user has selected ONLY UniswapX as their router preference, force them to receive a Classic quote.
  if (
    routerPreference === RouterPreference.API ||
    // TODO (Gouda): enable ETH input flow
    tokenInIsNative ||
    tokenOutIsNative ||
    tradeType === TradeType.EXACT_OUTPUT ||
    !isUniswapXSupportedChain(tokenInChainId)
  ) {
    return [classic]
  }

  return [goudaDutchLimit, classic]
}

export const routingApi = createApi({
  reducerPath: 'routingApi',
  baseQuery: fetchBaseQuery({
    // TODO (Gouda): Update this with final API url
    baseUrl: 'https://4uemel8n4g.execute-api.us-east-2.amazonaws.com/prod',
  }),
  endpoints: (build) => ({
    getQuote: build.query<TradeResult, GetQuoteArgs>({
      async onQueryStarted(args: GetQuoteArgs, { queryFulfilled }) {
        trace(
          'quote',
          async ({ setTraceError, setTraceStatus }) => {
            try {
              await queryFulfilled
            } catch (error: unknown) {
              if (error && typeof error === 'object' && 'error' in error) {
                const queryError = (error as Record<'error', FetchBaseQueryError>).error
                if (typeof queryError.status === 'number') {
                  setTraceStatus(queryError.status)
                }
                setTraceError(queryError)
              } else {
                throw error
              }
            }
          },
          {
            data: {
              ...args,
              isPrice: args.routerPreference === INTERNAL_ROUTER_PREFERENCE_PRICE,
              isAutoRouter: args.routerPreference === RouterPreference.API,
            },
          }
        )
      },
      async queryFn(args: GetQuoteArgs, _api, _extraOptions, fetch) {
        if (isApiOrUniswapXQuote(args)) {
          try {
            const { tokenInAddress, tokenInChainId, tokenOutAddress, tokenOutChainId, amount, tradeType } = args
            const type = isExactInput(tradeType) ? 'EXACT_INPUT' : 'EXACT_OUTPUT'

            const requestBody = {
              tokenInChainId,
              tokenIn: tokenInAddress,
              tokenOutChainId,
              tokenOut: tokenOutAddress,
              amount,
              type,
              configs: getConfigByRouterPreference(args),
            }

            const response = await fetch({
              method: 'POST',
              url: '/quote',
              body: JSON.stringify(requestBody),
            })

            if (response.error) {
              try {
                // cast as any here because we do a runtime check on it being an object before indexing into .errorCode
                const errorData = response.error.data as any
                // NO_ROUTE should be treated as a valid response to prevent retries.
                if (typeof errorData === 'object' && errorData?.errorCode === 'NO_ROUTE') {
                  return { data: { state: QuoteState.NOT_FOUND } }
                }
              } catch {
                throw response.error
              }
            }

            const uraQuoteResponse = response.data as URAQuoteResponse
            const tradeResult = transformRoutesToTrade(args, uraQuoteResponse)

            return { data: tradeResult }
          } catch (error: any) {
            console.warn(
              `GetQuote failed on Unified Routing API, falling back to client: ${
                error?.message ?? error?.detail ?? error
              }`
            )
          }
        }
        try {
          const router = getRouter(args.tokenInChainId)
          const quoteResult = await getClientSideQuote(args, router, CLIENT_PARAMS)
          if (quoteResult.state === QuoteState.SUCCESS) {
            return { data: transformRoutesToTrade(args, { quote: quoteResult.data, routing: URAQuoteType.CLASSIC }) }
          } else {
            return { data: quoteResult }
          }
        } catch (error: any) {
          console.warn(`GetQuote failed on client: ${error}`)
          return { error: { status: 'CUSTOM_ERROR', error: error?.detail ?? error?.message ?? error } }
        }
      },
      keepUnusedDataFor: ms`10s`,
      extraOptions: {
        maxRetries: 0,
      },
    }),
  }),
})

export const { useGetQuoteQuery } = routingApi
