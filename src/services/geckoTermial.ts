import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

type SearchResponse = {
  data: {
    id: string
    attributes: {
      pools: {
        address: string
        reserve_in_usd: string
        tokens: [{ symbol: string }, { symbol: string }]
        network: {
          identifier: string
        }
      }[]
    }
  }
}

interface CandleResponse {
  data: Array<{
    dt: string
    o: number
    h: number
    l: number
    c: number
    v: number
  }>
  meta?: {
    noData: boolean
  }
}

interface CandleParams {
  token_id: string
  pool_id: string
  resolution: number | string
  from: string | number
  to: string | number
  for_update: boolean
  currency: 'usd' | 'token'
  count_back?: number
}

interface Token {
  id: string
  attributes: {
    name: string
    symbol: string
  }
}

export interface PoolResponse {
  data: {
    id: string
    attributes: {
      address: string
      name: string
      base_token_id: string
    }
  }
  included: [Token, Token]
}

const geckoTerminalApi = createApi({
  reducerPath: 'geckoTerminalApi',
  baseQuery: fetchBaseQuery({
    // TODO(viet-nv): check prod env
    baseUrl: 'https://ks-proxy.dev.kyberengineering.io/geckoterminal',
  }),
  endpoints: builder => ({
    geckoTerminalSearch: builder.query<SearchResponse, string>({
      query: search => ({
        url: '/api/p1/search',
        params: {
          query: search,
        },
      }),
    }),

    getPoolDetail: builder.query<PoolResponse, { network: string; poolAddress: string }>({
      query: ({ network, poolAddress }) => ({
        url: `/api/p1/${network}/pools/${poolAddress}?include=tokens`,
      }),
    }),

    candelsticks: builder.query<CandleResponse, CandleParams>({
      query: params => ({
        url: '/contracts/1/candlesticks.json',
        params,
      }),
    }),
  }),
})

export const { useGeckoTerminalSearchQuery, useGetPoolDetailQuery, useLazyCandelsticksQuery } = geckoTerminalApi

export default geckoTerminalApi
