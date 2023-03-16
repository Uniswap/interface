import { Token } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import uriToHttp from 'lib/utils/uriToHttp'
import Vibrant from 'node-vibrant/lib/bundle.js'
import { shade } from 'polished'
import { useEffect, useState } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { hex } from 'wcag-contrast'

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
    if (token.chainId !== SupportedChainId.MAINNET) {
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
