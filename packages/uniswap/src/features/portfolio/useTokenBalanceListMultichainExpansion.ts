import { isExtensionApp } from '@universe/environment'
import isEqual from 'lodash/isEqual'
import { useCallback, useMemo, useRef, useState } from 'react'
import { PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import type { SortedPortfolioBalancesMultichain } from 'uniswap/src/features/portfolio/balances/types'
import { HIDDEN_TOKEN_BALANCES_ROW, TokenBalanceListRow } from 'uniswap/src/features/portfolio/types'

/**
 * Builds token balance list row ids. When {@link isExtensionApp} is true, multichain parents stay a
 * single row; {@link expandedCurrencyId} drives per-chain breakdown UI rendered under the parent
 * (see TokenBalanceItemRow + HeightAnimator). At most one multichain parent is expanded at a time
 * (accordion). Non-extension builds never expand.
 */
export function useTokenBalanceListMultichainExpansion({
  sortedData,
  hiddenTokensExpanded,
}: {
  sortedData: SortedPortfolioBalancesMultichain | undefined
  hiddenTokensExpanded: boolean
}): {
  rows: TokenBalanceListRow[]
  /** The one expanded multichain parent, if any — expansion is an accordion. */
  expandedCurrencyId: string | undefined
  toggleExpanded: (currencyId: string) => void
  multichainRowExpansionEnabled: boolean
} {
  const multichainRowExpansionEnabled = isExtensionApp

  const [expandedCurrencyId, setExpandedCurrencyId] = useState<string | undefined>(undefined)

  const toggleExpanded = useCallback(
    (currencyId: string) => {
      if (!multichainRowExpansionEnabled) {
        return
      }
      setExpandedCurrencyId((prev) => (prev === currencyId ? undefined : currencyId))
    },
    [multichainRowExpansionEnabled],
  )

  const rowsRef = useRef<TokenBalanceListRow[]>(undefined)

  const rows = useMemo((): TokenBalanceListRow[] => {
    if (!sortedData) {
      return []
    }

    const buildRowIdsForBalances = (balances: PortfolioMultichainBalance[]): TokenBalanceListRow[] => {
      const result: TokenBalanceListRow[] = []
      for (const balance of balances) {
        const currencyId = balance.id
        result.push(currencyId)
      }
      return result
    }

    const shownRowIds = buildRowIdsForBalances(sortedData.balances)
    const hiddenBalances = sortedData.hiddenBalances
    const newRowIds: TokenBalanceListRow[] = [
      ...shownRowIds,
      ...(hiddenBalances.length ? [HIDDEN_TOKEN_BALANCES_ROW] : []),
      ...(hiddenTokensExpanded ? buildRowIdsForBalances(hiddenBalances) : []),
    ]

    if (!rowsRef.current || !isEqual(rowsRef.current, newRowIds)) {
      rowsRef.current = newRowIds
    }
    return rowsRef.current
  }, [sortedData, hiddenTokensExpanded])

  return {
    rows,
    expandedCurrencyId,
    toggleExpanded,
    multichainRowExpansionEnabled,
  }
}
