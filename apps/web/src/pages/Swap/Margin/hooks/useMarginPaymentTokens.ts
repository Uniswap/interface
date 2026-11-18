import type { Currency } from '@uniswap/sdk-core'
import { MARGIN_NATIVE_TOKEN_ADDRESS } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'

// Currency → the wire's payment-token shape (native ETH → the 0x0 sentinel address).
export function toMarginPaymentToken(currency: Currency): MarginPaymentToken {
  return {
    address: currency.isNative ? MARGIN_NATIVE_TOKEN_ADDRESS : currency.address,
    symbol: currency.symbol ?? '',
    decimals: currency.decimals,
    isNative: currency.isNative,
    chainId: currency.chainId,
  }
}
