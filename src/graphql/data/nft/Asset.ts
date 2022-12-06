import graphql from 'babel-plugin-relay/macro'
import { parseEther } from 'ethers/lib/utils'
import useInterval from 'lib/hooks/useInterval'
import ms from 'ms.macro'
import { GenieAsset, Trait } from 'nft/types'
import { wrapScientificNotation } from 'nft/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchQuery, useLazyLoadQuery, usePaginationFragment, useQueryLoader, useRelayEnvironment } from 'react-relay'

import { AssetPaginationQuery } from './__generated__/AssetPaginationQuery.graphql'
import {
  AssetQuery,
  AssetQuery$variables,
  NftAssetsFilterInput,
  NftAssetSortableField,
  NftAssetTraitInput,
  NftMarketplace,
} from './__generated__/AssetQuery.graphql'
import { AssetQuery_nftAssets$data } from './__generated__/AssetQuery_nftAssets.graphql'

const assetPaginationQuery = graphql`
  fragment AssetQuery_nftAssets on Query @refetchable(queryName: "AssetPaginationQuery") {
    nftAssets(
      address: $address
      orderBy: $orderBy
      asc: $asc
      filter: $filter
      first: $first
      after: $after
      last: $last
      before: $before
    ) @connection(key: "AssetQuery_nftAssets") {
      edges {
        node {
          id
          name
          ownerAddress
          image {
            url
          }
          smallImage {
            url
          }
          originalImage {
            url
          }
          tokenId
          description
          animationUrl
          suspiciousFlag
          collection {
            name
            isVerified
            image {
              url
            }
            creator {
              address
              profileImage {
                url
              }
              isVerified
            }
            nftContracts {
              address
              standard
            }
          }
          listings(first: 1) {
            edges {
              node {
                address
                createdAt
                endAt
                id
                maker
                marketplace
                marketplaceUrl
                orderHash
                price {
                  currency
                  value
                }
                quantity
                startAt
                status
                taker
                tokenId
                type
                protocolParameters
              }
              cursor
            }
          }
          rarities {
            provider
            rank
            score
          }
          metadataUrl
        }
      }
      totalCount
    }
  }
`

const assetQuery = graphql`
  query AssetQuery(
    $address: String!
    $orderBy: NftAssetSortableField
    $asc: Boolean
    $filter: NftAssetsFilterInput
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    ...AssetQuery_nftAssets
  }
`

type NftAssetsQueryAsset = NonNullable<
  NonNullable<NonNullable<AssetQuery_nftAssets$data['nftAssets']>['edges']>[number]
>

function formatAssetQueryData(queryAsset: NftAssetsQueryAsset, totalCount?: number) {
  const asset = queryAsset.node
  const ethPrice = parseEther(wrapScientificNotation(asset.listings?.edges[0]?.node.price.value ?? 0)).toString()
  return {
    id: asset.id,
    address: asset?.collection?.nftContracts?.[0]?.address,
    notForSale: asset.listings?.edges?.length === 0,
    collectionName: asset.collection?.name,
    collectionSymbol: asset.collection?.image?.url,
    imageUrl: asset.image?.url,
    animationUrl: asset.animationUrl,
    marketplace: asset.listings?.edges[0]?.node?.marketplace?.toLowerCase(),
    name: asset.name,
    priceInfo: asset.listings
      ? {
          ETHPrice: ethPrice,
          baseAsset: 'ETH',
          baseDecimals: '18',
          basePrice: ethPrice,
        }
      : undefined,
    susFlag: asset.suspiciousFlag,
    sellorders: asset.listings?.edges.map((listingNode) => {
      return {
        ...listingNode.node,
        protocolParameters: listingNode.node?.protocolParameters
          ? JSON.parse(listingNode.node?.protocolParameters.toString())
          : undefined,
      }
    }),
    smallImageUrl: asset.smallImage?.url,
    tokenId: asset.tokenId,
    tokenType: asset.collection?.nftContracts?.[0]?.standard,
    totalCount,
    collectionIsVerified: asset.collection?.isVerified,
    rarity: {
      primaryProvider: 'Rarity Sniper', // TODO update when backend adds more providers
      providers: asset.rarities?.map((rarity) => {
        return {
          ...rarity,
          provider: 'Rarity Sniper',
        }
      }),
    },
    owner: asset.ownerAddress,
    creator: {
      profile_img_url: asset.collection?.creator?.profileImage?.url,
      address: asset.collection?.creator?.address,
    },
    metadataUrl: asset.metadataUrl,
  }
}

export const ASSET_PAGE_SIZE = 25

export interface AssetFetcherParams {
  address: string
  orderBy: NftAssetSortableField
  asc: boolean
  filter: NftAssetsFilterInput
  first?: number
  after?: string
  last?: number
  before?: string
}

const defaultAssetFetcherParams: Omit<AssetQuery$variables, 'address'> = {
  orderBy: 'PRICE',
  asc: true,
  // tokenSearchQuery must be specified so that this exactly matches the initial query.
  filter: { listed: false, tokenSearchQuery: '' },
  first: ASSET_PAGE_SIZE,
}

