import * as WebBrowser from 'expo-web-browser'
import { Linking } from 'react-native'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { toUniswapWebAppLink } from 'uniswap/src/features/chains/utils'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { currencyIdToChain, currencyIdToGraphQLAddress } from 'uniswap/src/utils/currencyId'
import { openUri } from 'uniswap/src/utils/linking'
import { FiatPurchaseTransactionInfo, ServiceProviderInfo } from 'wallet/src/features/transactions/types'

export const UNISWAP_APP_NATIVE_TOKEN = 'NATIVE'

export function dismissInAppBrowser(): void {
  WebBrowser.dismissBrowser()
}

export async function openTransactionLink(hash: string | undefined, chainId: WalletChainId): Promise<void> {
  if (!hash) {
    return
  }
  const explorerUrl = getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)
  return openUri(explorerUrl)
}

export async function openUniswapHelpLink(): Promise<void> {
  return openUri(uniswapUrls.helpRequestUrl)
}

export async function openMoonpayTransactionLink(info: FiatPurchaseTransactionInfo): Promise<void> {
  return openUri(info.explorerUrl ?? 'https://support.moonpay.com/hc/en-gb')
}

const SERVICE_PROVIDER_SUPPORT_URLS: Record<string, string> = {
  MOONPAY: 'https://www.moonpay.com/contact-us',
  ROBINHOOD: 'https://robinhood.com/support/articles/how-to-contact-support/',
  COINBASEPAY: 'https://help.coinbase.com/',
  TRANSAK: 'https://support.transak.com/collections/3985810-customer-help-center',
  BANXA: 'https://support.banxa.com/support/home',
  STRIPE: 'https://support.stripe.com/',
}

export async function openLegacyFiatOnRampServiceProviderLink(serviceProvider: string): Promise<void> {
  const helpUrl = SERVICE_PROVIDER_SUPPORT_URLS[serviceProvider] ?? 'https://www.moonpay.com/contact-us'
  return openUri(helpUrl)
}

export async function openOnRampSupportLink(serviceProvider: ServiceProviderInfo): Promise<void> {
  return openUri(serviceProvider.supportUrl ?? uniswapUrls.helpRequestUrl)
}

export async function openSettings(): Promise<void> {
  await Linking.openSettings()
}

export enum ExplorerDataType {
  TRANSACTION = 'transaction',
  TOKEN = 'token',
  ADDRESS = 'address',
  BLOCK = 'block',
  NFT = 'nft',
}

/**
 * Return the explorer name for the given chain ID
 * @param chainId the ID of the chain for which to return the explorer name
 */
export function getExplorerName(chainId: UniverseChainId): string {
  return UNIVERSE_CHAIN_INFO[chainId].explorer.name
}

/**
 * Return the explorer link for the given data and data type
 * @param chainId the ID of the chain for which to return the data
 * @param data the data to return a link for
 * @param type the type of the data
 */
export function getExplorerLink(chainId: WalletChainId, data: string, type: ExplorerDataType): string {
  const prefix = UNIVERSE_CHAIN_INFO[chainId].explorer.url

  switch (type) {
    case ExplorerDataType.TRANSACTION:
      return `${prefix}tx/${data}`

    case ExplorerDataType.TOKEN:
      if (
        data === UNIVERSE_CHAIN_INFO[chainId].nativeCurrency.address &&
        UNIVERSE_CHAIN_INFO[chainId].nativeCurrency.explorerLink
      ) {
        return UNIVERSE_CHAIN_INFO[chainId].nativeCurrency.explorerLink ?? `${prefix}token/${data}`
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
      return `${prefix}`
  }
}

export function getNftCollectionUrl(contractAddress: Maybe<string>): string | undefined {
  if (!contractAddress) {
    return undefined
  }
  return `${uniswapUrls.webInterfaceNftCollectionUrl}/${contractAddress}`
}

export function getNftUrl(contractAddress: string, tokenId: string): string {
  return `${uniswapUrls.webInterfaceNftItemUrl}/${contractAddress}/${tokenId}`
}

export function getProfileUrl(walletAddress: string): string {
  return `${uniswapUrls.webInterfaceAddressUrl}/${walletAddress}`
}

const UTM_TAGS_MOBILE = 'utm_medium=mobile&utm_source=share-tdp'

export function getTokenUrl(currencyId: string, addMobileUTMTags: boolean = false): string | undefined {
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
    const tokenUrl = `${uniswapUrls.webInterfaceTokensUrl}/${network}/${tokenAddress}`
    return addMobileUTMTags ? tokenUrl + `?${UTM_TAGS_MOBILE}` : tokenUrl
  } catch (_) {
    return
  }
}

export function getTwitterLink(twitterName: string): string {
  return `https://twitter.com/${twitterName}`
}
