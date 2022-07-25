import { useState, useLayoutEffect } from 'react'
import { shade } from 'polished'
import Vibrant from 'node-vibrant'
import { hex } from 'wcag-contrast'
import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import uriToHttp from 'utils/uriToHttp'
import { useIsDarkMode } from 'state/user/hooks'
import { getTokenLogoURL } from 'utils'
import { NETWORKS_INFO } from 'constants/networks'

async function getColorFromToken(token: Currency): Promise<string | null> {
  if (token.chainId === ChainId.RINKEBY && token.wrapped.address === '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735') {
    return Promise.resolve('#FAAB14')
  }

  const path = token.isNative
    ? NETWORKS_INFO[token.chainId as ChainId].icon
    : getTokenLogoURL(token.address, token.chainId)

  return Vibrant.from(path)
    .getPalette()
    .then(palette => {
      if (palette?.Vibrant) {
        let detectedHex = palette.Vibrant.hex
        let AAscore = hex(detectedHex, '#FFF')
        while (AAscore < 3) {
          detectedHex = shade(0.005, detectedHex)
          AAscore = hex(detectedHex, '#FFF')
        }
        return detectedHex
      }
      return null
    })
    .catch(() => null)
}

async function getColorFromUriPath(uri: string, isDark: boolean): Promise<string | null> {
  const formattedPath = uriToHttp(uri)[0]

  return Vibrant.from(formattedPath)
    .getPalette()
    .then(palette => {
      if (isDark) {
        if (palette?.DarkVibrant) {
          return palette.DarkVibrant.hex
        }
      } else {
        if (palette?.LightVibrant) {
          return palette.LightVibrant.hex
        }
      }
      if (palette?.Vibrant) {
        return palette.Vibrant.hex
      }
      return null
    })
    .catch(() => null)
}

export function useColor(token?: Currency) {
  const [color, setColor] = useState('#2172E5')

  useLayoutEffect(() => {
    let stale = false

    if (token) {
      getColorFromToken(token).then(tokenColor => {
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
  const isDark = useIsDarkMode()

  useLayoutEffect(() => {
    let stale = false

    if (listImageUri) {
      getColorFromUriPath(listImageUri, isDark).then(color => {
        if (!stale && color !== null) {
          setColor(color)
        }
      })
    }

    return () => {
      stale = true
      setColor('#2172E5')
    }
  }, [isDark, listImageUri])

  return color
}
