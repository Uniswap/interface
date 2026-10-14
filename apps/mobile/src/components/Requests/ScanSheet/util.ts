import { Platform, UniverseChainId, getValidAddress } from '@universe/chains'
import { parseUri } from '@walletconnect/utils'
import {
  UNISWAP_URL_SCHEME,
  UNISWAP_URL_SCHEME_SCANTASTIC,
  UNISWAP_URL_SCHEME_WALLETCONNECT_AS_PARAM,
  UNISWAP_WALLETCONNECT_URL,
} from 'src/features/deepLinking/constants'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { tryCatch } from 'utilities/src/errors'
import { logger } from 'utilities/src/logger/logger'
import { ScantasticParams, ScantasticParamsSchema } from 'wallet/src/features/scantastic/types'

export enum URIType {
  WalletConnectURL = 'walletconnect',
  WalletConnectV2URL = 'walletconnect-v2',
  Address = 'address',
  EIP681 = 'eip-681',
  EasterEgg = 'easter-egg',
  Scantastic = 'scantastic',
}

type SimpleURIFormat = {
  type: Exclude<URIType, URIType.EIP681>
  value: string
}

export type EIP681URI = {
  type: URIType.EIP681
  value: string
  chainId?: UniverseChainId
  tokenAddress?: string
}

export type URIFormat = SimpleURIFormat | EIP681URI

interface SupportedURIOptions {
  isScantasticEnabled?: boolean
  enabledChainIds?: UniverseChainId[]
}

const EASTER_EGG_QR_CODE = 'DO_NOT_SCAN_OR_ELSE_YOU_WILL_GO_TO_MOBILE_TEAM_JAIL'
export const CUSTOM_UNI_QR_CODE_PREFIX = 'hello_uniwallet:'

export async function getSupportedURI(uri: string, options?: SupportedURIOptions): Promise<URIFormat | undefined> {
  if (!uri) {
    return undefined
  }

  // Decode URI in case it's encoded (handles both percent encoding and HTML ampersand)
  uri = safeDecodeURIComponent(uri).replace(/&amp;/g, '&')

  const maybeAddress = getValidAddress({
    address: uri,
    platform: Platform.EVM,
    withEVMChecksum: true,
    log: false,
  })
  if (maybeAddress) {
    return { type: URIType.Address, value: maybeAddress }
  }

  const maybeEIP681URI = getEIP681URI(uri)
  if (maybeEIP681URI === null) {
    return undefined
  }

  if (
    maybeEIP681URI?.chainId &&
    options?.enabledChainIds &&
    !options.enabledChainIds.includes(maybeEIP681URI.chainId)
  ) {
    return undefined
  }

  if (maybeEIP681URI) {
    return maybeEIP681URI
  }

  const maybeSchemeAddress = getAddressFromSchemeUri(uri)
  if (maybeSchemeAddress) {
    return { type: URIType.Address, value: maybeSchemeAddress }
  }

  const maybeScantasticQueryParams = getScantasticQueryParams(uri)
  if (options?.isScantasticEnabled && maybeScantasticQueryParams) {
    return { type: URIType.Scantastic, value: maybeScantasticQueryParams }
  }

  // The check for custom prefixes must be before the parseUri version 2 check because
  // parseUri(hello_uniwallet:[valid_wc_uri]) also returns version 2
  const { uri: maybeCustomWcUri, type } =
    (await getWcUriWithCustomPrefix(uri, CUSTOM_UNI_QR_CODE_PREFIX)) ||
    (await getWcUriWithCustomPrefix(uri, UNISWAP_URL_SCHEME_WALLETCONNECT_AS_PARAM)) ||
    (await getWcUriWithCustomPrefix(uri, UNISWAP_URL_SCHEME)) ||
    (await getWcUriWithCustomPrefix(uri, UNISWAP_WALLETCONNECT_URL)) ||
    {}

  if (maybeCustomWcUri && type) {
    return { type, value: maybeCustomWcUri }
  }

  const { data: parsedUri, error: parseUriError } = tryCatch(() => parseUri(uri))
  if (parseUriError) {
    logger.debug('util.ts', 'getSupportedURI', 'Failed to parse URI as WalletConnect URI', {
      error: parseUriError.message,
    })
  }
  const wctUriVersion = parsedUri?.version
  if (wctUriVersion === 1) {
    return { type: URIType.WalletConnectURL, value: uri }
  }

  if (wctUriVersion === 2) {
    return { type: URIType.WalletConnectV2URL, value: uri }
  }

  if (uri === EASTER_EGG_QR_CODE) {
    return { type: URIType.EasterEgg, value: uri }
  }

  return undefined
}

