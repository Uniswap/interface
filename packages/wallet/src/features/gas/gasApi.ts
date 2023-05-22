import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { providers } from 'ethers'
import { config } from 'wallet/src/config'
import { uniswapUrls } from 'wallet/src/constants/urls'

import { GasFeeResponse } from './types'

export const gasApi = createApi({
  reducerPath: 'gasApi',
  baseQuery: fetchBaseQuery({
    baseUrl: uniswapUrls.gasServiceUrl,
    prepareHeaders: (headers) => {
      // TODO: [MOB-3883] remove once gas service supports mobile origin URL
      headers.set('Origin', config.uniswapAppUrl ?? '')
      headers.set('X-API-KEY', config.uniswapApiKey ?? '')
      return headers
    },
  }),
  endpoints: (builder) => ({
    gasFee: builder.query<GasFeeResponse, providers.TransactionRequest>({
      query: (transaction: providers.TransactionRequest) => ({
        url: '/',
        body: transaction,
        method: 'POST',
      }),
    }),
  }),
})

export const { useGasFeeQuery } = gasApi
