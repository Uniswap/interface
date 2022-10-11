import clsx from 'clsx'
import useDebounce from 'hooks/useDebounce'
import { AnimatedBox, Box } from 'nft/components/Box'
import { CollectionSearch, FilterButton } from 'nft/components/collection'
import { CollectionAsset } from 'nft/components/collection/CollectionAsset'
import * as styles from 'nft/components/collection/CollectionNfts.css'
import { SortDropdown } from 'nft/components/common/SortDropdown'
import { Center, Row } from 'nft/components/Flex'
import { NonRarityIcon, RarityIcon } from 'nft/components/icons'
import { bodySmall, buttonTextMedium, headlineMedium } from 'nft/css/common.css'
import { vars } from 'nft/css/sprinkles.css'
import {
  CollectionFilters,
  initialCollectionFilterState,
  SortBy,
  useCollectionFilters,
  useFiltersExpanded,
  useIsMobile,
} from 'nft/hooks'
import { useIsCollectionLoading } from 'nft/hooks/useIsCollectionLoading'
import { AssetsFetcher } from 'nft/queries'
import { DropDownOption, GenieCollection, UniformHeight, UniformHeights } from 'nft/types'
import { getRarityStatus } from 'nft/utils/asset'
import { pluralize } from 'nft/utils/roundAndPluralize'
import { scrollToTop } from 'nft/utils/scrollToTop'
import { applyFiltersFromURL, syncLocalFiltersWithURL } from 'nft/utils/urlParams'
import { useEffect, useMemo, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery } from 'react-query'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components/macro'

import { CollectionAssetLoading } from './CollectionAssetLoading'
import { marketPlaceItems } from './MarketplaceSelect'
import { TraitChip } from './TraitChip'

interface CollectionNftsProps {
  contractAddress: string
  collectionStats: GenieCollection
  rarityVerified?: boolean
}

const rarityStatusCache = new Map<string, boolean>()

const ClearAllButton = styled.button`
  color: ${({ theme }) => theme.textTertiary};
  padding-left: 8px;
  padding-right: 8px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  background: none;
`

