/**
 * Shared multichain portfolio UI materialization (per-chain hide/unhide, aggregates).
 *
 * Consumers:
 * - Web Portfolio Tokens tab: `useTransformTokenTableData` flattens fully hidden multichain rows via
 *   {@link flattenPortfolioMultichainBalanceToSingleChainRows} before mapping to table `TokenData`.
 * - Extension token list: `TokenBalanceListContext` via {@link buildExtensionMultichainBalancesListData} +
 *   `flattenPortfolioMultichainBalanceToSingleChainRows`.
 * - Mobile token list: intentionally does not use this path (see `isExtensionApp` branch in context).
 */
import type { PortfolioChainBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import {
  flattenMultichainChainToken,
  multichainChainTokenRowSuffix,
} from 'uniswap/src/features/portfolio/balances/flattenMultichainToSingleChainRows'
import { partitionMultichainTokensByVisibility } from 'uniswap/src/features/portfolio/balances/portfolioBalanceVisibility'
import type { SortedPortfolioBalancesMultichain } from 'uniswap/src/features/portfolio/balances/types'
import type { CurrencyIdToVisibility } from 'uniswap/src/features/visibility/slice'

export type MultichainBalanceUiPartition = {
  balance: PortfolioMultichainBalance
  visibleChainTokens: PortfolioChainBalance[]
  hiddenChainTokens: PortfolioChainBalance[]
}

/**
 * Partitions each multichain balance's row tokens into visible vs hidden chains using the same rules as legacy rows.
 */
export function partitionMultichainBalancesByPerChainVisibility({
  balances,
  isTestnetModeEnabled,
  currencyIdToTokenVisibility,
}: {
  balances: PortfolioMultichainBalance[]
  isTestnetModeEnabled: boolean
  currencyIdToTokenVisibility: CurrencyIdToVisibility
}): {
  partitions: MultichainBalanceUiPartition[]
  totalUsdVisible: number
} {
  const partitions = balances.map((balance) => {
    const { visible: visibleChainTokens, hidden: hiddenChainTokens } = partitionMultichainTokensByVisibility({
      chainTokens: balance.tokens,
      multichainIsHidden: balance.isHidden,
      isTestnetModeEnabled,
      currencyIdToTokenVisibility,
    })
    return { balance, visibleChainTokens, hiddenChainTokens }
  })
  const totalUsdVisible = partitions.reduce(
    (sum, { visibleChainTokens }) => sum + visibleChainTokens.reduce((s, t) => s + (t.valueUsd ?? 0), 0),
    0,
  )
  return { partitions, totalUsdVisible }
}

/**
 * Multichain balance for a visible row: only visible chain tokens; totals recomputed from that subset.
 */
export function buildVisibleSubsetMultichainBalance(
  balance: PortfolioMultichainBalance,
  visibleChainTokens: PortfolioChainBalance[],
): PortfolioMultichainBalance {
  if (visibleChainTokens.length === 0) {
    throw new Error('buildVisibleSubsetMultichainBalance requires at least one visible chain token')
  }
  const ordered = [...visibleChainTokens].sort((a, b) => (b.valueUsd ?? 0) - (a.valueUsd ?? 0))
  const totalValueUsd = ordered.reduce((sum, t) => sum + (t.valueUsd ?? 0), 0)
  const totalAmount = ordered.reduce((sum, t) => sum + t.quantity, 0)
  const priceUsd = totalAmount > 0 && totalValueUsd > 0 ? totalValueUsd / totalAmount : balance.priceUsd
  return {
    ...balance,
    tokens: ordered,
    totalAmount,
    totalValueUsd,
    priceUsd,
  }
}

/**
 * One synthetic multichain row with a single chain (hidden section / flattened rows).
 */
export function buildSingleChainHiddenMultichainBalance({
  parentBalance,
  chainToken,
}: {
  parentBalance: PortfolioMultichainBalance
  chainToken: PortfolioChainBalance
}): PortfolioMultichainBalance {
  const suffix = multichainChainTokenRowSuffix(chainToken)
  const id = `${parentBalance.id}-${suffix}`
  const valueUsd = chainToken.valueUsd ?? 0
  const quantity = chainToken.quantity
  const priceUsd = quantity > 0 && valueUsd > 0 ? valueUsd / quantity : parentBalance.priceUsd
  return {
    ...parentBalance,
    id,
    cacheId: id,
    tokens: [chainToken],
    totalAmount: quantity,
    totalValueUsd: valueUsd,
    priceUsd,
    isHidden: true,
  }
}

/**
 * One UI row per chain (shared control flow with web via {@link flattenMultichainChainToken}).
 */
export function flattenPortfolioMultichainBalanceToSingleChainRows(
  balance: PortfolioMultichainBalance,
): PortfolioMultichainBalance[] {
  const result: PortfolioMultichainBalance[] = []
  flattenMultichainChainToken({
    parentId: balance.id,
    chainTokens: balance.tokens,
    onSingleChain: (only) => {
      result.push(buildVisibleSubsetMultichainBalance(balance, [only]))
    },
    onMultiChainEach: ({ token: chainToken }) => {
      result.push(buildSingleChainHiddenMultichainBalance({ parentBalance: balance, chainToken }))
    },
  })
  return result
}

function buildHiddenFlattenedMultichainBalancesForList(
  hiddenBalancesFromSort: PortfolioMultichainBalance[],
  partitions: MultichainBalanceUiPartition[],
): PortfolioMultichainBalance[] {
  const fully = hiddenBalancesFromSort.flatMap((b) => flattenPortfolioMultichainBalanceToSingleChainRows(b))
  const partial = partitions.flatMap(({ balance, hiddenChainTokens }) =>
    hiddenChainTokens.map((ht) => buildSingleChainHiddenMultichainBalance({ parentBalance: balance, chainToken: ht })),
  )
  // Partial-visibility per-chain hidden rows first so “flattened” multichain chains surface above fully hidden assets.
  return [...partial, ...fully]
}

/**
 * Builds extension token-list view data: visible parents use visible-only chains and totals; hidden list is flattened
 * per chain; `listBalancesById` merges overrides for row lookup (parent ids → visible subset; synthetic ids → hidden rows).
 */
export function buildExtensionMultichainBalancesListData({
  sortedBalances,
  balancesById,
  isTestnetModeEnabled,
  currencyIdToTokenVisibility,
}: {
  sortedBalances: SortedPortfolioBalancesMultichain
  balancesById: Record<string, PortfolioMultichainBalance>
  isTestnetModeEnabled: boolean
  currencyIdToTokenVisibility: CurrencyIdToVisibility
}): {
  sortedDataForUi: SortedPortfolioBalancesMultichain
  listBalancesById: Record<string, PortfolioMultichainBalance>
  hiddenTokensCount: number
} {
  const { partitions } = partitionMultichainBalancesByPerChainVisibility({
    balances: sortedBalances.balances,
    isTestnetModeEnabled,
    currencyIdToTokenVisibility,
  })

  const visibleDisplayBalances = partitions
    .map(({ balance, visibleChainTokens }) => {
      if (visibleChainTokens.length === 0) {
        return null
      }
      return buildVisibleSubsetMultichainBalance(balance, visibleChainTokens)
    })
    .filter((b): b is PortfolioMultichainBalance => b !== null)

  const hiddenFlattened = buildHiddenFlattenedMultichainBalancesForList(sortedBalances.hiddenBalances, partitions)

  const listBalancesById: Record<string, PortfolioMultichainBalance> = { ...balancesById }
  for (const v of visibleDisplayBalances) {
    listBalancesById[v.id] = v
  }
  for (const h of hiddenFlattened) {
    listBalancesById[h.id] = h
  }

  return {
    sortedDataForUi: {
      balances: visibleDisplayBalances,
      hiddenBalances: hiddenFlattened,
    },
    listBalancesById,
    hiddenTokensCount: hiddenFlattened.length,
  }
}
