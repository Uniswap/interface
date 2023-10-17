import { ChainId, Token } from '@uniswap/sdk-core'
import { DEFAULT_COLOR } from 'constants/tokenColors'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import { darken, lighten, rgb } from 'polished'
import { useEffect, useState } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useTheme } from 'styled-components'
import { getColor } from 'utils/getColor'
import { hex } from 'wcag-contrast'

// The WCAG AA standard color contrast threshold
const MIN_COLOR_CONTRAST_THRESHOLD = 3

/**
 * Compares a given color against the background color to determine if it passes the minimum contrast threshold.
 * @param color The hex value of the extracted color
 * @param backgroundColor The hex value of the background color to check contrast against
 * @returns either 'sporeWhite' or 'sporeBlack'
 */
function passesContrast(color: string, backgroundColor: string): boolean {
  const contrast = hex(color, backgroundColor)
  return contrast >= MIN_COLOR_CONTRAST_THRESHOLD
}

function URIForEthToken(address: string) {
  return `https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/${address}/logo.png`
}

/**
 * Retrieves the average color from a token's symbol using various sources.
 *
 * @param {Token} token - The token for which to fetch the color.
 * @param {string} primarySrc - Primary source URL for color retrieval (optional).
 *
 * @returns {Promise< | null>} A promise that resolves to a color string or null if color cannot be determined.
 */
async function getColorFromToken(token: Token, primarySrc?: string): Promise<string | null> {
  const wrappedToken = token as WrappedTokenInfo
  let color: string | null = null

  try {
    if (primarySrc) {
      const colorArray = await getColor(primarySrc)
      color = colorArray === DEFAULT_COLOR ? null : convertColorArrayToString(colorArray)
    }

    if (!color && wrappedToken?.logoURI) {
      const colorArray = await getColor(wrappedToken.logoURI)
      color = colorArray === DEFAULT_COLOR ? null : convertColorArrayToString(colorArray)
    }

    if (!color && token.chainId === ChainId.MAINNET) {
      const colorArray = await getColor(URIForEthToken(wrappedToken.address))
      color = colorArray === DEFAULT_COLOR ? null : convertColorArrayToString(colorArray)
    }

    return color
  } catch (error) {
    console.warn(`Unable to load logoURI (${token.symbol}): ${primarySrc}, ${wrappedToken.logoURI}`)
    return null
  }
}

function convertColorArrayToString([red, green, blue]: number[]): string {
  return rgb({ red, green, blue })
}

export function useColor(token?: Token, backgroundColor?: string, makeLighter?: boolean) {
  const theme = useTheme()
  const [color, setColor] = useState(theme.accent1)
  const [src] = useTokenLogoSource(token?.address, token?.chainId, token?.isNative)

  useEffect(() => {
    let stale = false

    if (token) {
      getColorFromToken(token, src).then((tokenColor) => {
        if (!stale && tokenColor !== null) {
          if (backgroundColor) {
            let increment = 0.1
            while (!passesContrast(tokenColor, backgroundColor)) {
              tokenColor = makeLighter ? lighten(increment, tokenColor) : darken(increment, tokenColor)
              increment += 0.1
            }
          }
          setColor(tokenColor)
        }
      })
    }

    return () => {
      stale = true
      setColor(theme.accent1)
    }
  }, [backgroundColor, makeLighter, src, theme.accent1, token])

  return color
}
