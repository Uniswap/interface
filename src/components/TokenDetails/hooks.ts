import { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { WrappedTokenInfo } from 'src/features/tokenLists/wrappedTokenInfo'
import { useTokenInfoFromAddress } from 'src/features/tokens/useTokenInfoFromAddress'
import { buildCurrencyId } from 'src/utils/currencyId'

export function useBridgeInfo(currency: Currency) {
  const nativeWrappedCurrency = useTokenInfoFromAddress(
    currency.chainId,
    currency.isNative ? buildCurrencyId(currency.chainId, currency.wrapped.address) : undefined
  )
  return useMemo(
    () =>
      currency instanceof WrappedTokenInfo
        ? currency.bridgeInfo
        : nativeWrappedCurrency instanceof WrappedTokenInfo
        ? nativeWrappedCurrency.bridgeInfo
        : null,
    [currency, nativeWrappedCurrency]
  )
}
