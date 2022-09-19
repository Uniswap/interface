import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { CollectionAsset } from 'nft/components/collection/CollectionAsset'
import * as styles from 'nft/components/collection/CollectionNfts.css'
import { Center } from 'nft/components/Flex'
import { bodySmall, buttonTextMedium, header2 } from 'nft/css/common.css'
import { useCollectionCount, useCollectionFilters } from 'nft/hooks'
import { AssetsFetcher } from 'nft/queries'
import { UniformHeight, UniformHeights } from 'nft/types'
import { useEffect, useMemo, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery } from 'react-query'

import useDebounce from '../../../hooks/useDebounce'

interface CollectionNftsProps {
  contractAddress: string
}

export const CollectionNfts = ({ contractAddress }: CollectionNftsProps) => {
  const { markets, minPrice, maxPrice, buyNow, traits } = useCollectionFilters((state) => ({
    markets: state.markets,
    buyNow: state.buyNow,
    traits: state.traits,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
  }))
  const setCollectionCount = useCollectionCount((state) => state.setCollectionCount)

  const debouncedMinPrice = useDebounce(minPrice, 500)
  const debouncedMaxPrice = useDebounce(maxPrice, 500)

  const {
    data: collectionAssets,
    isSuccess: AssetsFetchSuccess,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    [
      'collectionNfts',
      {
        traits,
        contractAddress,
        markets,
        notForSale: !buyNow,
        price: {
          low: debouncedMinPrice,
          high: debouncedMaxPrice,
          symbol: 'ETH',
        },
      },
    ],
    async ({ pageParam = 0 }) => {
      return await AssetsFetcher({
        contractAddress,
        markets,
        notForSale: !buyNow,
        pageParam,
        traits,
        price: {
          low: debouncedMinPrice,
          high: debouncedMaxPrice,
          symbol: 'ETH',
        },
      })
    },
    {
      getNextPageParam: (lastPage, pages) => {
        return lastPage?.flat().length === 25 ? pages.length : null
      },
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchInterval: 5000,
    }
  )

  const [uniformHeight, setUniformHeight] = useState<UniformHeight>(UniformHeights.unset)
  const [currentTokenPlayingMedia, setCurrentTokenPlayingMedia] = useState<string | undefined>()

  const collectionNfts = useMemo(() => {
    if (!collectionAssets || !AssetsFetchSuccess) return undefined

    return collectionAssets.pages.flat()
  }, [collectionAssets, AssetsFetchSuccess])

  useEffect(() => {
    const count = collectionNfts?.[0]?.totalCount

    if (count) {
      setCollectionCount(count)
    }
  }, [collectionNfts, setCollectionCount])

  useEffect(() => {
    setUniformHeight(UniformHeights.unset)
  }, [contractAddress])

  if (!collectionNfts) {
    // TODO: collection unavailable page
    return <div>No CollectionAssets</div>
  }

  return (
    <InfiniteScroll
      next={fetchNextPage}
      hasMore={hasNextPage ?? false}
      loader={hasNextPage ? <p>Loading from scroll...</p> : null}
      dataLength={collectionNfts.length}
      style={{ overflow: 'unset' }}
    >
      {collectionNfts.length > 0 ? (
        <div className={styles.assetList}>
          {collectionNfts.map((asset) => {
            return asset ? (
              <CollectionAsset
                key={asset.address + asset.tokenId}
                asset={asset}
                uniformHeight={uniformHeight}
                setUniformHeight={setUniformHeight}
                mediaShouldBePlaying={asset.tokenId === currentTokenPlayingMedia}
                setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
              />
            ) : null
          })}
        </div>
      ) : (
        <Center width="full" color="darkGray" style={{ height: '60vh' }}>
          <div style={{ display: 'block', textAlign: 'center' }}>
            <p className={header2}>No NFTS found</p>
            <Box className={clsx(bodySmall, buttonTextMedium)} color="blue" cursor="pointer">
              View full collection
            </Box>
          </div>
        </Center>
      )}
    </InfiniteScroll>
  )
}
