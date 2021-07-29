import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { SupportedChainId } from 'constants/chains'
import qs from 'qs'

export interface GetQuoteResult {
  blockNumber: string
  gasPriceWei: string
  gasUseEstimate: string
  gasUseEstimateQuote: string
  gasUseEstimateQuoteDecimals: string
  gasUseEstimateUSD: string
  methodParameters: { calldata: string; value: string }
  quote: string
  quoteDecimals: string
  quoteGasAdjusted: string
  quoteGasAdjustedDecimals: string
  quoteId: string
  routeEdges: {
    amountIn: string
    amountOut: string
    fee: string
    id: string
    inId: string
    outId: string
    type: string
    sqrtRatioX96: string
    liquidity: string
    tickCurrent: string
  }[]
  routeNodes: { chainId: number; id: string; decimals: string; symbol?: string | undefined; type?: string }[]
  routeString: string
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
        recipient?: string
        slippageTolerance?: string
        deadline?: string
      }
    >({
      query: (args) => {
        const { recipient, slippageTolerance, deadline, ...rest } = args

        // API requires all three to be present
        const recipientSpecific =
          recipient && slippageTolerance && deadline ? { recipient, slippageTolerance, deadline } : {}

        const queryParams = {
          ...rest,
          ...recipientSpecific,
        }
        return `quote?${qs.stringify(queryParams)}`
      },
    }),
  }),
})

export const { useGetQuoteQuery } = routingApi
