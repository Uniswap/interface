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

async function getColorFromToken(token: Token): Promise<string | null> {
  const { address, chainId, logoURI } = token

  // Color extraction must use a CORS-compatible resource, but the resource is already cached.
  // Add a dummy parameter to force a different browser resource cache entry.
  // Without this, color extraction prevent resource caching.
  const uri = uriToHttp(logoURI)[0] + '?color'

  // If we've already determined that a fallback is necessary, use it immediately to prevent a flash.
  const fallbackUri = fallbackCache.get(uri)
  if (fallbackUri) {
    return await getColorFromUriPath(fallbackUri)
  }

  let color = await getColorFromUriPath(uri)
  if (!color && chainId === 1) {
    const fallbackUri = UriForEthToken(address)
    color = await getColorFromUriPath(fallbackUri)
    if (color) {
      fallbackCache.set(uri, fallbackUri)
    }
  }

  return color
}

async function getColorFromUriPath(uri: string): Promise<string | null> {
  try {
    const palette = await Vibrant.from(uri).getPalette()
    return palette.Vibrant?.hex ?? null
  } catch {
    return null
  }
}

function getAccessibleColor(color: string, theme: Theme) {
  const dynamic = getDynamicTheme(color, theme)
  const { darkMode } = dynamic
  let { primary } = dynamic
  let AAscore = hex(color, primary)
  while (AAscore < 3) {
    color = darkMode ? tint(0.005, color) : shade(0.005, color)
    primary = getDynamicTheme(color, theme).primary
    AAscore = hex(color, primary)
  }
  return color
}

export function prefetchColor(token?: Token) {
  if (token) {
    getColorFromToken(token)
  }
}

export default function useColor(token?: Token) {
  const [color, setColor] = useState<string | undefined>(undefined)
  const theme = useTheme()

  useLayoutEffect(() => {
    let stale = false

    if (token) {
      getColorFromToken(token).then((color) => {
        if (!stale && color !== null) {
          color = getAccessibleColor(color, theme)
          setColor(color)
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
