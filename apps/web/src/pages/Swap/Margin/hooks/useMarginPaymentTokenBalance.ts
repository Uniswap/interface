import { useMemo } from 'react'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { currencyId, normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { MARGIN_PAYMENT_SOURCE_CHAIN_IDS } from '~/constants/margin'
import { getPaymentCurrency, getSpendablePaymentBalance } from '~/pages/Swap/Margin/marginCurrencies'

// Spendable base-unit balance of a margin payment token across every supported source chain. Mirrors
// useDerivedMarginInfo's balance read (prefers quantityRaw for base-unit precision; any native payment
// reserves a gas buffer, on an L2 source as well as on the margin chain) so the add-collateral editor
// gates Confirm the way the open form does.
// `portfolioLoaded` stays false until the first read lands so the caller doesn't block prematurely.
export function useMarginPaymentTokenBalance({
  paymentToken,
  evmAddress,
}: {
  paymentToken: MarginPaymentToken
  evmAddress?: string
}): { spendableBalanceRaw: string | undefined; portfolioLoaded: boolean } {
  const { data: portfolio } = usePortfolioBalances({
    evmAddress,
    chainIds: MARGIN_PAYMENT_SOURCE_CHAIN_IDS,
  })

  const paymentCurrency = useMemo(() => getPaymentCurrency(paymentToken), [paymentToken])

  const spendableBalanceRaw = useMemo(() => {
    const map = new Map<string, PortfolioBalance>()
    for (const [id, entry] of Object.entries(portfolio ?? {})) {
      map.set(normalizeCurrencyIdForMapLookup(id), entry)
    }
    const entry = map.get(normalizeCurrencyIdForMapLookup(currencyId(paymentCurrency)))
    if (!entry) {
      return undefined
    }
    const exact = entry.quantityRaw
      ? getCurrencyAmount({ value: entry.quantityRaw, valueType: ValueType.Raw, currency: paymentCurrency })
      : undefined
    const balance =
      exact ??
      getCurrencyAmount({ value: String(entry.quantity), valueType: ValueType.Exact, currency: paymentCurrency }) ??
      undefined
    return getSpendablePaymentBalance({ paymentToken, balance })?.quotient.toString()
  }, [portfolio, paymentCurrency, paymentToken])

  return { spendableBalanceRaw, portfolioLoaded: portfolio !== undefined }
}
