import { GraphQLApi } from '@universe/api'
import * as WebBrowser from 'expo-web-browser'
import { colorsLight } from 'ui/src/theme'
import { NATIVE_TOKEN_PLACEHOLDER } from 'uniswap/src/constants/addresses'
import { UniswapHelpUrls, UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain, toUniswapWebAppLink } from 'uniswap/src/features/chains/utils'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { BACKEND_NATIVE_CHAIN_ADDRESS_STRING } from 'uniswap/src/features/search/utils'
import type { EarnAnalyticsEntryPoint } from 'uniswap/src/features/telemetry/types'
import { ServiceProviderInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyIdToChain, currencyIdToGraphQLAddress, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { canOpenURL, openURL } from 'uniswap/src/utils/link'
import { logger } from 'utilities/src/logger/logger'

export const TDP_MULTICHAIN_CHAIN_QUERY_VALUE = 'multichain'

export enum TDPView {
  Chain = 'chain',
  Aggregate = 'aggregate',
}

/** Discriminant for {@link TdpChainSelection}. Values mirror `TDPChainSearchParam` (apps/web) for one vocabulary. */
export enum TdpChainSelectionType {
  Chain = 'chain', // a specific network's deployment
  Multichain = 'multichain', // the all-networks (multichain) aggregate view
}

/**
 * How the token-detail-page network selector should be initialized when navigating.
 * Omit (pass `undefined`) to open the token's own chain via a path-only URL.
 */
export type TdpChainSelection =
  | { type: TdpChainSelectionType.Chain; chainId: UniverseChainId }
  | { type: TdpChainSelectionType.Multichain }

/**
 * Adapts a raw chain filter (the shape persisted for search history, `UniverseChainId | null`) into a
 * `TdpChainSelection`. `null` -> aggregate multichain view; `undefined` -> the token's own chain (no selection).
 */
export function tdpChainSelectionFromFilter(
  chainFilter: UniverseChainId | null | undefined,
): TdpChainSelection | undefined {
  if (chainFilter === null) {
    return { type: TdpChainSelectionType.Multichain }
  }
  if (chainFilter === undefined) {
    return undefined
  }
  return { type: TdpChainSelectionType.Chain, chainId: chainFilter }
}

/**
 * Checks whether a URI uses an allowed external scheme (http or https).
 * Uses the URL API for case-insensitive protocol parsing.
 */
export function isAllowedExternalUri(uri: string): boolean {
  try {
    const parsed = new URL(uri.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

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
  if (!isSafeUri && !isAllowedExternalUri(uri)) {
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

  const trimmedURI = uri.trim()
  const isHttp = /^https?:\/\//.test(trimmedURI)

  // `canOpenURL` returns `false` for App Links / Universal Links, so we just assume any device can handle the `https://` protocol.
  const supported = isHttp ? true : await canOpenURL(trimmedURI)

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
  const chainInfo = getChainInfo(chainId)

  // Handle unsupported chain IDs gracefully
  // oxlint-disable-next-line typescript/no-unnecessary-condition -- chainInfo can be undefined in edge cases (SDK mismatch)
  if (!chainInfo) {
    return ''
  }

  const { explorer, nativeCurrency } = chainInfo
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
  contractAddress,
  tokenId,
}: {
  chainId: UniverseChainId
  contractAddress: string
  tokenId: string
}): string {
  return getExplorerLink({
    chainId,
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
 * @param tdpView whether the URL should open the chain-specific or aggregate TDP view
 */
export function getTokenDetailsURL({
  address,
  chain,
  chainUrlParam,
  inputAddress,
  tdpView,
}: {
  address: string
  chain?: number
  chainUrlParam?: string
  inputAddress?: string | null
  tdpView?: TDPView
}): string {
  if (!chain) {
    return '/not-found'
  }
  const chainInfo = toGraphQLChain(chain)

  const adjustedAddress = isNativeCurrencyAddress(chain, address) ? NATIVE_TOKEN_PLACEHOLDER : address
  const adjustedInputAddress =
    inputAddress && isNativeCurrencyAddress(chain, inputAddress) ? NATIVE_TOKEN_PLACEHOLDER : inputAddress

  const chainName = chainUrlParam || String(chainInfo).toLowerCase() || GraphQLApi.Chain.Ethereum.toLowerCase()
  const params = new URLSearchParams()
  if (adjustedInputAddress) {
    params.set('inputCurrency', adjustedInputAddress)
  }
  if (tdpView === TDPView.Aggregate) {
    params.set('chain', TDP_MULTICHAIN_CHAIN_QUERY_VALUE)
  }
  const query = params.toString()
  return `/explore/tokens/${chainName}/${adjustedAddress}${query ? `?${query}` : ''}`
}

type FiatOnRampURLParams = {
  chainId?: UniverseChainId
  currencyCode?: string
  currencyId?: string
}

export function getFiatOnRampURL(chainIdOrParams?: UniverseChainId | FiatOnRampURLParams): string {
  const params = typeof chainIdOrParams === 'number' ? { chainId: chainIdOrParams } : chainIdOrParams
  const searchParams = new URLSearchParams()

  if (params?.chainId) {
    searchParams.set('chainId', String(params.chainId))
  }
  if (params?.currencyCode) {
    searchParams.set('currencyCode', params.currencyCode)
  }
  if (params?.currencyId) {
    searchParams.set('currencyId', params.currencyId)
  }

  const queryString = searchParams.toString()
  return queryString ? `/buy?${queryString}` : '/buy'
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
  return openUri({ uri: UniswapHelpUrls.requestUrl })
}

export async function openFORSupportLink(serviceProvider: ServiceProviderInfo): Promise<void> {
  return openUri({ uri: serviceProvider.supportUrl ?? UniswapHelpUrls.requestUrl })
}

export async function openOfframpPendingSupportLink(): Promise<void> {
  return openUri({ uri: UniswapHelpUrls.articles.fiatOffRampHelp })
}

export function getPortfolioUrl(walletAddress: string): string {
  return `${UniswapStaticUrls.webInterfacePortfolioUrl}/${walletAddress}`
}

const UTM_TAGS_MOBILE = 'utm_medium=mobile&utm_source=share-tdp'

type GetTokenUrlOptions = {
  addMobileUTMTags?: boolean
}

export function getTokenUrl(
  currencyId: string,
  optionsOrAddMobileUTMTags: GetTokenUrlOptions | boolean = false,
): string | undefined {
  const chainId = currencyIdToChain(currencyId)
  if (!chainId) {
    return undefined
  }
  const options =
    typeof optionsOrAddMobileUTMTags === 'boolean'
      ? { addMobileUTMTags: optionsOrAddMobileUTMTags }
      : optionsOrAddMobileUTMTags
  const network = toUniswapWebAppLink(chainId)
  try {
    let tokenAddress = currencyIdToGraphQLAddress(currencyId)
    // in case it's a native token
    if (tokenAddress === null) {
      // this is how web app handles native tokens
      tokenAddress = BACKEND_NATIVE_CHAIN_ADDRESS_STRING
    }
    const tokenUrl = `${UniswapStaticUrls.webInterfaceTokensUrl}/${network}/${tokenAddress}`
    const params = new URLSearchParams()
    if (options.addMobileUTMTags) {
      for (const [key, value] of new URLSearchParams(UTM_TAGS_MOBILE)) {
        params.set(key, value)
      }
    }
    const query = params.toString()
    return query ? `${tokenUrl}?${query}` : tokenUrl
  } catch {
    return undefined
  }
}

/**
 * Query param used on a Token Details Page URL to auto-open the EarnVaultModal
 * for that token's vault on page load (e.g., when linking from the extension's
 * earn positions list).
 */
export const EARN_VAULT_MODAL_QUERY_PARAM = 'modal'
export const EARN_VAULT_MODAL_QUERY_VALUE = 'earn-vault'
export const EARN_ENTRY_POINT_QUERY_PARAM = 'earnEntryPoint'

/**
 * Build a Uniswap web TDP URL that auto-opens the earn vault modal for the
 * given vault's underlying token. Returns undefined if the vault's currencyId
 * cannot be resolved to a token URL.
 */
export function getEarnVaultUrl(
  vault: EarnVaultInfo,
  analyticsEntryPoint?: EarnAnalyticsEntryPoint,
): string | undefined {
  const tokenUrl = getTokenUrl(vault.displayCurrencyId)
  if (!tokenUrl) {
    return undefined
  }
  const entryPointQuery = analyticsEntryPoint
    ? `&${EARN_ENTRY_POINT_QUERY_PARAM}=${encodeURIComponent(analyticsEntryPoint)}`
    : ''
  return `${tokenUrl}?${EARN_VAULT_MODAL_QUERY_PARAM}=${EARN_VAULT_MODAL_QUERY_VALUE}${entryPointQuery}`
}

export function getTwitterLink(twitterName: string): string {
  return `https://twitter.com/${twitterName}`
}
