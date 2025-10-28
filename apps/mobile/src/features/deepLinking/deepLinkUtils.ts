import { DeepLinkUrlAllowlist } from '@universe/gating'
import { getScantasticQueryParams } from 'src/components/Requests/ScanSheet/util'
import { UNISWAP_URL_SCHEME_UWU_LINK } from 'src/components/Requests/Uwulink/utils'
import { getInAppBrowserAllowlist } from 'src/features/deepLinking/configUtils'
import {
  UNISWAP_URL_SCHEME,
  UNISWAP_URL_SCHEME_SCANTASTIC,
  UNISWAP_URL_SCHEME_WALLETCONNECT_AS_PARAM,
  UNISWAP_WALLETCONNECT_URL,
} from 'src/features/deepLinking/constants'
import { UNISWAP_WEB_HOSTNAME } from 'uniswap/src/constants/urls'
import { isCurrencyIdValid } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

const UNISWAP_URL_SCHEME_WIDGET = 'uniswap://widget/'
const WALLETCONNECT_URI_SCHEME = 'wc:' // https://eips.ethereum.org/EIPS/eip-1328

export enum DeepLinkAction {
  UniswapWebLink = 'uniswapWebLink',
  UniswapWalletConnect = 'uniswapWalletConnect',
  WalletConnectAsParam = 'walletConnectAsParam',
  UniswapWidget = 'uniswapWidget',
  Scantastic = 'scantastic',
  TransactionScreen = 'transactionScreen',
  ShowTransactionAfterFiatOnRamp = 'fiatOnRamp',
  ShowTransactionAfterFiatOffRampScreen = 'fiatOffRamp',
  SwapScreen = 'swapScreen',
  UwuLink = 'uwuLink',
  SkipNonWalletConnect = 'skipNonWalletConnect',
  UniversalWalletConnectLink = 'universalWalletConnectLink',
  WalletConnect = 'walletConnect',
  InAppBrowser = 'inAppBrowser',
  Error = 'error',
  Unknown = 'unknown',
  TokenDetails = 'tokenDetails',
  FiatOnRampScreen = 'fiatOnRampScreen',
}

/**
 * Base payload for all deep link actions.
 *
 * @param url - The URL object of the deep link.
 * @param screen - The "screen" to be displayed. This will be superseded
 * by using the pathname of the URL instead as "screen" as a query param
 * is less flexible and currently navigating to parts of a screen.
 * @param source - The source of the deep link such as a push notification
 */
type BasePayload = { url: URL; screen: string; source: string }

/**
 * Payload for all deep link actions that include a WalletConnect URI.
 *
 * @param wcUri - The WalletConnect URI.
 */
type PayloadWithWcUri = BasePayload & { wcUri: string }

/**
 * Payload for all deep link actions that include a user address.
 *
 * @param userAddress - The user address.
 */
type PayloadWithUserAddress = BasePayload & { userAddress: string }

/**
 * Payload for all deep link actions that include Scantastic query params.
 *
 * @param scantasticQueryParams - The Scantastic query params.
 */
type PayloadWithScantasticParams = BasePayload & { scantasticQueryParams: string }

/**
 * Payload for all deep link actions that include fiat onramp params.
 *
 * @param userAddress - The user address (optional when moonpayOnly is true).
 * @param moonpayOnly - Show the moonpay only mode.
 * @param moonpayCurrencyCode - The moonpay currency code (eth, usdc, etc).
 * @param amount - The input amount to prefill
 */
export type PayloadWithFiatOnRampParams = BasePayload & {
  userAddress?: string
  moonpayOnly?: boolean
  moonpayCurrencyCode?: string
  amount?: string
}

