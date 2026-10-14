import { getCurrencies } from 'react-native-localize'
import { DEFAULT_LOCAL_CURRENCY, FiatCurrency, ORDERED_CURRENCIES } from 'uniswap/src/features/fiatCurrency/constants'

function isSupportedFiatCurrency(code: string): code is FiatCurrency {
  return ORDERED_CURRENCIES.includes(code as FiatCurrency)
}

/** First supported currency from the device's locale preferences, falling back to USD. */
export function getDeviceFiatCurrency(): FiatCurrency {
  try {
    return getCurrencies().find(isSupportedFiatCurrency) ?? DEFAULT_LOCAL_CURRENCY
  } catch {
    return DEFAULT_LOCAL_CURRENCY
  }
}
