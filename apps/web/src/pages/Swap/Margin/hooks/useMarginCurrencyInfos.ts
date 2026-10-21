import { useMemo } from 'react'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { type MarginTokenInfo } from '~/constants/margin'
import { useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { marginTokenCurrencyId } from '~/pages/Swap/Margin/marginCurrencies'
import { marginUnwrapSymbol } from '~/pages/Swap/Margin/marginTokenDisplay'

// Resolves real CurrencyInfo (logoUrl included) for every margin token in ONE batched data-API query,
// keyed by normalized currencyId. Mainnet art resolves independently of the local fork.
//
// The token set is whatever GET /margin/markets lists — both legs of every market, in the registry's
// own order — so a newly listed asset gets art without a client release. Wrapped-native (WETH) routes
// to the native currencyId via marginTokenCurrencyId, so its logo resolves to ETH.
export function useMarginCurrencyInfos(): Map<string, CurrencyInfo> {
  const { markets } = useMarginMarkets()
  const currencyIds = useMemo(() => {
    const ids = new Set<string>()
    for (const market of markets) {
      ids.add(marginTokenCurrencyId(market.collateral))
      ids.add(marginTokenCurrencyId(market.debt))
    }
    return [...ids]
  }, [markets])
  const resolved = useCurrencyInfos(currencyIds)
  return useMemo(() => {
    const map = new Map<string, CurrencyInfo>()
    for (const info of resolved) {
      if (info) {
        map.set(normalizeCurrencyIdForMapLookup(info.currencyId), info)
      }
    }
    return map
  }, [resolved])
}

// Map lookup by a token's currencyId, tolerant of address casing.
export function getMarginCurrencyInfo(input: {
  currencyInfos: Map<string, CurrencyInfo>
  currencyId: string
}): Maybe<CurrencyInfo> {
  return input.currencyInfos.get(normalizeCurrencyIdForMapLookup(input.currencyId))
}

// SplitLogo props for a pair, base on the input slot. One source of truth so no site can drift.
export function getMarginPairLogoProps(input: {
  base: MarginTokenInfo
  quote: MarginTokenInfo
  currencyInfos: Map<string, CurrencyInfo>
}): {
  inputLogoUrl?: string
  outputLogoUrl?: string
  inputFallbackSymbol: string
  outputFallbackSymbol: string
} {
  const { base, quote, currencyInfos } = input
  return {
    inputLogoUrl:
      getMarginCurrencyInfo({ currencyInfos, currencyId: marginTokenCurrencyId(base) })?.logoUrl ?? undefined,
    outputLogoUrl:
      getMarginCurrencyInfo({ currencyInfos, currencyId: marginTokenCurrencyId(quote) })?.logoUrl ?? undefined,
    inputFallbackSymbol: marginUnwrapSymbol(base),
    outputFallbackSymbol: marginUnwrapSymbol(quote),
  }
}