export type DeepLinkActionResult =
  | { action: DeepLinkAction.UniswapWebLink; data: BasePayload & { urlPath: string } }
  | { action: DeepLinkAction.WalletConnectAsParam; data: PayloadWithWcUri }
  | { action: DeepLinkAction.UniswapWalletConnect; data: PayloadWithWcUri }
  | { action: DeepLinkAction.UniswapWidget; data: BasePayload }
  | { action: DeepLinkAction.Scantastic; data: PayloadWithScantasticParams }
  | { action: DeepLinkAction.UwuLink; data: BasePayload }
  | { action: DeepLinkAction.ShowTransactionAfterFiatOnRamp; data: PayloadWithUserAddress }
  | { action: DeepLinkAction.ShowTransactionAfterFiatOffRampScreen; data: PayloadWithUserAddress }
  | { action: DeepLinkAction.TransactionScreen; data: PayloadWithUserAddress }
  | { action: DeepLinkAction.SwapScreen; data: PayloadWithUserAddress }
  | { action: DeepLinkAction.SkipNonWalletConnect; data: BasePayload }
  | { action: DeepLinkAction.UniversalWalletConnectLink; data: PayloadWithWcUri }
  | { action: DeepLinkAction.WalletConnect; data: BasePayload & { wcUri: string } }
  | { action: DeepLinkAction.InAppBrowser; data: BasePayload & { targetUrl: string; openInApp: boolean } }
  | { action: DeepLinkAction.TokenDetails; data: BasePayload & { currencyId: string } }
  | { action: DeepLinkAction.FiatOnRampScreen; data: PayloadWithFiatOnRampParams }
  | { action: DeepLinkAction.Error; data: BasePayload }
  | { action: DeepLinkAction.Unknown; data: BasePayload }

type DeepLinkHandler = (url: URL, data: BasePayload) => DeepLinkActionResult

/**
 * Checks if a URL is allowlisted for browser opening and returns the configuration.
 * This function should be called with the dynamic config value.
 *
 * @param urlString - The URL to check.
 * @param allowList - Allowlist from dynamic config.
 * @returns Object with isAllowed and openInApp flags, or null if not allowlisted.
 */
function getUrlAllowlistConfig(
  urlString: string,
  allowList: DeepLinkUrlAllowlist,
): { isAllowed: boolean; openInApp: boolean } {
  try {
    const url = new URL(urlString)

    // Only allow HTTPS protocol
    if (url.protocol !== 'https:') {
      return { isAllowed: false, openInApp: false }
    }

    const urlToCheck = `${url.protocol}//${url.hostname}${url.pathname}`

    for (const allowedItem of allowList.allowedUrls) {
      const allowedUrl = typeof allowedItem === 'string' ? allowedItem : allowedItem.url
      const openInApp = typeof allowedItem === 'string' ? true : (allowedItem.openInApp ?? true) // Default to in-app

      try {
        // Support both exact matches and hostname matches
        if (allowedUrl === urlString || allowedUrl === urlToCheck) {
          return { isAllowed: true, openInApp }
        }

        // Support hostname-only matches (e.g., "example.com" matches "https://example.com/any/path")
        // Always use HTTPS for allowed URL validation
        const allowedUrlObj = new URL(allowedUrl.startsWith('https://') ? allowedUrl : `https://${allowedUrl}`)
        if (url.hostname === allowedUrlObj.hostname) {
          return { isAllowed: true, openInApp }
        }
      } catch {
        // If allowedUrl is not a valid URL, reject it for security
        continue
      }
    }

    return { isAllowed: false, openInApp: false }
  } catch {
    return { isAllowed: false, openInApp: false }
  }
}

/**
 * Parses a deep link URL and returns the action to be taken as well as
 * any additional data that may be needed to handle the deep link.
 *
 * @param urlString - The URL to parse.
 */
