import {
  ARS_ICON,
  AUD_ICON,
  BRL_ICON,
  CAD_ICON,
  CNY_ICON,
  COP_ICON,
  EUR_ICON,
  GBP_ICON,
  HKD_ICON,
  IDR_ICON,
  INR_ICON,
  JPY_ICON,
  KRW_ICON,
  MXN_ICON,
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
import { ReactNode, Suspense } from 'react'
import { Loader } from 'ui/src/loading/Loader'
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
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <USD_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.Euro:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <EUR_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.RussianRuble:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <RUB_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.IndianRupee:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <INR_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.BritishPound:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <GBP_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.JapaneseYen:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <JPY_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.SouthKoreanWon:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <KRW_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.VietnameseDong:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <VND_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.SingaporeDollar:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <SGD_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.BrazilianReal:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <BRL_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.HongKongDollar:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <HKD_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.CanadianDollar:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <CAD_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.IndonesianRupiah:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <IDR_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.TurkishLira:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <TRY_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.NigerianNaira:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <NGN_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.AustralianDollar:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <AUD_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.PakistaniRupee:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <PKR_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.UkrainianHryvnia:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <UAH_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.ThaiBaht:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <THB_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.ChineseYuan:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <CNY_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.ArgentinePeso:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <ARS_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.ColombianPeso:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <COP_ICON width={size} height={size} />
        </Suspense>
      )
    case FiatCurrency.MexicanPeso:
      return (
        <Suspense fallback={<Loader.Box borderRadius="$roundedFull" width={size} height={size} />}>
          <MXN_ICON width={size} height={size} />
        </Suspense>
      )
    default:
      return null
  }
}
