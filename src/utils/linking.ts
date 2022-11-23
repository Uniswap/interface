import * as WebBrowser from 'expo-web-browser'
import { Linking } from 'react-native'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { uniswapUrls } from 'src/constants/urls'
import { logException, logMessage } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'
import { FiatPurchaseTransactionInfo } from 'src/features/transactions/types'
import { logger } from 'src/utils/logger'

const ALLOWED_EXTERNAL_URI_SCHEMES = ['http://', 'https://']

/**
 * Opens allowed URIs. if isSafeUri is set to true then this will open http:// and https:// as well as some deeplinks.
 * Only set this flag to true if you have formed the URL yourself in our own app code. For any URLs from an external source
 * isSafeUri must be false and it will only open http:// and https:// URI schemes.
 *
 * @param openExternalBrowser whether to leave the app and open in system browser. default is false, opens in-app browser window
 * @param isSafeUri whether to bypass ALLOWED_EXTERNAL_URI_SCHEMES check
 **/
export async function openUri(uri: string, openExternalBrowser = false, isSafeUri = false) {
  const trimmedURI = uri.trim()
  if (!isSafeUri && !ALLOWED_EXTERNAL_URI_SCHEMES.some((scheme) => trimmedURI.startsWith(scheme))) {
    // TODO: show a visual warning that the link cannot be opened.
    logMessage(LogContext.SecurityConcern, `potentially unsafe URI scheme provided ${uri}`)
    logger.info('utils/linking', 'openUri', 'cannot open an unsafe URI scheme', uri)
    return
  }

  const supported = await Linking.canOpenURL(uri)
  if (!supported) {
    logMessage(LogContext.OpenUri, `Cannot open URI: ${uri}`)
    return
  }

  try {
    if (openExternalBrowser) {
      await Linking.openURL(uri)
    } else {
      await WebBrowser.openBrowserAsync(uri)
    }
  } catch (error) {
    logException(LogContext.OpenUri, error)
  }
}

export async function openTransactionLink(hash: string, chainId: ChainId) {
  const explorerUrl = getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)
  return openUri(explorerUrl)
}

export async function openUniswapHelpLink() {
  return openUri(`${uniswapUrls.helpUrl}/hc/en-us/requests/new`)
}

export async function openMoonpayTransactionLink(info: FiatPurchaseTransactionInfo) {
  return openUri(info.explorerUrl ?? 'https://support.moonpay.com/hc/en-gb')
}

export async function openMoonpayHelpLink() {
  return openUri('https://support.moonpay.com/')
}

export function openSettings() {
  Linking.openSettings()
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
export function getExplorerLink(chainId: number, data: string, type: ExplorerDataType): string {
  if (chainId === ChainId.ArbitrumOne) {
    switch (type) {
      case ExplorerDataType.TRANSACTION:
        return `https://arbiscan.io/tx/${data}`
      case ExplorerDataType.ADDRESS:
      case ExplorerDataType.TOKEN:
        return `https://arbiscan.io/address/${data}`
      case ExplorerDataType.BLOCK:
        return `https://arbiscan.io/block/${data}`
      default:
        return 'https://arbiscan.io/'
    }
  }

  const prefix = CHAIN_INFO[chainId]?.explorer ?? 'https://etherscan.io/'

  switch (type) {
    case ExplorerDataType.TRANSACTION:
      return `${prefix}tx/${data}`

    case ExplorerDataType.TOKEN:
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

export function getTwitterLink(twitterName: string) {
  return `https://twitter.com/${twitterName}`
}
