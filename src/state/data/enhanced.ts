import { api as generatedApi } from './generated'

// tag that should be applied to queries that need to be invalidated when the chain changes
export const CHAIN_TAG = 'Chain'

// enhanced api to provide/invalidate tags
export const api = generatedApi.enhanceEndpoints({
  addTagTypes: [CHAIN_TAG],
  endpoints: {
    allV3Ticks: {
      providesTags: [CHAIN_TAG],
    },
    feeTierDistribution: {
      providesTags: [CHAIN_TAG],
    },
  },
})

export const { useAllV3TicksQuery, useFeeTierDistributionQuery } = api
