import { Currency } from '@juiceswapxyz/sdk-core'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useTheme } from 'lib/styled-components'
import { useMemo } from 'react'
import { useExtractedTokenColor } from 'ui/src'

type ContrastSettings = { backgroundColor: string; darkMode: boolean }

export function useColor(currency?: Currency, contrastSettings?: ContrastSettings) {
  const theme = useTheme()
  const currencyInfo = useCurrencyInfo(currency)
  const src = currencyInfo?.logoUrl ?? undefined

  return (
    useSrcColor({
      src,
      currencyName: currency?.name,
      backgroundColor: contrastSettings?.backgroundColor,
    }).tokenColor ?? theme.accent1
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
  const theme = useTheme()

  const extractSrc = useMemo(
    () => (src?.includes('coingecko') ? 'https://corsproxy.io/?' + encodeURIComponent(src) : src),
    [src],
  )

  return useExtractedTokenColor({
    imageUrl: extractSrc,
    tokenName: currencyName,
    backgroundColor: backgroundColor ?? theme.surface1,
    defaultColor: theme.accent1,
  })
}
