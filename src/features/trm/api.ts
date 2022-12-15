import { createApi, fetchBaseQuery, skipToken } from '@reduxjs/toolkit/query/react'
import { config } from 'src/config'
import { uniswapUrls } from 'src/constants/urls'

type ScreenResponse = {
  block: boolean
}

export const trmApi = createApi({
  reducerPath: 'trmApi',
  baseQuery: fetchBaseQuery({
    baseUrl: uniswapUrls.trmUrl,
    prepareHeaders: (headers) => {
      // TODO: [MOB-3883] remove once routing api officially supports mobile
      // spoof origin to go around server permissions
      headers.set('Origin', config.uniswapAppUrl)
      return headers
    },
  }),
  endpoints: (builder) => ({
    trm: builder.query<ScreenResponse, string>({
      query: (address: string) => ({
        url: '/',
        body: { address },
        method: 'POST',
      }),
    }),
  }),
})

const { useTrmQuery, usePrefetch } = trmApi
export const useTrmPrefetch = () => usePrefetch('trm')

/** Calls the TRM screen query if there is a defined non-readonly account. */
export function useTrmQueryResult(accountAddress?: string | undefined, isViewOnly = false) {
  return useTrmQuery(accountAddress && !isViewOnly ? accountAddress : skipToken)
}
