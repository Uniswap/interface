import graphql from 'babel-plugin-relay/macro'
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
          collection {
            isVerified
            image {
              url
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
  return collectionAssets?.map((queryAsset)=> {
   const asset = queryAsset.node
    return {
    id?: asset.id, 
    address: asset.nftContract?.address,
    notForSale: asset.listings?.edges.length === 0,
    collectionName: string, // seems to be missing
    collectionSymbol: asset.collection?.image?.url,
    currentEthPrice: asset.listings?.edges[0].node.price.value,
    currentUsdPrice: string, // FE to start deriving?
    imageUrl: asset.image?.url,
    animationUrl: asset.animationUrl,
    marketplace: asset.listings?.edges[0].node.marketplace,
    name: asset.name,
    priceInfo: { // FE to start deriving?
      ETHPrice: string
      USDPrice: string
      baseAsset: string
      baseDecimals: string
      basePrice: string
    }, 
    openseaSusFlag: boolean, // seems to be missing
    sellorders: asset.listings.edges,
    smallImageUrl: asset.smallImage?.url,
    tokenId: asset.tokenId
    tokenType: TokenType, // ERC20 || ERC721 || ERC1155 || Dust || Cryptopunk
    url: string, //deprecate
    totalCount?: number, // deprecate, requires FE logic change
    amount?: number, // deprecate
    decimals?: number, // deprecate
    collectionIsVerified?: asset.collection?.isVerified,
    rarity?: asset.rarities,
    owner: asset.ownerAddress,
    creator: { // possibly store in the nftContract?
      profile_img_url: string
      address: string
      config: string
    }, 
    externalLink: string, // metadata url
    traits?: { //seems to be missing
      trait_type: string
      value: string
      trait_count: number
    }[]
   }
  })
}
