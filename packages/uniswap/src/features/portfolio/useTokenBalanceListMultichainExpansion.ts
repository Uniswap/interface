import { isExtensionApp } from '@universe/environment'
import isEqual from 'lodash/isEqual'
import { useCallback, useMemo, useRef, useState } from 'react'
import { PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import type { SortedPortfolioBalancesMultichain } from 'uniswap/src/features/portfolio/balances/types'
import { HIDDEN_TOKEN_BALANCES_ROW, TokenBalanceListRow } from 'uniswap/src/features/portfolio/types'

/**
 * Builds token balance list row ids. When {@link isExtensionApp} is true, multichain parents stay a
 * single row; {@link expandedCurrencyIds} drives per-chain breakdown UI rendered under the parent
 * (see TokenBalanceItems + HeightAnimator). At most one multichain parent is expanded at a time
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
  expandedCurrencyIds: Set<string>
  toggleExpanded: (currencyId: string) => void
  multichainRowExpansionEnabled: boolean
} {
  const multichainRowExpansionEnabled = isExtensionApp

  const [expandedCurrencyIds, setExpandedCurrencyIds] = useState<Set<string>>(() => new Set())

  const toggleExpanded = useCallback(
    (currencyId: string) => {
      if (!multichainRowExpansionEnabled) {
        return
      }
      setExpandedCurrencyIds((prev) => {
        if (prev.has(currencyId)) {
          return new Set()
        }
        return new Set([currencyId])
      })
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
    expandedCurrencyIds,
    toggleExpanded,
    multichainRowExpansionEnabled,
  }
}
