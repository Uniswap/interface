import { isMobileWeb } from '@universe/environment'
import { Flex, UniversalList, type UniversalListRenderItemInfo, View } from '@universe/mycelium'
import { NoNfts } from '@universe/mycelium/icons/NoNfts'
import { TestID } from '@universe/test'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { useNftListRenderData } from 'uniswap/src/components/nfts/hooks/useNftListRenderData'
import { useNftSearch } from 'uniswap/src/components/nfts/hooks/useNftSearch'
import type { NftsListItem, NftsListProps } from 'uniswap/src/components/nfts/NftsList'
import { NftsListEmptyState } from 'uniswap/src/components/nfts/NftsListEmptyState'
import { NftListHeader } from 'uniswap/src/components/nfts/NftsListHeader'
import { NftsListLoadingFooter } from 'uniswap/src/components/nfts/NftsListLoadingFooter'
import { ShowNFTModal } from 'uniswap/src/components/nfts/ShowNFTModal'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import {
  HIDDEN_NFTS_ROW,
  NFT_GRID_DEFAULT_COLUMNS,
  NFT_GRID_MIN_COLUMN_WIDTH,
  NFT_GRID_ROW_HEIGHT,
} from 'uniswap/src/features/nfts/constants'
import { getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useContainerWidth } from 'utilities/src/react/useContainerWidth'

// Off-screen buffer. Mobile web stays below desktop because each card is ~half the viewport wide,
// but the previous two rows sat under one phone viewport, so a fling scrolled onto blank cells.
const DRAW_DISTANCE = NFT_GRID_ROW_HEIGHT * (isMobileWeb ? 5 : 12)

/**
 * The hidden count grows as pages arrive. Routed through context rather than `extraData` so paging
 * doesn't invalidate every cell — with `numColumns` and `getItemSpan` both set, an `extraData`
 * change forces a full item-position recalculation, and mobile web pages more often than desktop.
 */
const HiddenNftsCountContext = createContext(0)
// Trigger the next page while roughly three rows remain, matching the old lastVisibleRowIndex check.
const END_REACHED_THRESHOLD = 0.3

const keyExtractor = (item: NftsListItem): string =>
  typeof item === 'string' ? item : getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? '')

/** Takes the count from context, so a newly-paged-in batch doesn't have to invalidate every cell. */
function HiddenNftsExpander({
  isExpanded,
  onPress,
  renderExpandoRow,
}: {
  isExpanded: boolean
  onPress: () => void
  renderExpandoRow: NftsListProps['renderExpandoRow']
}): JSX.Element {
  const { t } = useTranslation()
  const numHidden = useContext(HiddenNftsCountContext)
  const label = t('hidden.nfts.info.text.button', { numHidden })

  return (
    <Flex grow>
      {renderExpandoRow ? (
        renderExpandoRow({ isExpanded, label, onPress })
      ) : (
        <ExpandoRow
          isExpanded={isExpanded}
          data-testid={TestID.HiddenNftsRow}
          label={label}
          mx="$spacing4"
          onPress={onPress}
        />
      )}
      {isExpanded && <ShowNFTModal />}
    </Flex>
  )
}

function AssetsContainer({
  useGrid,
  autoColumns,
  children,
}: {
  useGrid?: boolean
  autoColumns?: boolean
  children: ReactNode
}): JSX.Element {
  return (
    <View
      width="100%"
      gap="$spacing2"
      style={
        useGrid
          ? {
              display: 'grid',
              // default to 2 columns
              gridTemplateColumns: autoColumns
                ? 'repeat(auto-fill, minmax(200px, 1fr))'
                : 'minmax(0, 1fr) minmax(0, 1fr)',
              gridGap: '12px',
            }
          : undefined
      }
    >
      {children}
    </View>
  )
}

