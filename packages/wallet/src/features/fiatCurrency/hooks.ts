import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
// eslint-disable-next-line no-restricted-imports
import { FiatCurrencyComponents, getFiatCurrencyComponents } from 'utilities/src/format/localeBased'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import { useCurrentLocale } from 'wallet/src/features/language/hooks'
import { useAppSelector } from 'wallet/src/state'

export type FiatCurrencyInfo = {
  name: string
  code: string
} & FiatCurrencyComponents

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
 * Hook used to get the fiat currency name in the current app language
 * @param currency target currency
 * @returns currency name
 */
export function useFiatCurrencyName(currency: FiatCurrency): string {
  const { t } = useTranslation()

  const currencyToCurrencyName = useMemo((): Record<FiatCurrency, string> => {
    return {
      [FiatCurrency.AustrialianDollor]: t('Australian Dollar'),
      [FiatCurrency.BrazilianReal]: t('Brazilian Real'),
      [FiatCurrency.CanadianDollar]: t('Canadian Dollar'),
      [FiatCurrency.ChineseYuan]: t('Chinese Yuan'),
      [FiatCurrency.Euro]: t('Euro'),
      [FiatCurrency.BritishPound]: t('British Pound'),
      [FiatCurrency.HongKongDollar]: t('Hong Kong Dollar'),
      [FiatCurrency.IndonesianRupiah]: t('Indonesian Rupiah'),
      [FiatCurrency.IndianRupee]: t('Indian Rupee'),
      [FiatCurrency.JapaneseYen]: t('Japanese Yen'),
      [FiatCurrency.NigerianNaira]: t('Nigerian Naira'),
      [FiatCurrency.PakistaniRupee]: t('Pakistani Rupee'),
      [FiatCurrency.RussianRuble]: t('Russian Ruble'),
      [FiatCurrency.SingaporeDollar]: t('Singapore Dollar'),
      [FiatCurrency.ThaiBaht]: t('Thai Baht'),
      [FiatCurrency.TurkishLira]: t('Turkish Lira'),
      [FiatCurrency.UkrainianHryvnia]: t('Ukrainian Hryvnia'),
      [FiatCurrency.UnitedStatesDollar]: t('United States Dollar'),
      [FiatCurrency.VietnameseDong]: t('Vietnamese Dong'),
    }
  }, [t])

  return currencyToCurrencyName[currency]
}

/**
 * Hook used to get fiat currency info (name, code, symbol, etc.) in the current app language
 * @param currency target currency
 * @returns all relevant currency info
 */
export function useFiatCurrencyInfo(currency: FiatCurrency): FiatCurrencyInfo {
  const components = useFiatCurrencyComponents(currency)

  return {
    ...components,
    name: useFiatCurrencyName(currency),
    code: getFiatCurrencyCode(currency),
  }
}

/**
 * Hook used to return the current selected fiat currency in the app
 * @returns currently selected fiat currency
 */
export function useAppFiatCurrency(): FiatCurrency {
  const featureEnabled = useFeatureFlag(FEATURE_FLAGS.CurrencyConversion)
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
  const components = useFiatCurrencyComponents(currency)

  return {
    ...components,
    name: useFiatCurrencyName(currency),
    code: getFiatCurrencyCode(currency),
  }
}