export function useLoadAssetsQuery(address?: string) {
  const [, loadQuery] = useQueryLoader<AssetQuery>(assetQuery)
  useEffect(() => {
    if (address) {
      loadQuery({ ...defaultAssetFetcherParams, address })
    }
  }, [address, loadQuery])
}

export function useLazyLoadAssetsQuery(params: AssetFetcherParams) {
  const vars = useMemo(() => ({ ...defaultAssetFetcherParams, ...params }), [params])
  const [fetchKey, setFetchKey] = useState(0)
  // Use the store if it is available (eg from polling), or the network if it is not (eg from an incorrect preload).
  const fetchPolicy = 'store-or-network'
  const queryData = useLazyLoadQuery<AssetQuery>(assetQuery, vars, { fetchKey, fetchPolicy }) // this will suspend if not yet loaded

  const { data, hasNext, loadNext, isLoadingNext } = usePaginationFragment<AssetPaginationQuery, any>(
    assetPaginationQuery,
    queryData
  )

  // Poll for updates.
  const POLLING_INTERVAL = ms`5s`
  const environment = useRelayEnvironment()
  const poll = useCallback(async () => {
    if (data.nftAssets?.edges?.length > ASSET_PAGE_SIZE) return
    // Initiate a network request. When it resolves, refresh the UI from store (to avoid re-triggering Suspense);
    // see: https://relay.dev/docs/guided-tour/refetching/refreshing-queries/#if-you-need-to-avoid-suspense-1.
    await fetchQuery<AssetQuery>(environment, assetQuery, { ...vars }).toPromise()
    setFetchKey((fetchKey) => fetchKey + 1)
  }, [data.nftAssets?.edges?.length, environment, vars])
  useInterval(poll, isLoadingNext ? null : POLLING_INTERVAL, /* leading= */ false)

  // It is especially important for this to be memoized to avoid re-rendering from polling if data is unchanged.
  const assets: GenieAsset[] = useMemo(
    () =>
      data.nftAssets?.edges?.map((queryAsset: NftAssetsQueryAsset) => {
        return formatAssetQueryData(queryAsset, data.nftAssets?.totalCount)
      }),
    [data.nftAssets?.edges, data.nftAssets?.totalCount]
  )

  return { assets, hasNext, isLoadingNext, loadNext }
}

const DEFAULT_SWEEP_AMOUNT = 50

export interface SweepFetcherParams {
  contractAddress: string
  markets?: string[]
  price?: { high?: number | string; low?: number | string; symbol: string }
  traits?: Trait[]
}

function useSweepFetcherVars({ contractAddress, markets, price, traits }: SweepFetcherParams): AssetQuery$variables {
  const filter: NftAssetsFilterInput = useMemo(
    () => ({
      listed: true,
      maxPrice: price?.high?.toString(),
      minPrice: price?.low?.toString(),
      traits:
        traits && traits.length > 0
          ? traits?.map((trait) => {
              return { name: trait.trait_type, values: [trait.trait_value] } as unknown as NftAssetTraitInput
            })
          : undefined,
      marketplaces:
        markets && markets.length > 0 ? markets?.map((market) => market.toUpperCase() as NftMarketplace) : undefined,
    }),
    [markets, price?.high, price?.low, traits]
  )
  return useMemo(
    () => ({
      address: contractAddress,
      orderBy: 'PRICE',
      asc: true,
      first: DEFAULT_SWEEP_AMOUNT,
      filter,
    }),
    [contractAddress, filter]
  )
}

export function useLoadSweepAssetsQuery(params: SweepFetcherParams, enabled = true) {
  const [, loadQuery] = useQueryLoader<AssetQuery>(assetQuery)
  const vars = useSweepFetcherVars(params)
  useEffect(() => {
    if (enabled) {
      loadQuery(vars)
    }
  }, [loadQuery, enabled, vars])
}

// Lazy-loads an already loaded AssetsQuery.
// This will *not* trigger a query - that must be done from a parent component to ensure proper query coalescing and to
// prevent waterfalling. Use useLoadSweepAssetsQuery to trigger the query.
export function useLazyLoadSweepAssetsQuery(params: SweepFetcherParams): GenieAsset[] {
  const vars = useSweepFetcherVars(params)
  const queryData = useLazyLoadQuery(assetQuery, vars, { fetchPolicy: 'store-only' }) // this will suspend if not yet loaded
  const { data } = usePaginationFragment<AssetPaginationQuery, any>(assetPaginationQuery, queryData)
  return useMemo<GenieAsset[]>(
    () =>
      data.nftAssets?.edges?.map((queryAsset: NftAssetsQueryAsset) => {
        return formatAssetQueryData(queryAsset, data.nftAssets?.totalCount)
      }),
    [data.nftAssets?.edges, data.nftAssets?.totalCount]
  )
}
