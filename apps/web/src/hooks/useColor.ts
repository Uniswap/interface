import { Currency } from '@uniswap/sdk-core'
import { type TokenColorOverrides, useExtractedTokenColor } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useMemo } from 'react'
import { useCurrencyInfo } from '~/hooks/Tokens'

type ContrastSettings = { backgroundColor: string; darkMode: boolean }

export function useColor(currency?: Currency, contrastSettings?: ContrastSettings) {
  const colors = useSporeColors()
  const currencyInfo = useCurrencyInfo(currency)
  const src = currencyInfo?.logoUrl ?? undefined

  return (
    useSrcColor({
      src,
      currencyName: currency?.name,
      backgroundColor: contrastSettings?.backgroundColor,
      colorOverrides: currencyInfo?.colorOverrides,
    }).tokenColor ?? colors.accent1.val
  )
}

export function useSrcColor({
  src,
  currencyName,
  backgroundColor,
  defaultColor,
  colorOverrides,
}: {
  src?: string
  currencyName?: string
  backgroundColor?: string
  defaultColor?: string
  colorOverrides?: TokenColorOverrides
}) {
  const colors = useSporeColors()

  const extractSrc = useMemo(
    () => (src?.includes('coingecko') ? 'https://corsproxy.io/?' + encodeURIComponent(src) : src),
    [src],
  )

  return useExtractedTokenColor({
    imageUrl: extractSrc,
    tokenName: currencyName,
    backgroundColor: backgroundColor ?? colors.surface1.val,
    defaultColor: defaultColor ?? colors.accent1.val,
    colorOverrides,
  })
}
