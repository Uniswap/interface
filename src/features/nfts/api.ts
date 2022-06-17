import { QueryReturnValue } from '@reduxjs/toolkit/dist/query/baseQueryTypes'
import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { utils } from 'ethers'
import { REHYDRATE } from 'redux-persist'
import { config } from 'src/config'
import { ChainId } from 'src/constants/chains'
import {
  NFTAsset,
  OpenseaNFTAssetResponse,
  OpenseaNFTCollectionResponse,
} from 'src/features/nfts/types'
import { isEnabled } from 'src/features/remoteConfig'
import { TestConfig } from 'src/features/remoteConfig/testConfigs'
import { serializeQueryParams } from 'src/features/transactions/swap/utils'

const CURSOR_LIMIT = 50
const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v1/'
const OPENSEA_BASE_URL_RINKEBY = 'https://rinkeby-api.opensea.io/api/v1/'
const TOTAL_LIMIT = 1_000

const baseQueryOptions = {
  order_direction: 'desc',
  limit: CURSOR_LIMIT,
}

export const nftApi = createApi({
  reducerPath: 'nftApi',
  baseQuery: fetchBaseQuery({
    baseUrl: OPENSEA_BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json')
      headers.set('X-API-KEY', config.openseaApiKey)
      return headers
    },
  }),
  endpoints: (builder) => ({
    nftBalances: builder.query<Record<Address, NFTAsset.Asset[]>, { owner: Address }>({
      async queryFn({ owner }, _api, _extraOptions, fetchWithBQ) {
        let assets: NFTAsset.Asset[] = []
        let cursor: string | null = ''
        let error: FetchBaseQueryError | null = null

        const chainId = isEnabled(TestConfig.RinkebyNFTs) ? ChainId.Rinkeby : ChainId.Mainnet

        // recursively fetch NFTs
        while (cursor !== null && assets.length <= TOTAL_LIMIT) {
          const params = `assets?${serializeQueryParams({
            ...baseQueryOptions,
            owner,
            cursor,
          })}`
          const cursorResult = (
            chainId === ChainId.Rinkeby
              ? await fetchBaseQuery({ baseUrl: OPENSEA_BASE_URL_RINKEBY })(
                  params,
                  _api,
                  _extraOptions
                )
              : await fetchWithBQ(params)
          ) as QueryReturnValue<OpenseaNFTAssetResponse>

          cursor = cursorResult?.data?.next ?? null
          error = cursorResult?.error as FetchBaseQueryError

          if (cursorResult && cursorResult.data?.assets) {
            assets = assets.concat(cursorResult.data.assets)
          }
        }

        const assetsByCollection = assets.reduce<Record<Address, NFTAsset.Asset[]>>((all, nft) => {
          const key = utils.getAddress(nft.asset_contract.address)
          all[key] ??= []
          all[key]!.push({ ...nft, chainId })
          return all
        }, {})

        return error ? { error } : { data: assetsByCollection }
      },
    }),
    nftCollection: builder.query<NFTAsset.Collection, { openseaSlug: string }>({
      query: ({ openseaSlug }) => `collection/${openseaSlug}`,
      transformResponse: (response: OpenseaNFTCollectionResponse) => response.collection,
    }),
  }),
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE) {
      return action.payload?.[reducerPath]
    }
  },
})

export const { useNftBalancesQuery, useNftCollectionQuery } = nftApi
