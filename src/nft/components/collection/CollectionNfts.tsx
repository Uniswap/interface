import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, ElementName, EventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import clsx from 'clsx'
import { loadingAnimation } from 'components/Loader/styled'
import { parseEther } from 'ethers/lib/utils'
import { NftAssetTraitInput, NftMarketplace } from 'graphql/data/nft/__generated__/AssetQuery.graphql'
import {
  ASSET_PAGE_SIZE,
  AssetFetcherParams,
  useLazyLoadAssetsQuery,
  useLoadSweepAssetsQuery,
} from 'graphql/data/nft/Asset'
import useDebounce from 'hooks/useDebounce'
import { AnimatedBox, Box } from 'nft/components/Box'
import { CollectionSearch, FilterButton } from 'nft/components/collection'
import { CollectionAsset } from 'nft/components/collection/CollectionAsset'
import * as styles from 'nft/components/collection/CollectionNfts.css'
import { SortDropdown } from 'nft/components/common/SortDropdown'
import { Center, Column, Row } from 'nft/components/Flex'
import { SweepIcon } from 'nft/components/icons'
import { bodySmall, buttonTextMedium, headlineMedium } from 'nft/css/common.css'
import { loadingAsset } from 'nft/css/loading.css'
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
import { DropDownOption, GenieCollection, Markets, TokenType, UniformHeight, UniformHeights } from 'nft/types'
import { getRarityStatus } from 'nft/utils/asset'
import { pluralize } from 'nft/utils/roundAndPluralize'
import { scrollToTop } from 'nft/utils/scrollToTop'
import { applyFiltersFromURL, syncLocalFiltersWithURL } from 'nft/utils/urlParams'
import { useEffect, useMemo, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { CollectionAssetLoading } from './CollectionAssetLoading'
import { MARKETPLACE_ITEMS } from './MarketplaceSelect'
import { Sweep, useSweepFetcherParams } from './Sweep'
import { TraitChip } from './TraitChip'

interface CollectionNftsProps {
  contractAddress: string
  collectionStats: GenieCollection
  rarityVerified?: boolean
}

const rarityStatusCache = new Map<string, boolean>()

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
  margin-right: 14px;
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

const loadingAssets = (
  <>
    {Array.from(Array(ASSET_PAGE_SIZE), (_, index) => (
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

export const getSortDropdownOptions = (setSortBy: (sortBy: SortBy) => void, hasRarity: boolean): DropDownOption[] => {
  const options = [
    {
      displayText: 'Price: Low to High',
      onClick: () => setSortBy(SortBy.LowToHigh),
      reverseIndex: 2,
      sortBy: SortBy.LowToHigh,
    },
    {
      displayText: 'Price: High to Low',
      onClick: () => setSortBy(SortBy.HighToLow),
      reverseIndex: 1,
      sortBy: SortBy.HighToLow,
    },
  ]
  return hasRarity
    ? options.concat([
        {
          displayText: 'Rarity: Rare to Common',
          onClick: () => setSortBy(SortBy.RareToCommon),
          reverseIndex: 4,
          sortBy: SortBy.RareToCommon,
        },
        {
          displayText: 'Rarity: Common to Rare',
          onClick: () => setSortBy(SortBy.CommonToRare),
          reverseIndex: 3,
          sortBy: SortBy.CommonToRare,
        },
      ])
    : options
}

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
  const setHasRarity = useCollectionFilters((state) => state.setHasRarity)

  const toggleBag = useBag((state) => state.toggleBag)
  const bagExpanded = useBag((state) => state.bagExpanded)

  const debouncedMinPrice = useDebounce(minPrice, 500)
  const debouncedMaxPrice = useDebounce(maxPrice, 500)
  const debouncedSearchByNameText = useDebounce(searchByNameText, 500)

  const [sweepIsOpen, setSweepOpen] = useState(false)
  // Load all sweep queries. Loading them on the parent allows lazy-loading, but avoids waterfalling requests.
  const collectionParams = useSweepFetcherParams(contractAddress, 'others', debouncedMinPrice, debouncedMaxPrice)
  const nftxParams = useSweepFetcherParams(contractAddress, Markets.NFTX, debouncedMinPrice, debouncedMaxPrice)
  const nft20Params = useSweepFetcherParams(contractAddress, Markets.NFT20, debouncedMinPrice, debouncedMaxPrice)
  useLoadSweepAssetsQuery(collectionParams, sweepIsOpen)
  useLoadSweepAssetsQuery(nftxParams, sweepIsOpen)
  useLoadSweepAssetsQuery(nft20Params, sweepIsOpen)

  const assetQueryParams: AssetFetcherParams = {
    address: contractAddress,
    orderBy: SortByQueries[sortBy].field,
    asc: SortByQueries[sortBy].asc,
    filter: {
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
    first: ASSET_PAGE_SIZE,
  }

  const { assets: collectionNfts, loadNext, hasNext, isLoadingNext } = useLazyLoadAssetsQuery(assetQueryParams)

  const [uniformHeight, setUniformHeight] = useState<UniformHeight>(UniformHeights.unset)
  const [currentTokenPlayingMedia, setCurrentTokenPlayingMedia] = useState<string | undefined>()
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const oldStateRef = useRef<CollectionFilters | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    setIsCollectionNftsLoading(isLoadingNext)
  }, [isLoadingNext, setIsCollectionNftsLoading])

  const hasRarity = useMemo(() => {
    const hasRarity = getRarityStatus(rarityStatusCache, collectionStats?.address, collectionNfts) ?? false
    setHasRarity(hasRarity)
    return hasRarity
  }, [collectionStats.address, collectionNfts, setHasRarity])

  const sortDropDownOptions: DropDownOption[] = useMemo(
    () => getSortDropdownOptions(setSortBy, hasRarity),
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
                events={[BrowserEvent.onClick]}
                element={ElementName.NFT_FILTER_BUTTON}
                name={EventName.NFT_FILTER_OPENED}
                shouldLogImpression={!isFiltersExpanded}
                properties={{ collection_address: contractAddress, chain_id: chainId }}
              >
                <FilterButton
                  isMobile={isMobile}
                  isFiltersExpanded={isFiltersExpanded}
                  collectionCount={collectionNfts?.[0]?.totalCount ?? 0}
                  onClick={() => setFiltersExpanded(!isFiltersExpanded)}
                />
              </TraceEvent>
              <SortDropdownContainer isFiltersExpanded={isFiltersExpanded}>
                <SortDropdown dropDownOptions={sortDropDownOptions} />
              </SortDropdownContainer>
              <CollectionSearch />
            </ActionsSubContainer>
            {!hasErc1155s ? (
              <SweepButton
                toggled={sweepIsOpen}
                disabled={hasErc1155s}
                className={buttonTextMedium}
                onClick={() => {
                  if (hasErc1155s) return
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
            ) : null}
          </ActionsContainer>
          {sweepIsOpen && (
            <Sweep contractAddress={contractAddress} minPrice={debouncedMinPrice} maxPrice={debouncedMaxPrice} />
          )}
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
        next={() => loadNext(ASSET_PAGE_SIZE)}
        hasMore={hasNext}
        loader={hasNext && hasNfts ? loadingAssets : null}
        dataLength={collectionNfts?.length ?? 0}
        style={{ overflow: 'unset' }}
        className={hasNfts || isLoadingNext ? styles.assetList : undefined}
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
        ) : (
          <CollectionNftsLoading />
        )}
      </InfiniteScroll>
    </>
  )
}
