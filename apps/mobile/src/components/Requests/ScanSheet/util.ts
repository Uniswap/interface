import { parseUri } from '@walletconnect/utils'
import {
  UWULINK_PREFIX,
  isUwULinkDirectLink,
  isUwuLinkUniswapDeepLink,
  parseUwuLinkDataFromDeeplink,
} from 'src/components/Requests/Uwulink/utils'
import {
  UNISWAP_URL_SCHEME,
  UNISWAP_URL_SCHEME_SCANTASTIC,
  UNISWAP_URL_SCHEME_WALLETCONNECT_AS_PARAM,
  UNISWAP_WALLETCONNECT_URL,
} from 'src/features/deepLinking/constants'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { ScantasticParams, ScantasticParamsSchema } from 'wallet/src/features/scantastic/types'

export enum URIType {
  WalletConnectURL = 'walletconnect',
  WalletConnectV2URL = 'walletconnect-v2',
  Address = 'address',
  EasterEgg = 'easter-egg',
  Scantastic = 'scantastic',
  UwULink = 'uwu-link',
}

type URIFormat = {
  type: URIType
  value: string
}

interface EnabledFeatureFlags {
  isUwULinkEnabled: boolean
  isScantasticEnabled: boolean
}

const EASTER_EGG_QR_CODE = 'DO_NOT_SCAN_OR_ELSE_YOU_WILL_GO_TO_MOBILE_TEAM_JAIL'
export const CUSTOM_UNI_QR_CODE_PREFIX = 'hello_uniwallet:'

export async function getSupportedURI(
  uri: string,
  enabledFeatureFlags?: EnabledFeatureFlags,
): Promise<URIFormat | undefined> {
  if (!uri) {
    return undefined
  }

  const maybeAddress = getValidAddress(uri, /*withChecksum=*/ true, /*log=*/ false)
  if (maybeAddress) {
    return { type: URIType.Address, value: maybeAddress }
  }

  const maybeMetamaskAddress = getMetamaskAddress(uri)
  if (maybeMetamaskAddress) {
    return { type: URIType.Address, value: maybeMetamaskAddress }
  }

  const maybeScantasticQueryParams = getScantasticQueryParams(uri)
  if (enabledFeatureFlags?.isScantasticEnabled && maybeScantasticQueryParams) {
    return { type: URIType.Scantastic, value: maybeScantasticQueryParams }
  }

  // The check for custom prefixes must be before the parseUri version 2 check because
  // parseUri(hello_uniwallet:[valid_wc_uri]) also returns version 2
  const { uri: maybeCustomWcUri, type } =
    (await getWcUriWithCustomPrefix(uri, CUSTOM_UNI_QR_CODE_PREFIX)) ||
    (await getWcUriWithCustomPrefix(uri, UNISWAP_URL_SCHEME_WALLETCONNECT_AS_PARAM)) ||
    (await getWcUriWithCustomPrefix(uri, UNISWAP_URL_SCHEME)) ||
    (await getWcUriWithCustomPrefix(decodeURIComponent(uri), UNISWAP_WALLETCONNECT_URL)) ||
    {}

  if (maybeCustomWcUri && type) {
    return { type, value: maybeCustomWcUri }
  }

  const wctUriVersion = parseUri(uri).version
  if (wctUriVersion === 1) {
    return { type: URIType.WalletConnectURL, value: uri }
  }

  if (wctUriVersion === 2) {
    return { type: URIType.WalletConnectV2URL, value: uri }
  }

  if (uri === EASTER_EGG_QR_CODE) {
    return { type: URIType.EasterEgg, value: uri }
  }

  if (isUwULinkDirectLink(uri)) {
    // remove escape strings from the stringified JSON before parsing it
    return { type: URIType.UwULink, value: uri.slice(UWULINK_PREFIX.length).replaceAll('\\', '') }
  }

  if (isUwuLinkUniswapDeepLink(uri)) {
    return {
      type: URIType.UwULink,
      // remove escape strings from the stringified JSON before parsing it
      value: parseUwuLinkDataFromDeeplink(uri),
    }
  }

  return undefined
}

async function getWcUriWithCustomPrefix(uri: string, prefix: string): Promise<{ uri: string; type: URIType } | null> {
  if (uri.indexOf(prefix) !== 0) {
    return null
  }

  const maybeWcUri = uri.slice(prefix.length)

  if (parseUri(maybeWcUri).version === 2) {
    return { uri: maybeWcUri, type: URIType.WalletConnectV2URL }
  }

  return null
}

// metamask QR code values have the format "ethereum:<address>"
function getMetamaskAddress(uri: string): Nullable<string> {
  const uriParts = uri.split(':')
  if (uriParts.length < 2) {
    return null
  }

  return getValidAddress(uriParts[1], /*withChecksum=*/ true, /*log=*/ false)
}

// format is uniswap://scantastic?<params>
export function getScantasticQueryParams(uri: string): Nullable<string> {
  if (!uri.startsWith(UNISWAP_URL_SCHEME_SCANTASTIC)) {
    return null
  }

  const uriParts = uri.split('://scantastic?')

  if (uriParts.length < 2) {
    return null
  }

  return uriParts[1] || null
}

const PARAM_PUB_KEY = 'pubKey'
const PARAM_UUID = 'uuid'
const PARAM_VENDOR = 'vendor'
const PARAM_MODEL = 'model'
const PARAM_BROWSER = 'browser'

/** parses scantastic params for a valid scantastic URI. */
export function parseScantasticParams(uri: string): ScantasticParams | undefined {
  const uriParams = new URLSearchParams(uri)
  const paramKeys = [PARAM_PUB_KEY, PARAM_UUID, PARAM_VENDOR, PARAM_MODEL, PARAM_BROWSER]

  // Validate all keys are unique for security
  for (const paramKey of paramKeys) {
    if (uriParams.getAll(paramKey).length > 1) {
      logger.error(new Error('Invalid scantastic params due to duplicate keys'), {
        tags: {
          file: 'util.ts',
          function: 'parseScantasticParams',
        },
        extra: { uri },
      })
      return undefined
    }
  }

  const publicKey = uriParams.get(PARAM_PUB_KEY)
  const uuid = uriParams.get(PARAM_UUID)
  const vendor = uriParams.get(PARAM_VENDOR)
  const model = uriParams.get(PARAM_MODEL)
  const browser = uriParams.get(PARAM_BROWSER)

  try {
    return ScantasticParamsSchema.parse({
      publicKey: publicKey ? JSON.parse(publicKey) : undefined,
      uuid: uuid ? decodeURIComponent(uuid) : undefined,
      vendor: vendor ? decodeURIComponent(vendor) : undefined,
      model: model ? decodeURIComponent(model) : undefined,
      browser: browser ? decodeURIComponent(browser) : undefined,
    })
  } catch (e) {
    const wrappedError = new Error('Invalid scantastic params', { cause: e })
    logger.error(wrappedError, {
      tags: {
        file: 'util.ts',
        function: 'parseScantasticParams',
      },
    })
    return undefined
  }
}
