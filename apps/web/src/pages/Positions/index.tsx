import { Platform } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { spacing } from 'ui/src/theme/spacing'
import { InterfacePageName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'
import { APP_BODY_MOBILE_GUTTER_PX } from '~/app/layout/constants'
import { BlastShutdownPositionsBanner } from '~/features/Liquidity/BlastShutdownBanner'
import { PoolsUnavailableOnSolanaView } from '~/features/Liquidity/components/emptyStates/PoolsUnavailableOnSolanaView'
import { LiquidityLearnMoreTiles } from '~/features/Liquidity/components/LearnMoreTiles'
import { usePositionSort } from '~/features/Liquidity/hooks/usePositionSort'
import { useShowHiddenPositions } from '~/features/Liquidity/hooks/useShowHiddenPositions'
import { useV2StatusFilter } from '~/features/Liquidity/hooks/useV2StatusFilter'
import { useWalletPositionsWeb } from '~/features/Liquidity/hooks/useWalletPositionsWeb'
import { PositionsHeroHeader } from '~/features/Liquidity/PositionsHeroHeader'
import { PositionsSummaryChips } from '~/features/Liquidity/PositionsSummaryChips'
import { PositionsTable, PositionsTableError, PositionsTableLoader } from '~/features/Liquidity/PositionsTable'
import {
  hasActiveControlBarFilter,
  type PositionsTableControlBarProps,
} from '~/features/Liquidity/PositionsTableControlBar'
import { useAccount } from '~/hooks/useAccount'
import { EmptyPositionsDiscoveryView } from '~/pages/Positions/components/EmptyPositionsDiscoveryView'
import { usePositionFilters } from '~/pages/Positions/hooks/usePositionFilters'

function getPositionsViewState({
  isConnected,
  isLoadingPositions,
  hasErrorWithoutData,
  connectedWithoutEVM,
  hasPositions,
  hasActiveV2Filter,
  showHiddenPositions,
}: {
  isConnected: boolean
  isLoadingPositions: boolean
  hasErrorWithoutData: boolean
  connectedWithoutEVM: boolean
  hasPositions: boolean
  hasActiveV2Filter: boolean
  showHiddenPositions: boolean
}): { showDiscoveryEmptyState: boolean } {
  const hasNoPositionsToShow = !isLoadingPositions && !connectedWithoutEVM && !hasPositions
  // With server-side filtering, an empty result under a non-default filter must NOT swap in the
  // discovery view (which hosts no control bar) — otherwise the filter deletes its own UI and the
  // only recovery is a reload. The Hidden toggle is the same trap: flipping it on with no hidden
  // positions empties the list, so keep the table (and its control bar) mounted in that case too.
  const showDiscoveryEmptyState =
    hasNoPositionsToShow && !hasActiveV2Filter && !showHiddenPositions && !(isConnected && hasErrorWithoutData)
  return { showDiscoveryEmptyState }
}

// Right gutter the summary carousel cancels to bleed to the viewport edge on mWeb: the page's
// $lg px + AppBody's gutter below the md breakpoint.
const SUMMARY_CHIPS_BLEED_GUTTERS = { md: spacing.spacing20 + APP_BODY_MOBILE_GUTTER_PX }

export function Pool() {
  const account = useAccount()
  const { t } = useTranslation()
  const { address, isConnected } = account

  const connectedWithoutEVM = useIsMissingPlatformWallet(Platform.EVM)

  const {
    chainFilter,
    setChainFilter,
    versionFilter,
    toggleVersion,
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    resetFilters,
  } = usePositionFilters()
  const { showHiddenPositions, setShowHiddenPositions } = useShowHiddenPositions(account.address)
  const { v2StatusFilter, toggleV2Status, resetV2Status } = useV2StatusFilter()
  // Resets chain/version/search, the lifecycle filter, and the Hidden toggle. The range tab
  // selection survives — navigation, not a filter (mirrors Portfolio Pools).
  const handleClearFilters = useCallback(() => {
    resetFilters()
    resetV2Status()
    setShowHiddenPositions(false)
  }, [resetFilters, resetV2Status, setShowHiddenPositions])
  const { sort, onSort } = usePositionSort()

  // Single source for the control-bar prop bundle, spread into the table, its loader, and its error
  // surface so a prop change lands in one place (mirrors the sibling Portfolio Pools page).
  const controlBarProps: PositionsTableControlBarProps = {
    statusFilter: v2StatusFilter,
    onToggleStatus: toggleV2Status,
    rangeFilter: statusFilter,
    setRangeFilter: setStatusFilter,
    versionFilter,
    toggleVersion,
    chainFilter,
    setChainFilter,
    showHiddenPositions,
    setShowHiddenPositions,
    search,
    onSearchChange: setSearch,
    onClearFilters: handleClearFilters,
  }
  // A non-default selection on any control-bar dimension means an empty result is "nothing matches
  // this filter" rather than "wallet has no positions" — keep the control bar (and show a
  // filter-aware empty prompt) so the user can change it back instead of being stranded in discovery.
  const hasActiveV2Filter = hasActiveControlBarFilter(controlBarProps)

  const {
    visiblePositions,
    hiddenPositions,
    isFetching,
    isPlaceholderData,
    hasNextPage,
    isLoadingPositions,
    hasErrorWithoutData,
    refetch,
    loadMorePositions,
  } = useWalletPositionsWeb({
    address,
    chainFilter,
    versionFilter,
    statusFilter,
    v2StatusFilter,
    sort,
    searchText: search,
  })

  const hasPositions = visiblePositions.length > 0 || hiddenPositions.length > 0
  const { showDiscoveryEmptyState } = getPositionsViewState({
    isConnected,
    isLoadingPositions,
    hasErrorWithoutData,
    connectedWithoutEVM,
    hasPositions,
    hasActiveV2Filter,
    showHiddenPositions,
  })
  // Wallet-wide totals stand on their own regardless of what the table shows: an empty result —
  // filtered, or a wallet holding nothing — reads $0.00 instead of the chips disappearing, which is
  // what made switching to a quiet network look like the summary broke.
  const showSummaryChips = isConnected

  return (
    <Trace logImpression page={InterfacePageName.Positions} section={SectionName.PositionsList}>
      <PositionsHeroHeader />
      <Flex
        row
        justifyContent="space-between"
        $xl={{ flexDirection: 'column', gap: '$gap16' }}
        width="100%"
        gap={20}
        py="$spacing24"
        px="$spacing40"
        $lg={{ px: '$spacing20' }}
      >
        <Flex grow shrink gap="$spacing24" maxWidth="100%" $xl={{ maxWidth: '100%' }}>
          {showSummaryChips && (
            <PositionsSummaryChips walletAddress={account.address} bleedGutters={SUMMARY_CHIPS_BLEED_GUTTERS} />
          )}
          {!showDiscoveryEmptyState && <Text variant="heading3">{t('pool.positions.title')}</Text>}
          <BlastShutdownPositionsBanner />
          {connectedWithoutEVM ? (
            <>
              <PoolsUnavailableOnSolanaView withBorder />
              <LiquidityLearnMoreTiles />
            </>
          ) : hasErrorWithoutData && isConnected ? (
            <PositionsTableError {...controlBarProps} onRetry={refetch} />
          ) : !isLoadingPositions ? (
            // Same predicate as the title above, so the two never desync: the discovery view shows
            // only for a genuinely empty wallet, so an active filter or the Hidden toggle keeps the
            // (possibly empty) table — and its control bar — mounted instead of trapping the user.
            showDiscoveryEmptyState ? (
              <EmptyPositionsDiscoveryView />
            ) : (
              <PositionsTable
                visiblePositions={visiblePositions}
                hiddenPositions={hiddenPositions}
                hasNextPage={hasNextPage}
                isFetching={isFetching}
                isPlaceholderData={isPlaceholderData}
                loadMorePositions={loadMorePositions}
                sort={sort}
                onSort={onSort}
                {...controlBarProps}
              />
            )
          ) : (
            <PositionsTableLoader {...controlBarProps} />
          )}
        </Flex>
      </Flex>
    </Trace>
  )
}

export default Pool
