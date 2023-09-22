import { ChainId, Token } from '@uniswap/sdk-core'
import { DEFAULT_COLOR } from 'constants/tokenColors'
import useTokenLogoSource from 'hooks/useAssetLogoSource'
import { rgb } from 'polished'
import { useEffect, useState } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { getColor } from 'utils/getColor'

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
  if (!(token instanceof WrappedTokenInfo)) {
    return null
  }

  const wrappedToken = token as WrappedTokenInfo
  let color: string | null = null

  try {
    if (primarySrc) {
      const colorArray = await getColor(primarySrc)
      color = colorArray === DEFAULT_COLOR ? null : convertColorArrayToString(colorArray)
    }

    if (!color && wrappedToken.logoURI) {
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

export function useColor(token?: Token) {
  const [color, setColor] = useState('#2172E5')
  const [src] = useTokenLogoSource(token?.address, token?.chainId, token?.isNative)

  useEffect(() => {
    let stale = false

    if (token) {
      getColorFromToken(token, src).then((tokenColor) => {
        if (!stale && tokenColor !== null) {
          setColor(tokenColor)
        }
      })
    }

    return () => {
      stale = true
      setColor('#2172E5')
    }
  }, [src, token])

  return color
}
