import { useWeb3React } from '@web3-react/core'
import { ElementName, Event, EventName } from 'analytics/constants'
import { TraceEvent } from 'analytics/TraceEvent'
import clsx from 'clsx'
import { loadingAnimation } from 'components/Loader/styled'
import { parseEther } from 'ethers/lib/utils'
import { NftGraphQlVariant, useNftGraphQlFlag } from 'featureFlags/flags/nftGraphQl'
import { NftAssetTraitInput, NftMarketplace } from 'graphql/data/nft/__generated__/AssetQuery.graphql'
import { useAssetsQuery } from 'graphql/data/nft/Asset'
import useDebounce from 'hooks/useDebounce'
import { AnimatedBox, Box } from 'nft/components/Box'
import { CollectionSearch, FilterButton } from 'nft/components/collection'
import { CollectionAsset } from 'nft/components/collection/CollectionAsset'
import * as styles from 'nft/components/collection/CollectionNfts.css'
import { SortDropdown } from 'nft/components/common/SortDropdown'
import { Center, Column, Row } from 'nft/components/Flex'
import { NonRarityIcon, RarityIcon, SweepIcon } from 'nft/components/icons'
import { bodySmall, buttonTextMedium, headlineMedium } from 'nft/css/common.css'
import { loadingAsset } from 'nft/css/loading.css'
import { vars } from 'nft/css/sprinkles.css'
import {
  CollectionFilters,
  initialCollectionFilterState,
  SortBy,
  SortByQueries,
  useBag,
  useCollectionFilters,
  useFiltersExpanded,
  useIsMobile,
} from 'nft/hooks'
import { useIsCollectionLoading } from 'nft/hooks/useIsCollectionLoading'
import { usePriceRange } from 'nft/hooks/usePriceRange'
import { AssetsFetcher } from 'nft/queries'
import { DropDownOption, GenieCollection, TokenType, UniformHeight, UniformHeights } from 'nft/types'
import { getRarityStatus } from 'nft/utils/asset'
import { pluralize } from 'nft/utils/roundAndPluralize'
import { scrollToTop } from 'nft/utils/scrollToTop'
import { applyFiltersFromURL, syncLocalFiltersWithURL } from 'nft/utils/urlParams'
import { useEffect, useMemo, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery } from 'react-query'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { CollectionAssetLoading } from './CollectionAssetLoading'
import { MARKETPLACE_ITEMS } from './MarketplaceSelect'
import { Sweep } from './Sweep'
import { TraitChip } from './TraitChip'

interface CollectionNftsProps {
  contractAddress: string
  collectionStats: GenieCollection
  rarityVerified?: boolean
}

const rarityStatusCache = new Map<string, boolean>()
const nonRarityIcon = <NonRarityIcon width="20" height="20" viewBox="2 2 22 22" color={vars.color.blue400} />
const rarityIcon = <RarityIcon width="20" height="20" viewBox="2 2 24 24" color={vars.color.blue400} />

const ActionsContainer = styled.div`
  display: flex;
  gap: 10px;
  width: 100%;
  justify-content: space-between;
`

const ActionsSubContainer = styled.div`
  display: flex;
  gap: 12px;
  flex: 1;
  min-width: 0px;
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    gap: 10px;
  }
`

export const SortDropdownContainer = styled.div<{ isFiltersExpanded: boolean }>`
  width: max-content;
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    ${({ isFiltersExpanded }) => isFiltersExpanded && `display: none;`}
  }
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    display: none;
  }
`

const EmptyCollectionWrapper = styled.div`
  display: block;
  textalign: center;
`

const ViewFullCollection = styled.span`
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }

  &:active {
    opacity: ${({ theme }) => theme.opacity.click};
  }

  transition: ${({
    theme: {
      transition: { duration, timing },
    },
  }) => `opacity ${duration.medium} ${timing.ease}`};
`

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

const SweepButton = styled.div<{ toggled: boolean; disabled?: boolean }>`
  display: flex;
  gap: 8px;
  border: none;
  border-radius: 12px;
  padding: 12px 18px 12px 12px;
  cursor: ${({ disabled }) => (disabled ? 'auto' : 'pointer')};
  color: ${({ toggled, disabled, theme }) => (toggled && !disabled ? theme.accentTextLightPrimary : theme.textPrimary)};
  background: ${({ theme, toggled, disabled }) =>
    !disabled && toggled
      ? 'radial-gradient(101.8% 4091.31% at 0% 0%, #4673FA 0%, #9646FA 100%)'
      : theme.backgroundInteractive};
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};
  :hover {
    background-color: ${({ theme }) => theme.hoverState};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `${duration.fast} background-color ${timing.in}`};
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 12px 12px 12px 12px;
  }
`

