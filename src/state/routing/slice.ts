import { QueryReturnValue } from '@reduxjs/toolkit/dist/query/baseQueryTypes'
import { createApi, fetchBaseQuery, FetchBaseQueryError, FetchBaseQueryMeta } from '@reduxjs/toolkit/query/react'
import * as Comlink from 'comlink'
import { SupportedChainId } from 'constants/chains'
import qs from 'qs'
import { AppState } from 'state'
import { GetQuoteWorkerType } from 'worker/smartOrderRouter/worker'
import Worker from 'worker-loader!worker/smartOrderRouter/worker'

import { GetQuoteResult } from './types'

let comlinkWorker: Comlink.Remote<GetQuoteWorkerType> | null = null

function getWorker() {
  return comlinkWorker ??
    (comlinkWorker = (Comlink.wrap<GetQuoteWorkerType>(new Worker())))
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
      async queryFn(args, {getState}, extraOptions, fetch) {
        const { tokenInAddress, tokenInChainId, tokenOutAddress, tokenOutChainId, amount, type} = args

        const clientSideRouter = (getState() as AppState).user.userClientSideRouter

        const result = await
          (clientSideRouter ?
            // TODO(judo): update worker when token list changes?
            (getWorker().getQuote({
              type,
              chainId: tokenInChainId as number,
              // TODO(judo): decimals and symbols
              tokenIn: { address: tokenInAddress, chainId: tokenInChainId, decimals: 18},
              tokenOut: { address: tokenOutAddress, chainId: tokenOutChainId, decimals: 18},
              amount
            })) :
           (fetch(`quote?${qs.stringify(args)}`))) as QueryReturnValue<GetQuoteResult, FetchBaseQueryError, FetchBaseQueryMeta>

        if (result.error) {
          throw result.error
        }

        return { data: result.data as GetQuoteResult }
        // as QueryReturnValue<GetQuoteResult, FetchBaseQueryError, unknown>
        }
    }),
  }),
})

export const { useGetQuoteQuery } = routingApi
