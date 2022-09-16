import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { CollectionAsset } from 'nft/components/collection/CollectionAsset'
import * as styles from 'nft/components/collection/CollectionNfts.css'
import { Center } from 'nft/components/Flex'
import { bodySmall, buttonTextMedium, header2 } from 'nft/css/common.css'
import { useCollectionFilters } from 'nft/hooks'
import { AssetsFetcher } from 'nft/queries'
import { useMemo, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery } from 'react-query'

interface CollectionNftsProps {
  contractAddress: string
}

export const CollectionNfts = ({ contractAddress }: CollectionNftsProps) => {
  const buyNow = useCollectionFilters((state) => state.buyNow)

  const {
    data: collectionAssets,
    isSuccess: AssetsFetchSuccess,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery(
    [
      'collectionNfts',
      {
        contractAddress,
        notForSale: !buyNow,
      },
    ],
    async ({ pageParam = 0 }) => {
      return await AssetsFetcher({
        contractAddress,
        notForSale: !buyNow,
        pageParam,
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

  const [currentTokenPlayingMedia, setCurrentTokenPlayingMedia] = useState<string | undefined>()

  const collectionNfts = useMemo(() => {
    if (!collectionAssets || !AssetsFetchSuccess) return undefined

    return collectionAssets.pages.flat()
  }, [collectionAssets, AssetsFetchSuccess])

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
