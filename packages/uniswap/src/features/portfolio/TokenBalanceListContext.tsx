import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CurrencyInfo, PortfolioChainBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
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
  refetch: (() => void) | undefined
  isPending: boolean
  isError: boolean
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
 * `currency` and `safetyInfo` are rebuilt on every poll, so compare by field. Covers what rows read:
 * name/symbol/decimals/logo for display, isSpam + safetyInfo for the report/blocked context-menu state.
 */
function currencyInfoEqual(a: CurrencyInfo, b: CurrencyInfo): boolean {
  return (
    a.currencyId === b.currencyId &&
    a.logoUrl === b.logoUrl &&
    a.isSpam === b.isSpam &&
    a.spamCode === b.spamCode &&
    a.currency.symbol === b.currency.symbol &&
    a.currency.name === b.currency.name &&
    a.currency.decimals === b.currency.decimals &&
    a.safetyInfo?.tokenList === b.safetyInfo?.tokenList &&
    a.safetyInfo?.protectionResult === b.safetyInfo?.protectionResult &&
    a.safetyInfo?.attackType === b.safetyInfo?.attackType &&
    a.safetyInfo?.blockaidFees?.buyFeePercent === b.safetyInfo?.blockaidFees?.buyFeePercent &&
    a.safetyInfo?.blockaidFees?.sellFeePercent === b.safetyInfo?.blockaidFees?.sellFeePercent
  )
}

function chainBalancesEqual(a: PortfolioChainBalance, b: PortfolioChainBalance): boolean {
  return (
    a.chainId === b.chainId &&
    a.address === b.address &&
    a.quantity === b.quantity &&
    a.valueUsd === b.valueUsd &&
    a.isHidden === b.isHidden &&
    currencyInfoEqual(a.currencyInfo, b.currencyInfo)
  )
}

/**
 * Field-level equality over everything a balance row renders. If a row starts rendering a field
 * that isn't compared here (or in `currencyInfoEqual`), polls will stop re-rendering it for changes
 * to that field — keep this list in sync with row consumers (TokenBalanceItem, the context menus,
 * the mobile/web row wrappers).
 */
export function multichainBalancesEqual(a: PortfolioMultichainBalance, b: PortfolioMultichainBalance): boolean {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.symbol === b.symbol &&
    a.logoUrl === b.logoUrl &&
    a.totalAmount === b.totalAmount &&
    a.priceUsd === b.priceUsd &&
    a.pricePercentChange1d === b.pricePercentChange1d &&
    a.totalValueUsd === b.totalValueUsd &&
    a.isHidden === b.isHidden &&
    a.tokens.length === b.tokens.length &&
    a.tokens.every((token, i) => {
      const other = b.tokens[i]
      return other !== undefined && chainBalancesEqual(token, other)
    })
  )
}

type BalancesById = Record<string, PortfolioMultichainBalance>

/**
 * The query's `select` rebuilds every balance object whenever anything in the response changes,
 * so one token's price moving hands every mounted row a new `portfolioBalance` identity and
 * defeats their memoization. Reuse the previous object for entries whose rendered fields are
 * unchanged (and the previous map itself when nothing changed), and report which keys really did.
 */
export function stabilizeBalancesById(
  prev: BalancesById | undefined,
  next: BalancesById | undefined,
): { merged: BalancesById | undefined; changedKeys: string[] } {
  if (!prev || !next) {
    return { merged: next, changedKeys: next ? Object.keys(next) : prev ? Object.keys(prev) : [] }
  }
  const changedKeys: string[] = []
  const merged: BalancesById = {}
  for (const [key, nextBalance] of Object.entries(next)) {
    const prevBalance = prev[key]
    if (prevBalance !== undefined && multichainBalancesEqual(prevBalance, nextBalance)) {
      merged[key] = prevBalance
    } else {
      merged[key] = nextBalance
      changedKeys.push(key)
    }
  }
  for (const key of Object.keys(prev)) {
    if (!(key in next)) {
      changedKeys.push(key)
    }
  }
  const sameShape = changedKeys.length === 0 && Object.keys(prev).length === Object.keys(next).length
  return { merged: sameShape ? prev : merged, changedKeys }
}

type RowBalancesStore = {
  get: (key: string) => PortfolioMultichainBalance | undefined
  /** Render-phase safe: swaps the backing map without notifying. */
  replace: (map: BalancesById | undefined) => void
  notify: (keys: string[]) => void
  subscribe: (key: string, listener: () => void) => () => void
}

