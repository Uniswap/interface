import { isNonPollingRequestInFlight } from '@universe/api'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Flex, Loader, styled, Text, View } from 'ui/src'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { useNftListRenderData } from 'uniswap/src/components/nfts/hooks/useNftListRenderData'
import { NftsListProps } from 'uniswap/src/components/nfts/NftsList'
import { NftsListEmptyState } from 'uniswap/src/components/nfts/NftsListEmptyState'
import { NftListHeader } from 'uniswap/src/components/nfts/NftsListHeader'
import { ShowNFTModal } from 'uniswap/src/components/nfts/ShowNFTModal'
import { EMPTY_NFT_ITEM, HIDDEN_NFTS_ROW } from 'uniswap/src/features/nfts/constants'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { buildNftsArray, filterNft, getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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

const LOADING_ITEM = 'loading'

const keyExtractor = (item: NFTItem | string): string =>
  typeof item === 'string' ? item : getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? '')

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
  showHeader = false,
  SearchInputComponent,
  searchInputTestId,
  headerTestId,
  noResultsTestId,
  emptyStateTestId,
  pollInterval,
}: NftsListProps): JSX.Element {
  const { t } = useTranslation()

  const [search, setSearch] = useState('')

  const {
    nfts: allNfts,
    numHidden: internalNumHidden,
    numShown: internalNumShown,
    isErrorState,
    hasNextPage,
    shouldAddInLoadingItem,
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

  // Filter NFTs based on search string
  const filteredShownNfts = useMemo(() => {
    if (!search) {
      return shownNfts
    }
    return shownNfts.filter((item) => filterNft(item, search))
  }, [shownNfts, search])

  const filteredHiddenNfts = useMemo(() => {
    if (!search) {
      return hiddenNfts
    }
    return hiddenNfts.filter((item) => filterNft(item, search))
  }, [hiddenNfts, search])

  // Rebuild the nfts array from filtered arrays using the shared logic
  const nfts = useMemo<Array<NFTItem | string>>(() => {
    if (!search) {
      return allNfts
    }

    const result: Array<NFTItem | string> = buildNftsArray({
      shownNfts: filteredShownNfts,
      hiddenNfts: filteredHiddenNfts,
      showHidden: hiddenNftsExpanded,
      allPagesFetched: !hasNextPage,
    })
    return result
  }, [allNfts, filteredShownNfts, filteredHiddenNfts, search, hasNextPage, hiddenNftsExpanded])

  // Calculate filtered counts
  const filteredShownCount = filteredShownNfts.length
  const filteredHiddenCount = filteredHiddenNfts.length

  // Use filtered count if provided, otherwise use internal count
  const numHidden = filteredNumHidden ?? (search ? filteredHiddenCount : internalNumHidden)

  // Notify parent of filtered counts (or unfiltered counts if no search)
  useEffect(() => {
    if (onFilteredCountsChange) {
      onFilteredCountsChange({ shown: filteredShownCount, hidden: filteredHiddenCount })
    }
  }, [onFilteredCountsChange, filteredShownCount, filteredHiddenCount])

  const onHiddenRowPressed = useCallback((): void => {
    setHiddenNftsExpanded(!hiddenNftsExpanded)
  }, [hiddenNftsExpanded, setHiddenNftsExpanded])

  // Track NFTs loaded only when initial data loads, not when filtering changes
  useEffect(() => {
    sendAnalyticsEvent(WalletEventName.NFTsLoaded, {
      shown: internalNumShown,
      hidden: internalNumHidden,
    })
  }, [internalNumShown, internalNumHidden])

  useEffect(() => {
    if (numHidden === 0 && hiddenNftsExpanded) {
      setHiddenNftsExpanded(false)
    }
  }, [hiddenNftsExpanded, numHidden, setHiddenNftsExpanded])

  const renderItem = useCallback(
    (item: string | NFTItem, index: number): JSX.Element | null => {
      if (typeof item !== 'string') {
        return <Fragment key={keyExtractor(item)}>{renderNFTItem(item, index)}</Fragment>
      }

      switch (item) {
        case LOADING_ITEM:
          // This case probably never occurs
          return <Loader.NFT />
        case EMPTY_NFT_ITEM:
          return null
        case HIDDEN_NFTS_ROW:
          return (
            <Flex key={keyExtractor(item)} grow gridColumn="span 2" $platform-web={{ gridColumn: '1 / -1' }}>
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
          )

        default:
          return null
      }
    },
    [hiddenNftsExpanded, numHidden, onHiddenRowPressed, renderNFTItem, t, renderExpandoRow],
  )

  const onRetry = useCallback(() => refetch(), [refetch])

  const itemsToRender = useMemo<Array<NFTItem | string>>(
    () => (shouldAddInLoadingItem ? [...nfts, LOADING_ITEM] : nfts),
    [nfts, shouldAddInLoadingItem],
  )

  // Skeleton content without container (used for initial load inside main AssetsContainer)
  const skeletonContent = useMemo<JSX.Element>((): JSX.Element => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- customLoadingState is typed as JSX.Element | undefined
    return (
      customLoadingState ?? (
        <>
          {Array.from({ length: loadingSkeletonCount }, (_, i) => (
            <Loader.NFT key={i} />
          ))}
        </>
      )
    )
  }, [loadingSkeletonCount, customLoadingState])

  // Loading state with grid container (used for infinite scroll loader)
  const infiniteScrollLoader = useMemo<JSX.Element>(() => {
    return (
      <AssetsContainer useGrid autoColumns={autoColumns} pt="$spacing12">
        {skeletonContent}
      </AssetsContainer>
    )
  }, [skeletonContent, autoColumns])

  const emptyState = useMemo<JSX.Element>((): JSX.Element => {
    const defaultEmptyState = <NftsListEmptyState containerStyle={emptyStateStyle} dataTestId={emptyStateTestId} />
    return (customEmptyState ?? defaultEmptyState) as JSX.Element
  }, [customEmptyState, emptyStateStyle, emptyStateTestId])

  const errorState = useMemo(
    () => (
      <Flex centered grow style={errorStateStyle}>
        <BaseCard.ErrorState
          description={t('common.error.general')}
          retryButtonLabel={t('common.button.retry')}
          title={t('tokens.nfts.list.error.load.title')}
          onRetry={onRetry}
        />
      </Flex>
    ),
    [errorStateStyle, onRetry, t],
  )

  const isEmptyState = (nfts.length === 0 && !isLoadingState) || isErrorState

  const listContent = useMemo<JSX.Element | JSX.Element[]>((): JSX.Element | JSX.Element[] => {
    if (isLoadingState) {
      return skeletonContent
    }

    if (isErrorState) {
      return errorState
    }

    // Show no-results when user has searched and the filtered list is empty (explicit check so we always hit this when filtering yields nothing)
    if (search && filteredShownCount === 0) {
      return (
        <Flex centered p="$spacing12" width="100%" data-testid={noResultsTestId}>
          <Text variant="body3" color="$neutral2">
            {t('common.noResults')}
          </Text>
        </Flex>
      )
    }

    // Use nfts.length so we show empty state when there are no NFTs; itemsToRender can have length 1 when shouldAddInLoadingItem is true
    if (nfts.length === 0) {
      return emptyState
    }

    return itemsToRender.map(renderItem).filter((item): item is JSX.Element => item !== null)
  }, [
    isLoadingState,
    nfts.length,
    filteredShownCount,
    itemsToRender,
    renderItem,
    errorState,
    emptyState,
    skeletonContent,
    isErrorState,
    noResultsTestId,
    search,
    t,
  ])

  return (
    <Flex gap="$spacing24">
      {showHeader && (
        <NftListHeader
          count={filteredShownCount}
          SearchInputComponent={SearchInputComponent}
          searchInputTestId={searchInputTestId}
          headerTestId={headerTestId}
          onSearchValueChange={setSearch}
        />
      )}
      <InfiniteScroll
        next={onListEndReached}
        hasMore={hasNextPage}
        loader={infiniteScrollLoader}
        dataLength={shouldAddInLoadingItem ? nfts.length + 1 : nfts.length}
        style={{ overflow: 'unset' }}
        scrollableTarget="wallet-dropdown-scroll-wrapper"
      >
        {/* only use grid if there are nfts to render (do not apply to empty states) */}
        <AssetsContainer useGrid={!isEmptyState} autoColumns={autoColumns && !isEmptyState}>
          {listContent}
        </AssetsContainer>
      </InfiniteScroll>
    </Flex>
  )
}
