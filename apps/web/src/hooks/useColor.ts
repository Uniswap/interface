import { Currency } from '@uniswap/sdk-core'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useMemo } from 'react'
import { useExtractedTokenColor, useSporeColors } from 'ui/src'

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
    }).tokenColor ?? colors.accent1.val
  )
}

export function useSrcColor({
  src,
  currencyName,
  backgroundColor,
}: {
  src?: string
  currencyName?: string
  backgroundColor?: string
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
    defaultColor: colors.accent1.val,
  })
}
