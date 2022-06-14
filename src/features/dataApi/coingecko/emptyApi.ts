import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { config } from 'src/config'

// initialize an empty api service that we'll inject endpoints into later as needed
export const emptyApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: config.coingeckoApiUrl,
  }),
  endpoints: () => ({}),
})