// eslint-disable-next-line complexity
export function parseDeepLinkUrl(urlString: string): DeepLinkActionResult {
  const url = new URL(urlString)
  const screen = url.searchParams.get('screen') ?? 'other'
  const source = url.searchParams.get('source') ?? 'unknown'
  const data = { url, screen, source }

  for (const [prefix, handler] of Object.entries(handlers)) {
    if (urlString.startsWith(prefix) || url.hostname === prefix) {
      return handler(url, data)
    }
  }

  const urlPath = url.pathname
  const userAddress = url.searchParams.get('userAddress') ?? undefined
  const fiatOnRamp = url.searchParams.get('fiatOnRamp') === 'true'
  const fiatOffRamp = url.searchParams.get('fiatOffRamp') === 'true'

  switch (urlPath) {
    case '/tokendetails': {
      const currencyId = url.searchParams.get('currencyId')
      if (!currencyId) {
        return logAndReturnError({
          errorMsg: 'No currencyId found',
          action: DeepLinkAction.TokenDetails,
          urlString,
          data,
        })
      }
      if (!isCurrencyIdValid(currencyId)) {
        return logAndReturnError({
          errorMsg: 'Invalid currencyId found',
          action: DeepLinkAction.TokenDetails,
          urlString,
          data,
        })
      }
      return {
        action: DeepLinkAction.TokenDetails,
        data: { ...data, currencyId },
      }
    }
    case '/fiatonramp': {
      const moonpayOnly = url.searchParams.get('moonpayOnly') === 'true'
      const moonpayCurrencyCode = url.searchParams.get('moonpayCurrencyCode') ?? undefined
      const amount = url.searchParams.get('amount') ?? undefined

      if (!moonpayOnly && !userAddress) {
        return logAndReturnError({
          errorMsg: `No userAddress or moonpayOnly param found`,
          action: DeepLinkAction.FiatOnRampScreen,
          urlString,
          data,
        })
      }
      return {
        action: DeepLinkAction.FiatOnRampScreen,
        data: { ...data, userAddress, moonpayOnly, moonpayCurrencyCode, amount },
      }
    }
  }

  switch (screen.toLowerCase()) {
    case 'transaction':
      if (fiatOnRamp) {
        if (!userAddress) {
          return logAndReturnError({
            errorMsg: 'No userAddress found',
            action: DeepLinkAction.ShowTransactionAfterFiatOnRamp,
            urlString,
            data,
          })
        }
        return { action: DeepLinkAction.ShowTransactionAfterFiatOnRamp, data: { ...data, userAddress } }
      }
      if (fiatOffRamp) {
        if (!userAddress) {
          return logAndReturnError({
            errorMsg: 'No userAddress found',
            action: DeepLinkAction.ShowTransactionAfterFiatOffRampScreen,
            urlString,
            data,
          })
        }
        return { action: DeepLinkAction.ShowTransactionAfterFiatOffRampScreen, data: { ...data, userAddress } }
      }
      if (!userAddress) {
        return logAndReturnError({
          errorMsg: 'No userAddress found',
          action: DeepLinkAction.TransactionScreen,
          urlString,
          data,
        })
      }
      return { action: DeepLinkAction.TransactionScreen, data: { ...data, userAddress } }
    case 'swap':
      if (!userAddress) {
        return logAndReturnError({
          errorMsg: 'No userAddress found',
          action: DeepLinkAction.SwapScreen,
          urlString,
          data,
        })
      }
      return { action: DeepLinkAction.SwapScreen, data: { ...data, userAddress } }
  }

  // Skip non-wallet connect deep links after this point
  if (urlString.startsWith(UNISWAP_URL_SCHEME)) {
    return { action: DeepLinkAction.SkipNonWalletConnect, data }
  }

  if (urlString.startsWith(UNISWAP_WALLETCONNECT_URL)) {
    const wcUri = urlString.split(UNISWAP_WALLETCONNECT_URL).pop()
    return wcUri
      ? { action: DeepLinkAction.UniversalWalletConnectLink, data: { ...data, wcUri } }
      : logAndReturnError({
          errorMsg: 'No WC URI found',
          action: DeepLinkAction.UniversalWalletConnectLink,
          urlString,
          data,
        })
  }

  if (urlString.startsWith(WALLETCONNECT_URI_SCHEME)) {
    const wcUri = decodeURIComponent(urlString)
    return { action: DeepLinkAction.WalletConnect, data: { ...data, wcUri } }
  }

  // Check if URL is allowlisted for browser opening
  const inAppBrowserAllowlist = getInAppBrowserAllowlist()

  // Always perform allowlist check for consistent behavior and logging
  const allowlistConfig = getUrlAllowlistConfig(urlString, inAppBrowserAllowlist)
  if (allowlistConfig.isAllowed) {
    return {
      action: DeepLinkAction.InAppBrowser,
      data: { ...data, targetUrl: urlString, openInApp: allowlistConfig.openInApp },
    }
  }

  // Log appropriate message based on allowlist state
  if (inAppBrowserAllowlist.allowedUrls.length === 0) {
    logger.error(`No allowlist configured for browser opening, rejecting URL: ${urlString}`, {
      tags: { file: 'deepLinkUtils', function: 'parseDeepLinkUrl' },
    })
  } else {
    logger.error(`URL not allowlisted for browser opening: ${urlString}`, {
      tags: { file: 'deepLinkUtils', function: 'parseDeepLinkUrl' },
    })
  }

  logger.error(`Unknown deep link action for url=${urlString}`, {
    tags: { file: 'deepLinkUtils', function: 'parseDeepLinkUrl' },
  })
  return { action: DeepLinkAction.Unknown, data }
}

