import type { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { MARGIN_NATIVE_TOKEN_ADDRESS } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { CurrencyInfo, PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useSortedPortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { MARGIN_PAYMENT_SOURCE_CHAIN_IDS } from '~/constants/margin'

// A wallet-held token the user can pay with.
export interface MarginPaymentTokenRow {
  token: MarginPaymentToken
  currencyInfo: CurrencyInfo
  balance: number
  balanceUSD?: number
}

// Prefer the exact base-unit string: `quantity` is a float64 that loses dust past ~15-17 sig-figs;
// deriving the display balance from quantityRaw keeps it consistent with the sufficiency check. Falls
// back to the float when the API omits quantityRaw.
function exactBalance(balance: PortfolioBalance): number {
  if (balance.quantityRaw) {
    const amount = getCurrencyAmount({
      value: balance.quantityRaw,
      valueType: ValueType.Raw,
      currency: balance.currencyInfo.currency,
    })
    if (amount) {
      return Number(amount.toExact())
    }
  }
  return balance.quantity
}

// Currency → the wire's payment-token shape (native ETH → the 0x0 sentinel address).
function toMarginPaymentToken(currency: Currency): MarginPaymentToken {
  return {
    address: currency.isNative ? MARGIN_NATIVE_TOKEN_ADDRESS : currency.address,
    symbol: currency.symbol ?? '',
    decimals: currency.decimals,
    isNative: currency.isNative,
    chainId: currency.chainId,
  }
}

// Pay-with list = the wallet's real holdings across every supported source chain (spam/dust filtered,
// USD-sorted). Any token is selectable; the quote is the routability backstop.
export function useMarginPaymentTokens({ evmAddress }: { evmAddress?: string }): {
  rows: MarginPaymentTokenRow[]
  isLoading: boolean
} {
  const { data: sorted, loading } = useSortedPortfolioBalances({
    evmAddress,
    chainIds: MARGIN_PAYMENT_SOURCE_CHAIN_IDS,
  })

  return useMemo(() => {
    const rows: MarginPaymentTokenRow[] = (sorted?.balances ?? []).map((balance) => ({
      token: toMarginPaymentToken(balance.currencyInfo.currency),
      currencyInfo: balance.currencyInfo,
      balance: exactBalance(balance),
      balanceUSD: balance.balanceUSD ?? undefined,
    }))
    return { rows, isLoading: loading }
  }, [sorted, loading])
}
