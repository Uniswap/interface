import { useTheme } from 'lib/theme'
import { Token } from 'lib/types'
import uriToHttp from 'lib/utils/uriToHttp'
import Vibrant from 'node-vibrant/lib/bundle'
import { useLayoutEffect, useState } from 'react'

const colors = new Map<string, string | undefined>()

function UriForEthToken(address: string) {
  return `https://raw.githubusercontent.com/uniswap/assets/master/blockchains/ethereum/assets/${address}/logo.png?color`
}

/**
 * Extracts the prominent color from a token.
 * NB: If cached, this function returns synchronously; using a callback allows sync or async returns.
 */
async function getColorFromToken(token: Token, cb: (color: string | undefined) => void = () => void 0) {
  const { address, chainId, logoURI } = token
  const key = chainId + address
  let color = colors.get(key)

  if (!color && logoURI) {
    // Color extraction must use a CORS-compatible resource, but the resource is already cached.
    // Add a dummy parameter to force a different browser resource cache entry.
    // Without this, color extraction prevents resource caching.
    const uri = uriToHttp(logoURI)[0] + '?color'
    color = await getColorFromUriPath(uri)
  }

  if (!color && chainId === 1) {
    const fallbackUri = UriForEthToken(address)
    color = await getColorFromUriPath(fallbackUri)
  }

  colors.set(key, color)
  return cb(color)
}

async function getColorFromUriPath(uri: string): Promise<string | undefined> {
  try {
    const palette = await Vibrant.from(uri).getPalette()
    return palette.Vibrant?.hex
  } catch {}
  return
}

export function usePrefetchColor(token?: Token) {
  const theme = useTheme()

  if (theme.tokenColorExtraction && token) {
    getColorFromToken(token)
  }
}

export default function useColor(token?: Token) {
  const [color, setColor] = useState<string | undefined>(undefined)
  const theme = useTheme()

  useLayoutEffect(() => {
    let stale = false

    if (theme.tokenColorExtraction && token) {
      getColorFromToken(token, (color) => {
        if (!stale && color) {
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
