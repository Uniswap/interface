import * as Sentry from '@sentry/react'
import { Token } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import uriToHttp from 'lib/utils/uriToHttp'
import Vibrant from 'node-vibrant/lib/bundle.js'
import { shade } from 'polished'
import { useEffect, useState } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useTheme } from 'styled-components/macro'
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
      Sentry.captureMessage(error.toString())
    }
  }

  return null
}

async function getColorFromUriPath(uri: string): Promise<string | null> {
  const formattedPath = uriToHttp(uri)[0]

  let palette

  try {
    palette = await Vibrant.from(formattedPath).getPalette()
  } catch (err) {
    console.log('ERROR', uri, err.message)
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
  const theme = useTheme()
  const [color, setColor] = useState(theme.accentActive)

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
      setColor(theme.accentActive)
    }
  }, [theme.accentActive, token])

  return color
}

export function useColorFromURI(uri?: string) {
  const theme = useTheme()
  const [color, setColor] = useState(theme.accentAction)

  useEffect(() => {
    let stale = false

    if (uri) {
      // let parsedURI = uri
      // // const lastChar = uri.charAt(uri.length - 1)
      // // if (uri.includes("coingecko") && lastChar >= '0' && lastChar <= '9') {
      // //   parsedURI = uri.replace(/\d+$/, "")
      // //   parsedURI = parsedURI.substring(0, parsedURI.length - 1)
      // //   parsedURI = parsedURI.replace("large", "thumb")
      // // }
      getColorFromUriPath(uri).then((tokenColor) => {
        if (!stale && tokenColor !== null) {
          setColor(tokenColor)
        }
      })
    }

    return () => {
      stale = true
      setColor(theme.accentAction)
    }
  }, [theme.accentAction, uri])

  return color
}
