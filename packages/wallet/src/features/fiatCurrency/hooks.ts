import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { AppTFunction } from 'ui/src/i18n/types'
import { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
// eslint-disable-next-line no-restricted-imports
import { FiatCurrencyComponents, getFiatCurrencyComponents } from 'utilities/src/format/localeBased'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useCurrentLocale } from 'wallet/src/features/language/hooks'
import { useAppSelector } from 'wallet/src/state'

/**
 * Helper function for getting the ISO currency code from our internal enum
 * @param currency target currency
 * @returns ISO currency code
 */
// ISO currency code is only in English and cannot be translated
export function getFiatCurrencyCode(currency: FiatCurrency): string {
  return currency.toString()
}

/**
 * Hook to get the currency symbol based on the fiat currency in the current
 * language/locale, which is why it's a hook
 * @param currency target currency
 * @returns currency symbol
 */
export function useFiatCurrencyComponents(currency: FiatCurrency): FiatCurrencyComponents {
  const locale = useCurrentLocale()
  const currencyCode = getFiatCurrencyCode(currency)

  const components = getFiatCurrencyComponents(locale, currencyCode)
  return components
}

/**
 * Helper used to get the fiat currency name in the current app language
 * @param currency target currency
 * @returns currency name
 */
export function getFiatCurrencyName(t: AppTFunction, currency: FiatCurrency): { name: string; shortName: string } {
  const currencyToCurrencyName = {
    [FiatCurrency.AustrialianDollor]: t('currency.aud'),
    [FiatCurrency.BrazilianReal]: t('currency.brl'),
    [FiatCurrency.CanadianDollar]: t('currency.cad'),
    [FiatCurrency.ChineseYuan]: t('currency.cny'),
    [FiatCurrency.Euro]: t('currency.eur'),
    [FiatCurrency.BritishPound]: t('currency.gbp'),
    [FiatCurrency.HongKongDollar]: t('currency.hkd'),
    [FiatCurrency.IndonesianRupiah]: t('currency.idr'),
    [FiatCurrency.IndianRupee]: t('currency.inr'),
    [FiatCurrency.JapaneseYen]: t('currency.jpy'),
    [FiatCurrency.NigerianNaira]: t('currency.ngn'),
    [FiatCurrency.PakistaniRupee]: t('currency.pkr'),
    [FiatCurrency.RussianRuble]: t('currency.rub'),
    [FiatCurrency.SingaporeDollar]: t('currency.sgd'),
    [FiatCurrency.ThaiBaht]: t('currency.thb'),
    [FiatCurrency.TurkishLira]: t('currency.try'),
    [FiatCurrency.UkrainianHryvnia]: t('currency.uah'),
    [FiatCurrency.UnitedStatesDollar]: t('currency.usd'),
    [FiatCurrency.VietnameseDong]: t('currency.vnd'),
  }
  const currencyToGlobalSymbol: Record<FiatCurrency, string> = {
    [FiatCurrency.AustrialianDollor]: '$',
    [FiatCurrency.BrazilianReal]: 'R$',
    [FiatCurrency.CanadianDollar]: '$',
    [FiatCurrency.ChineseYuan]: '¥',
    [FiatCurrency.Euro]: '€',
    [FiatCurrency.BritishPound]: '£',
    [FiatCurrency.HongKongDollar]: '$',
    [FiatCurrency.IndonesianRupiah]: 'Rp',
    [FiatCurrency.IndianRupee]: '₹',
    [FiatCurrency.JapaneseYen]: '¥',
    [FiatCurrency.NigerianNaira]: '₦',
    [FiatCurrency.PakistaniRupee]: 'Rs',
    [FiatCurrency.RussianRuble]: '₽',
    [FiatCurrency.SingaporeDollar]: '$',
    [FiatCurrency.ThaiBaht]: '฿',
    [FiatCurrency.TurkishLira]: '₺',
    [FiatCurrency.UkrainianHryvnia]: '₴',
    [FiatCurrency.UnitedStatesDollar]: '$',
    [FiatCurrency.VietnameseDong]: '₫',
  }

  const code = getFiatCurrencyCode(currency)
  const symbol = currencyToGlobalSymbol[currency]
  return { name: currencyToCurrencyName[currency], shortName: `${code} (${symbol})` }
}

/**
 * Hook used to get fiat currency info (name, code, symbol, etc.) in the current app language
 * @param currency target currency
 * @returns all relevant currency info
 */
export function useFiatCurrencyInfo(currency: FiatCurrency): FiatCurrencyInfo {
  const { t } = useTranslation()
  const components = useFiatCurrencyComponents(currency)
  const { name, shortName } = getFiatCurrencyName(t, currency)
  const code = getFiatCurrencyCode(currency)

  return {
    ...components,
    name,
    shortName,
    code,
  }
}

/**
 * Hook used to return the current selected fiat currency in the app
 * @returns currently selected fiat currency
 */
export function useAppFiatCurrency(): FiatCurrency {
  const featureEnabled = useFeatureFlag(FeatureFlags.CurrencyConversion)
  const { currentCurrency } = useAppSelector((state) => state.fiatCurrencySettings)
  return featureEnabled ? currentCurrency : FiatCurrency.UnitedStatesDollar
}

/**
 * Hook used to return all relevant currency info (name, code, symbol, etc)
 * for the currently selected fiat currency in the app
 * @returns all relevant info for the currently selected fiat currency
 */
export function useAppFiatCurrencyInfo(): FiatCurrencyInfo {
  const currency = useAppFiatCurrency()

  return useFiatCurrencyInfo(currency)
}

/**
 * Hook to convert local fiat currency amount to USD amount
 * @returns USD amount
 */
export const useLocalFiatToUSDConverter = (): ((fiatAmount: number) => number | undefined) => {
  const { convertFiatAmount } = useLocalizationContext()
  return useCallback(
    (fiatAmount: number): number | undefined => {
      const { amount: USDInLocalCurrency } = convertFiatAmount(1)
      return USDInLocalCurrency ? fiatAmount / USDInLocalCurrency : undefined
    },
    [convertFiatAmount],
  )
}
