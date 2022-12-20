import graphql from 'babel-plugin-relay/macro'
import { parseEther } from 'ethers/lib/utils'
import { DEFAULT_WALLET_ASSET_QUERY_AMOUNT } from 'nft/components/profile/view/ProfilePage'
import { WalletAsset } from 'nft/types'
import { wrapScientificNotation } from 'nft/utils'
import { useEffect } from 'react'
import { useLazyLoadQuery, usePaginationFragment, useQueryLoader } from 'react-relay'

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
                  endAt
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

export function useLoadNftBalanceQuery(
  ownerAddress?: string,
  collectionAddress?: string | string[],
  tokenId?: string
): void {
  const [, loadQuery] = useQueryLoader(nftBalanceQuery)
  useEffect(() => {
    if (ownerAddress) {
      loadQuery({
        ownerAddress,
        filter: tokenId
          ? { assets: [{ address: collectionAddress, tokenId }] }
          : { addresses: Array.isArray(collectionAddress) ? collectionAddress : [collectionAddress] },
        first: tokenId ? 1 : DEFAULT_WALLET_ASSET_QUERY_AMOUNT,
      })
    }
  }, [ownerAddress, loadQuery, collectionAddress, tokenId])
}

export function useNftBalanceQuery(
  ownerAddress: string,
  collectionFilters?: string[],
  assetsFilter?: { address: string; tokenId: string }[],
  first?: number,
  after?: string,
  last?: number,
  before?: string
) {
  const queryData = useLazyLoadQuery<NftBalanceQuery>(
    nftBalanceQuery,
    {
      ownerAddress,
      filter:
        assetsFilter && assetsFilter.length > 0
          ? {
              assets: assetsFilter,
            }
          : {
              addresses: collectionFilters,
            },
      first,
      after,
      last,
      before,
    },
    { fetchPolicy: 'store-or-network' }
  )
  const { data, hasNext, loadNext, isLoadingNext } = usePaginationFragment<NftBalancePaginationQuery, any>(
    nftBalancePaginationQuery,
    queryData
  )
  const walletAssets: WalletAsset[] = data.nftBalances?.edges?.map((queryAsset: NftBalanceQueryAsset) => {
    const asset = queryAsset.node.ownedAsset
    const ethPrice = parseEther(wrapScientificNotation(asset?.listings?.edges[0]?.node.price.value ?? 0)).toString()
    return {
      id: asset?.id,
      imageUrl: asset?.image?.url,
      smallImageUrl: asset?.smallImage?.url,
      notForSale: asset?.listings?.edges?.length === 0,
      animationUrl: asset?.animationUrl,
      susFlag: asset?.suspiciousFlag,
      priceInfo: asset?.listings
        ? {
            ETHPrice: ethPrice,
            baseAsset: 'ETH',
            baseDecimals: '18',
            basePrice: ethPrice,
          }
        : undefined,
      name: asset?.name,
      tokenId: asset?.tokenId,
      asset_contract: {
        address: asset?.collection?.nftContracts?.[0]?.address,
        schema_name: asset?.collection?.nftContracts?.[0]?.standard,
        name: asset?.collection?.name,
        description: asset?.description,
        image_url: asset?.collection?.image?.url,
        payout_address: queryAsset?.node?.listingFees?.[0]?.payoutAddress,
        tokenType: asset?.collection?.nftContracts?.[0].standard,
      },
      collection: asset?.collection,
      collectionIsVerified: asset?.collection?.isVerified,
      lastPrice: queryAsset.node.lastPrice?.value,
      floorPrice: asset?.collection?.markets?.[0]?.floorPrice?.value,
      basisPoints: queryAsset?.node?.listingFees?.[0]?.basisPoints ?? 0 / 10000,
      listing_date: asset?.listings?.edges?.[0]?.node?.createdAt,
      date_acquired: queryAsset.node.lastPrice?.timestamp,
      sellOrders: asset?.listings?.edges.map((edge: any) => edge.node),
      floor_sell_order_price: asset?.listings?.edges?.[0]?.node?.price?.value,
    }
  })
  return { walletAssets, hasNext, isLoadingNext, loadNext }
}
