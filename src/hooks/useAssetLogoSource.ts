import tokenLogoLookup from 'constants/tokenLogoLookup'
import { isCelo, nativeOnChain } from 'constants/tokens'
import { chainIdToNetworkName, getNativeLogoURI } from 'lib/hooks/useCurrencyLogoURIs'
import uriToHttp from 'lib/utils/uriToHttp'
import { useCallback, useEffect, useState } from 'react'
import { isAddress } from 'utils'

import celoLogo from '../assets/svg/celo_logo.svg'
import { checkWarning } from '../constants/tokenSafety'

const BAD_SRCS: { [tokenAddress: string]: true } = {}

// Converts uri's into fetchable urls
function parseLogoSources(uris: string[]) {
  const urls: string[] = []
  uris.forEach((uri) => urls.push(...uriToHttp(uri)))
  return urls
}

// Parses uri's, favors non-coingecko images, and improves coingecko logo quality
function prioritizeLogoSources(uris: string[]) {
  const parsedUris = uris.map((uri) => uriToHttp(uri)).flat(1)
  const preferredUris: string[] = []

  // Consolidate duplicate coingecko urls into one fallback source
  let coingeckoUrl: string | undefined = undefined

  parsedUris.forEach((uri) => {
    if (uri.startsWith('https://assets.coingecko')) {
      if (!coingeckoUrl) {
        coingeckoUrl = uri.replace(/small|thumb/g, 'large')
      }
    } else {
      preferredUris.push(uri)
    }
  })
  // Places coingecko urls in the back of the source array
  return coingeckoUrl ? [...preferredUris, coingeckoUrl] : preferredUris
}

function getInitialUrl(
  address?: string | null,
  chainId?: number | null,
  isNative?: boolean,
  backupImg?: string | null
) {
  if (chainId && isNative) return getNativeLogoURI(chainId)

  const networkName = chainId ? chainIdToNetworkName(chainId) : 'ethereum'
  const checksummedAddress = isAddress(address)

  if (chainId && isCelo(chainId) && address === nativeOnChain(chainId).wrapped.address) {
    return celoLogo
  }

  if (checksummedAddress) {
    return `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/${networkName}/assets/${checksummedAddress}/logo.png`
  } else {
    return backupImg ?? undefined
  }
}

export default function useAssetLogoSource(
  address?: string | null,
  chainId?: number | null,
  isNative?: boolean,
  backupImg?: string | null
): [string | undefined, () => void] {
  const showLogo = Boolean((address && checkWarning(address, chainId) === null) || isNative)
  const [current, setCurrent] = useState<string | undefined>(
    showLogo ? getInitialUrl(address, chainId, isNative, backupImg) : undefined
  )
  const [fallbackSrcs, setFallbackSrcs] = useState<string[] | undefined>(undefined)

  useEffect(() => {
    if (!showLogo) return
    setCurrent(getInitialUrl(address, chainId, isNative))
    setFallbackSrcs(undefined)
  }, [address, chainId, isNative, showLogo])

  const nextSrc = useCallback(() => {
    if (current) {
      BAD_SRCS[current] = true
    }
    // Parses and stores logo sources from tokenlists if assets repo url fails
    if (!fallbackSrcs) {
      const uris = tokenLogoLookup.getIcons(address, chainId) ?? []
      if (backupImg) uris.push(backupImg)
      const tokenListIcons = prioritizeLogoSources(parseLogoSources(uris))

      setCurrent(tokenListIcons.find((src) => !BAD_SRCS[src]))
      setFallbackSrcs(tokenListIcons)
    } else {
      setCurrent(fallbackSrcs.find((src) => !BAD_SRCS[src]))
    }
  }, [current, fallbackSrcs, address, chainId, backupImg])

  return [current, nextSrc]
}
