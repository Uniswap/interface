import { DeepLinkUrlAllowlist } from '@universe/gating'
import { getScantasticQueryParams } from 'src/components/Requests/ScanSheet/util'
import { UNISWAP_URL_SCHEME_UWU_LINK } from 'src/components/Requests/Uwulink/utils'
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
  UniswapExternalBrowserLink = 'uniswapExternalBrowserLink',
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
  | { action: DeepLinkAction.UniswapExternalBrowserLink; data: BasePayload & { urlPath: string } }
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
  | { action: DeepLinkAction.TokenDetails; data: BasePayload & { currencyId: string } }
  | { action: DeepLinkAction.FiatOnRampScreen; data: PayloadWithFiatOnRampParams }
  | { action: DeepLinkAction.Error; data: BasePayload }
  | { action: DeepLinkAction.Unknown; data: BasePayload }

type DeepLinkHandler = (url: URL, data: BasePayload) => DeepLinkActionResult

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

  if (isValidUniswapExternalWebLink(urlString)) {
    return { action: DeepLinkAction.UniswapExternalBrowserLink, data: { ...data, urlPath: url.pathname } }
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

const UNISWAP_EXTERNAL_WEB_LINK_VALID_REGEXES = [
  // eslint-disable-next-line security/detect-unsafe-regex
  /^https:\/\/([a-zA-Z0-9-]+)\.uniswap\.org(\/.*)?$/,
  // eslint-disable-next-line security/detect-unsafe-regex
  /^https:\/\/cryptothegame\.com(\/.*)?$/,
]

function isValidUniswapExternalWebLink(urlString: string): boolean {
  return UNISWAP_EXTERNAL_WEB_LINK_VALID_REGEXES.some((regex) => regex.test(urlString))
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
