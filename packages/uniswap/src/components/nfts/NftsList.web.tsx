import { NetworkStatus } from '@apollo/client'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { isNonPollingRequestInFlight } from '@universe/api'
import { isMobileWeb } from '@universe/environment'
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Loader, styled, View } from 'ui/src'
import { NoNfts } from 'ui/src/components/icons/NoNfts'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { useContainerWidth } from 'uniswap/src/components/nfts/hooks/useContainerWidth'
import { useNftListRenderData } from 'uniswap/src/components/nfts/hooks/useNftListRenderData'
import { useNftSearch } from 'uniswap/src/components/nfts/hooks/useNftSearch'
import { NftsListProps } from 'uniswap/src/components/nfts/NftsList'
import { NftsListEmptyState } from 'uniswap/src/components/nfts/NftsListEmptyState'
import { NftListHeader } from 'uniswap/src/components/nfts/NftsListHeader'
import { ShowNFTModal } from 'uniswap/src/components/nfts/ShowNFTModal'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import {
  NFT_GRID_DEFAULT_COLUMNS,
  NFT_GRID_MIN_COLUMN_WIDTH,
  NFT_GRID_ROW_HEIGHT,
} from 'uniswap/src/features/nfts/constants'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const estimateRowSize = (): number => NFT_GRID_ROW_HEIGHT

const AssetsContainer = styled(View, {
  width: '100%',
  gap: '$spacing2',
  variants: {
    useGrid: {
      true: {
        '$platform-web': {
          display: 'grid',
          // default to 2 columns
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gridGap: '12px',
        },
      },
    },
    autoColumns: {
      true: {
        '$platform-web': {
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        },
      },
    },
  },
})

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
  nextFetchPolicy,
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
    networkStatus,
    onListEndReached,
    refetch,
    shownNfts,
    hiddenNfts,
  } = useNftListRenderData({ owner, skip, chainsFilter, nextFetchPolicy, pollInterval })

  // Expose refetch function to parent component
  useEffect(() => {
    if (onRefetchReady) {
      onRefetchReady(refetch)
    }
  }, [onRefetchReady, refetch])

  // Expose loading state to parent component
  const isLoadingState = isNonPollingRequestInFlight(networkStatus)
  useEffect(() => {
    if (onLoadingStateChange) {
      onLoadingStateChange(isLoadingState)
    }
  }, [onLoadingStateChange, isLoadingState])

  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerWidth(containerRef)

  const { search, setSearch, nfts, filteredShownCount, filteredHiddenCount } = useNftSearch({
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

  const keyExtractor = (item: NFTItem | string): string =>
    typeof item === 'string' ? item : getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? '')

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

  const gridItems = useMemo(() => nfts.filter((item): item is NFTItem => typeof item !== 'string'), [nfts])
  const numColumns = useMemo(
    () =>
      autoColumns && containerWidth > 0
        ? Math.max(1, Math.floor(containerWidth / NFT_GRID_MIN_COLUMN_WIDTH))
        : NFT_GRID_DEFAULT_COLUMNS,
    [autoColumns, containerWidth],
  )
  const rowCount = Math.ceil(gridItems.length / numColumns)
  const isFetchingMore = nfts.length > 0 && networkStatus === NetworkStatus.fetchMore

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: estimateRowSize,
    overscan: isMobileWeb ? 2 : 12,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()

  const lastVisibleRowIndex = virtualRows[virtualRows.length - 1]?.index
  useEffect(() => {
    if (lastVisibleRowIndex === undefined) {
      return
    }
    if (lastVisibleRowIndex >= rowCount - 3 && hasNextPage && !isLoadingState && !isFetchingMore) {
      // oxlint-disable-next-line typescript/no-floating-promises -- biome-parity: oxlint is stricter here
      onListEndReached()
    }
  }, [lastVisibleRowIndex, rowCount, hasNextPage, isLoadingState, isFetchingMore, onListEndReached])

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

    // Show no-results when user has searched and the filtered list is empty (explicit check so we always hit this when filtering yields nothing)
    if (search && filteredShownCount === 0) {
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
    isLoadingState,
    nfts.length,
    noResultsTestId,
    skeletonContent,
    refetch,
    search,
    clearSearch,
    t,
  ])

  // Virtual grid renders fresh on every virtualizer tick — intentionally outside useMemo.
  const nftListContent = (
    <>
      <Flex position="relative" style={{ height: rowVirtualizer.getTotalSize() }}>
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * numColumns
          const rowItems = gridItems.slice(startIndex, startIndex + numColumns)
          return (
            <Flex
              key={virtualRow.key}
              position="absolute"
              top={0}
              left={0}
              width="100%"
              gap="$spacing12"
              height={virtualRow.size}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${numColumns}, minmax(0, 1fr))`,
                transform: `translateY(${virtualRow.start}px)`,
                willChange: 'transform',
                contain: 'strict',
                contentVisibility: 'auto',
              }}
            >
              {rowItems.map((item, i) => (
                <Fragment key={keyExtractor(item)}>{renderNFTItem(item, startIndex + i)}</Fragment>
              ))}
            </Flex>
          )
        })}
      </Flex>
      {isFetchingMore && skeletonContent}
      {numHidden > 0 && (
        <Flex grow>
          {renderExpandoRow ? (
            renderExpandoRow({
              isExpanded: hiddenNftsExpanded,
              label: t('hidden.nfts.info.text.button', { numHidden }),
              onPress: onHiddenRowPressed,
            })
          ) : (
            <ExpandoRow
              isExpanded={hiddenNftsExpanded}
              data-testid={TestID.HiddenNftsRow}
              label={t('hidden.nfts.info.text.button', { numHidden })}
              mx="$spacing4"
              onPress={onHiddenRowPressed}
            />
          )}
          {hiddenNftsExpanded && <ShowNFTModal />}
        </Flex>
      )}
    </>
  )

  return (
    <Flex ref={containerRef} gap="$spacing24">
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
      {nonNftContent ?? nftListContent}
    </Flex>
  )
}