const handlers: Record<string, DeepLinkHandler> = {
  [UNISWAP_WEB_HOSTNAME]: (url, data) => {
    const urlParts = url.href.split(`${UNISWAP_WEB_HOSTNAME}/`)
    const urlPath = urlParts.length >= 1 ? urlParts[1] : ''
    return { action: DeepLinkAction.UniswapWebLink, data: { ...data, urlPath: urlPath ?? '' } }
  },
  [UNISWAP_URL_SCHEME_WALLETCONNECT_AS_PARAM]: (url, data) => {
    const wcUri = extractWalletConnectUri(url.href, UNISWAP_URL_SCHEME_WALLETCONNECT_AS_PARAM)
    return wcUri
      ? { action: DeepLinkAction.WalletConnectAsParam, data: { ...data, wcUri } }
      : logAndReturnError({
          errorMsg: 'No WC URI found',
          action: DeepLinkAction.WalletConnectAsParam,
          urlString: url.href,
          data,
        })
  },
  [UNISWAP_URL_SCHEME + WALLETCONNECT_URI_SCHEME]: (url, data) => {
    const wcUri = extractWalletConnectUri(url.href, UNISWAP_URL_SCHEME)
    return wcUri
      ? { action: DeepLinkAction.UniswapWalletConnect, data: { ...data, wcUri } }
      : logAndReturnError({
          errorMsg: 'No WC URI found',
          action: DeepLinkAction.UniswapWalletConnect,
          urlString: url.href,
          data,
        })
  },
  [UNISWAP_URL_SCHEME_WIDGET]: (_, data) => ({
    action: DeepLinkAction.UniswapWidget,
    data,
  }),
  [UNISWAP_URL_SCHEME_SCANTASTIC]: (url, data) => {
    const scantasticQueryParams = getScantasticQueryParams(url.href)
    return scantasticQueryParams
      ? { action: DeepLinkAction.Scantastic, data: { ...data, scantasticQueryParams } }
      : logAndReturnError({
          errorMsg: 'No Scantastic query params found',
          action: DeepLinkAction.Scantastic,
          urlString: url.href,
          data,
        })
  },
  [UNISWAP_URL_SCHEME_UWU_LINK]: (_, data) => ({
    action: DeepLinkAction.UwuLink,
    data,
  }),
}

/**
 * Extracts the WalletConnect URI from a URL string.
 *
 * Example: "uri=wc:af098@2?relay-protocol=irn&symKey=51e"
 *
 * @param urlString - The URL string to extract the WalletConnect URI from.
 * @param prefix - The prefix to split the URL string by.
 * @returns The WalletConnect URI or null if not found.
 */
function extractWalletConnectUri(urlString: string, prefix: string): string | null {
  const wcUri = urlString.split(prefix)[1]
  return wcUri ? decodeURIComponent(wcUri) : null
}

/**
 * Logs an error and returns an error action result.
 *
 * @param errorMsg - The error message to log.
 * @param action - The action to return.
 * @param urlString - The URL string that caused the error.
 * @param data - The data associated with the deep link.
 * @returns The error action result.
 */
function logAndReturnError({
  errorMsg,
  action,
  urlString,
  data,
}: {
  errorMsg: string
  action: DeepLinkAction
  urlString: string
  data: DeepLinkActionResult['data']
}): DeepLinkActionResult {
  logger.error(`${errorMsg} for action=${action} in deep link url=${urlString}`, {
    tags: {
      file: 'deepLinkUtils',
      function: 'parseDeepLinkUrl',
    },
  })
  return { action: DeepLinkAction.Error, data }
}
