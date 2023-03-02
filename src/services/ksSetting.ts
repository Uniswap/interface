import { ChainId } from '@kyberswap/ks-sdk-core'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import { KS_SETTING_API } from 'constants/env'

export type KyberswapConfigurationResponse = {
  data: {
    config: {
      prochart: boolean
      rpc: string
      blockSubgraph: string
      classicSubgraph: string
      elasticSubgraph: string
    }
  }
}

export type KyberswapGlobalConfigurationResponse = {
  data: {
    config: {
      aggregator: string
    }
  }
}

const ksSettingApi = createApi({
  reducerPath: 'ksSettingConfigurationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${KS_SETTING_API}/v1`,
  }),
  endpoints: builder => ({
    getKyberswapConfiguration: builder.query<KyberswapConfigurationResponse, { chainId: ChainId }>({
      query: ({ chainId }) => ({
        url: '/configurations/fetch',
        params: {
          serviceCode: `kyberswap-${chainId}`,
        },
      }),
    }),
    getKyberswapGlobalConfiguration: builder.query<KyberswapGlobalConfigurationResponse, void>({
      query: () => ({
        url: '/configurations/fetch',
        params: {
          serviceCode: `kyberswap`,
        },
      }),
    }),
  }),
})

export const {
  useGetKyberswapConfigurationQuery,
  useLazyGetKyberswapConfigurationQuery,
  useGetKyberswapGlobalConfigurationQuery,
} = ksSettingApi

export default ksSettingApi
