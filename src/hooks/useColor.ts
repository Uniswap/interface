import { ChainId, Token } from '@uniswap/sdk-core'
import { Buffer } from 'buffer'
import JPEG from 'jpeg-js'
import PNG from 'png-ts'
import { rgb } from 'polished'
import { useEffect, useState } from 'react'

import { DEFAULT_COLOR, predefinedTokenColors } from '../constants/tokenColors'
import useTokenLogoSource from '../hooks/useAssetLogoSource'
import { WrappedTokenInfo } from '../state/lists/wrappedTokenInfo'

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

function convertColorArrayToString(color: number[]): string {
  return rgb({ red: color[0], green: color[1], blue: color[2] })
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

export async function getColor(image: string | undefined, checkDistance = false) {
  if (!image) {
    return DEFAULT_COLOR
  }
  if (image in predefinedTokenColors) {
    return predefinedTokenColors[image]
  }
  try {
    const data = await fetch(image)
    const buffer = await data.arrayBuffer()
    const arrayBuffer = Buffer.from(buffer)

    const type = data.headers.get('content-type') ?? ''
    return getAverageColor(arrayBuffer, type, checkDistance)
  } catch (e) {
    return DEFAULT_COLOR
  }
}

function getAverageColor(arrayBuffer: Uint8Array, type: string, checkDistance: boolean) {
  let pixels
  switch (type) {
    case 'image/png': {
      const image = PNG.load(arrayBuffer)
      pixels = image.decode()
      break
    }
    case 'image/jpeg' || 'image/jpg': {
      const jpeg = JPEG.decode(arrayBuffer, { useTArray: true })
      pixels = jpeg.data
      break
    }
    default: {
      return DEFAULT_COLOR
    }
  }

  const pixelCount = pixels.length / 4

  let transparentPixels = 0

  let r = 0
  let g = 0
  let b = 0

  for (let i = 0; i < pixelCount; i++) {
    if (pixels[i * 4 + 3] === 0) {
      transparentPixels++
      continue
    }
    r += pixels[i * 4]
    g += pixels[i * 4 + 1]
    b += pixels[i * 4 + 2]
  }

  r = Math.floor(r / (pixelCount - transparentPixels))
  g = Math.floor(g / (pixelCount - transparentPixels))
  b = Math.floor(b / (pixelCount - transparentPixels))

  if (checkDistance) {
    const distance = Math.sqrt(Math.pow(r - 255, 2) + Math.pow(g - 255, 2) + Math.pow(b - 255, 2))

    if (distance < 50) {
      return DEFAULT_COLOR
    }
  }

  return [r, g, b]
}
