import { TrendingCollection } from 'nft/types'
import { useMemo } from 'react'
import {
  HistoryDuration,
  useTrendingCollectionsQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export function useTrendingCollections(size: number, timePeriod: HistoryDuration) {
  const { data, loading, error } = useTrendingCollectionsQuery({
    variables: {
      size,
      timePeriod,
    },
  })

  const trendingCollections: TrendingCollection[] | undefined = useMemo(
    () =>
      data?.topCollections?.edges?.map((edge) => {
        const collection = edge?.node
        return {
          name: collection.name,
          address: collection.nftContracts?.[0]?.address,
          imageUrl: collection.image?.url,
          bannerImageUrl: collection.bannerImage?.url,
          isVerified: collection.isVerified,
          volume: collection.markets?.[0]?.volume?.value,
          volumeChange: collection.markets?.[0]?.volumePercentChange?.value,
          floor: collection.markets?.[0]?.floorPrice?.value,
          floorChange: collection.markets?.[0]?.floorPricePercentChange?.value,
          marketCap: collection.markets?.[0]?.totalVolume?.value,
          percentListed:
            (collection.markets?.[0]?.listings?.value ?? 0) / (collection.nftContracts?.[0]?.totalSupply ?? 1),
          owners: collection.markets?.[0]?.owners,
          sales: collection.markets?.[0]?.sales?.value,
          totalSupply: collection.nftContracts?.[0]?.totalSupply,
        }
      }),
    [data?.topCollections?.edges]
  )

  return {
    data: trendingCollections,
    loading,
    error,
  }
}
