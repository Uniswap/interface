import {
  AUD_ICON,
  BRL_ICON,
  CAD_ICON,
  CNY_ICON,
  EUR_ICON,
  GBP_ICON,
  HKD_ICON,
  IDR_ICON,
  INR_ICON,
  JPY_ICON,
  KRW_ICON,
  NGN_ICON,
  PKR_ICON,
  RUB_ICON,
  SGD_ICON,
  THB_ICON,
  TRY_ICON,
  UAH_ICON,
  USD_ICON,
  VND_ICON,
} from 'constants/localCurrencyIcons'
import { ReactNode } from 'react'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'

// some currencies need to be forced to use the narrow symbol and others need to be forced to use symbol
// for example: when CAD is set to narrowSymbol it is displayed as $ which offers no differentiation from USD
// but when set to symbol it is displayed as CA$ which is correct
// On the other hand when TBH is set to symbol it is displayed as THB, but when set to narrowSymbol it is ฿ which is correct
export function getCurrencySymbolDisplayType(currency: FiatCurrency): 'narrowSymbol' | 'symbol' {
  switch (currency) {
    case FiatCurrency.SingaporeDollar:
    case FiatCurrency.BrazilianReal:
    case FiatCurrency.HongKongDollar:
    case FiatCurrency.CanadianDollar:
    case FiatCurrency.AustralianDollar:
      return 'symbol'
    default:
      return 'narrowSymbol'
  }
}

export function getLocalCurrencyIcon(localCurrency: FiatCurrency, size = 20): ReactNode {
  switch (localCurrency) {
    case FiatCurrency.UnitedStatesDollar:
      return <USD_ICON width={size} height={size} />
    case FiatCurrency.Euro:
      return <EUR_ICON width={size} height={size} />
    case FiatCurrency.RussianRuble:
      return <RUB_ICON width={size} height={size} />
    case FiatCurrency.IndianRupee:
      return <INR_ICON width={size} height={size} />
    case FiatCurrency.BritishPound:
      return <GBP_ICON width={size} height={size} />
    case FiatCurrency.JapaneseYen:
      return <JPY_ICON width={size} height={size} />
    case FiatCurrency.SouthKoreanWon:
      return <KRW_ICON width={size} height={size} />
    case FiatCurrency.VietnameseDong:
      return <VND_ICON width={size} height={size} />
    case FiatCurrency.SingaporeDollar:
      return <SGD_ICON width={size} height={size} />
    case FiatCurrency.BrazilianReal:
      return <BRL_ICON width={size} height={size} />
    case FiatCurrency.HongKongDollar:
      return <HKD_ICON width={size} height={size} />
    case FiatCurrency.CanadianDollar:
      return <CAD_ICON width={size} height={size} />
    case FiatCurrency.IndonesianRupiah:
      return <IDR_ICON width={size} height={size} />
    case FiatCurrency.TurkishLira:
      return <TRY_ICON width={size} height={size} />
    case FiatCurrency.NigerianNaira:
      return <NGN_ICON width={size} height={size} />
    case FiatCurrency.AustralianDollar:
      return <AUD_ICON width={size} height={size} />
    case FiatCurrency.PakistaniRupee:
      return <PKR_ICON width={size} height={size} />
    case FiatCurrency.UkrainianHryvnia:
      return <UAH_ICON width={size} height={size} />
    case FiatCurrency.ThaiBaht:
      return <THB_ICON width={size} height={size} />
    case FiatCurrency.ChineseYuan:
      return <CNY_ICON width={size} height={size} />
    default:
      return null
  }
}
