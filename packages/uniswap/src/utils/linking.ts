import { GraphQLApi } from '@universe/api'
import * as WebBrowser from 'expo-web-browser'
import { colorsLight } from 'ui/src/theme'
import { NATIVE_TOKEN_PLACEHOLDER } from 'uniswap/src/constants/addresses'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain, toUniswapWebAppLink } from 'uniswap/src/features/chains/utils'
import { BACKEND_NATIVE_CHAIN_ADDRESS_STRING } from 'uniswap/src/features/search/utils'
import { ServiceProviderInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyIdToChain, currencyIdToGraphQLAddress, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { canOpenURL, openURL } from 'uniswap/src/utils/link'
import { logger } from 'utilities/src/logger/logger'

const ALLOWED_EXTERNAL_URI_SCHEMES = ['http://', 'https://']

/**
 * Opens allowed URIs. if isSafeUri is set to true then this will open http:// and https:// as well as some deeplinks.
 * Only set this flag to true if you have formed the URL yourself in our own app code. For any URLs from an external source
 * isSafeUri must be false and it will only open http:// and https:// URI schemes.
 *
 * @param openExternalBrowser whether to leave the app and open in system browser. default is false, opens in-app browser window
 * @param isSafeUri whether to bypass ALLOWED_EXTERNAL_URI_SCHEMES check
 * @param controlsColor When opening in an in-app browser, determines the controls color
 * @param throwOnError whether to throw errors instead of just logging them
 **/
export async function openUri({
  uri,
  openExternalBrowser = false,
  isSafeUri = false,
  controlsColor = colorsLight.accent1,
  throwOnError = false,
}: {
  uri: string
  openExternalBrowser?: boolean
  isSafeUri?: boolean
  // NOTE: okay to use colors object directly as we want the same color for light/dark modes
  controlsColor?: string
  throwOnError?: boolean
}): Promise<void> {
  const trimmedURI = uri.trim()
  if (!isSafeUri && !ALLOWED_EXTERNAL_URI_SCHEMES.some((scheme) => trimmedURI.startsWith(scheme))) {
    const error = new Error('User attempted to open potentially unsafe url')
    logger.error(error, {
      tags: {
        file: 'linking',
        function: 'openUri',
      },
      extra: { uri },
    })
    if (throwOnError) {
      throw error
    }
    return
  }

  const isHttp = /^https?:\/\//.test(trimmedURI)

  // `canOpenURL` returns `false` for App Links / Universal Links, so we just assume any device can handle the `https://` protocol.
  const supported = isHttp ? true : await canOpenURL(uri)

  if (!supported) {
    const error = new Error(`Cannot open URI: ${uri}`)
    logger.warn('linking', 'openUri', error.message)
    if (throwOnError) {
      throw error
    }
    return
  }

  try {
    if (openExternalBrowser) {
      await openURL(uri)
    } else {
      await WebBrowser.openBrowserAsync(uri, {
        // iOS only
        controlsColor,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,

        // Android only
        // This is needed to avoid the browser automatically closing when the user comes back from another app (for example, when using the camera during FOR KYC).
        showInRecents: true,

        // Web only
        windowFeatures: 'popup=false',
      })
    }
  } catch (error) {
    logger.error(error, { tags: { file: 'linking', function: 'openUri' }, extra: { uri } })
    if (throwOnError) {
      throw error
    }
  }
}

export enum ExplorerDataType {
  TRANSACTION = 'transaction',
  TOKEN = 'token',
  ADDRESS = 'address',
  BLOCK = 'block',
  NFT = 'nft',
  NATIVE = 'native',
}

/**
 * Return the explorer link for the given data and data type
 * @param chainId the ID of the chain for which to return the data
 * @param data the data to return a link for
 * @param type the type of the data
 */
export function getExplorerLink({
  chainId,
  data,
  type,
}: {
  chainId: UniverseChainId
  data?: string
  type: ExplorerDataType
}): string {
  const { explorer, nativeCurrency } = getChainInfo(chainId)
  const prefix = explorer.url

  if (!data) {
    return prefix
  }

  switch (type) {
    case ExplorerDataType.TRANSACTION:
      return `${prefix}tx/${data}`

    case ExplorerDataType.TOKEN:
      if (data === nativeCurrency.address && nativeCurrency.explorerLink) {
        return nativeCurrency.explorerLink
      }
      return `${prefix}token/${data}`

    case ExplorerDataType.BLOCK:
      if (chainId === UniverseChainId.Optimism) {
        return `${prefix}tx/${data}`
      }
      return `${prefix}block/${data}`

    case ExplorerDataType.ADDRESS:
      return `${prefix}address/${data}`

    case ExplorerDataType.NFT:
      if (chainId === UniverseChainId.Zora) {
        // Zora Energy Explorer uses a different URL format of [blockExplorerUrl]/token/[contractAddress]/instance/[tokenId]
        // We need to split the data to get the contract address and token ID
        const splitData = data.split('/')
        const contractAddress = splitData[0] ?? ''
        const tokenAddress = splitData[1] ?? ''
        return `${prefix}token/${contractAddress}/instance/${tokenAddress}`
      }
      return `${prefix}nft/${data}`

    default:
      return prefix
  }
}

export function getNftExplorerLink({
  chainId,
  fallbackChainId,
  contractAddress,
  tokenId,
}: {
  chainId?: UniverseChainId
  fallbackChainId: UniverseChainId
  contractAddress: string
  tokenId: string
}): string {
  const targetChainId = chainId ?? fallbackChainId
  return getExplorerLink({
    chainId: targetChainId,
    data: `${contractAddress}/${tokenId}`,
    type: ExplorerDataType.NFT,
  })
}

export function getOpenseaLink({
  chainId,
  contractAddress,
  tokenId,
}: {
  chainId: UniverseChainId
  contractAddress: string
  tokenId: string
}): string | null {
  const chainInfo = getChainInfo(chainId)

  if (!chainInfo.openseaName) {
    return null
  }

  return `https://opensea.io/item/${chainInfo.openseaName}/${contractAddress}/${tokenId}`
}

/**
 * Return the token details URL for the given address and chain
 * @param address the address of the token
 * @param chain the chain of the token
 * @param chainUrlParam the chain URL parameter
 * @param inputAddress the input address
 */
export function getTokenDetailsURL({
  address,
  chain,
  chainUrlParam,
  inputAddress,
}: {
  address: string
  chain?: number
  chainUrlParam?: string
  inputAddress?: string | null
}): string {
  if (!chain) {
    return '/not-found'
  }
  const chainInfo = toGraphQLChain(chain)

  const adjustedAddress = isNativeCurrencyAddress(chain, address) ? NATIVE_TOKEN_PLACEHOLDER : address
  const adjustedInputAddress = isNativeCurrencyAddress(chain, inputAddress) ? NATIVE_TOKEN_PLACEHOLDER : inputAddress

  const chainName = chainUrlParam || String(chainInfo).toLowerCase() || GraphQLApi.Chain.Ethereum.toLowerCase()
  const inputAddressSuffix = adjustedInputAddress ? `?inputCurrency=${adjustedInputAddress}` : ''
  return `/explore/tokens/${chainName}/${adjustedAddress}${inputAddressSuffix}`
}

export function getPoolDetailsURL(address: string, chain: UniverseChainId): string {
  const chainName = getChainInfo(chain).urlParam
  return `/explore/pools/${chainName}/${address}`
}

export async function openTransactionLink(hash: string | undefined, chainId: UniverseChainId): Promise<void> {
  if (!hash) {
    return undefined
  }
  const explorerUrl = getExplorerLink({ chainId, data: hash, type: ExplorerDataType.TRANSACTION })
  return openUri({ uri: explorerUrl })
}

export async function openUniswapHelpLink(): Promise<void> {
  return openUri({ uri: uniswapUrls.helpRequestUrl })
}

export async function openFORSupportLink(serviceProvider: ServiceProviderInfo): Promise<void> {
  return openUri({ uri: serviceProvider.supportUrl ?? uniswapUrls.helpRequestUrl })
}

export async function openOfframpPendingSupportLink(): Promise<void> {
  return openUri({ uri: uniswapUrls.helpArticleUrls.fiatOffRampHelp })
}

export function getProfileUrl(walletAddress: string): string {
  return `${uniswapUrls.webInterfaceAddressUrl}/${walletAddress}`
}

const UTM_TAGS_MOBILE = 'utm_medium=mobile&utm_source=share-tdp'

export function getTokenUrl(currencyId: string, addMobileUTMTags: boolean = false): string | undefined {
  const chainId = currencyIdToChain(currencyId)
  if (!chainId) {
    return undefined
  }
  const network = toUniswapWebAppLink(chainId)
  try {
    let tokenAddress = currencyIdToGraphQLAddress(currencyId)
    // in case it's a native token
    if (tokenAddress === null) {
      // this is how web app handles native tokens
      tokenAddress = BACKEND_NATIVE_CHAIN_ADDRESS_STRING
    }
    const tokenUrl = `${uniswapUrls.webInterfaceTokensUrl}/${network}/${tokenAddress}`
    return addMobileUTMTags ? tokenUrl + `?${UTM_TAGS_MOBILE}` : tokenUrl
  } catch (_) {
    return undefined
  }
}

export function getTwitterLink(twitterName: string): string {
  return `https://twitter.com/${twitterName}`
}
