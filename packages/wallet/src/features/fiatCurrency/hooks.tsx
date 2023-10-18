import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FiatCurrency } from 'wallet/src/features/fiatCurrency/constants'
import { useCurrentLanguageInfo } from 'wallet/src/features/language/hooks'
import { useAppSelector } from 'wallet/src/state'

export type FiatCurrencyInfo = {
  name: string
  code: string
  symbol: string
}

// ISO currency code is only in English and cannot be translated
export function getFiatCurrencyCode(currency: FiatCurrency): string {
  return currency.toString()
}

export function useFiatCurrencySymbol(currency: FiatCurrency): string {
  const locale = useCurrentLanguageInfo().locale
  const currencyCode = getFiatCurrencyCode(currency)

  // Parts is different based on locale
  // E.g. [{"type":"currency","value":"$"},{"type":"integer","value":"1"}]
  const parts = Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).formatToParts(1)

  const currencyPart = parts.find((part) => part.type === 'currency')
  return currencyPart?.value ?? ''
}

export function useFiatCurrencyName(currency: FiatCurrency): string {
  const { t } = useTranslation()

  const currencyToCurrencyName = useMemo((): Record<FiatCurrency, string> => {
    return {
      [FiatCurrency.AustrialianDollor]: t('Australian Dollar'),
      [FiatCurrency.BrazilianReal]: t('Brazilian Real'),
      [FiatCurrency.CanadianDollar]: t('Canadian Dollar'),
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

export function useFiatCurrencyInfo(currency: FiatCurrency): FiatCurrencyInfo {
  return {
    name: useFiatCurrencyName(currency),
    code: getFiatCurrencyCode(currency),
    symbol: useFiatCurrencySymbol(currency),
  }
}

export function useAppFiatCurrency(): FiatCurrency {
  const { currentCurrency } = useAppSelector((state) => state.fiatCurrencySettings)
  return currentCurrency
}

export function useAppFiatCurrencyInfo(): FiatCurrencyInfo {
  const currency = useAppFiatCurrency()
  return {
    name: useFiatCurrencyName(currency),
    code: getFiatCurrencyCode(currency),
    symbol: useFiatCurrencySymbol(currency),
  }
}
