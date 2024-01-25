import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import {
  FiatCurrencyInfo,
  useAppFiatCurrencyInfo,
  useFiatCurrencyInfo,
} from 'wallet/src/features/fiatCurrency/hooks'

// MoonPay supported fiat currencies (https://support.moonpay.com/hc/en-gb/articles/360011931457-Which-fiat-currencies-are-supported-)
const MOONPAY_FIAT_CURRENCY_CODES = [
  'aud', // Australian Dollar
  'bgn', // Bulgarian Lev
  'brl', // Brazilian Real
  'cad', // Canadian Dollar
  'chf', // Swiss Franc
  'cny', // Chinese Yuan
  'cop', // Colombia Peso
  'czk', // Czech Koruna
  'dkk', // Danish Krone
  'dop', // Dominican Peso
  'egp', // Egyptian Pound
  'eur', // Euro
  'gbp', // Pound Sterling
  'hkd', // Hong Kong Dollar
  'idr', // Indonesian Rupiah
  'ils', // Israeli New Shekel
  'jpy', // Japanese Yen
  'jod', // Jordanian Dollar
  'kes', // Kenyan Shilling
  'krw', // South Korean Won
  'kwd', // Kuwaiti Dinar
  'lkr', // Sri Lankan Rupee
  'mad', // Moroccan Dirham
  'mxn', // Mexican Peso
  'ngn', // Nigerian Naira
  'nok', // Norwegian Krone
  'nzd', // New Zealand Dollar
  'omr', // Omani Rial
  'pen', // Peruvian Sol
  'pkr', // Pakistani Rupee
  'pln', // Polish Złoty
  'ron', // Romanian Leu
  'sek', // Swedish Krona
  'thb', // Thai Baht
  'try', // Turkish Lira
  'twd', // Taiwan Dollar
  'usd', // US Dollar
  'vnd', // Vietnamese Dong
  'zar', // South African Rand
]

export function useMoonpayFiatCurrencySupportInfo(): {
  appFiatCurrencySupportedInMoonpay: boolean
  moonpaySupportedFiatCurrency: FiatCurrencyInfo
} {
  // Not all the currencies are supported by MoonPay, so we need to fallback to USD if the currency is not supported
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const fallbackCurrencyInfo = useFiatCurrencyInfo(FiatCurrency.UnitedStatesDollar)
  const appFiatCurrencyCode = appFiatCurrencyInfo.code.toLowerCase()

  const appFiatCurrencySupported = MOONPAY_FIAT_CURRENCY_CODES.includes(appFiatCurrencyCode)
  const currency = appFiatCurrencySupported ? appFiatCurrencyInfo : fallbackCurrencyInfo

  return {
    appFiatCurrencySupportedInMoonpay: appFiatCurrencySupported,
    moonpaySupportedFiatCurrency: currency,
  }
}
