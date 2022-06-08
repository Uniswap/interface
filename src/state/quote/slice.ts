import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
  retry,
} from '@reduxjs/toolkit/query/react'
import { SupportedChainId } from 'constants/chains'
import qs from 'qs'
import { AppState } from 'state'

import { GetQuote0xResult } from './types'

// List of supported 0x protocols
export const CHAIN_0x_URL: Record<number, string> = {
  [SupportedChainId.MAINNET]: 'https://api.0x.org/swap/v1',
  [SupportedChainId.ROPSTEN]: 'https://ropsten.api.0x.org/swap/v1',
  [SupportedChainId.OPTIMISM]: 'https://optimism.api.0x.org/swap/v1',
  [SupportedChainId.POLYGON]: 'https://polygon.api.0x.org/swap/v1',
}

const dynamicBase0xQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const chainId = (api.getState() as AppState).application.chainId

  const queryUrl = chainId ? CHAIN_0x_URL[chainId] : undefined

  // gracefully handle scenarios where data to generate the URL is missing
  if (!queryUrl) {
    return retry.fail({
      error: {
        status: 400,
        statusText: 'Bad Request',
        data: 'No project ID received',
      },
    })
  }

  const result = await fetchBaseQuery({ baseUrl: queryUrl })(args, api, extraOptions)
  return result
}

export const routingApi0x = createApi({
  reducerPath: 'routingApi0x',
  baseQuery: dynamicBase0xQuery,
  endpoints: (build) => ({
    getSwap0x: build.query<
      GetQuote0xResult,
      {
        chainId: string
        queryArg: {
          sellToken: string
          buyToken: string
          sellAmount: string | null
          buyAmount: string | null
          slippagePercentage: string
          takerAddress: string | null
          feeRecipient: string | null
          buyTokenPercentageFee: string | null
          skipValidation: boolean
        }
      }
    >({
      query: (args) => {
        const { queryArg } = args
        return `/quote?${qs.stringify(queryArg, { skipNulls: true })}`
      },
    }),
  }),
})

export const { useGetSwap0xQuery } = routingApi0x
