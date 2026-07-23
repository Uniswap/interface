import { NetworkStatus } from '@apollo/client'
import { isWarmLoadingStatus } from '@universe/api'
import { createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useMemo, useState } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import { useSortedPortfolioBalancesMultichain } from 'uniswap/src/features/portfolio/balances/hooks'
import { TokenBalanceListRow } from 'uniswap/src/features/portfolio/types'
import { useMultichainBalancesListData } from 'uniswap/src/features/portfolio/useMultichainBalancesListData'
import { useMultichainPortfolioMetricsAnalytics } from 'uniswap/src/features/portfolio/useMultichainPortfolioMetricsAnalytics'
import { useTokenBalanceListMultichainExpansion } from 'uniswap/src/features/portfolio/useTokenBalanceListMultichainExpansion'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { CurrencyId } from 'uniswap/src/types/currency'

export type TokenBalancePressOptions = {
  isMultichainAsset?: boolean
}

type TokenBalanceListContextState = {
  balancesById: Record<string, PortfolioMultichainBalance> | undefined
  expandedCurrencyIds: Set<string>
  multichainRowExpansionEnabled: boolean
  networkStatus: NetworkStatus
  refetch: (() => void) | undefined
  hiddenTokensCount: number
  hiddenTokensExpanded: boolean
  isPortfolioBalancesLoading: boolean
  isWarmLoading: boolean
  rows: Array<TokenBalanceListRow>
  /** Row ids in the hidden-tokens section (hide fiat USD; still show token quantity). */
  hiddenBalanceRowIds: Set<string>
  setHiddenTokensExpanded: Dispatch<SetStateAction<boolean>>
  toggleExpanded: (currencyId: string) => void
  onPressToken?: (currencyId: CurrencyId, options?: TokenBalancePressOptions) => void
  evmOwner?: Address
  svmOwner?: Address
  error?: Error
  dataUpdatedAt?: number
}

export const TokenBalanceListContext = createContext<TokenBalanceListContextState | undefined>(undefined)

/**
 * The subset of context consumed by every rendered row (`TokenBalanceItem`). Kept separate from the
 * full context so rows don't re-render on each poll when only churny status fields (dataUpdatedAt,
 * networkStatus, loading) change — these fields are all stable across polls.
 */
export type TokenBalanceItemConfig = {
  evmOwner?: Address
  svmOwner?: Address
  expandedCurrencyIds: Set<string>
  multichainRowExpansionEnabled: boolean
  hiddenBalanceRowIds: Set<string>
  onPressToken?: (currencyId: CurrencyId, options?: TokenBalancePressOptions) => void
}

const TokenBalanceItemConfigContext = createContext<TokenBalanceItemConfig | undefined>(undefined)

