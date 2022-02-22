import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { SupportedChainId } from 'constants/chains'
import qs from 'qs'

import { GetQuoteResult } from './types'

export interface Post {
  calldata: string
}

export const routingApi = createApi({
  reducerPath: 'routingApi',
  tagTypes: ['Posts'],
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.defender.openzeppelin.com/autotasks/873a861e-18a2-4f4e-bf41-c0556d85c723/runs/webhook/',
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
      query: (args) => `quote?${qs.stringify(args)}`,
    }),
    addPost: build.mutation<Post, Partial<Post>>({
      query(body) {
        return {
          url: `f01e923b-a353-445d-871f-036d5c876cc7/8wxovGTVS3yWdtU525Wo67`,
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Posts'],
    }),
  }),
})

export const { useGetQuoteQuery, useAddPostMutation } = routingApi
