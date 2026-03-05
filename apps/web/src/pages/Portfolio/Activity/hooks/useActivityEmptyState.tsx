import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ActivityListEmptyState } from 'uniswap/src/components/activity/ActivityListEmptyState'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import {
  ActivityFilterType,
  filterTransactionDetailsFromActivityItems,
  TimePeriod,
} from '~/pages/Portfolio/Activity/Filters/utils'

interface UseActivityEmptyStateParams {
  chainId: UniverseChainId | undefined
  selectedTransactionType: string
  selectedTimePeriod: string
  sectionData: ActivityItem[] | undefined
  isExternalWallet: boolean
  showLoading: boolean
  transactionDataLength: number
  onClearFilters: () => void
}

interface UseActivityEmptyStateResult {
  /** Whether the empty state should be displayed */
  shouldShowEmptyState: boolean
  /** The empty state content to render, or null if not showing empty state */
  emptyStateContent: JSX.Element | null
}

/**
 * Hook that manages empty state display logic for the activity list.
 *
 * Provides different empty states based on context:
 * - Chain filter active: Shows chain-specific message with "See all networks" button
 * - Type/time filters hiding results: Shows filter-specific message with "Clear filters" button
 * - No transactions at all: Shows default empty state
 */
export function useActivityEmptyState({
  chainId,
  selectedTransactionType,
  selectedTimePeriod,
  sectionData,
  isExternalWallet,
  showLoading,
  transactionDataLength,
  onClearFilters,
}: UseActivityEmptyStateParams): UseActivityEmptyStateResult {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Handler to clear chain filter and show all networks
  const handleShowAllNetworks = useCallback(() => {
    navigate('/portfolio/activity')
  }, [navigate])

  // Check if any filters (type or time) are applied
  const hasFiltersApplied = selectedTransactionType !== ActivityFilterType.All || selectedTimePeriod !== TimePeriod.All

  // Check if there's any raw transaction data before filtering (to distinguish between "no activity" vs "no matching results")
  const hasAnyTransactions = useMemo(() => {
    return filterTransactionDetailsFromActivityItems(sectionData || []).length > 0
  }, [sectionData])

  // Custom empty state for chain filtering
  const chainFilterEmptyState = useMemo(() => {
    if (!chainId) {
      return null
    }
    const chainName = getChainLabel(chainId)
    return (
      <ActivityListEmptyState
        description={null}
        buttonLabel={t('portfolio.networkFilter.seeAllNetworks')}
        onPress={handleShowAllNetworks}
        title={t('activity.list.noneOnChain.title', { chainName })}
        dataTestId={TestID.PortfolioActivityChainEmptyState}
        buttonDataTestId={TestID.PortfolioActivitySeeAllNetworksButton}
      />
    )
  }, [handleShowAllNetworks, chainId, t])

  // Custom empty state for type/time filtering
  const filterEmptyState = useMemo(() => {
    return (
      <ActivityListEmptyState
        description={null}
        buttonLabel={t('activity.list.noFilterResults.button')}
        onPress={onClearFilters}
        title={t('activity.list.noFilterResults.title')}
        dataTestId={TestID.PortfolioActivityEmptyState}
      />
    )
  }, [onClearFilters, t])

  const shouldShowEmptyState = !showLoading && transactionDataLength === 0

  const emptyStateContent = useMemo(() => {
    if (!shouldShowEmptyState) {
      return null
    }

    // Chain filter is active - show chain-specific empty state
    if (chainId) {
      return chainFilterEmptyState
    }

    // Type/time filters are hiding existing transactions - show filter empty state
    if (hasFiltersApplied && hasAnyTransactions) {
      return filterEmptyState
    }

    // No transactions at all - show default empty state
    return (
      <ActivityListEmptyState
        description={isExternalWallet ? t('home.activity.empty.description.external') : undefined}
        dataTestId={TestID.PortfolioActivityEmptyState}
      />
    )
  }, [
    shouldShowEmptyState,
    chainId,
    chainFilterEmptyState,
    hasFiltersApplied,
    hasAnyTransactions,
    filterEmptyState,
    isExternalWallet,
    t,
  ])

  return {
    shouldShowEmptyState,
    emptyStateContent,
  }
}
