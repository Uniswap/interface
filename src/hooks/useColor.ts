import { Currency } from '@kyberswap/ks-sdk-core'
import Vibrant from 'node-vibrant'
import { shade } from 'polished'
import { useLayoutEffect, useState } from 'react'
import { hex } from 'wcag-contrast'

import { NETWORKS_INFO } from 'constants/networks'
import { getTokenLogoURL } from 'utils'

async function getColorFromToken(token: Currency): Promise<string | null> {
  const path = token.isNative ? NETWORKS_INFO[token.chainId].icon : getTokenLogoURL(token.address, token.chainId)

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
