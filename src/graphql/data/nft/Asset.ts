import graphql from 'babel-plugin-relay/macro'
import { parseEther } from 'ethers/lib/utils'
import { usePaginationFragment } from 'react-relay'

import { NftAssetFilterInput, NftAssetSortableField, PaginationInput } from './__generated__/AssetQuery.graphql'

const assetsPaginationQuery = graphql`
  fragment AssetQuery_pagination on NftAsset
  @argumentDefinitions(
    address: { type: "String!" }
    orderBy: { type: "NftAssetSortableField" }
    asc: { type: "Boolean" }
    filter: { type: "NftAssetFilterInput" }
    pagination: { type: "PaginationInput" }
  )
  @refetchable(queryName: "AssetsPaginationQuery") {
    nftAssets(address: $address, orderBy: $orderBy, asc: $asc, filter: $filter, pagination: $pagination)
      @connection(key: "AssetQuery_pagination") {
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
            }
          }
          listings(pagination: { first: 1 }) {
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
              }
              cursor
            }
          }
          rarities {
            provider
            rank
            score
          }
          nftContract {
            address
            chain
            id
            standard
          }
        }
        cursor
      }
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
  }
`

const assetsQuery = graphql``

// export function useAssetsQuery() {
//   const assets = useLazyLoadQuery<AssetQuery>(assetsQuery, {}).nftAssets?.edges
//   return assets
// }

export function useAssetsQuery(
  address: string,
  orderBy: NftAssetSortableField,
  asc: boolean,
  filter: NftAssetFilterInput,
  pagination: PaginationInput
) {
  const { data, hasNext, loadNext, isLoadingNext } = usePaginationFragment<AssetsPaginationQuery, _>(
    assetsPaginationQuery,
    {
      address,
      orderBy,
      asc,
      filter,
      pagination,
    }
  )

  // const assetsQueryReference = loadQuery<AssetQuery>(NFTRelayEnvironment, assetsQuery, {
  //   address,
  //   orderBy,
  //   asc,
  //   filter,
  //   pagination,
  // })
  // const collectionAssets = usePreloadedQuery<AssetQuery>(assetsQuery, assetsQueryReference).nftAssets?.edges
  // const collectionAssets = useLazyLoadQuery<AssetQuery>(assetsQuery, {}).nftAssets?.edges
  const assets = data.nftAssets?.edges?.map((queryAsset: { node: any }) => {
    const asset = queryAsset.node
    return {
      id: asset.id,
      address: asset.nftContract?.address,
      notForSale: asset.listings?.edges.length === 0,
      collectionName: asset.collection?.name,
      collectionSymbol: asset.collection?.image?.url,
      currentEthPrice: parseEther(asset.listings?.edges[0].node.price.value?.toString() ?? '0').toString(),
      // currentUsdPrice: string, // FE to start deriving?
      imageUrl: asset.image?.url,
      animationUrl: asset.animationUrl,
      marketplace: asset.listings?.edges[0].node.marketplace,
      name: asset.name,
      // priceInfo: { // FE to start deriving?
      //   ETHPrice: asset.listings?.edges[0].node.price.value,
      //   USDPrice: string
      //   baseAsset: string
      //   baseDecimals: string
      //   basePrice: string
      // },
      openseaSusFlag: asset.suspiciousFlag,
      sellorders: asset.listings?.edges,
      smallImageUrl: asset.smallImage?.url,
      tokenId: asset.tokenId,
      tokenType: asset.nftContract?.standard,
      // url: string, //deprecate
      // totalCount?: number, // deprecate, requires FE logic change
      // amount?: number, // deprecate
      // decimals?: number, // deprecate
      collectionIsVerified: asset.collection?.isVerified,
      // rarity: asset.rarities, // TODO format
      owner: asset.ownerAddress,
      creator: {
        profile_img_url: asset.collection?.creator?.profileImage?.url,
        address: asset.collection?.creator?.address,
      },
      // externalLink: string, // metadata url TODO
      // traits?: { // TODO make its own call
      //   trait_type: string
      //   value: string
      //   trait_count: number
      // }[]
    }
  })
  return { assets, hasNext, isLoadingNext, loadNext }
}
