export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'RUB',
  'INR',
  'GBP',
  'JPY',
  'VND',
  'SGD',
  'BRL',
  'HKD',
  'CAD',
  'IDR',
  'TRY',
  'NGN',
  'UAH',
  'PKR',
  'AUD',
  'THB',
]

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

export const DEFAULT_CURRENCY: SupportedCurrency = 'USD'
