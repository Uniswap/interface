import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { providers } from 'ethers'
import { config } from 'src/config'
import { GasFeeResponse } from 'src/features/gas/types'

export const gasApi = createApi({
  reducerPath: 'gasApi',
  baseQuery: fetchBaseQuery({
    baseUrl: config.uniswapGasServiceUrl,
    prepareHeaders: (headers) => {
      // TODO remove once gas service supports mobile origin URL
      headers.set('Origin', config.uniswapAppUrl)
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
