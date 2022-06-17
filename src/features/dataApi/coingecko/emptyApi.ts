import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { REHYDRATE } from 'redux-persist'
import { config } from 'src/config'

// initialize an empty api service that we'll inject endpoints into later as needed
export const emptyApi = createApi({
  reducerPath: 'coingeckoApi',
  baseQuery: fetchBaseQuery({
    baseUrl: config.coingeckoApiUrl,
  }),
  endpoints: () => ({}),
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE) {
      return action.payload?.[reducerPath]
    }
  },
})
