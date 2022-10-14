import graphql from 'babel-plugin-relay/macro'
import { parseEther } from 'ethers/lib/utils'
import NFTRelayEnvironment from 'graphql/data/nft/NFTRelayEnvironment'
import { loadQuery, usePreloadedQuery } from 'react-relay'

import { AssetQuery } from './__generated__/AssetQuery.graphql'

const assetsQuery = graphql`
  query AssetQuery {
    nftAssets(
      address: "0x60e4d786628fea6478f785a6d7e704777c86a7c6"
      orderBy: PRICE
      asc: true
      filter: { buyNow: true }
      pagination: { first: 25 }
    ) {
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
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
`

// export function useAssetsQuery() {
//   const assets = useLazyLoadQuery<AssetQuery>(assetsQuery, {}).nftAssets?.edges
//   return assets
// }

const assetsQueryReference = loadQuery<AssetQuery>(NFTRelayEnvironment, assetsQuery, {})

export function useAssetsQuery() {
  const collectionAssets = usePreloadedQuery<AssetQuery>(assetsQuery, assetsQueryReference).nftAssets?.edges
  // const collectionAssets = useLazyLoadQuery<AssetQuery>(assetsQuery, {}).nftAssets?.edges
  return collectionAssets?.map((queryAsset) => {
    const asset = queryAsset.node
    return {
      id: asset.id,
      address: asset.nftContract?.address,
      notForSale: asset.listings?.edges.length === 0,
      collectionName: asset.collection?.name, // seems to be missing
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
      openseaSusFlag: asset.suspiciousFlag, // seems to be missing
      sellorders: asset.listings?.edges,
      smallImageUrl: asset.smallImage?.url,
      tokenId: asset.tokenId,
      tokenType: asset.nftContract?.standard, // ERC20 || ERC721 || ERC1155 || Dust || Cryptopunk
      // url: string, //deprecate
      // totalCount?: number, // deprecate, requires FE logic change
      // amount?: number, // deprecate
      // decimals?: number, // deprecate
      collectionIsVerified: asset.collection?.isVerified,
      // rarity: asset.rarities, // TODO
      owner: asset.ownerAddress,
      creator: {
        // possibly store in the nftContract?
        profile_img_url: asset.collection?.creator?.profileImage?.url,
        address: asset.collection?.creator?.address,
      },
      // externalLink: string, // metadata url TODO
      // traits?: { //seems to be missing
      //   trait_type: string
      //   value: string
      //   trait_count: number
      // }[]
    }
  })
}