export function NftsList({
  owner,
  errorStateStyle,
  emptyStateStyle,
  renderNFTItem,
  skip,
  customEmptyState,
  autoColumns = false,
  loadingSkeletonCount = 6,
  customLoadingState,
  filteredNumHidden,
  chainsFilter,
  onFilteredCountsChange,
  renderExpandoRow,
  onRefetchReady,
  onLoadingStateChange,
  SearchInputComponent,
  searchInputTestId,
  headerTestId,
  noResultsTestId,
  emptyStateTestId,
  pollInterval,
}: NftsListProps): JSX.Element {
  const { t } = useTranslation()
  const { evmAddress, svmAddress } = useActiveAddresses()
  const isExternalWallet = evmAddress !== owner && svmAddress !== owner

  const {
    numHidden: internalNumHidden,
    numShown: internalNumShown,
    isErrorState,
    hasNextPage,
    hiddenNftsExpanded,
    setHiddenNftsExpanded,
    isPending,
    isFetchingMore: isFetchingMoreNfts,
    onListEndReached,
    refetch,
    shownNfts,
    hiddenNfts,
  } = useNftListRenderData({ owner, skip, chainsFilter, pollInterval })

  // Expose refetch function to parent component
  useEffect(() => {
    if (onRefetchReady) {
      onRefetchReady(refetch)
    }
  }, [onRefetchReady, refetch])

  // Expose loading state to parent component
  const isLoadingState = shownNfts.length === 0 && isPending
  useEffect(() => {
    if (onLoadingStateChange) {
      onLoadingStateChange(isLoadingState)
    }
  }, [onLoadingStateChange, isLoadingState])

  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)

  const { search, setSearch, nfts, filteredShownNfts, filteredHiddenNfts, filteredShownCount, filteredHiddenCount } =
    useNftSearch({
      shownNfts,
      hiddenNfts,
      hiddenNftsExpanded,
      hasNextPage,
    })
  // NftListHeader owns its own local input state (with debounce). Bumping this key remounts the header
  // so a parent-initiated clear (e.g. the no-results "Clear search" button) actually empties the input.
  const [headerResetKey, setHeaderResetKey] = useState(0)
  const clearSearch = useCallback(() => {
    setSearch('')
    setHeaderResetKey((prev) => prev + 1)
  }, [setSearch])
  const showHeader = shownNfts.length !== 0 || isLoadingState || isErrorState

  // Use filtered count if provided, otherwise use internal count
  const numHidden = filteredNumHidden ?? (search ? filteredHiddenCount : internalNumHidden)

  // Notify parent of filtered counts (or unfiltered counts if no search)
  useEffect(() => {
    if (onFilteredCountsChange) {
      onFilteredCountsChange({ shown: filteredShownCount, hidden: filteredHiddenCount })
    }
  }, [onFilteredCountsChange, filteredShownCount, filteredHiddenCount])

  // Track NFTs loaded only when initial data loads, not when filtering changes
  useEffect(() => {
    sendAnalyticsEvent(WalletEventName.NFTsLoaded, { shown: internalNumShown, hidden: internalNumHidden })
  }, [internalNumShown, internalNumHidden])

  useEffect(() => {
    if (numHidden === 0 && hiddenNftsExpanded) {
      setHiddenNftsExpanded(false)
    }
  }, [hiddenNftsExpanded, numHidden, setHiddenNftsExpanded])

  const numColumns = useMemo(
    () =>
      autoColumns && containerWidth > 0
        ? Math.max(1, Math.floor(containerWidth / NFT_GRID_MIN_COLUMN_WIDTH))
        : NFT_GRID_DEFAULT_COLUMNS,
    [autoColumns, containerWidth],
  )
  // Hidden NFTs render below the expando; matches the buildNftsArray gate (showHidden && allPagesFetched)
  const showHiddenGrid = hiddenNftsExpanded && filteredHiddenNfts.length > 0
  const isFetchingMore = nfts.length > 0 && isFetchingMoreNfts

  // One flat grid: shown NFTs, the full-width hidden-NFTs expander, then the hidden NFTs it reveals.
  const listData = useMemo((): NftsListItem[] => {
    const rows: NftsListItem[] = [...filteredShownNfts]
    if (numHidden > 0) {
      rows.push(HIDDEN_NFTS_ROW)
    }
    if (showHiddenGrid) {
      rows.push(...filteredHiddenNfts)
    }
    return rows
  }, [filteredShownNfts, numHidden, showHiddenGrid, filteredHiddenNfts])

  const handleEndReached = useCallback((): void => {
    if (hasNextPage && !isLoadingState && !isFetchingMore) {
      // oxlint-disable-next-line typescript/no-floating-promises -- biome-parity: oxlint is stricter here
      onListEndReached()
    }
  }, [hasNextPage, isLoadingState, isFetchingMore, onListEndReached])

  const onHiddenRowPressed = useCallback((): void => {
    setHiddenNftsExpanded(!hiddenNftsExpanded)
  }, [hiddenNftsExpanded, setHiddenNftsExpanded])

  const skeletonContent = useMemo(
    () => (
      <AssetsContainer useGrid autoColumns={autoColumns}>
        {customLoadingState ?? Array.from({ length: loadingSkeletonCount }, (_, i) => <Loader.NFT key={i} />)}
      </AssetsContainer>
    ),
    [autoColumns, customLoadingState, loadingSkeletonCount],
  )

  const nonNftContent = useMemo((): JSX.Element | null => {
    if (isLoadingState) {
      return skeletonContent
    }

    if (isErrorState) {
      return (
        <Flex centered grow style={errorStateStyle}>
          <BaseCard.ErrorState
            description={t('common.error.general')}
            retryButtonLabel={t('common.button.retry')}
            title={t('tokens.nfts.list.error.load.title')}
            onRetry={refetch}
          />
        </Flex>
      )
    }

    // Show no-results when user has searched and the filtered list is empty (explicit check so we always hit this when filtering yields nothing).
    if (search && filteredShownCount === 0 && !isFetchingMore) {
      return (
        <Flex py="$spacing40" width="100%">
          <BaseCard.EmptyState
            icon={<NoNfts size="$icon.64" color="$neutral3" />}
            description={t('portfolio.noResults.search.title')}
            buttonLabel={t('portfolio.noResults.search.clear')}
            dataTestId={noResultsTestId}
            onPress={clearSearch}
          />
        </Flex>
      )
    }

    if (nfts.length === 0) {
      const defaultEmptyState = <NftsListEmptyState containerStyle={emptyStateStyle} dataTestId={emptyStateTestId} />
      return (customEmptyState ?? defaultEmptyState) as JSX.Element
    }

    return null
  }, [
    customEmptyState,
    emptyStateStyle,
    emptyStateTestId,
    errorStateStyle,
    filteredShownCount,
    isErrorState,
    isFetchingMore,
    isLoadingState,
    nfts.length,
    noResultsTestId,
    skeletonContent,
    refetch,
    search,
    clearSearch,
    t,
  ])

  // No header renders and no rows fill the grid, so the header gap and the loading footer's reserved
  // height would both land as dead space above the hidden-NFTs expando row
  const hasOnlyHiddenNfts = !showHeader && !nonNftContent

  // The expander spans the full grid width rather than sitting in one column.
  const getItemSpan = useCallback(
    (item: NftsListItem): number | undefined => (item === HIDDEN_NFTS_ROW ? numColumns : undefined),
    [numColumns],
  )

  const renderItem = useCallback(
    ({ item, index }: UniversalListRenderItemInfo<NftsListItem>): JSX.Element | null => {
      if (typeof item !== 'string') {
        return renderNFTItem(item, index)
      }
      if (item !== HIDDEN_NFTS_ROW) {
        return null
      }
      return (
        <HiddenNftsExpander
          isExpanded={hiddenNftsExpanded}
          renderExpandoRow={renderExpandoRow}
          onPress={onHiddenRowPressed}
        />
      )
    },
    [hiddenNftsExpanded, onHiddenRowPressed, renderExpandoRow, renderNFTItem],
  )

  // Both only ever render while more shown NFTs are still paging in, and hidden NFTs are gated on
  // every page having been fetched — so neither can appear below the hidden grid.
  const listFooter = useMemo(
    () => (
      <>
        {!hasOnlyHiddenNfts && <NftsListLoadingFooter show={Boolean(search) && hasNextPage} />}
        {isFetchingMore && !search && skeletonContent}
      </>
    ),
    [hasOnlyHiddenNfts, search, hasNextPage, isFetchingMore, skeletonContent],
  )

  const nftListContent = (
    <HiddenNftsCountContext.Provider value={numHidden}>
      <UniversalList
        // The page is the scroller: an inner container here would virtualize against an unbounded
        // parent, grow to full content height and reserve a second scrollbar.
        useWindowScroll
        data={listData}
        drawDistance={DRAW_DISTANCE}
        estimatedItemSize={NFT_GRID_ROW_HEIGHT}
        // A mounted cell invalidates only on (key, item, extraData), so everything `renderItem`
        // closes over has to reach here — the expander is a constant string whose (key, item) never
        // change. Keyed on the callback itself rather than a copy of its dependency list: its
        // identity already aggregates them, so the two can't drift apart. `useCallback` keeps it
        // stable, which matters because this list sets `numColumns` and `getItemSpan`, where a new
        // identity forces a full item-position recalculation.
        extraData={renderItem}
        getItemSpan={getItemSpan}
        keyExtractor={keyExtractor}
        ListFooterComponent={listFooter}
        numColumns={numColumns}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
      />
    </HiddenNftsCountContext.Provider>
  )

  return (
    <Flex ref={containerRef}>
      {showHeader && (
        <NftListHeader
          key={headerResetKey}
          isExternalWallet={isExternalWallet}
          SearchInputComponent={SearchInputComponent}
          searchInputTestId={searchInputTestId}
          headerTestId={headerTestId}
          onSearchValueChange={setSearch}
        />
      )}
      <Flex mt={hasOnlyHiddenNfts ? undefined : '$spacing24'}>{nonNftContent ?? nftListContent}</Flex>
    </Flex>
  )
}
