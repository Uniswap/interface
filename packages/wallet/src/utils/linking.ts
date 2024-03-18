import * as WebBrowser from 'expo-web-browser'
import { Linking } from 'react-native'
import { colorsLight } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { logger } from 'utilities/src/logger/logger'
import { CHAIN_INFO, ChainId } from 'wallet/src/constants/chains'
import { toUniswapWebAppLink } from 'wallet/src/features/chains/utils'
import { FiatPurchaseTransactionInfo } from 'wallet/src/features/transactions/types'
import { currencyIdToChain, currencyIdToGraphQLAddress } from 'wallet/src/utils/currencyId'

export const UNISWAP_APP_NATIVE_TOKEN = 'NATIVE'
const ALLOWED_EXTERNAL_URI_SCHEMES = ['http://', 'https://']

/**
 * Opens allowed URIs. if isSafeUri is set to true then this will open http:// and https:// as well as some deeplinks.
 * Only set this flag to true if you have formed the URL yourself in our own app code. For any URLs from an external source
 * isSafeUri must be false and it will only open http:// and https:// URI schemes.
 *
 * @param openExternalBrowser whether to leave the app and open in system browser. default is false, opens in-app browser window
 * @param isSafeUri whether to bypass ALLOWED_EXTERNAL_URI_SCHEMES check
 * @param controlsColor When opening in an in-app browser, determines the controls color
 **/
export async function openUri(
  uri: string,
  openExternalBrowser = false,
  isSafeUri = false,
  // NOTE: okay to use colors object directly as we want the same color for light/dark modes
  controlsColor = colorsLight.accent1
): Promise<void> {
  const trimmedURI = uri.trim()
  if (!isSafeUri && !ALLOWED_EXTERNAL_URI_SCHEMES.some((scheme) => trimmedURI.startsWith(scheme))) {
    // TODO: [MOB-253] show a visual warning that the link cannot be opened.
    logger.error(new Error('User attempted to open potentially unsafe url'), {
      tags: {
        file: 'linking',
        function: 'openUri',
      },
      extra: { uri },
    })
    return
  }

  const isHttp = /^https?:\/\//.test(trimmedURI)

  // `canOpenURL` returns `false` for App Links / Universal Links, so we just assume any device can handle the `https://` protocol.
  const supported = isHttp ? true : await Linking.canOpenURL(uri)

  if (!supported) {
    logger.warn('linking', 'openUri', `Cannot open URI: ${uri}`)
    return
  }

  try {
    if (openExternalBrowser) {
      await Linking.openURL(uri)
    } else {
      await WebBrowser.openBrowserAsync(uri, {
        controlsColor,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      })
    }
  } catch (error) {
    logger.error(error, { tags: { file: 'linking', function: 'openUri' } })
  }
}

export function dismissInAppBrowser(): void {
  WebBrowser.dismissBrowser()
}

export async function openTransactionLink(
  hash: string | undefined,
  chainId: ChainId
): Promise<void> {
  if (!hash) {
    return
  }
  const explorerUrl = getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)
  return openUri(explorerUrl)
}

export async function openUniswapHelpLink(): Promise<void> {
  return openUri(`${uniswapUrls.helpRequestUrl}`)
}

export async function openMoonpayTransactionLink(info: FiatPurchaseTransactionInfo): Promise<void> {
  return openUri(info.explorerUrl ?? 'https://support.moonpay.com/hc/en-gb')
}

export async function openMoonpayHelpLink(): Promise<void> {
  return openUri('https://support.moonpay.com/')
}

export async function openSettings(): Promise<void> {
  await Linking.openSettings()
}

export enum ExplorerDataType {
  TRANSACTION = 'transaction',
  TOKEN = 'token',
  ADDRESS = 'address',
  BLOCK = 'block',
}

/**
 * Return the explorer link for the given data and data type
 * @param chainId the ID of the chain for which to return the data
 * @param data the data to return a link for
 * @param type the type of the data
 */
export function getExplorerLink(chainId: ChainId, data: string, type: ExplorerDataType): string {
  const prefix = CHAIN_INFO[chainId].explorer.url

  switch (type) {
    case ExplorerDataType.TRANSACTION:
      return `${prefix}tx/${data}`

    case ExplorerDataType.TOKEN:
      if (
        data === CHAIN_INFO[chainId].nativeCurrency.address &&
        CHAIN_INFO[chainId].nativeCurrency.explorerLink
      ) {
        return CHAIN_INFO[chainId].nativeCurrency.explorerLink ?? `${prefix}token/${data}`
      }
      return `${prefix}token/${data}`

    case ExplorerDataType.BLOCK:
      if (chainId === ChainId.Optimism) {
        return `${prefix}tx/${data}`
      }
      return `${prefix}block/${data}`

    case ExplorerDataType.ADDRESS:
      return `${prefix}address/${data}`
    default:
      return `${prefix}`
  }
}

export function getNftCollectionUrl(contractAddress: Maybe<string>): string | undefined {
  if (!contractAddress) {
    return undefined
  }
  return `${uniswapUrls.appUrl}/nfts/collection/${contractAddress}`
}

export function getNftUrl(contractAddress: string, tokenId: string): string {
  return `${uniswapUrls.appUrl}/nfts/asset/${contractAddress}/${tokenId}`
}

export function getProfileUrl(walletAddress: string): string {
  return `${uniswapUrls.appUrl}/address/${walletAddress}`
}

export function getTokenUrl(currencyId: string): string | undefined {
  const chainId = currencyIdToChain(currencyId)
  if (!chainId) {
    return
  }
  const network = toUniswapWebAppLink(chainId)
  try {
    let tokenAddress = currencyIdToGraphQLAddress(currencyId)
    // in case it's a native token
    if (tokenAddress === null) {
      // this is how web app handles native tokens
      tokenAddress = UNISWAP_APP_NATIVE_TOKEN
    }
    return `${uniswapUrls.appUrl}/tokens/${network}/${tokenAddress}`
  } catch (_) {
    return
  }
}

export function getTwitterLink(twitterName: string): string {
  return `https://twitter.com/${twitterName}`
}