function createRowBalancesStore(): RowBalancesStore {
  let balances: BalancesById | undefined
  const listeners = new Map<string, Set<() => void>>()
  return {
    get: (key) => balances?.[key],
    replace: (map) => {
      balances = map
    },
    notify: (keys) => {
      for (const key of keys) {
        listeners.get(key)?.forEach((listener) => listener())
      }
    },
    subscribe: (key, listener) => {
      let keyListeners = listeners.get(key)
      if (!keyListeners) {
        keyListeners = new Set()
        listeners.set(key, keyListeners)
      }
      keyListeners.add(listener)
      return () => {
        keyListeners.delete(listener)
        if (keyListeners.size === 0) {
          listeners.delete(key)
        }
      }
    },
  }
}

const RowBalancesContext = createContext<RowBalancesStore | undefined>(undefined)

/**
 * A single row's balance, by row id. Subscribes to just that key, so a portfolio poll re-renders
 * only the rows whose balance actually changed — not every mounted row (the full context's value
 * has a new identity on every poll via `dataUpdatedAt`).
 */
export function useTokenBalanceRowBalance(rowId: string): PortfolioMultichainBalance | undefined {
  const store = useContext(RowBalancesContext)
  if (store === undefined) {
    throw new Error('`useTokenBalanceRowBalance` must be used inside of `TokenBalanceListContextProvider`')
  }
  const subscribe = useCallback((listener: () => void) => store.subscribe(rowId, listener), [store, rowId])
  const getSnapshot = useCallback(() => store.get(rowId), [store, rowId])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

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
  toggleExpanded: (currencyId: string) => void
  /** Changes only on warm-loading transitions, not per poll. */
  isWarmLoading: boolean
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
    isPending,
    isError,
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
  const isWarmLoading = hasData && loading && !isExternalProfile
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

  // Identity-stable balances: unchanged entries keep their previous object so row memoization
  // holds across polls; the row store notifies only the keys that really changed.
  // The diff is against the last *committed* map and the memo body stays pure: React may run it
  // more than once per commit (StrictMode, interrupted concurrent render), and advancing the ref
  // in here would make the second pass diff against itself and drop every changed key.
  const committedBalancesRef = useRef<BalancesById | undefined>(undefined)
  const { merged: stableBalancesById, changedKeys } = useMemo(
    () => stabilizeBalancesById(committedBalancesRef.current, balancesByIdForList),
    [balancesByIdForList],
  )

  const rowBalancesStoreRef = useRef<RowBalancesStore | undefined>(undefined)
  rowBalancesStoreRef.current ??= createRowBalancesStore()
  const rowBalancesStore = rowBalancesStoreRef.current
  // Replace during render so rows mounting in this commit read current data; notify after commit.
  rowBalancesStore.replace(stableBalancesById)
  useEffect(() => {
    committedBalancesRef.current = stableBalancesById
    rowBalancesStore.notify(changedKeys)
  }, [rowBalancesStore, stableBalancesById, changedKeys])

  const state = useMemo<TokenBalanceListContextState>(
    (): TokenBalanceListContextState => ({
      balancesById: stableBalancesById,
      expandedCurrencyIds,
      multichainRowExpansionEnabled,
      hiddenTokensCount,
      hiddenTokensExpanded,
      hiddenBalanceRowIds,
      isPortfolioBalancesLoading,
      isWarmLoading,
      isPending,
      isError,
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
      stableBalancesById,
      expandedCurrencyIds,
      multichainRowExpansionEnabled,
      hiddenTokensCount,
      hiddenTokensExpanded,
      hiddenBalanceRowIds,
      isPortfolioBalancesLoading,
      isWarmLoading,
      isPending,
      isError,
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
      toggleExpanded,
      isWarmLoading,
    }),
    [
      evmOwner,
      svmOwner,
      expandedCurrencyIds,
      multichainRowExpansionEnabled,
      hiddenBalanceRowIds,
      onPressToken,
      toggleExpanded,
      isWarmLoading,
    ],
  )

  return (
    <TokenBalanceListContext.Provider value={state}>
      <TokenBalanceItemConfigContext.Provider value={itemConfig}>
        <RowBalancesContext.Provider value={rowBalancesStore}>{children}</RowBalancesContext.Provider>
      </TokenBalanceItemConfigContext.Provider>
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