export const CollectionNfts = ({ contractAddress, collectionStats, rarityVerified }: CollectionNftsProps) => {
  const traits = useCollectionFilters((state) => state.traits)
  const minPrice = useCollectionFilters((state) => state.minPrice)
  const maxPrice = useCollectionFilters((state) => state.maxPrice)
  const markets = useCollectionFilters((state) => state.markets)
  const sortBy = useCollectionFilters((state) => state.sortBy)
  const searchByNameText = useCollectionFilters((state) => state.search)
  const setMarketCount = useCollectionFilters((state) => state.setMarketCount)
  const setSortBy = useCollectionFilters((state) => state.setSortBy)
  const buyNow = useCollectionFilters((state) => state.buyNow)
  const setIsCollectionNftsLoading = useIsCollectionLoading((state) => state.setIsCollectionNftsLoading)
  const removeTrait = useCollectionFilters((state) => state.removeTrait)
  const removeMarket = useCollectionFilters((state) => state.removeMarket)
  const reset = useCollectionFilters((state) => state.reset)
  const setMin = useCollectionFilters((state) => state.setMinPrice)
  const setMax = useCollectionFilters((state) => state.setMaxPrice)

  const debouncedMinPrice = useDebounce(minPrice, 500)
  const debouncedMaxPrice = useDebounce(maxPrice, 500)
  const debouncedSearchByNameText = useDebounce(searchByNameText, 500)

  const {
    data: collectionAssets,
    isSuccess: AssetsFetchSuccess,
    isLoading,
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
        sortBy,
        debouncedMinPrice,
        debouncedMaxPrice,
        searchText: debouncedSearchByNameText,
      },
    ],
    async ({ pageParam = 0 }) => {
      let sort = undefined
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
        sort,
        markets,
        notForSale: !buyNow,
        searchText: debouncedSearchByNameText,
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

  useEffect(() => {
    setIsCollectionNftsLoading(isLoading)
  }, [isLoading, setIsCollectionNftsLoading])

  const [uniformHeight, setUniformHeight] = useState<UniformHeight>(UniformHeights.unset)
  const [currentTokenPlayingMedia, setCurrentTokenPlayingMedia] = useState<string | undefined>()
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const oldStateRef = useRef<CollectionFilters | null>(null)
  const isMobile = useIsMobile()

  const collectionNfts = useMemo(() => {
    if (!collectionAssets || !AssetsFetchSuccess) return undefined

    return collectionAssets.pages.flat()
  }, [collectionAssets, AssetsFetchSuccess])

  const loadingAssets = useMemo(() => <>{new Array(25).fill(<CollectionAssetLoading />)}</>, [])
  const hasRarity = getRarityStatus(rarityStatusCache, collectionStats?.address, collectionNfts)

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
    return () => {
      useCollectionFilters.setState(initialCollectionFilterState)
    }
  }, [contractAddress])

  const Nfts =
    collectionNfts &&
    collectionNfts.map((asset) =>
      asset ? (
        <CollectionAsset
          key={asset.address + asset.tokenId}
          asset={asset}
          isMobile={isMobile}
          uniformHeight={uniformHeight}
          setUniformHeight={setUniformHeight}
          mediaShouldBePlaying={asset.tokenId === currentTokenPlayingMedia}
          setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
          rarityVerified={rarityVerified}
        />
      ) : null
    )

  const hasNfts = collectionNfts && collectionNfts.length > 0

  const minMaxPriceChipText: string | undefined = useMemo(() => {
    if (debouncedMinPrice && debouncedMaxPrice) {
      return `Price: ${debouncedMinPrice}-${debouncedMaxPrice} ETH`
    } else if (debouncedMinPrice) {
      return `Min. Price: ${debouncedMinPrice} ETH`
    } else if (debouncedMaxPrice) {
      return `Max Price: ${debouncedMaxPrice} ETH`
    }

    return undefined
  }, [debouncedMinPrice, debouncedMaxPrice])

  useEffect(() => {
    const marketCount: any = {}
    collectionStats?.marketplaceCount?.forEach(({ marketplace, count }) => {
      marketCount[marketplace] = count
    })
    setMarketCount(marketCount)
    oldStateRef.current = useCollectionFilters.getState()
  }, [collectionStats?.marketplaceCount, setMarketCount])

  const location = useLocation()
  // Applying filters from URL to local state
  useEffect(() => {
    if (collectionStats?.traits) {
      const modifiedQuery = applyFiltersFromURL(location, collectionStats)

      requestAnimationFrame(() => {
        useCollectionFilters.setState(modifiedQuery as any)
      })

      useCollectionFilters.subscribe((state) => {
        if (JSON.stringify(oldStateRef.current) !== JSON.stringify(state)) {
          syncLocalFiltersWithURL(state)
          oldStateRef.current = state
        }
      })
    }
  }, [collectionStats, location])

  return (
    <>
      <AnimatedBox position="sticky" top="72" width="full" zIndex="3">
        <Box
          backgroundColor="backgroundFloating"
          width="full"
          paddingBottom="8"
          style={{ backdropFilter: 'blur(24px)' }}
        >
          <Row marginTop="12" gap="12">
            <FilterButton
              isMobile={isMobile}
              isFiltersExpanded={isFiltersExpanded}
              onClick={() => setFiltersExpanded(!isFiltersExpanded)}
              collectionCount={collectionNfts?.[0]?.totalCount ?? 0}
            />
            <SortDropdown dropDownOptions={sortDropDownOptions} />
            <CollectionSearch />
          </Row>
          <Row paddingTop="12" gap="8" flexWrap="wrap">
            {markets.map((market) => (
              <TraitChip
                key={market}
                value={marketPlaceItems[market as keyof typeof marketPlaceItems]}
                onClick={() => {
                  scrollToTop()
                  removeMarket(market)
                }}
              />
            ))}
            {traits.map((trait) => (
              <TraitChip
                key={trait.trait_value}
                value={
                  trait.trait_type === 'Number of traits'
                    ? `${trait.trait_value} trait${pluralize(Number(trait.trait_value))}`
                    : `${trait.trait_type}: ${trait.trait_value}`
                }
                onClick={() => {
                  scrollToTop()
                  removeTrait(trait)
                }}
              />
            ))}
            {minMaxPriceChipText && (
              <TraitChip
                value={minMaxPriceChipText}
                onClick={() => {
                  scrollToTop()
                  setMin('')
                  setMax('')
                }}
              />
            )}
            {traits.length || markets.length > 0 || minMaxPriceChipText ? (
              <ClearAllButton
                onClick={() => {
                  reset()
                  scrollToTop()
                }}
              >
                Clear All
              </ClearAllButton>
            ) : null}
          </Row>
        </Box>
      </AnimatedBox>
      <InfiniteScroll
        next={fetchNextPage}
        hasMore={hasNextPage ?? false}
        loader={hasNextPage ? loadingAssets : null}
        dataLength={collectionNfts?.length ?? 0}
        style={{ overflow: 'unset' }}
        className={hasNfts || isLoading ? styles.assetList : undefined}
      >
        {hasNfts
          ? Nfts
          : isLoading
          ? loadingAssets
          : !isLoading && (
              <Center width="full" color="textSecondary" style={{ height: '60vh' }}>
                <div style={{ display: 'block', textAlign: 'center' }}>
                  <p className={headlineMedium}>No NFTS found</p>
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
