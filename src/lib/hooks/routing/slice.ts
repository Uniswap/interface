import { Web3Provider } from '@ethersproject/providers'
import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { Protocol } from '@uniswap/router-sdk'
import { ChainId } from '@uniswap/smart-order-router'
import { getClientSideQuote } from 'lib/hooks/routing/clientSideSmartOrderRouter'
import ms from 'ms.macro'
import { GetQuoteResult } from 'state/routing/types'

export const clientSideSORApi = createApi({
  reducerPath: 'clientSideSORApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '',
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
        params: {
          chainId: number
          provider: Web3Provider
        }
        config: {
          protocols: Protocol[]
          distributionPercent: number
        }
      }
    >({
      async queryFn(args, _api, _extraOptions) {
        let result
        try {
          const { params, config } = args
          result = await getClientSideQuote(args, params, config)
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

export const { useGetQuoteQuery } = clientSideSORApi
