import graphql from 'babel-plugin-relay/macro'
import { parseEther } from 'ethers/lib/utils'
import useInterval from 'lib/hooks/useInterval'
import ms from 'ms.macro'
import { GenieAsset, Rarity, SellOrder } from 'nft/types'
import { useCallback, useMemo, useState } from 'react'
import { fetchQuery, useLazyLoadQuery, usePaginationFragment, useRelayEnvironment } from 'react-relay'

import { AssetPaginationQuery } from './__generated__/AssetPaginationQuery.graphql'
import { AssetQuery, NftAssetsFilterInput, NftAssetSortableField } from './__generated__/AssetQuery.graphql'

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

export function useAssetsQuery(
  address: string,
  orderBy: NftAssetSortableField,
  asc: boolean,
  filter: NftAssetsFilterInput,
  first?: number,
  after?: string,
  last?: number,
  before?: string
) {
  const vars = useMemo(
    () => ({ address, orderBy, asc, filter, first, after, last, before }),
    [address, after, asc, before, filter, first, last, orderBy]
  )
  const [queryOptions, setQueryOptions] = useState({ fetchKey: 0 })
  const queryData = useLazyLoadQuery<AssetQuery>(assetQuery, vars, queryOptions)

  const { data, hasNext, loadNext, isLoadingNext } = usePaginationFragment<AssetPaginationQuery, any>(
    assetPaginationQuery,
    queryData
  )

  // Poll for updates.
  const POLLING_INTERVAL = ms`5s`
  const environment = useRelayEnvironment()
  const refresh = useCallback(async () => {
    const length = data.nftAssets?.edges?.length
    // Initiate a network request. When it resolves, refresh the UI from store (to avoid re-triggering Suspense);
    // see: https://relay.dev/docs/guided-tour/refetching/refreshing-queries/#if-you-need-to-avoid-suspense-1.
    await fetchQuery<AssetQuery>(environment, assetQuery, { ...vars, first: length }).toPromise()
    setQueryOptions(({ fetchKey }) => ({
      fetchKey: fetchKey + 1,
      fetchPolicy: 'store-only',
    }))
  }, [data.nftAssets?.edges?.length, environment, vars])
  // NB: This will poll every POLLING_INTERVAL, *not* every POLLING_INTERVAL from the last successful poll.
  // TODO(WEB-2004): Update useInterval to wait for the fn to complete before rescheduling.
  useInterval(refresh, POLLING_INTERVAL)

  // It is especially important for this to be memoized to avoid re-rendering from polling if data is unchanged.
  const assets: GenieAsset[] = useMemo(
    () =>
      data.nftAssets?.edges?.map((queryAsset: { node: any }) => {
        const asset = queryAsset.node
        const ethPrice = parseEther(
          asset.listings?.edges[0]?.node.price.value?.toLocaleString('fullwide', { useGrouping: false }) ?? '0'
        ).toString()
        return {
          id: asset.id,
          address: asset.collection.nftContracts[0]?.address,
          notForSale: asset.listings?.edges.length === 0,
          collectionName: asset.collection?.name,
          collectionSymbol: asset.collection?.image?.url,
          imageUrl: asset.image?.url,
          animationUrl: asset.animationUrl,
          marketplace: asset.listings?.edges[0]?.node.marketplace.toLowerCase(),
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
          sellorders: asset.listings?.edges.map((listingNode: { node: SellOrder }) => {
            return {
              ...listingNode.node,
              protocolParameters: listingNode.node.protocolParameters
                ? JSON.parse(listingNode.node.protocolParameters.toString())
                : undefined,
            }
          }),
          smallImageUrl: asset.smallImage?.url,
          tokenId: asset.tokenId,
          tokenType: asset.collection.nftContracts[0]?.standard,
          // totalCount?: number, // TODO waiting for BE changes
          collectionIsVerified: asset.collection?.isVerified,
          rarity: {
            primaryProvider: 'Rarity Sniper', // TODO update when backend adds more providers
            providers: asset.rarities.map((rarity: Rarity) => {
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
      }),
    [data.nftAssets?.edges]
  )

  return { assets, hasNext, isLoadingNext, loadNext }
}
