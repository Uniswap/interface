import { getDynamicTheme, Theme, useTheme } from 'lib/theme'
import { Token } from 'lib/types'
import uriToHttp from 'lib/utils/uriToHttp'
import Vibrant from 'node-vibrant/lib/bundle'
import { shade, tint } from 'polished'
import { useLayoutEffect, useState } from 'react'
import { hex } from 'wcag-contrast'

const fallbackCache = new Map<string, string>()

function UriForEthToken(address: string) {
  return `https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/${address}/logo.png?color`
}

async function getColorFromToken(token: Token, theme: Theme): Promise<string | null> {
  const { address, chainId, logoURI } = token

  // Color extraction must use a CORS-compatible resource, but the resource is already cached.
  // Add a dummy parameter to force a different browser resource cache entry.
  // Without this, color extraction prevent resource caching.
  const uri = uriToHttp(logoURI)[0] + '?color'

  // If we've already determined that a fallback is necessary, use it immediately to prevent a flash.
  const fallbackUri = fallbackCache.get(uri)
  if (fallbackUri) {
    return await getColorFromUriPath(fallbackUri, theme)
  }

  let color = await getColorFromUriPath(uri, theme)
  if (!color && chainId === 1) {
    const fallbackUri = UriForEthToken(address)
    color = await getColorFromUriPath(fallbackUri, theme)
    if (color) {
      fallbackCache.set(uri, fallbackUri)
    }
  }

  return color
}

async function getColorFromUriPath(uri: string, theme: Theme): Promise<string | null> {
  let detectedHex
  try {
    const palette = await Vibrant.from(uri).getPalette()
    detectedHex = palette.Vibrant?.hex ?? null
  } catch {
    return null
  }

  if (detectedHex) {
    const dynamic = getDynamicTheme(detectedHex, theme)
    const { darkMode } = dynamic
    let { primary } = dynamic
    let AAscore = hex(detectedHex, primary)
    while (AAscore < 3) {
      detectedHex = darkMode ? tint(0.005, detectedHex) : shade(0.005, detectedHex)
      primary = getDynamicTheme(detectedHex, theme).primary
      AAscore = hex(detectedHex, primary)
    }
  }

  return detectedHex
}

export default function useColor(token?: Token) {
  const [color, setColor] = useState<string | undefined>(undefined)
  const theme = useTheme()

  useLayoutEffect(() => {
    let stale = false

    if (token) {
      getColorFromToken(token, theme).then((tokenColor) => {
        if (!stale && tokenColor !== null) {
          setColor(tokenColor)
        }
      })
    }

    return () => {
      stale = true
      setColor(undefined)
    }
  }, [token, theme])

  return color
}
