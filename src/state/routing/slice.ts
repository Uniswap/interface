import { BaseProvider, JsonRpcProvider } from '@ethersproject/providers'
import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@uniswap/router-sdk'
import { ChainId } from '@uniswap/smart-order-router'
import { RPC_URLS } from 'constants/networks'
import { getClientSideQuote, toSupportedChainId } from 'lib/hooks/routing/clientSideSmartOrderRouter'
import ms from 'ms.macro'
import qs from 'qs'

import { GetQuoteResult } from './types'

export enum RouterPreference {
  API = 'api',
  CLIENT = 'client',
  PRICE = 'price',
}

const routerProviders = new Map<ChainId, BaseProvider>()
function getRouterProvider(chainId: ChainId): BaseProvider {
  const provider = routerProviders.get(chainId)
  if (provider) return provider

  const supportedChainId = toSupportedChainId(chainId)
  if (supportedChainId) {
    const provider = new JsonRpcProvider(RPC_URLS[supportedChainId])
    routerProviders.set(chainId, provider)
    return provider
  }

  throw new Error(`Router does not support this chain (chainId: ${chainId}).`)
}

const protocols: Protocol[] = [Protocol.V2, Protocol.V3, Protocol.MIXED]

const API_QUERY_PARAMS = {
  protocols: protocols.map((p) => p.toLowerCase()).join(','),
  // example other params
  // forceCrossProtocol: 'true',
  // minSplits: '5',
}
const CLIENT_QUERY_PARAMS = {}
const PRICE_QUERY_PARAMS = {}

export const routingApi = createApi({
  reducerPath: 'routingApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.uniswap.org/v1/',
  }),
  endpoints: (build) => ({
    getQuote: build.query<
      GetQuoteResult,
      {
        tokenInAddress: string
        tokenInChainId: ChainId
        tokenInDecimals: number
        tokenInSymbol?: string
        tokenOutAddress: string
        tokenOutChainId: ChainId
        tokenOutDecimals: number
        tokenOutSymbol?: string
        amount: string
        routerPreference: RouterPreference
        type: 'exactIn' | 'exactOut'
      }
    >({
      async queryFn(args, _api, _extraOptions, fetch) {
        const { tokenInAddress, tokenInChainId, tokenOutAddress, tokenOutChainId, amount, routerPreference, type } =
          args

        let result

        try {
          if (routerPreference === RouterPreference.API) {
            const query = qs.stringify({
              ...API_QUERY_PARAMS,
              tokenInAddress,
              tokenInChainId,
              tokenOutAddress,
              tokenOutChainId,
              amount,
              type,
            })
            result = await fetch(`quote?${query}`)
          } else {
            const chainId = args.tokenInChainId
            const provider = getRouterProvider(chainId)
            const params = {
              chainId,
              provider,
              ...(routerPreference === RouterPreference.PRICE ? PRICE_QUERY_PARAMS : CLIENT_QUERY_PARAMS),
            }
            result = await getClientSideQuote(args, params, { protocols })
          }

          return { data: result.data as GetQuoteResult }
        } catch (e) {
          // TODO: fall back to client-side quoter when auto router fails.
          // deprecate 'legacy' v2/v3 routers first.
          return { error: e as FetchBaseQueryError }
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
