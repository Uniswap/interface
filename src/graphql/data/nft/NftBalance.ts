import graphql from 'babel-plugin-relay/macro'
import { WalletAsset } from 'nft/types'
import { useLazyLoadQuery, usePaginationFragment } from 'react-relay'

import { NftBalancePaginationQuery } from './__generated__/NftBalancePaginationQuery.graphql'
import { NftBalanceQuery } from './__generated__/NftBalanceQuery.graphql'
import { NftBalanceQuery_nftBalances$data } from './__generated__/NftBalanceQuery_nftBalances.graphql'

const nftBalancePaginationQuery = graphql`
  fragment NftBalanceQuery_nftBalances on Query @refetchable(queryName: "NftBalancePaginationQuery") {
    nftBalances(
      ownerAddress: $ownerAddress
      filter: $filter
      first: $first
      after: $after
      last: $last
      before: $before
    ) @connection(key: "NftBalanceQuery_nftBalances") {
      edges {
        node {
          ownedAsset {
            id
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
          listingFees {
            payoutAddress
            basisPoints
          }
          lastPrice {
            currency
            timestamp
            value
          }
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
  query NftBalanceQuery(
    $ownerAddress: String!
    $filter: NftBalancesFilterInput
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    ...NftBalanceQuery_nftBalances
  }
`

type NftBalanceQueryAsset = NonNullable<
  NonNullable<NonNullable<NftBalanceQuery_nftBalances$data['nftBalances']>['edges']>[number]
>
//
// export type TokenQueryData = NonNullable<TokenQuery$data['tokens']>[number]
export function useNftBalanceQuery(
  ownerAddress: string,
  collectionFilters?: string[],
  first?: number,
  after?: string,
  last?: number,
  before?: string
) {
  const queryData = useLazyLoadQuery<NftBalanceQuery>(nftBalanceQuery, {
    ownerAddress,
    filter: {
      addresses: collectionFilters,
    },
    first,
    after,
    last,
    before,
  })
  const { data, hasNext, loadNext, isLoadingNext } = usePaginationFragment<NftBalancePaginationQuery, any>(
    nftBalancePaginationQuery,
    queryData
  )
  const walletAssets: WalletAsset[] = data.nftBalances?.edges?.map((queryAsset: NftBalanceQueryAsset) => {
    const asset = queryAsset.node.ownedAsset
    return {
      id: asset?.id,
      image_url: asset?.image?.url,
      image_preview_url: asset?.smallImage?.url,
      name: asset?.name,
      tokenId: asset?.tokenId,
      asset_contract: {
        address: asset?.collection?.nftContracts?.[0]?.address,
        schema_name: asset?.collection?.nftContracts?.[0]?.standard,
        name: asset?.collection?.name,
        description: asset?.description,
        image_url: asset?.collection?.image?.url,
        payout_address: queryAsset?.node?.listingFees?.[0]?.payoutAddress,
      },
      collection: asset?.collection,
      collectionIsVerified: asset?.collection?.isVerified,
      lastPrice: queryAsset.node.lastPrice?.value,
      floorPrice: asset?.collection?.markets?.[0]?.floorPrice?.value,
      creatorPercentage: queryAsset?.node?.listingFees?.[0]?.basisPoints ?? 0 / 10000,
      listing_date: asset?.listings?.edges?.[0]?.node?.createdAt,
      date_acquired: queryAsset.node.lastPrice?.timestamp,
      sellOrders: asset?.listings?.edges.map((edge: any) => edge.node),
      floor_sell_order_price: asset?.listings?.edges?.[0]?.node?.price?.value,
    }
  })
  return { walletAssets, hasNext, isLoadingNext, loadNext }
}
