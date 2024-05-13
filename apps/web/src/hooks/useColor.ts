import { Currency } from '@ubeswap/sdk-core'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import { useMemo } from 'react'
import { useTheme } from 'styled-components'
import { useExtractedTokenColor } from 'ui/src/utils/colors'

type ContrastSettings = { backgroundColor: string; darkMode: boolean }

export function useColor(currency?: Currency, contrastSettings?: ContrastSettings) {
  const theme = useTheme()
  const [src] = useTokenLogoSource({
    address: currency?.wrapped.address,
    chainId: currency?.chainId,
    isNative: currency?.isNative,
  })

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