async function getWcUriWithCustomPrefix(uri: string, prefix: string): Promise<{ uri: string; type: URIType } | null> {
  if (uri.indexOf(prefix) !== 0) {
    return null
  }

  const maybeWcUri = uri.slice(prefix.length)

  const { data: parsedWcUri, error: parseWcUriError } = tryCatch(() => parseUri(maybeWcUri))
  if (parseWcUriError) {
    logger.debug('util.ts', 'getWcUriWithCustomPrefix', 'Failed to parse URI as WalletConnect URI', {
      error: parseWcUriError.message,
    })
  }
  if (parsedWcUri?.version === 2) {
    return { uri: maybeWcUri, type: URIType.WalletConnectV2URL }
  }

  return null
}

function getAddressFromSchemeUri(uri: string): Nullable<string> {
  const uriParts = uri.split(':')
  if (uriParts.length < 2) {
    return null
  }

  return getValidEvmAddress(uriParts[1] ?? '')
}

// Returns undefined for other formats and null for invalid EIP-681 requests.
function getEIP681URI(uri: string): EIP681URI | null | undefined {
  const prefix = 'ethereum:'
  if (!uri.startsWith(prefix)) {
    return undefined
  }

  let rest = uri.slice(prefix.length)
  const hasPaymentRequestSyntax = rest.startsWith('pay-') || /[@/?]/.test(rest)
  if (!hasPaymentRequestSyntax) {
    return undefined
  }

  if (rest.startsWith('pay-')) {
    rest = rest.slice('pay-'.length)
  }

  const [path = '', query] = rest.split('?')
  const [targetWithChain = '', functionName] = path.split('/')
  const [target = '', rawChainId] = targetWithChain.split('@')
  const parsedChainId = rawChainId ? toSupportedChainId(rawChainId) : undefined

  if (rawChainId && !parsedChainId) {
    return null
  }
  const chainId = parsedChainId ?? undefined

  if (functionName !== undefined) {
    // ERC-20 transfer targets the token contract; its address param is the recipient.
    if (functionName !== 'transfer' || !query) {
      return null
    }
    const tokenAddress = getValidEvmAddress(target)
    const recipient = new URLSearchParams(query).get('address')
    const recipientAddress = recipient ? getValidEvmAddress(recipient) : null

    return tokenAddress && recipientAddress
      ? { type: URIType.EIP681, value: recipientAddress, chainId, tokenAddress }
      : null
  }

  const recipientAddress = getValidEvmAddress(target)
  return recipientAddress
    ? {
        type: URIType.EIP681,
        value: recipientAddress,
        chainId,
        tokenAddress: undefined,
      }
    : null
}

function getValidEvmAddress(address: string): Nullable<string> {
  return getValidAddress({
    address,
    platform: Platform.EVM,
    withEVMChecksum: true,
    log: false,
  })
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

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch (e) {
    logger.error(new Error('Failed to decode URI component'), {
      tags: {
        file: 'util.ts',
        function: 'safeDecodeURIComponent',
      },
      extra: { value, error: e },
    })
    // If decoding fails, return the original value
    return value
  }
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
      uuid: uuid ? safeDecodeURIComponent(uuid) : undefined,
      vendor: vendor ? safeDecodeURIComponent(vendor) : undefined,
      model: model ? safeDecodeURIComponent(model) : undefined,
      browser: browser ? safeDecodeURIComponent(browser) : undefined,
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
