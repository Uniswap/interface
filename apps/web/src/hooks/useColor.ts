import { ChainId, Currency } from '@uniswap/sdk-core'
import { DEFAULT_COLOR } from 'constants/tokenColors'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import { rgb } from 'polished'
import { useEffect, useMemo, useRef, useState } from 'react'
import { TokenFromList } from 'state/lists/tokenFromList'
import { useTheme } from 'styled-components'
import { getAccessibleColor } from 'theme/utils'
import { getColor } from 'utils/getColor'

function URIForEthToken(address: string) {
  return `https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/${address}/logo.png`
}

const COLOR_CACHE: Record<string, string | undefined> = {}

/**
 * Retrieves the average color from a token's symbol using various sources.
 *
 * @param {Currency} currency - The currency for which to fetch the color.
 * @param {string} primarySrc - Primary source URL for color retrieval (optional).
 *
 * @returns {Promise<string | null>} A promise that resolves to a color string or null if color cannot be determined.
 */
async function getColorFromToken(srcs: string[]): Promise<string | undefined> {
  let color: string | null = null
  try {
    for (const src of srcs) {
      const cachedColor = COLOR_CACHE[src]
      if (cachedColor) return cachedColor

      const colorArray = await getColor(src)
      color = colorArray === DEFAULT_COLOR ? null : convertColorArrayToString(colorArray)
      if (color) {
        COLOR_CACHE[src] = color
        return color
      }
    }
    return undefined
  } catch (error) {
    console.warn(`Unable to extract color from logo sources: ${srcs}`)
    return undefined
  }
}

function getBackupCurrencySrcs(currency?: Currency) {
  const srcs = []
  const wrappedToken = currency?.wrapped as TokenFromList

  if (wrappedToken?.logoURI) {
    srcs.push(wrappedToken.logoURI)
  }
  if (currency?.chainId === ChainId.MAINNET) {
    srcs.push(URIForEthToken(wrappedToken.address))
  }

  return srcs
}

function convertColorArrayToString([red, green, blue]: number[]): string {
  return rgb({ red, green, blue })
}

type ContrastSettings = { backgroundColor: string; darkMode: boolean }

export function useColor(currency?: Currency, contrastSettings?: ContrastSettings) {
  const theme = useTheme()
  const [src] = useTokenLogoSource({
    address: currency?.wrapped.address,
    chainId: currency?.chainId,
    isNative: currency?.isNative,
  })

  const srcs = useMemo(() => {
    const backupSrcs = getBackupCurrencySrcs(currency)
    return src ? [src, ...backupSrcs] : backupSrcs
  }, [currency, src])

  return useSrcColor(srcs, contrastSettings) ?? theme.accent1
}

export function useSrcColor(src?: string[] | string, contrastSettings?: ContrastSettings) {
  const theme = useTheme()
  const [color, setColor] = useState<string | undefined>()

  const prevSrcRef = useRef(src)
  prevSrcRef.current = src

  useEffect(() => {
    async function fetchColor() {
      if (src) {
        let color = await getColorFromToken(Array.isArray(src) ? src : [src])
        // Update the color if the src has not changed since before fetch started
        if (color && prevSrcRef.current === src) {
          if (contrastSettings) {
            color = getAccessibleColor(color, contrastSettings.backgroundColor, contrastSettings.darkMode)
          }
          setColor(color)
        } else {
          setColor(undefined)
        }
      }
    }
    fetchColor()
  }, [contrastSettings, src, theme.accent1])

  return color
}
