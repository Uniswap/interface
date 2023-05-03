import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { providers } from 'ethers'
import { GasFeeResponse } from './types'

export const gasApi = createApi({
  reducerPath: 'gasApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.UNISWAP_API_BASE_URL}/v1/gas-fee`,
    prepareHeaders: (headers) => {
      // TODO: [MOB-3883] remove once gas service supports mobile origin URL
      headers.set('Origin', process.env.UNISWAP_APP_URL ?? '')
      headers.set('X-API-KEY', process.env.UNISWAP_API_KEY ?? '')
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
