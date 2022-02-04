import { JsonRpcProvider } from '@ethersproject/providers'
import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@uniswap/router-sdk'
import { ChainId } from '@uniswap/smart-order-router'
import { AlphaRouterParams } from '@uniswap/smart-order-router'
import { SupportedChainId } from 'constants/chains'
import { INFURA_NETWORK_URLS } from 'constants/infura'
import { AUTO_ROUTER_SUPPORTED_CHAINS, getClientSideQuote } from 'lib/hooks/routing/clientSideSmartOrderRouter'
import ms from 'ms.macro'
import qs from 'qs'

import { GetQuoteResult } from './types'

const routerParams = AUTO_ROUTER_SUPPORTED_CHAINS.reduce<{ [chainId in SupportedChainId]?: AlphaRouterParams }>(
  (params, chainId) => ({
    ...params,
    [chainId]: {
      chainId,
      provider: new JsonRpcProvider(INFURA_NETWORK_URLS[chainId]),
    },
  }),
  {}
)

const protocols: Protocol[] = [Protocol.V2, Protocol.V3]

const DEFAULT_QUERY_PARAMS = {
  protocols: protocols.map((p) => p.toLowerCase()).join(','),
  // example other params
  // forceCrossProtocol: 'true',
  // minSplits: '5',
}

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
        useClientSideRouter: boolean // included in key to invalidate on change
        type: 'exactIn' | 'exactOut'
      }
    >({
      async queryFn(args, _api, _extraOptions, fetch) {
        const { tokenInAddress, tokenInChainId, tokenOutAddress, tokenOutChainId, amount, useClientSideRouter, type } =
          args

        let result

        try {
          if (useClientSideRouter) {
            const chainId = args.tokenInChainId
            const params = routerParams[chainId]
            if (!params) throw new Error(`Router does not support this chain (chainId: ${chainId}).`)
            result = await getClientSideQuote(args, params, { protocols })
          } else {
            const query = qs.stringify({
              ...DEFAULT_QUERY_PARAMS,
              tokenInAddress,
              tokenInChainId,
              tokenOutAddress,
              tokenOutChainId,
              amount,
              type,
            })
            result = await fetch(`quote?${query}`)
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
