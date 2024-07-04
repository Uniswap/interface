import { SupportedLocalCurrency } from 'constants/localCurrencies'
import { AppTFunction } from 'ui/src/i18n/types'
import { Currency } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

/**
 * Helper used to get the fiat currency name in the current app language
 * @param currency target currency
 * @returns currency name
 */
export function getFiatCurrencyName(
  t: AppTFunction,
  currency: SupportedLocalCurrency,
): { name: string; shortName: string } {
  const currencyToCurrencyName: Record<SupportedLocalCurrency, string> = {
    [Currency.Aud]: t('currency.aud'),
    [Currency.Brl]: t('currency.brl'),
    [Currency.Cad]: t('currency.cad'),
    [Currency.Cny]: t('currency.cny'),
    [Currency.Eur]: t('currency.eur'),
    [Currency.Gbp]: t('currency.gbp'),
    [Currency.Hkd]: t('currency.hkd'),
    [Currency.Idr]: t('currency.idr'),
    [Currency.Inr]: t('currency.inr'),
    [Currency.Jpy]: t('currency.jpy'),
    [Currency.Ngn]: t('currency.ngn'),
    [Currency.Pkr]: t('currency.pkr'),
    [Currency.Rub]: t('currency.rub'),
    [Currency.Sgd]: t('currency.sgd'),
    [Currency.Thb]: t('currency.thb'),
    [Currency.Try]: t('currency.try'),
    [Currency.Uah]: t('currency.uah'),
    [Currency.Usd]: t('currency.usd'),
    [Currency.Vnd]: t('currency.vnd'),
  }
  const currencyToGlobalSymbol: Record<SupportedLocalCurrency, string> = {
    [Currency.Aud]: '$',
    [Currency.Brl]: 'R$',
    [Currency.Cad]: '$',
    [Currency.Cny]: '¥',
    [Currency.Eur]: '€',
    [Currency.Gbp]: '£',
    [Currency.Hkd]: '$',
    [Currency.Idr]: 'Rp',
    [Currency.Inr]: '₹',
    [Currency.Jpy]: '¥',
    [Currency.Ngn]: '₦',
    [Currency.Pkr]: 'Rs',
    [Currency.Rub]: '₽',
    [Currency.Sgd]: '$',
    [Currency.Thb]: '฿',
    [Currency.Try]: '₺',
    [Currency.Uah]: '₴',
    [Currency.Usd]: '$',
    [Currency.Vnd]: '₫',
  }

  const code = currency.toUpperCase()
  const symbol = currencyToGlobalSymbol[currency]
  return { name: currencyToCurrencyName[currency], shortName: `${code} (${symbol})` }
}
