import { Platform } from '@universe/chains'
import { FeatureFlags, useFeatureFlagWithExposureLoggingDisabled } from '@universe/gating'
import { Flex, Loader, UniversalList, type UniversalListRenderItemInfo } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { ExpandoRow } from 'uniswap/src/components/ExpandoRow/ExpandoRow'
import { PositionItem } from 'uniswap/src/components/portfolio/PositionItem/PositionItem'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { PoolsDataIssueBanner } from 'uniswap/src/features/portfolio/pools/PoolsDataIssueBanner'
import { usePoolsOutageBanner } from 'uniswap/src/features/portfolio/pools/usePoolsOutageBanner'
import { PositionsEmptyFilterView } from 'uniswap/src/features/positions/components/PositionsEmptyFilterView'
import {
  POSITION_STATUS_FILTER_TO_STATUSES,
  PositionStatusFilter,
  PositionStatusFilterValue,
} from 'uniswap/src/features/positions/components/PositionStatusFilter'
import { usePoolsPositionsReport } from 'uniswap/src/features/positions/hooks/usePoolsPositionsReport'
import { SORT_BY_USD_VALUE_DESC, useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { filterAndSortPositions, getPositionKey } from 'uniswap/src/features/positions/utils'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { usePendingLiquidityTransactionsChangeListener } from 'wallet/src/features/transactions/hooks/usePendingLiquidityTransactionsChangeListener'

const PAGE_SIZE = 25
const FIRST_PAGE_LOADER_ROW_COUNT = 6
const NEXT_PAGE_LOADER_ROW_COUNT = 2

/**
 * The tab's two position groups flattened into the single row array `UniversalList` takes: the
 * visible positions (or the empty-filter view standing in for them), then the hidden-positions
 * toggle and, while it's open, the hidden positions.
 */
type PoolsRow =
  | { type: 'emptyFilter'; key: string }
  | { type: 'hiddenToggle'; key: string }
  | { type: 'position'; key: string; position: PositionInfo; isVisible: boolean }

/**
 * Resolves its own label rather than taking a string: the toggle row object is stable, so the cell
 * memoizes on an unchanged `(key, item)` and a parent-resolved string would keep the old language
 * after a locale switch. `useTranslation` re-renders this component directly on `languageChanged`.
 * Same reason `HiddenTokensRow` does it this way.
 */
function HiddenPoolsRow({
  isExpanded,
  numHidden,
  onPress,
}: {
  isExpanded: boolean
  numHidden: number
  onPress: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <ExpandoRow isExpanded={isExpanded} label={t('hidden.pools.info.text.button', { numHidden })} onPress={onPress} />
  )
}

function rowKey(row: PoolsRow): string {
  return row.key
}

function rowType(row: PoolsRow): string {
  return row.type
}

export const PoolsTab = memo(function PoolsTabInner({
  address,
  skip,
  openPositionsCount = 0,
}: {
  address: Address
  skip?: boolean
  openPositionsCount?: number
}): JSX.Element {
  const { t } = useTranslation()
  const { chains } = useEnabledChains({ platform: Platform.EVM })
  const portfolioPoolsBalancesEnabled = useFeatureFlagWithExposureLoggingDisabled(FeatureFlags.PortfolioPoolsBalances)
  const outageBanner = usePoolsOutageBanner({ evmAddress: address, enabled: portfolioPoolsBalancesEnabled })

  const { value: hiddenExpanded, toggle: toggleHidden } = useBooleanState(false)
  const [statusFilter, setStatusFilter] = useState<PositionStatusFilterValue>(PositionStatusFilterValue.Open)
  const viewOpenPositions = useEvent(() => setStatusFilter(PositionStatusFilterValue.Open))
  const filterStatuses = POSITION_STATUS_FILTER_TO_STATUSES[statusFilter]

  // Fetch every status once and filter client-side, so toggling the pill never refetches and this
  // query shares its cache entry with the HomeScreen visibility query (which also fetches all statuses).
  const {
    positions,
    hiddenPositions,
    hasData,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    pagesLoaded,
  } = useWalletPositions({
    account: address,
    chainIds: chains,
    statuses: POSITION_STATUS_FILTER_TO_STATUSES[PositionStatusFilterValue.All],
    includeHidden: true,
    autoFetchAllPages: false,
    ...SORT_BY_USD_VALUE_DESC,
    pageSize: PAGE_SIZE,
    disabled: skip,
    pollInterval: PollingInterval.Normal,
  })

  usePendingLiquidityTransactionsChangeListener(refetch)

  const isFetchingFirstPage = isFetching && !isFetchingNextPage
  const isLoadingFirstPage = isFetchingFirstPage && !hasData
  const hasErrorWithoutData = !!error && !hasData && !isFetchingFirstPage

  const visiblePositions = useMemo(() => filterAndSortPositions(positions, filterStatuses), [positions, filterStatuses])

  usePoolsPositionsReport({
    positions: visiblePositions,
    lifecycleFilter: statusFilter,
    pagesLoaded,
    hasMore: hasNextPage,
    isLoading: isLoadingFirstPage,
    enabled: !skip,
  })
  const filteredHiddenPositions = useMemo(
    () => filterAndSortPositions(hiddenPositions, filterStatuses),
    [hiddenPositions, filterStatuses],
  )

  // Empty while the error card or first-page skeleton is showing, so those render through
  // ListEmptyComponent and stay below the filter chrome in the header rather than replacing it.
  const rows = useMemo<PoolsRow[]>(() => {
    if (hasErrorWithoutData || isLoadingFirstPage) {
      return []
    }

    const result: PoolsRow[] =
      visiblePositions.length === 0
        ? [{ type: 'emptyFilter', key: 'empty-filter' }]
        : visiblePositions.map((position) => ({
            type: 'position',
            key: `visible-${getPositionKey(position)}`,
            position,
            isVisible: true,
          }))

    if (filteredHiddenPositions.length > 0) {
      result.push({ type: 'hiddenToggle', key: 'hidden-toggle' })

      if (hiddenExpanded) {
        for (const position of filteredHiddenPositions) {
          result.push({ type: 'position', key: `hidden-${getPositionKey(position)}`, position, isVisible: false })
        }
      }
    }

    return result
  }, [hasErrorWithoutData, isLoadingFirstPage, visiblePositions, filteredHiddenPositions, hiddenExpanded])

  // No `extraData` needed for the toggle row: `rows` is rebuilt when `hiddenExpanded` changes, so
  // every row object is a fresh identity and the engine re-renders the cell on its own.
  const renderItem = useCallback(
    ({ item }: UniversalListRenderItemInfo<PoolsRow>): JSX.Element => {
      switch (item.type) {
        case 'emptyFilter':
          return (
            <PositionsEmptyFilterView
              statusFilter={statusFilter}
              openPositionsCount={openPositionsCount}
              onViewOpenPositions={viewOpenPositions}
            />
          )
        case 'hiddenToggle':
          return (
            <HiddenPoolsRow
              isExpanded={hiddenExpanded}
              numHidden={filteredHiddenPositions.length}
              onPress={toggleHidden}
            />
          )
        case 'position':
          return (
            <PositionItem
              positionInfo={item.position}
              contextMenuActions={{ isVisible: item.isVisible, onReportSuccess: refetch }}
            />
          )
        default: {
          // Defect guard: PoolsRow is a closed union, so a new member must be rendered explicitly.
          const unreachable: never = item
          throw new Error(`unknown pools row: ${JSON.stringify(unreachable)}`)
        }
      }
    },
    [
      statusFilter,
      openPositionsCount,
      viewOpenPositions,
      hiddenExpanded,
      filteredHiddenPositions.length,
      toggleHidden,
      refetch,
    ],
  )

  const handleEndReached = useEvent((): void => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  })

  // `usePoolsOutageBanner` returns a fresh object each render, so depend on its fields, not on it.
  const {
    isVisible: isOutageBannerVisible,
    message: outageBannerMessage,
    onDismiss: onDismissOutageBanner,
  } = outageBanner

  const listHeader = useMemo(
    () => (
      <>
        <Flex mb="$spacing8">
          <PositionStatusFilter value={statusFilter} onChange={setStatusFilter} disabled={hasErrorWithoutData} />
        </Flex>
        {isOutageBannerVisible && (
          <Flex mb="$spacing8">
            <PoolsDataIssueBanner message={outageBannerMessage} onDismiss={onDismissOutageBanner} />
          </Flex>
        )}
      </>
    ),
    [statusFilter, hasErrorWithoutData, isOutageBannerVisible, outageBannerMessage, onDismissOutageBanner],
  )

  const listFooter = useMemo(
    () =>
      isFetchingNextPage ? (
        <Flex px="$spacing8">
          <Loader.Token withPrice repeat={NEXT_PAGE_LOADER_ROW_COUNT} />
        </Flex>
      ) : null,
    [isFetchingNextPage],
  )

  // Both body states that replace the rows entirely; `rows` is empty for each, so they render here
  // and stay below the header chrome instead of replacing it.
  const listEmpty = useMemo(() => {
    if (hasErrorWithoutData) {
      return (
        <BaseCard.ErrorState
          icon={<AlertTriangleFilled color="$neutral3" size="$icon.36" />}
          description={t('pool.balances.unavailable')}
          retryButtonLabel={t('common.button.tryAgain')}
          retryEnabled
          onRetry={refetch}
        />
      )
    }
    if (isLoadingFirstPage) {
      return (
        <Flex px="$spacing8" testID="pools-loading-skeleton">
          <Loader.Token withPrice repeat={FIRST_PAGE_LOADER_ROW_COUNT} />
        </Flex>
      )
    }
    return null
  }, [hasErrorWithoutData, isLoadingFirstPage, t, refetch])

  return (
    <UniversalList
      // The sidepanel document is the scroller; an inner container here would stop virtualizing
      // inside its unbounded parent and reserve a second scrollbar gutter.
      useWindowScroll
      data={rows}
      getItemType={rowType}
      keyExtractor={rowKey}
      ListEmptyComponent={listEmpty}
      ListFooterComponent={listFooter}
      ListHeaderComponent={listHeader}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      style={{ className: 'w-full' }}
      onEndReached={handleEndReached}
    />
  )
})
