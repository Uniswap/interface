import { ChainId, Token } from '@uniswap/sdk-core'
import { Buffer } from 'buffer'
import JPEG from 'jpeg-js'
import Vibrant from 'node-vibrant/lib/bundle.js'
import PNG from 'png-ts'
import { shade } from 'polished'
import { useEffect, useState } from 'react'
import { hex } from 'wcag-contrast'

import { DEFAULT_COLOR, predefinedTokenColors } from '../constants/tokenColors'
import uriToHttp from '../lib/utils/uriToHttp'
import { WrappedTokenInfo } from '../state/lists/wrappedTokenInfo'

function URIForEthToken(address: string) {
  return `https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/${address}/logo.png`
}

async function getColorFromToken(token: Token): Promise<string | null> {
  if (!(token instanceof WrappedTokenInfo)) {
    return null
  }

  const wrappedToken = token as WrappedTokenInfo
  const { address } = wrappedToken
  let { logoURI } = wrappedToken
  if (!logoURI) {
    if (token.chainId !== ChainId.MAINNET) {
      return null
    } else {
      logoURI = URIForEthToken(address)
    }
  }

  try {
    return await getColorFromUriPath(logoURI)
  } catch (e) {
    if (logoURI === URIForEthToken(address)) {
      return null
    }

    try {
      logoURI = URIForEthToken(address)
      return await getColorFromUriPath(logoURI)
    } catch (error) {
      console.warn(`Unable to load logoURI (${token.symbol}): ${logoURI}`)
      return null
    }
  }
}

async function getColorFromUriPath(uri: string): Promise<string | null> {
  const formattedPath = uriToHttp(uri)[0]

  let palette

  try {
    palette = await Vibrant.from(formattedPath).getPalette()
  } catch (err) {
    return null
  }
  if (!palette?.Vibrant) {
    return null
  }

  let detectedHex = palette.Vibrant.hex
  let AAscore = hex(detectedHex, '#FFF')
  while (AAscore < 3) {
    detectedHex = shade(0.005, detectedHex)
    AAscore = hex(detectedHex, '#FFF')
  }

  return detectedHex
}

export function useColor(token?: Token) {
  const [color, setColor] = useState('#2172E5')

  useEffect(() => {
    let stale = false

    if (token) {
      getColorFromToken(token).then((tokenColor) => {
        if (!stale && tokenColor !== null) {
          setColor(tokenColor)
        }
      })
    }

    return () => {
      stale = true
      setColor('#2172E5')
    }
  }, [token])

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
