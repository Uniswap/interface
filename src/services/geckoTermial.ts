import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { Bar } from 'components/TradingViewChart/charting_library/charting_library'

type SearchResponse = {
  data: PoolResponse[]
}

type OHLCV = [number, number, number, number, number, number]

interface CandleResponse {
  data: {
    attributes: {
      ohlcv_list: [
        number, // timestamp
        number, // open
        number, // high
        number, // low
        number, // close
        number, // volume
      ]
    }
  }
}

interface CandleParams {
  network: string
  poolAddress: string
  timeframe: 'day' | 'hour' | 'minute'
  timePeriod: string | number
  token: 'base' | 'quote'
  before_timestamp: number
  limit: number
}

export interface PoolResponse {
  id: string
  attributes: {
    address: string
    base_token_price_usd: string
    name: string
    quote_token_price_usd: string
    token_price_usd: string
  }
  relationships: {
    dex: {
      data: {
        id: string
        type: 'dex'
      }
    }
    base_token: {
      data: {
        id: string
        type: 'token'
      }
    }
    quote_token: {
      data: {
        id: string
        type: 'token'
      }
    }
  }
}

export const transformData = (res: CandleResponse['data']['attributes']['ohlcv_list']): Bar[] => {
  const tmp = JSON.parse(JSON.stringify(res || []))
  tmp.sort((a: OHLCV, b: OHLCV) => a[0] - b[0])

  return tmp.map((item: OHLCV) => {
    return {
      time: item[0] * 1000,
      open: item[1],
      high: item[2],
      low: item[3],
      close: item[4],
      volume: item[5],
    }
  })
}
const geckoTerminalApi = createApi({
  reducerPath: 'geckoTerminalApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://proxy.kyberswap.com/geckoterminal/api/v2',
    headers: {
      Accept: 'application/json;version=20230302',
    },
  }),
  endpoints: builder => ({
    tokenTopPools: builder.query<SearchResponse, { network: string; address: string }>({
      query: ({ network, address }) => ({
        url: `/networks/${network}/tokens/${address}/pools`,
      }),
    }),

    ohlcv: builder.query<CandleResponse, CandleParams>({
      query: ({ network, poolAddress, timeframe, timePeriod, token, before_timestamp, limit }) => ({
        url: `/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}`,
        params: {
          aggregate: timePeriod,
          currency: 'token',
          token,
          before_timestamp,
          limit,
          include: 'base_token',
        },
      }),
    }),
  }),
})

export const { useTokenTopPoolsQuery, useLazyOhlcvQuery } = geckoTerminalApi

export default geckoTerminalApi
