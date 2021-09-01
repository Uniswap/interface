import { Token } from '@uniswap/sdk-core'
import Vibrant from 'node-vibrant'
import { shade } from 'polished'
import { useLayoutEffect, useState } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import Logger from 'utils/Logger'
import uriToHttp from 'utils/uriToHttp'
import { hex } from 'wcag-contrast'

async function getColorFromToken(token: Token): Promise<string | null> {
  if (!(token instanceof WrappedTokenInfo)) {
    return null
  }

  try {
    const wrappedToken = token as WrappedTokenInfo
    const { logoURI } = wrappedToken
    if (!logoURI) {
      return null
    }

    const palette = await Vibrant.from(logoURI).getPalette()
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
  } catch (e) {
    Logger.error(e)
    return null
  }
}

async function getColorFromUriPath(uri: string): Promise<string | null> {
  const formattedPath = uriToHttp(uri)[0]

  return Vibrant.from(formattedPath)
    .getPalette()
    .then((palette) => {
      if (palette?.Vibrant) {
        return palette.Vibrant.hex
      }
      return null
    })
    .catch(() => null)
}

export function useColor(token?: Token) {
  const [color, setColor] = useState('#2172E5')

  useLayoutEffect(() => {
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

export function useListColor(listImageUri?: string) {
  const [color, setColor] = useState('#2172E5')

  useLayoutEffect(() => {
    let stale = false

    if (listImageUri) {
      getColorFromUriPath(listImageUri).then((color) => {
        if (!stale && color !== null) {
          setColor(color)
        }
      })
    }

    return () => {
      stale = true
      setColor('#2172E5')
    }
  }, [listImageUri])

  return color
}
