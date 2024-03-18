import { parseUri } from '@walletconnect/utils'
import { parseEther } from 'ethers/lib/utils'
import {
  UNISWAP_URL_SCHEME,
  UNISWAP_URL_SCHEME_WALLETCONNECT_AS_PARAM,
  UNISWAP_WALLETCONNECT_URL,
} from 'src/features/deepLinking/handleDeepLinkSaga'
import { logger } from 'utilities/src/logger/logger'
import { ScantasticParams, ScantasticParamsSchema } from 'wallet/src/features/scantastic/types'
import { UwULinkRequest } from 'wallet/src/features/walletConnect/types'
import { getValidAddress } from 'wallet/src/utils/addresses'

export enum URIType {
  WalletConnectURL = 'walletconnect',
  WalletConnectV2URL = 'walletconnect-v2',
  Address = 'address',
  EasterEgg = 'easter-egg',
  Scantastic = 'scantastic',
  UwULink = 'uwu-link',
}

export type URIFormat = {
  type: URIType
  value: string
}

interface EnabledFeatureFlags {
  isUwULinkEnabled: boolean
  isScantasticEnabled: boolean
}

const UNISNAP_CONTRACT_ADDRESS = '0xFd2308677A0eb48e2d0c4038c12AA7DCb703e8DC'
const UWULINK_CONTRACT_ALLOWLIST = [UNISNAP_CONTRACT_ADDRESS]
const UWULINK_MAX_TXN_VALUE = '0.001'

const EASTER_EGG_QR_CODE = 'DO_NOT_SCAN_OR_ELSE_YOU_WILL_GO_TO_MOBILE_TEAM_JAIL'
export const CUSTOM_UNI_QR_CODE_PREFIX = 'hello_uniwallet:'
export const UWULINK_PREFIX = 'uwulink'
const MAX_DAPP_NAME_LENGTH = 60

export function truncateDappName(name: string): string {
  return name && name.length > MAX_DAPP_NAME_LENGTH
    ? `${name.slice(0, MAX_DAPP_NAME_LENGTH)}...`
    : name
}

export async function getSupportedURI(
  uri: string,
  enabledFeatureFlags?: EnabledFeatureFlags
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

  const maybeScantasticAddress = getScantasticAddress(uri)
  if (enabledFeatureFlags?.isScantasticEnabled && maybeScantasticAddress) {
    return { type: URIType.Scantastic, value: maybeScantasticAddress }
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

  if (enabledFeatureFlags?.isUwULinkEnabled && isUwULink(uri)) {
    return { type: URIType.UwULink, value: uri.slice(UWULINK_PREFIX.length) }
  }
}

async function getWcUriWithCustomPrefix(
  uri: string,
  prefix: string
): Promise<{ uri: string; type: URIType } | null> {
  if (uri.indexOf(prefix) !== 0) {
    return null
  }

  const maybeWcUri = uri.slice(prefix.length)

  if (parseUri(maybeWcUri).version === 2) {
    return { uri: maybeWcUri, type: URIType.WalletConnectV2URL }
  }

  return null
}

function isUwULink(uri: string): boolean {
  // Note the trailing `{` char is required for UwULink. See spec:
  // https://github.com/ethereum/EIPs/pull/7253/files#diff-ec1218463dc29af4f2826e540d30abe987ab4c5b7152e1f6c567a0f71938a293R30
  return uri.startsWith(`${UWULINK_PREFIX}{`)
}

/**
 * Util function to check if a UwULinkRequest is valid.
 *
 * Current testing conditions requires:
 * 1. The to address is in the UWULINK_CONTRACT_ALLOWLIST
 * 2. The value is less than or equal to UWULINK_MAX_TXN_VALUE
 *
 * @param request parsed UwULinkRequest
 * @returns boolean for whether the UwULinkRequest is allowed
 */
export function isAllowedUwULinkRequest(request: UwULinkRequest): boolean {
  const { to, value } = request.value
  const belowMaximumValue =
    value && parseFloat(value) <= parseEther(UWULINK_MAX_TXN_VALUE).toNumber()
  const isAllowedContractAddress = to && UWULINK_CONTRACT_ALLOWLIST.includes(to)

  if (!belowMaximumValue || !isAllowedContractAddress) {
    return false
  }

  return true
}

// metamask QR code values have the format "ethereum:<address>"
function getMetamaskAddress(uri: string): Nullable<string> {
  const uriParts = uri.split(':')
  if (uriParts.length < 2) {
    return null
  }

  return getValidAddress(uriParts[1], /*withChecksum=*/ true, /*log=*/ false)
}

// format is scantastic://<uri>
function getScantasticAddress(uri: string): Nullable<string> {
  if (!uri.startsWith('scantastic://')) {
    return null
  }

  const uriParts = uri.split('://')

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
      return
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
    const wrappedError = new Error('Invalid scantastic params')
    wrappedError.cause = e
    logger.error(wrappedError, {
      tags: {
        file: 'util.ts',
        function: 'parseScantasticParams',
      },
    })
  }
}
