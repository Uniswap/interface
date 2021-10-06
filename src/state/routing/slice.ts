import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as Comlink from 'comlink'
import { SupportedChainId } from 'constants/chains'
import qs from 'qs'
import { AppState } from 'state'
import { GetQuoteFunctionType } from 'worker/smartOrderRouter/router.worker'
import SmartOrderRouterWorker from 'worker-loader!worker/smartOrderRouter/router.worker'

import { GetQuoteResult } from './types'

let comlinkWorker: Comlink.Remote<GetQuoteFunctionType> | null = null

function getWorker() {
  return comlinkWorker ?? (comlinkWorker = Comlink.wrap<GetQuoteFunctionType>(new SmartOrderRouterWorker()))
}

export const routingApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.uniswap.org/v1/',
  }),
  endpoints: (build) => ({
    getQuote: build.query<
      GetQuoteResult,
      {
        tokenInAddress: string
        tokenInChainId: SupportedChainId
        tokenOutAddress: string
        tokenOutChainId: SupportedChainId
        amount: string
        type: 'exactIn' | 'exactOut'
      }
    >({
      async queryFn(args, { getState }, extraOptions, fetch) {
        const { tokenInAddress, tokenInChainId, tokenOutAddress, tokenOutChainId, amount, type } = args

        const useClientSideRouter: boolean = (getState() as AppState).user.userClientSideRouter

        const result: { data?: unknown; error?: unknown } = await (useClientSideRouter
          ? // TODO(judo): update worker when token list changes?
            getWorker().getQuote({
              type,
              chainId: tokenInChainId as number,
              // TODO(judo): decimals and symbols
              tokenIn: { address: tokenInAddress, chainId: tokenInChainId, decimals: 18 },
              tokenOut: { address: tokenOutAddress, chainId: tokenOutChainId, decimals: 18 },
              amount,
            })
          : fetch(`quote?${qs.stringify(args)}`))

        if (result.error) {
          throw result.error
        }

        return { data: result.data as GetQuoteResult }
      },
    }),
  }),
})

export const { useGetQuoteQuery } = routingApi
