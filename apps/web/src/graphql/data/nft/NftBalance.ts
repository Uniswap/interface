import { parseEther } from 'ethers/lib/utils'
import { GenieCollection, WalletAsset } from 'nft/types'
import { wrapScientificNotation } from 'nft/utils'
import { useCallback, useMemo } from 'react'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import {
  Chain,
  NftAsset,
  useNftBalanceQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'

type UseNftBalanceParams = {
  ownerAddress: string
  collectionFilters?: string[]
  assetsFilter?: { address: string; tokenId: string }[]
  first?: number
  after?: string
  last?: number
  before?: string
  skip?: boolean
  chains?: Chain[]
}

export function useNftBalance({
  ownerAddress,
  collectionFilters,
  assetsFilter,
  first,
  after,
  last,
  before,
  skip = false,
  chains,
}: UseNftBalanceParams) {
  const { data, loading, fetchMore } = useNftBalanceQuery({
    variables: {
      ownerAddress,
      filter:
        assetsFilter && assetsFilter.length > 0
          ? {
              assets: assetsFilter,
            }
          : {
              addresses: collectionFilters,
            },
      chains,
      first,
      after,
      last,
      before,
    },
    skip,
  })
  const hideSpam = useHideSpamTokensSetting()

  const hasNext = data?.nftBalances?.pageInfo?.hasNextPage
  const loadMore = useCallback(
    () =>
      fetchMore({
        variables: {
          after: data?.nftBalances?.pageInfo?.endCursor,
        },
      }),
    [data?.nftBalances?.pageInfo?.endCursor, fetchMore],
  )

  // If hideSpam is true, filter out spam NFTs
  const filteredQueryAssets = hideSpam
    ? data?.nftBalances?.edges?.filter((queryAsset) => !(queryAsset?.node.ownedAsset as NonNullable<NftAsset>).isSpam)
    : data?.nftBalances?.edges

  const walletAssets: WalletAsset[] | undefined = filteredQueryAssets?.map((queryAsset) => {
    const asset = queryAsset?.node.ownedAsset as NonNullable<NftAsset>
    const ethPrice = parseEther(wrapScientificNotation(asset?.listings?.edges[0]?.node.price.value ?? 0)).toString()
    return {
      id: asset?.id,
      imageUrl: asset?.image?.url,
      smallImageUrl: asset?.smallImage?.url,
      notForSale: asset?.listings?.edges?.length === 0,
      animationUrl: asset?.animationUrl,
      susFlag: asset?.suspiciousFlag,
      priceInfo: {
        ETHPrice: ethPrice,
        baseAsset: 'ETH',
        baseDecimals: '18',
        basePrice: ethPrice,
      },
      name: asset?.name,
      tokenId: asset?.tokenId,
      asset_contract: {
        address: asset?.collection?.nftContracts?.[0]?.address,
        tokenType: asset?.collection?.nftContracts?.[0]?.standard,
        name: asset?.collection?.name,
        description: asset?.description,
        image_url: asset?.collection?.image?.url,
        payout_address: queryAsset?.node?.listingFees?.[0]?.payoutAddress,
      },
      collection: {
        name: asset.collection?.name,
        isVerified: asset.collection?.isVerified,
        imageUrl: asset.collection?.image?.url,
        twitterUrl: asset.collection?.twitterName ? `@${asset.collection?.twitterName}` : undefined,
      } as GenieCollection,
      collectionIsVerified: asset?.collection?.isVerified,
      lastPrice: queryAsset.node.lastPrice?.value,
      floorPrice: asset?.collection?.markets?.[0]?.floorPrice?.value,
      basisPoints: queryAsset?.node?.listingFees?.[0]?.basisPoints ?? 0 / BIPS_BASE,
      listing_date: asset?.listings?.edges?.[0]?.node?.createdAt?.toString(),
      date_acquired: queryAsset.node.lastPrice?.timestamp?.toString(),
      sellOrders: asset?.listings?.edges.map((edge: any) => edge.node),
      floor_sell_order_price: asset?.listings?.edges?.[0]?.node?.price?.value,
      chain: asset.chain,
    }
  })
  return useMemo(() => ({ walletAssets, hasNext, loadMore, loading }), [hasNext, loadMore, loading, walletAssets])
}