const SweepText = styled(ThemedText.BodyPrimary)`
  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    display: none;
  }
`

export const LoadingButton = styled.div`
  border-radius: 12px;
  height: 44px;
  width: 114px;
  animation: ${loadingAnimation} 1.5s infinite;
  animation-fill-mode: both;
  background: linear-gradient(
    to left,
    ${({ theme }) => theme.backgroundInteractive} 25%,
    ${({ theme }) => theme.backgroundOutline} 50%,
    ${({ theme }) => theme.backgroundInteractive} 75%
  );
  will-change: background-position;
  background-size: 400%;
`

export const DEFAULT_ASSET_QUERY_AMOUNT = 25

const loadingAssets = (
  <>
    {Array.from(Array(DEFAULT_ASSET_QUERY_AMOUNT), (_, index) => (
      <CollectionAssetLoading key={index} />
    ))}
  </>
)

export const CollectionNftsLoading = () => (
  <Box width="full" className={styles.assetList}>
    {loadingAssets}
  </Box>
)

export const CollectionNftsAndMenuLoading = () => (
  <Column alignItems="flex-start" position="relative" width="full">
    <Row marginY="12" gap="12">
      <Box className={loadingAsset} borderRadius="12" width={{ sm: '44', md: '100' }} height="44" />
      <Box
        className={loadingAsset}
        borderRadius="12"
        height="44"
        display={{ sm: 'none', md: 'flex' }}
        style={{ width: '220px' }}
      />
      <Box className={loadingAsset} borderRadius="12" height="44" width={{ sm: '276', md: '332' }} />
    </Row>
    <CollectionNftsLoading />
  </Column>
)

