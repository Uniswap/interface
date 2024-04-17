import { Currency } from '@uniswap/sdk-core'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useMemo } from 'react'
import { useTheme } from 'styled-components'
import { useExtractedTokenColor } from 'ui/src/utils/colors'

type ContrastSettings = { backgroundColor: string; darkMode: boolean }

export function useColor(currency?: Currency, contrastSettings?: ContrastSettings) {
  const theme = useTheme()
  const currencyInfo = useCurrencyInfo(currency)
  const src = currencyInfo?.logoUrl ?? undefined

  return useSrcColor(src, currency?.name, contrastSettings?.backgroundColor).tokenColor ?? theme.accent1
}

export function useSrcColor(src?: string, currencyName?: string, backgroundColor?: string) {
  const theme = useTheme()

  const extractSrc = useMemo(
    () => (src?.includes('coingecko') ? 'https://corsproxy.io/?' + encodeURIComponent(src) : src),
    [src]
  )

  return useExtractedTokenColor(extractSrc, currencyName, backgroundColor ?? theme.surface1, theme.accent1)
}
