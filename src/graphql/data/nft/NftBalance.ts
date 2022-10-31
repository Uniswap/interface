import graphql from 'babel-plugin-relay/macro'
import { WalletAsset } from 'nft/types'
import { loadQuery, usePaginationFragment, usePreloadedQuery } from 'react-relay'

import RelayEnvironment from '../RelayEnvironment'
import { NftBalancePaginationQuery } from './__generated__/NftBalancePaginationQuery.graphql'
import { NftBalanceQuery } from './__generated__/NftBalanceQuery.graphql'

const nftBalancePaginationQuery = graphql`
  fragment NftBalanceQuery_nftBalances on Query @refetchable(queryName: "NftBalancePaginationQuery") {
    nftBalances(ownerAddress: $ownerAddress, first: $first, after: $after, last: $last, before: $before)
      @connection(key: "NftBalanceQuery_nftBalances") {
      edges {
        node {
          ownedAsset {
            animationUrl
            collection {
              isVerified
              image {
                url
              }
              name
              nftContracts {
                address
                chain
                name
                standard
                symbol
                totalSupply
              }
              markets(currencies: ETH) {
                floorPrice {
                  value
                }
              }
            }
            description
            flaggedBy
            image {
              url
            }
            originalImage {
              url
            }
            name
            ownerAddress
            smallImage {
              url
            }
            suspiciousFlag
            tokenId
            thumbnail {
              url
            }
            listings(first: 1) {
              edges {
                node {
                  price {
                    value
                    currency
                  }
                  createdAt
                  marketplace
                }
              }
            }
          }
          listedMarketplaces
        }
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

const nftBalanceQuery = graphql`
  query NftBalanceQuery($ownerAddress: String!, $first: Int, $after: String, $last: Int, $before: String) {
    ...NftBalanceQuery_nftBalances
  }
`

export function useNftBalanceQuery(
  ownerAddress: string,
  first?: number,
  after?: string,
  last?: number,
  before?: string
) {
  const nftBalanceQueryReference = loadQuery<NftBalanceQuery>(RelayEnvironment, nftBalanceQuery, {
    ownerAddress,
    first,
    after,
    last,
    before,
  })
  const queryData = usePreloadedQuery<NftBalanceQuery>(nftBalanceQuery, nftBalanceQueryReference)
  const { data, hasNext, loadNext, isLoadingNext } = usePaginationFragment<NftBalancePaginationQuery, any>(
    nftBalancePaginationQuery,
    queryData
  )

  const walletAssets: WalletAsset[] = data.nftBalances.edges.map((queryAsset: { node: any }) => {
    const asset = queryAsset.node.ownedAsset
    return {
      id: asset.id,
      image_url: asset.image.url,
      image_preview_url: asset.smallImage.url,
      name: asset.name,
      tokenId: asset.tokenId,
      asset_contract: {
        address: asset.collection.nftContracts[0].address,
        schema_name: asset.collection.nftContracts[0].standard,
        name: asset.collection.name,
        description: asset.description,
        image_url: asset.collection.image.url,
        payout_address: string, // ask BE
      },
      collection: asset.collection,
      collectionIsVerified: asset.collection.isVerified,
      lastPrice: number, // ask BE
      floorPrice: asset.collection.markets[0].floorPrice,
      creatorPercentage: number, // ask BE
      listing_date: asset.listings[0].edges[0].node.createdAt,
      date_acquired: string, // ask BE
      sellOrders: asset.listings?.edges,
      floor_sell_order_price: asset.listings[0].edges[0].node.price.value,
    }
  })
  return { walletAssets, hasNext, isLoadingNext, loadNext }
}
