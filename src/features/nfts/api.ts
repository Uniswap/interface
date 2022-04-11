import { QueryReturnValue } from '@reduxjs/toolkit/dist/query/baseQueryTypes'
import { createApi, fetchBaseQuery, FetchBaseQueryError } from '@reduxjs/toolkit/query/react'
import { config } from 'src/config'
import {
  NFTAsset,
  OpenseaNFTAssetResponse,
  OpenseaNFTCollectionResponse,
} from 'src/features/nfts/types'
import { serializeQueryParams } from 'src/features/transactions/swap/utils'

const CURSOR_LIMIT = 50
const OPENSEA_BASE_URL = 'https://api.opensea.io/api/v1/'
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

        // recursively fetch NFTs
        while (cursor !== null && assets.length <= TOTAL_LIMIT) {
          const cursorResult = (await fetchWithBQ(
            `assets?${serializeQueryParams({
              ...baseQueryOptions,
              owner,
              cursor,
            })}`
          )) as QueryReturnValue<OpenseaNFTAssetResponse>

          cursor = cursorResult?.data?.next ?? null
          error = cursorResult?.error as FetchBaseQueryError

          if (cursorResult && cursorResult.data?.assets) {
            assets = assets.concat(cursorResult.data.assets)
          }
        }

        const assetsByCollection = assets.reduce<Record<Address, NFTAsset.Asset[]>>((all, nft) => {
          const key = nft.asset_contract.address
          all[key] ??= []
          all[key]!.push(nft)
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
})

export const { useNftBalancesQuery, useNftCollectionQuery } = nftApi