export function TokenBalanceListContextProvider({
  evmOwner,
  svmOwner,
  isExternalProfile,
  children,
  onPressToken,
  disablePolling = false,
}: PropsWithChildren<{
  evmOwner?: Address
  svmOwner?: Address
  isExternalProfile: boolean
  onPressToken?: (currencyId: CurrencyId, options?: TokenBalancePressOptions) => void
  /** When true, skips the internal poll — use when a parent coordinator already refreshes this data on its own cadence. */
  disablePolling?: boolean
}>): JSX.Element {
  const {
    data: sortedData,
    balancesById,
    networkStatus,
    refetch,
    loading,
    error,
    dataUpdatedAt,
  } = useSortedPortfolioBalancesMultichain({
    evmAddress: evmOwner,
    svmAddress: svmOwner,
    pollInterval: disablePolling ? undefined : PollingInterval.KindaFast,
    requestMultichainFromBackend: true,
  })

  const { isTestnetModeEnabled } = useEnabledChains()
  const ownerAddresses = useMemo(() => [evmOwner, svmOwner].filter((a): a is Address => !!a), [evmOwner, svmOwner])
  const currencyIdToTokenVisibility = useCurrencyIdToVisibility(ownerAddresses)

  const { sortedDataForList, balancesByIdForList, hiddenTokensCount } = useMultichainBalancesListData({
    sortedData,
    balancesById,
    isTestnetModeEnabled,
    currencyIdToTokenVisibility,
  })

  // oxlint-disable-next-line no-unnecessary-condition -- length can be undefined
  const shouldShowHiddenTokens = !sortedDataForList?.balances?.length && !!sortedDataForList?.hiddenBalances?.length

  const [hiddenTokensExpanded, setHiddenTokensExpanded] = useState(shouldShowHiddenTokens)

  const { rows, expandedCurrencyIds, toggleExpanded, multichainRowExpansionEnabled } =
    useTokenBalanceListMultichainExpansion({
      sortedData: sortedDataForList,
      hiddenTokensExpanded,
    })

  const hasData = !!balancesById
  const isWarmLoading = hasData && isWarmLoadingStatus(networkStatus) && !isExternalProfile
  // Show loading skeletons when loading OR when there's an outage with no cached data
  const isPortfolioBalancesLoading = loading || (!!error && !sortedData)

  useMultichainPortfolioMetricsAnalytics({
    sortedDataForList,
    isExternalProfile,
    isPortfolioBalancesLoading,
  })

  const hiddenBalanceRowIds = useMemo(
    () => new Set(sortedDataForList?.hiddenBalances.map((balance) => balance.id) ?? []),
    [sortedDataForList?.hiddenBalances],
  )

  const state = useMemo<TokenBalanceListContextState>(
    (): TokenBalanceListContextState => ({
      balancesById: balancesByIdForList,
      expandedCurrencyIds,
      multichainRowExpansionEnabled,
      hiddenTokensCount,
      hiddenTokensExpanded,
      hiddenBalanceRowIds,
      isPortfolioBalancesLoading,
      isWarmLoading,
      networkStatus,
      onPressToken,
      refetch,
      rows,
      setHiddenTokensExpanded,
      toggleExpanded,
      evmOwner,
      svmOwner,
      error,
      dataUpdatedAt,
    }),
    [
      balancesByIdForList,
      expandedCurrencyIds,
      multichainRowExpansionEnabled,
      hiddenTokensCount,
      hiddenTokensExpanded,
      hiddenBalanceRowIds,
      isPortfolioBalancesLoading,
      isWarmLoading,
      networkStatus,
      onPressToken,
      refetch,
      rows,
      toggleExpanded,
      evmOwner,
      svmOwner,
      error,
      dataUpdatedAt,
    ],
  )

  const itemConfig = useMemo<TokenBalanceItemConfig>(
    () => ({
      evmOwner,
      svmOwner,
      expandedCurrencyIds,
      multichainRowExpansionEnabled,
      hiddenBalanceRowIds,
      onPressToken,
    }),
    [evmOwner, svmOwner, expandedCurrencyIds, multichainRowExpansionEnabled, hiddenBalanceRowIds, onPressToken],
  )

  return (
    <TokenBalanceListContext.Provider value={state}>
      <TokenBalanceItemConfigContext.Provider value={itemConfig}>{children}</TokenBalanceItemConfigContext.Provider>
    </TokenBalanceListContext.Provider>
  )
}

export const useTokenBalanceListContext = (): TokenBalanceListContextState => {
  const context = useContext(TokenBalanceListContext)

  if (context === undefined) {
    throw new Error('`useTokenBalanceListContext` must be used inside of `TokenBalanceListContextProvider`')
  }

  return context
}

/**
 * Stable per-row config. Prefer this over `useTokenBalanceListContext` in components rendered once per
 * row, so they don't re-render on every portfolio poll.
 */
export const useTokenBalanceItemConfig = (): TokenBalanceItemConfig => {
  const context = useContext(TokenBalanceItemConfigContext)

  if (context === undefined) {
    throw new Error('`useTokenBalanceItemConfig` must be used inside of `TokenBalanceListContextProvider`')
  }

  return context
}