export const CollectionNfts = ({ contractAddress, collectionStats, rarityVerified }: CollectionNftsProps) => {
  const { chainId } = useWeb3React()
  const traits = useCollectionFilters((state) => state.traits)
  const minPrice = useCollectionFilters((state) => state.minPrice)
  const maxPrice = useCollectionFilters((state) => state.maxPrice)
  const markets = useCollectionFilters((state) => state.markets)
  const sortBy = useCollectionFilters((state) => state.sortBy)
  const searchByNameText = useCollectionFilters((state) => state.search)
  const setMarketCount = useCollectionFilters((state) => state.setMarketCount)
  const setSortBy = useCollectionFilters((state) => state.setSortBy)
  const buyNow = useCollectionFilters((state) => state.buyNow)

  const setPriceRangeLow = usePriceRange((state) => state.setPriceRangeLow)
  const priceRangeLow = usePriceRange((state) => state.priceRangeLow)
  const priceRangeHigh = usePriceRange((state) => state.priceRangeHigh)
  const setPriceRangeHigh = usePriceRange((state) => state.setPriceRangeHigh)
  const setPrevMinMax = usePriceRange((state) => state.setPrevMinMax)

  const setIsCollectionNftsLoading = useIsCollectionLoading((state) => state.setIsCollectionNftsLoading)
  const removeTrait = useCollectionFilters((state) => state.removeTrait)
  const removeMarket = useCollectionFilters((state) => state.removeMarket)
  const reset = useCollectionFilters((state) => state.reset)
  const setMin = useCollectionFilters((state) => state.setMinPrice)
  const setMax = useCollectionFilters((state) => state.setMaxPrice)
  const isNftGraphQl = useNftGraphQlFlag() === NftGraphQlVariant.Enabled

  const toggleBag = useBag((state) => state.toggleBag)
  const bagExpanded = useBag((state) => state.bagExpanded)

  const debouncedMinPrice = useDebounce(minPrice, 500)
  const debouncedMaxPrice = useDebounce(maxPrice, 500)
  const debouncedSearchByNameText = useDebounce(searchByNameText, 500)

  const [sweepIsOpen, setSweepOpen] = useState(false)

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
        return lastPage?.flat().length === DEFAULT_ASSET_QUERY_AMOUNT ? pages.length : null
      },
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchInterval: 5000,
    }
  )
  const {
    assets: nftQueryAssets,
    loadNext,
    hasNext,
    isLoadingNext,
  } = useAssetsQuery(
    isNftGraphQl ? contractAddress : '',
    SortByQueries[sortBy].field,
    SortByQueries[sortBy].asc,
    {
      listed: buyNow,
      marketplaces: markets.length > 0 ? markets.map((market) => market.toUpperCase() as NftMarketplace) : undefined,
      maxPrice: debouncedMaxPrice ? parseEther(debouncedMaxPrice).toString() : undefined,
      minPrice: debouncedMinPrice ? parseEther(debouncedMinPrice).toString() : undefined,
      tokenSearchQuery: debouncedSearchByNameText,
      traits:
        traits.length > 0
          ? traits.map((trait) => {
              return { name: trait.trait_type, values: [trait.trait_value] } as unknown as NftAssetTraitInput
            })
          : undefined,
    },
    DEFAULT_ASSET_QUERY_AMOUNT
  )

  const [uniformHeight, setUniformHeight] = useState<UniformHeight>(UniformHeights.unset)
  const [currentTokenPlayingMedia, setCurrentTokenPlayingMedia] = useState<string | undefined>()
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const oldStateRef = useRef<CollectionFilters | null>(null)
  const isMobile = useIsMobile()

  const collectionNfts = useMemo(() => {
    if (
      (isNftGraphQl && !nftQueryAssets && !isLoadingNext) ||
      (!isNftGraphQl && !collectionAssets) ||
      !AssetsFetchSuccess
    )
      return undefined

    return isNftGraphQl ? nftQueryAssets : collectionAssets?.pages.flat()
  }, [AssetsFetchSuccess, collectionAssets, isLoadingNext, isNftGraphQl, nftQueryAssets])

  const wrappedLoadingState = isNftGraphQl ? isLoadingNext : isLoading
  const wrappedHasNext = isNftGraphQl ? hasNext : hasNextPage ?? false

  useEffect(() => {
    setIsCollectionNftsLoading(wrappedLoadingState)
  }, [wrappedLoadingState, setIsCollectionNftsLoading])

  const hasRarity = getRarityStatus(rarityStatusCache, collectionStats?.address, collectionNfts)

  const sortDropDownOptions: DropDownOption[] = useMemo(
    () =>
      hasRarity
        ? [
            {
              displayText: 'Low to High',
              onClick: () => setSortBy(SortBy.LowToHigh),
              icon: nonRarityIcon,
              reverseIndex: 2,
            },
            {
              displayText: 'High to Low',
              onClick: () => setSortBy(SortBy.HighToLow),
              icon: nonRarityIcon,
              reverseIndex: 1,
            },
            {
              displayText: 'Rare to Common',
              onClick: () => setSortBy(SortBy.RareToCommon),
              icon: rarityIcon,
              reverseIndex: 4,
            },
            {
              displayText: 'Common to Rare',
              onClick: () => setSortBy(SortBy.CommonToRare),
              icon: rarityIcon,
              reverseIndex: 3,
            },
          ]
        : [
            {
              displayText: 'Low to High',
              onClick: () => setSortBy(SortBy.LowToHigh),
              icon: nonRarityIcon,
              reverseIndex: 2,
            },
            {
              displayText: 'High to Low',
              onClick: () => setSortBy(SortBy.HighToLow),
              icon: nonRarityIcon,
              reverseIndex: 1,
            },
          ],
    [hasRarity, setSortBy]
  )

  useEffect(() => {
    setUniformHeight(UniformHeights.unset)
    setSweepOpen(false)
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
  const hasErc1155s = hasNfts && collectionNfts[0] && collectionNfts[0].tokenType === TokenType.ERC1155

  const minMaxPriceChipText: string | undefined = useMemo(() => {
    if (debouncedMinPrice && debouncedMaxPrice) {
      return `Price: ${debouncedMinPrice} - ${debouncedMaxPrice} ETH`
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

  useEffect(() => {
    if (collectionStats && collectionStats.stats?.floor_price) {
      const lowValue = collectionStats.stats?.floor_price
      const maxValue = 10 * collectionStats.stats?.floor_price

      if (priceRangeLow === '') {
        setPriceRangeLow(lowValue?.toFixed(2))
      }

      if (priceRangeHigh === '') {
        setPriceRangeHigh(maxValue.toFixed(2))
      }
    }
  }, [collectionStats, priceRangeLow, priceRangeHigh, setPriceRangeHigh, setPriceRangeLow])

  return (
    <>
      <AnimatedBox position="sticky" top="72" width="full" zIndex="3" marginBottom={{ sm: '8', md: '20' }}>
        <Box
          backgroundColor="backgroundBackdrop"
          width="full"
          paddingTop={{ sm: '12', md: '16' }}
          paddingBottom={{ sm: '12', md: '16' }}
        >
          <ActionsContainer>
            <ActionsSubContainer>
              <TraceEvent
                events={[Event.onClick]}
                element={ElementName.NFT_FILTER_BUTTON}
                name={EventName.NFT_FILTER_OPENED}
                shouldLogImpression={!isFiltersExpanded}
                properties={{ collection_address: contractAddress, chain_id: chainId }}
              >
                <FilterButton
                  isMobile={isMobile}
                  isFiltersExpanded={isFiltersExpanded}
                  onClick={() => setFiltersExpanded(!isFiltersExpanded)}
                />
              </TraceEvent>
              <SortDropdownContainer isFiltersExpanded={isFiltersExpanded}>
                <SortDropdown dropDownOptions={sortDropDownOptions} />
              </SortDropdownContainer>
              <CollectionSearch />
            </ActionsSubContainer>
            {!hasErc1155s ? (
              isLoading ? (
                <LoadingButton />
              ) : (
                <SweepButton
                  toggled={sweepIsOpen}
                  disabled={!buyNow}
                  className={buttonTextMedium}
                  onClick={() => {
                    if (!buyNow || hasErc1155s) return
                    if (!sweepIsOpen) {
                      scrollToTop()
                      if (!bagExpanded && !isMobile) toggleBag()
                    }
                    setSweepOpen(!sweepIsOpen)
                  }}
                >
                  <SweepIcon viewBox="0 0 24 24" width="20px" height="20px" />
                  <SweepText fontWeight={600} color="currentColor" lineHeight="20px">
                    Sweep
                  </SweepText>
                </SweepButton>
              )
            ) : null}
          </ActionsContainer>
          <Sweep
            contractAddress={contractAddress}
            collectionStats={collectionStats}
            minPrice={debouncedMinPrice}
            maxPrice={debouncedMaxPrice}
            showSweep={sweepIsOpen && buyNow && !hasErc1155s}
          />
          <Row
            paddingTop={!!markets.length || !!traits.length || minMaxPriceChipText ? '12' : '0'}
            gap="8"
            flexWrap="wrap"
          >
            {markets.map((market) => (
              <TraitChip
                key={market}
                value={MARKETPLACE_ITEMS[market as keyof typeof MARKETPLACE_ITEMS]}
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
                  setPrevMinMax([0, 100])
                }}
              />
            )}
            {!!traits.length || !!markets.length || minMaxPriceChipText ? (
              <ClearAllButton
                onClick={() => {
                  reset()
                  setPrevMinMax([0, 100])
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
        next={() => (isNftGraphQl ? loadNext(DEFAULT_ASSET_QUERY_AMOUNT) : fetchNextPage())}
        hasMore={wrappedHasNext}
        loader={wrappedHasNext && hasNfts ? loadingAssets : null}
        dataLength={collectionNfts?.length ?? 0}
        style={{ overflow: 'unset' }}
        className={hasNfts || wrappedLoadingState ? styles.assetList : undefined}
      >
        {hasNfts ? (
          Nfts
        ) : collectionNfts?.length === 0 ? (
          <Center width="full" color="textSecondary" textAlign="center" style={{ height: '60vh' }}>
            <EmptyCollectionWrapper>
              <p className={headlineMedium}>No NFTS found</p>
              <Box
                onClick={reset}
                type="button"
                className={clsx(bodySmall, buttonTextMedium)}
                color="blue"
                cursor="pointer"
              >
                <ViewFullCollection>View full collection</ViewFullCollection>
              </Box>
            </EmptyCollectionWrapper>
          </Center>
        ) : isNftGraphQl ? (
          <CollectionNftsLoading />
        ) : (
          loadingAssets
        )}
      </InfiniteScroll>
    </>
  )
}
