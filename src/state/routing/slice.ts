import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Token } from '@uniswap/sdk-core'
import qs from 'qs'
import { AppState } from 'state'

import { getQuote } from '../../worker/smartOrderRouter/router.worker'
import { GetQuoteResult } from './types'

type SerializableToken = Pick<Token, 'address' | 'chainId' | 'symbol' | 'decimals'>

async function getClientSideQuote({
  tokenIn,
  tokenOut,
  amount,
  type,
}: {
  tokenIn: SerializableToken
  tokenOut: SerializableToken
  amount: string
  type: 'exactIn' | 'exactOut'
}) {
  // TODO(judo): update worker when token list changes
  return getQuote({
    type,
    chainId: tokenIn.chainId,
    tokenIn: { address: tokenIn.address, chainId: tokenIn.chainId, decimals: tokenIn.decimals },
    tokenOut: { address: tokenOut.address, chainId: tokenOut.chainId, decimals: tokenOut.decimals },
    amount,
  })
}

export const routingApi = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.uniswap.org/v1/',
  }),
  endpoints: (build) => ({
    getQuote: build.query<
      GetQuoteResult,
      {
        tokenIn: SerializableToken
        tokenOut: SerializableToken
        amount: string
        type: 'exactIn' | 'exactOut'
      }
    >({
      async queryFn(args, { getState }, _, fetch) {
        const { tokenIn, tokenOut, amount, type } = args
        const useClientSideRouter: boolean = (getState() as AppState).user.userClientSideRouter

        let result
        if (useClientSideRouter) {
          result = await getClientSideQuote(args)
        } else {
          result = await fetch(
            `quote?${qs.stringify({
              tokenInAddress: tokenIn.address,
              tokenInChainId: tokenIn.chainId,
              tokenOutAddress: tokenOut.address,
              tokenOutChainId: tokenOut.chainId,
              amount,
              type,
            })}`
          )
        }

        if (result.error) {
          throw result.error
        }

        return { data: result.data as GetQuoteResult }
      },
    }),
  }),
})

export const { useGetQuoteQuery } = routingApi
