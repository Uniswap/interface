import { parseUri } from '@walletconnect/utils'
import { parseEther } from 'ethers/lib/utils'
import {
  UNISWAP_URL_SCHEME,
  UNISWAP_URL_SCHEME_SCANTASTIC,
  UNISWAP_URL_SCHEME_WALLETCONNECT_AS_PARAM,
  UNISWAP_WALLETCONNECT_URL,
} from 'src/features/deepLinking/constants'
import { DynamicConfigs } from 'uniswap/src/features/gating/configs'
import { useDynamicConfig } from 'uniswap/src/features/gating/hooks'
import { logger } from 'utilities/src/logger/logger'
import { RPCType } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { ContractManager } from 'wallet/src/features/contracts/ContractManager'
import { ProviderManager } from 'wallet/src/features/providers'
import { ScantasticParams, ScantasticParamsSchema } from 'wallet/src/features/scantastic/types'
import { getTokenTransferRequest } from 'wallet/src/features/transactions/transfer/hooks/useTransferTransactionRequest'
import { TransferCurrencyParams } from 'wallet/src/features/transactions/transfer/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import {
  EthMethod,
  EthTransaction,
  UwULinkErc20SendRequest,
  UwULinkMethod,
  UwULinkRequest,
} from 'wallet/src/features/walletConnect/types'
import { areAddressesEqual, getValidAddress } from 'wallet/src/utils/addresses'

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

// This type must match the format in statsig dynamic config for uwulink
// https://console.statsig.com/5HjUux4OvSGzgqWIfKFt8i/dynamic_configs/uwulink_config
type UwULinkAllowlistItem = {
  chainId: number
  address: string
  name: string
  icon?: string
}

type UwULinkAllowlist = {
  contracts: UwULinkAllowlistItem[]
  tokenRecipients: UwULinkAllowlistItem[]
}

const UWULINK_MAX_TXN_VALUE = '0.001'

const EASTER_EGG_QR_CODE = 'DO_NOT_SCAN_OR_ELSE_YOU_WILL_GO_TO_MOBILE_TEAM_JAIL'
export const CUSTOM_UNI_QR_CODE_PREFIX = 'hello_uniwallet:'
export const UWULINK_PREFIX = 'uwulink' as const

export const truncateQueryParams = (url: string): string => {
  // In fact, the first element will be always returned below. url is
  // added as a fallback just to satisfy TypeScript.
  return url.split('?')[0] ?? url
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

  if (isUwULink(uri)) {
    // remove escape strings from the stringified JSON before parsing it
    return { type: URIType.UwULink, value: uri.slice(UWULINK_PREFIX.length).replaceAll('\\', '') }
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

// Gets the UWULink contract allow list from statsig dynamic config.
// We can safely cast as long as the statsig config format matches our `UwuLinkAllowlist` type.
export function useUwuLinkContractAllowlist(): UwULinkAllowlist {
  const uwuLinkConfig = useDynamicConfig(DynamicConfigs.UwuLink)
  return uwuLinkConfig.getValue('allowlist') as UwULinkAllowlist
}

export function findAllowedTokenRecipient(
  request: UwULinkRequest,
  allowlist: UwULinkAllowlist
): UwULinkAllowlistItem | undefined {
  if (request.method !== UwULinkMethod.Erc20Send) {
    return
  }

  const { chainId, recipient } = request
  return allowlist.tokenRecipients.find(
    (item) => item.chainId === chainId && areAddressesEqual(item.address, recipient)
  )
}
/**
 * Util function to check if a UwULinkRequest is valid.
 *
 * Current testing conditions requires:
 * 1. The to address is in the UWULINK_CONTRACT_ALLOWLIST
 * 2. The value is less than or equal to UWULINK_MAX_TXN_VALUE
 *
 * TODO: also check for validity of the entire request object (e.g. all the required fields exist)
 *
 * @param request parsed UwULinkRequest
 * @returns boolean for whether the UwULinkRequest is allowed
 */
export function isAllowedUwuLinkRequest(
  request: UwULinkRequest,
  allowlist: UwULinkAllowlist
): boolean {
  // token sends
  if (request.method === UwULinkMethod.Erc20Send) {
    return Boolean(findAllowedTokenRecipient(request, allowlist))
  }

  if (request.method === EthMethod.PersonalSign) {
    return true
  }

  // generic transactions
  const { to, value } = request.value
  const belowMaximumValue =
    value && parseFloat(value) <= parseEther(UWULINK_MAX_TXN_VALUE).toNumber()
  const isAllowedContractAddress =
    to && allowlist.contracts.some((item) => areAddressesEqual(item.address, to))

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

export async function toTokenTransferRequest(
  request: UwULinkErc20SendRequest,
  account: Account,
  providerManager: ProviderManager,
  contractManager: ContractManager
): Promise<EthTransaction> {
  const provider = providerManager.getProvider(request.chainId, RPCType.Public)
  const params: TransferCurrencyParams = {
    type: AssetType.Currency,
    account,
    chainId: request.chainId,
    toAddress: request.recipient,
    tokenAddress: request.tokenAddress,
    amountInWei: request.amount.toString(),
  }
  const transaction = await getTokenTransferRequest(params, provider, contractManager)
  return transaction as EthTransaction
}
