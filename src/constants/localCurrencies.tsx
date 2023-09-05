import { ReactNode } from 'react'

import {
  AUD_ICON,
  BRL_ICON,
  CAD_ICON,
  EUR_ICON,
  GBP_ICON,
  HKD_ICON,
  IDR_ICON,
  INR_ICON,
  JPY_ICON,
  NGN_ICON,
  PKR_ICON,
  RUB_ICON,
  SGD_ICON,
  THB_ICON,
  TRY_ICON,
  UAH_ICON,
  USD_ICON,
  VND_ICON,
} from './localCurrencyIcons'

export const SUPPORTED_LOCAL_CURRENCIES = [
  'USD',
  'AUD',
  'BRL',
  'CAD',
  'EUR',
  'GBP',
  'HKD',
  'IDR',
  'INR',
  'JPY',
  'NGN',
  'PKR',
  'RUB',
  'SGD',
  'THB',
  'TRY',
  'UAH',
  'VND',
]

export type SupportedLocalCurrency = (typeof SUPPORTED_LOCAL_CURRENCIES)[number]

export const DEFAULT_LOCAL_CURRENCY: SupportedLocalCurrency = 'USD'

// some currencies need to be forced to use the narrow symbol and others need to be forced to use symbol
// for example: when CAD is set to narrowSymbol it is displayed as $ which offers no differentiation from USD
// but when set to symbol it is displayed as CA$ which is correct
// On the other hand when TBH is set to symbol it is displayed as THB, but when set to narrowSymbol it is ฿ which is correct
export const LOCAL_CURRENCY_SYMBOL_DISPLAY_TYPE: Record<SupportedLocalCurrency, 'narrowSymbol' | 'symbol'> = {
  USD: 'narrowSymbol',
  EUR: 'narrowSymbol',
  RUB: 'narrowSymbol',
  INR: 'narrowSymbol',
  GBP: 'narrowSymbol',
  JPY: 'narrowSymbol',
  VND: 'narrowSymbol',
  SGD: 'symbol',
  BRL: 'symbol',
  HKD: 'symbol',
  CAD: 'symbol',
  IDR: 'narrowSymbol',
  TRY: 'narrowSymbol',
  NGN: 'narrowSymbol',
  UAH: 'narrowSymbol',
  PKR: 'narrowSymbol',
  AUD: 'symbol',
  THB: 'narrowSymbol',
}

export function getLocalCurrencyIcon(localCurrency: SupportedLocalCurrency, size = 20): ReactNode {
  switch (localCurrency) {
    case 'USD':
      return <USD_ICON width={size} height={size} />
    case 'EUR':
      return <EUR_ICON width={size} height={size} />
    case 'RUB':
      return <RUB_ICON width={size} height={size} />
    case 'INR':
      return <INR_ICON width={size} height={size} />
    case 'GBP':
      return <GBP_ICON width={size} height={size} />
    case 'JPY':
      return <JPY_ICON width={size} height={size} />
    case 'VND':
      return <VND_ICON width={size} height={size} />
    case 'SGD':
      return <SGD_ICON width={size} height={size} />
    case 'BRL':
      return <BRL_ICON width={size} height={size} />
    case 'HKD':
      return <HKD_ICON width={size} height={size} />
    case 'CAD':
      return <CAD_ICON width={size} height={size} />
    case 'IDR':
      return <IDR_ICON width={size} height={size} />
    case 'TRY':
      return <TRY_ICON width={size} height={size} />
    case 'NGN':
      return <NGN_ICON width={size} height={size} />
    case 'AUD':
      return <AUD_ICON width={size} height={size} />
    case 'PKR':
      return <PKR_ICON width={size} height={size} />
    case 'UAH':
      return <UAH_ICON width={size} height={size} />
    case 'THB':
      return <THB_ICON width={size} height={size} />
    default:
      return null
  }
}
