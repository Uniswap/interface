import clsx from 'clsx'
import useDebounce from 'hooks/useDebounce'
import { AnimatedBox, Box } from 'nft/components/Box'
import { FilterButton } from 'nft/components/collection'
import { CollectionAsset } from 'nft/components/collection/CollectionAsset'
import * as styles from 'nft/components/collection/CollectionNfts.css'
import { Row } from 'nft/components/Flex'
import { Center } from 'nft/components/Flex'
import { bodySmall, buttonTextMedium, header2 } from 'nft/css/common.css'
import { useCollectionFilters, useFiltersExpanded, useIsMobile } from 'nft/hooks'
import { AssetsFetcher } from 'nft/queries'
import { UniformHeight, UniformHeights } from 'nft/types'
import { useEffect, useMemo, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery } from 'react-query'

interface CollectionNftsProps {
  contractAddress: string
}

export const CollectionNfts = ({ contractAddress }: CollectionNftsProps) => {
  const traits = useCollectionFilters((state) => state.traits)
  const minPrice = useCollectionFilters((state) => state.minPrice)
  const maxPrice = useCollectionFilters((state) => state.maxPrice)
  const markets = useCollectionFilters((state) => state.markets)
  const buyNow = useCollectionFilters((state) => state.buyNow)
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const isMobile = useIsMobile()

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
    setUniformHeight(UniformHeights.unset)
  }, [contractAddress])

  if (!collectionNfts) {
    // TODO: collection unavailable page
    return <div>No CollectionAssets</div>
  }

  return (
    <>
      <AnimatedBox position="sticky" top="72" width="full" zIndex="3">
        <Box backgroundColor="white08" width="full" paddingBottom="8" style={{ backdropFilter: 'blur(24px)' }}>
          <Row marginTop="12" gap="12">
            <FilterButton
              isMobile={isMobile}
              isFiltersExpanded={isFiltersExpanded}
              onClick={() => setFiltersExpanded(!isFiltersExpanded)}
              collectionCount={collectionNfts?.[0]?.totalCount ?? 0}
            />
          </Row>
        </Box>
      </AnimatedBox>

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
                  isMobile={isMobile}
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
    </>
  )
}
