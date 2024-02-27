import tokenLogoLookup from 'constants/tokenLogoLookup'
import { isCelo, nativeOnChain } from 'constants/tokens'
import { checkWarning, WARNING_LEVEL } from 'constants/tokenSafety'
import { chainIdToNetworkName, getNativeLogoURI } from 'lib/hooks/useCurrencyLogoURIs'
import uriToHttp from 'lib/utils/uriToHttp'
import { useCallback, useMemo, useReducer } from 'react'
import { isAddress } from 'utilities/src/addresses'

import celoLogo from '../assets/svg/celo_logo.svg'

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

export function getInitialUrl(
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

export default function useAssetLogoSource({
  address,
  chainId,
  isNative,
  backupImg,
  primaryImg,
}: {
  address?: string | null
  chainId?: number | null
  isNative?: boolean
  backupImg?: string | null
  primaryImg?: string | null
}): [string | undefined, () => void] {
  const hideLogo = Boolean(address && checkWarning(address, chainId)?.level === WARNING_LEVEL.BLOCKED)
  const [srcIndex, incrementSrcIndex] = useReducer((n: number) => n + 1, 0)

  const current = useMemo(() => {
    if (hideLogo) return undefined
    const initialUrl = getInitialUrl(address, chainId, isNative, backupImg)
    if (srcIndex === 0) {
      return primaryImg ?? initialUrl
    } else if (srcIndex === 1 && primaryImg && initialUrl) {
      return initialUrl
    }
    const uris = tokenLogoLookup.getIcons(address, chainId) ?? []
    const fallbackSrcs = prioritizeLogoSources(parseLogoSources(uris))
    return fallbackSrcs.find((src) => !BAD_SRCS[src])
  }, [address, backupImg, chainId, hideLogo, isNative, primaryImg, srcIndex])

  const nextSrc = useCallback(() => {
    if (current) BAD_SRCS[current] = true
    incrementSrcIndex()
  }, [current])

  return [current, nextSrc]
}
