import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { FiatOnRampCurrency, FORCurrencyOrBalance } from 'uniswap/src/features/fiatOnRamp/types'
import {
  getUnsupportedFORTokensWithBalance,
  normalizeBalancesByIdForLookup,
} from 'uniswap/src/features/fiatOnRamp/utils'
import { CurrencyId } from 'uniswap/src/types/currency'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'

export enum FiatOnRampRowType {
  UnsupportedToggle = 'unsupportedToggle',
  Currency = 'currency',
}

export type FiatOnRampRow =
  | { type: FiatOnRampRowType.UnsupportedToggle; key: string }
  | { type: FiatOnRampRowType.Currency; key: string; currency: FORCurrencyOrBalance }

function currencyKey(item: FORCurrencyOrBalance): CurrencyId {
  return item.currencyInfo?.currencyId ?? ''
}

/**
 * Flattens the two fiat on/off-ramp sections into the single row array `UniversalList` takes:
 * supported currencies, then — off-ramp only, and only when there are any — the unsupported divider
 * toggle followed by the unsupported currencies while it's open.
 *
 * Entries without a `currencyInfo` are dropped rather than rendered: they'd all key to the same
 * `supported-`, which breaks row identity in a virtualized list, and the row renders `null` anyway.
 * The unsupported rows need no such filter — they come from `balancesById`, and a `PortfolioBalance`
 * always carries a `currencyInfo`, so their keys are unique by construction.
 */
export function buildFiatOnRampRows({
  list,
  balancesById,
  isOffRamp,
  showMore,
}: {
  list: FiatOnRampCurrency[]
  balancesById: Record<string, PortfolioBalance> | undefined
  isOffRamp: boolean
  showMore: boolean
}): FiatOnRampRow[] {
  const resolved = list.filter((c) => c.currencyInfo)
  const normalizedBalancesById = normalizeBalancesByIdForLookup(balancesById)
  const balanceOf = (c: FiatOnRampCurrency): PortfolioBalance | undefined =>
    c.currencyInfo ? normalizedBalancesById?.[normalizeCurrencyIdForMapLookup(c.currencyInfo.currencyId)] : undefined

  // A true partition: a currency with a cached balance entry of `quantity: 0` — what a fully-sold
  // token leaves behind — belongs with the unheld ones, not nowhere. Testing the quantity on both
  // sides is what makes every resolved currency appear exactly once.
  const isHeld = (c: FiatOnRampCurrency): boolean => (balanceOf(c)?.quantity ?? 0) > 0

  const sortedSupportedAssetsWithBalance = resolved
    .filter(isHeld)
    .sort((a, b) => (balanceOf(b)?.balanceUSD ?? 0) - (balanceOf(a)?.balanceUSD ?? 0))

  const supportedAssetsWithoutBalance = resolved.filter((c) => !isHeld(c))

  // Off-ramp sorts held balances to the top; on-ramp keeps the server's ordering.
  const supported = isOffRamp ? [...sortedSupportedAssetsWithBalance, ...supportedAssetsWithoutBalance] : resolved

  const rows: FiatOnRampRow[] = supported.map((currency) => ({
    type: FiatOnRampRowType.Currency,
    key: `supported-${currencyKey(currency)}`,
    currency,
  }))

  const unsupportedAssetsWithBalance = isOffRamp ? getUnsupportedFORTokensWithBalance(list, balancesById) : []

  if (unsupportedAssetsWithBalance.length > 0) {
    rows.push({ type: FiatOnRampRowType.UnsupportedToggle, key: 'unsupported-toggle' })

    if (showMore) {
      for (const currency of unsupportedAssetsWithBalance) {
        rows.push({ type: FiatOnRampRowType.Currency, key: `unsupported-${currencyKey(currency)}`, currency })
      }
    }
  }

  return rows
}
