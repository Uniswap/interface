import { BigNumber } from '@ethersproject/bignumber'
import clsx from 'clsx'
import { AnimatedBox, Box } from 'nft/components/Box'
import { CollectionSearch, FilterButton } from 'nft/components/collection'
import { CollectionAsset } from 'nft/components/collection/CollectionAsset'
import * as styles from 'nft/components/collection/CollectionNfts.css'
import { SortDropdown } from 'nft/components/common/SortDropdown'
import { Center } from 'nft/components/Flex'
import { Row } from 'nft/components/Flex'
import { bodySmall, buttonTextMedium, header2 } from 'nft/css/common.css'
import { SortBy, useCollectionFilters, useFiltersExpanded, useIsMobile } from 'nft/hooks'
import { AssetsFetcher } from 'nft/queries'
import { DropDownOption, GenieAsset, GenieCollection, UniformHeight, UniformHeights } from 'nft/types'
import { useEffect, useMemo, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery } from 'react-query'

import { NonRarityIcon, RarityIcon } from '../../components/icons'
import { vars } from '../../css/sprinkles.css'

const rarityStatusCache = new Map<string, boolean>()
function getRarityStatus(id: string, assets?: (GenieAsset | undefined)[]) {
  if (rarityStatusCache.has(id)) {
    return rarityStatusCache.get(id)
  }
  let hasRarity = false
  assets &&
    Array.from(assets).forEach((asset) => {
      if (hasRarity) {
        return
      }
      if (asset?.rarity) {
        hasRarity = true
      }
    })
  if (hasRarity) {
    rarityStatusCache.set(id, hasRarity)
  }

  return true
}

interface CollectionNftsProps {
  contractAddress: string
  collectionStats: GenieCollection
}

export const CollectionNfts = ({ contractAddress, collectionStats }: CollectionNftsProps) => {
  const {
    buyNow,
    search: searchByNameText,
    sortBy,
    setSortBy,
  } = useCollectionFilters(({ buyNow, sortBy, setSortBy, search }) => ({
    buyNow,
    sortBy,
    setSortBy,
    search,
  }))

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
        sortBy,
        searchText: searchByNameText,
      },
    ],
    async ({ pageParam = 0 }) => {
      let sort = null
      switch (sortBy) {
        case SortBy.HighToLow: {
          sort = { currentEthPrice: 'desc' }
          break
        }
        case SortBy.RareToCommon: {
          sort = { 'rarity.providers.0.rank': 1 }
          break
        }
        case SortBy.CommonToRare: {
          sort = { 'rarity.providers.0.rank': -1 }
          break
        }
        default:
      }

      return await AssetsFetcher({
        contractAddress,
        sort: sort ?? undefined,
        notForSale: !buyNow,
        searchText: searchByNameText,
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

  const [uniformHeight, setUniformHeight] = useState<UniformHeight>(UniformHeights.unset)
  const [currentTokenPlayingMedia, setCurrentTokenPlayingMedia] = useState<string | undefined>()
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const isMobile = useIsMobile()

  const collectionNfts = useMemo(() => {
    if (!collectionAssets || !AssetsFetchSuccess) return undefined
    const assets = collectionAssets.pages.flat()

    if (sortBy === SortBy.HighToLow || sortBy === SortBy.LowToHigh)
      return assets.sort((a = {} as GenieAsset, b = {} as GenieAsset) => {
        const bigA = BigNumber.from(a.currentEthPrice ?? -1)
        const bigB = BigNumber.from(b.currentEthPrice ?? -1)
        const diff = bigA.sub(bigB)

        if ((bigA.gte(0) || bigB.gte(0)) && (bigA.lt(0) || bigB.lt(0))) {
          return bigA.gte(0) ? (sortBy === SortBy.LowToHigh ? -1 : 1) : sortBy === SortBy.LowToHigh ? 1 : -1
        }

        if (diff.gt(0)) {
          return sortBy === SortBy.LowToHigh ? 1 : -1
        } else if (diff.lt(0)) {
          return sortBy === SortBy.LowToHigh ? -1 : 1
        }

        return 0
      })

    return assets
  }, [collectionAssets, AssetsFetchSuccess, sortBy])

  const hasRarity = getRarityStatus(collectionStats?.address, collectionNfts)

  const sortDropDownOptions: DropDownOption[] = useMemo(
    () =>
      hasRarity
        ? [
            {
              displayText: 'Low to High',
              onClick: () => setSortBy(SortBy.LowToHigh),
              icon: <NonRarityIcon width="28" height="28" color={vars.color.blue400} />,
              reverseIndex: 2,
            },
            {
              displayText: 'High to Low',
              onClick: () => setSortBy(SortBy.HighToLow),
              icon: <NonRarityIcon width="28" height="28" color={vars.color.blue400} />,
              reverseIndex: 1,
            },
            {
              displayText: 'Rare to Common',
              onClick: () => setSortBy(SortBy.RareToCommon),
              icon: <RarityIcon width="28" height="28" color={vars.color.blue400} />,
              reverseIndex: 4,
            },
            {
              displayText: 'Common to Rare',
              onClick: () => setSortBy(SortBy.CommonToRare),
              icon: <RarityIcon width="28" height="28" color={vars.color.blue400} />,
              reverseIndex: 3,
            },
          ]
        : [
            {
              displayText: 'Low to High',
              onClick: () => setSortBy(SortBy.LowToHigh),
              icon: <NonRarityIcon width="28" height="28" color={vars.color.blue400} />,
              reverseIndex: 2,
            },
            {
              displayText: 'High to Low',
              onClick: () => setSortBy(SortBy.HighToLow),
              icon: <NonRarityIcon width="28" height="28" color={vars.color.blue400} />,
              reverseIndex: 1,
            },
          ],
    [hasRarity, setSortBy]
  )

  useEffect(() => {
    setUniformHeight(UniformHeights.unset)
  }, [contractAddress])

  return (
    <>
      <AnimatedBox position="sticky" top="72" width="full" zIndex="3">
        <Box backgroundColor="white08" width="full" paddingBottom="8" style={{ backdropFilter: 'blur(24px)' }}>
          <Row marginTop="12" gap="12">
            <FilterButton
              isMobile={isMobile}
              isFiltersExpanded={isFiltersExpanded}
              onClick={() => setFiltersExpanded(!isFiltersExpanded)}
            />
            <SortDropdown dropDownOptions={sortDropDownOptions} />
            <CollectionSearch />
          </Row>
        </Box>
      </AnimatedBox>
      {!collectionNfts ? (
        <div>No CollectionAssets</div>
      ) : (
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
      )}
    </>
  )
}
