import { parseUri } from '@walletconnect/utils'
import {
  UNISWAP_URL_SCHEME,
  UNISWAP_URL_SCHEME_WALLETCONNECT_AS_PARAM,
  UNISWAP_WALLETCONNECT_URL,
} from 'src/features/deepLinking/handleDeepLinkSaga'
import { getValidAddress } from 'wallet/src/utils/addresses'

export enum URIType {
  WalletConnectURL = 'walletconnect',
  WalletConnectV2URL = 'walletconnect-v2',
  Address = 'address',
  EasterEgg = 'easter-egg',
}

export type URIFormat = {
  type: URIType
  value: string
}

const EASTER_EGG_QR_CODE = 'DO_NOT_SCAN_OR_ELSE_YOU_WILL_GO_TO_MOBILE_TEAM_JAIL'
export const CUSTOM_UNI_QR_CODE_PREFIX = 'hello_uniwallet:'
const MAX_DAPP_NAME_LENGTH = 60

export function truncateDappName(name: string): string {
  return name.length > MAX_DAPP_NAME_LENGTH ? `${name.slice(0, MAX_DAPP_NAME_LENGTH)}...` : name
}

export async function getSupportedURI(uri: string): Promise<URIFormat | undefined> {
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

// metamask QR code values have the format "ethereum:<address>"
function getMetamaskAddress(uri: string): Nullable<string> {
  const uriParts = uri.split(':')
  if (uriParts.length < 2) {
    return null
  }

  return getValidAddress(uriParts[1], /*withChecksum=*/ true, /*log=*/ false)
}
