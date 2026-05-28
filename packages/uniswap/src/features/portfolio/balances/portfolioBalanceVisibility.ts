import { isMobileApp } from '@universe/environment'
import type {
  PortfolioBalance,
  PortfolioChainBalance,
  PortfolioMultichainBalance,
} from 'uniswap/src/features/dataApi/types'
import type { CurrencyIdToVisibility } from 'uniswap/src/features/visibility/slice'

/**
 * Determines whether a portfolio balance should be hidden from the user interface.
 *
 * The hiding logic varies based on testnet mode and token type:
 * - **Testnet mode**: Never hide balances from the main list — Data API spam/heuristics are unreliable on testnets.
 * - **Normal mode**:
 *   - Native tokens: Hidden if the user marked the token not visible; on mobile, API `isHidden` is also respected
 *   - Non-native tokens: Hidden based on the `isHidden` flag from the API when there is no explicit visibility override
 */
function shouldHideTokenByVisibility({
  currencyInfo,
  isHidden,
  isTestnetModeEnabled,
  currencyIdToTokenVisibility,
}: {
  currencyInfo: PortfolioBalance['currencyInfo']
  isHidden: PortfolioBalance['isHidden']
  isTestnetModeEnabled: boolean
  currencyIdToTokenVisibility: CurrencyIdToVisibility
}): boolean {
  if (isTestnetModeEnabled) {
    return false
  }
  const tokenVisibility = currencyIdToTokenVisibility[currencyInfo.currencyId]
  if (currencyInfo.currency.isNative) {
    return (
      (typeof tokenVisibility?.isVisible === 'boolean' && !tokenVisibility.isVisible) || (isMobileApp && !!isHidden)
    )
  }
  if (typeof tokenVisibility?.isVisible === 'boolean') {
    return !tokenVisibility.isVisible
  }
  return !!isHidden
}

/**
 * Whether a legacy portfolio row should be hidden (shown vs hidden token lists).
 */
export function shouldHidePortfolioBalance({
  balance,
  isTestnetModeEnabled,
  currencyIdToTokenVisibility,
}: {
  balance: PortfolioBalance
  isTestnetModeEnabled: boolean
  currencyIdToTokenVisibility: CurrencyIdToVisibility
}): boolean {
  return shouldHideTokenByVisibility({
    currencyInfo: balance.currencyInfo,
    isHidden: balance.isHidden,
    isTestnetModeEnabled,
    currencyIdToTokenVisibility,
  })
}

export type PartitionMultichainTokensParams = {
  chainTokens: PortfolioChainBalance[]
  multichainIsHidden: PortfolioMultichainBalance['isHidden']
  isTestnetModeEnabled: boolean
  currencyIdToTokenVisibility: CurrencyIdToVisibility
}

/**
 * Splits multichain chain balances into UI-visible vs hidden using the same rules as legacy single-chain balances.
 * Used so one hidden chain can drop out of the main multichain row while the rest stay visible.
 *
 * **Per-chain `isHidden` and the multichain row:** REST sometimes omits `isHidden` on individual chain tokens
 * (`null` / `undefined`) while still setting it on the parent multichain row. We intentionally treat missing
 * per-chain flags as inheriting `multichainIsHidden` so web/extension stay consistent with the row-level hidden
 * state. Explicit `true`/`false` on the chain token still wins (`??` only fills in nullish).
 */
export function partitionMultichainTokensByVisibility({
  chainTokens,
  multichainIsHidden,
  isTestnetModeEnabled,
  currencyIdToTokenVisibility,
}: PartitionMultichainTokensParams): { visible: PortfolioChainBalance[]; hidden: PortfolioChainBalance[] } {
  const visible: PortfolioChainBalance[] = []
  const hidden: PortfolioChainBalance[] = []
  for (const t of chainTokens) {
    const hide = shouldHideTokenByVisibility({
      currencyInfo: t.currencyInfo,
      // Intentional: see JSDoc above — nullish per-chain `isHidden` inherits the multichain row flag.
      isHidden: t.isHidden ?? multichainIsHidden,
      isTestnetModeEnabled,
      currencyIdToTokenVisibility,
    })
    if (hide) {
      hidden.push(t)
    } else {
      visible.push(t)
    }
  }
  return { visible, hidden }
}

/**
 * Whether a multichain balance row belongs in the hidden portfolio list.
 * Web/extension: partition per-chain so a row stays in "balances" if any chain is visible.
 * Mobile: one row per asset — row-level + primary-token visibility only (no per-chain partition).
 */
export function shouldHideMultichainPortfolioRow(params: PartitionMultichainTokensParams): boolean {
  const { chainTokens, multichainIsHidden, isTestnetModeEnabled, currencyIdToTokenVisibility } = params
  if (isMobileApp) {
    const primary = chainTokens[0]
    if (!primary) {
      return true
    }
    return shouldHideTokenByVisibility({
      currencyInfo: primary.currencyInfo,
      isHidden: multichainIsHidden,
      isTestnetModeEnabled,
      currencyIdToTokenVisibility,
    })
  }
  return (
    partitionMultichainTokensByVisibility({
      chainTokens,
      multichainIsHidden,
      isTestnetModeEnabled,
      currencyIdToTokenVisibility,
    }).visible.length === 0
  )
}
