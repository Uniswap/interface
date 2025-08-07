import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toUniswapWebAppLink } from 'uniswap/src/features/chains/utils'
import { BACKEND_NATIVE_CHAIN_ADDRESS_STRING } from 'uniswap/src/features/search/utils'
import { ServiceProviderInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyIdToChain, currencyIdToGraphQLAddress } from 'uniswap/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'

export async function openTransactionLink(hash: string | undefined, chainId: UniverseChainId): Promise<void> {
  if (!hash) {
    return undefined
  }
  const explorerUrl = getExplorerLink({ chainId, data: hash, type: ExplorerDataType.TRANSACTION })
  return openUri({ uri: explorerUrl })
}

export async function openUniswapHelpLink(): Promise<void> {
  return openUri({ uri: uniswapUrls.helpRequestUrl })
}

export async function openFORSupportLink(serviceProvider: ServiceProviderInfo): Promise<void> {
  return openUri({ uri: serviceProvider.supportUrl ?? uniswapUrls.helpRequestUrl })
}

export async function openOfframpPendingSupportLink(): Promise<void> {
  return openUri({ uri: uniswapUrls.helpArticleUrls.fiatOffRampHelp })
}

/**
 * Return the explorer name for the given chain ID
 * @param chainId the ID of the chain for which to return the explorer name
 */
export function getExplorerName(chainId: UniverseChainId): string {
  return getChainInfo(chainId).explorer.name
}

export function getProfileUrl(walletAddress: string): string {
  return `${uniswapUrls.webInterfaceAddressUrl}/${walletAddress}`
}

const UTM_TAGS_MOBILE = 'utm_medium=mobile&utm_source=share-tdp'

export function getTokenUrl(currencyId: string, addMobileUTMTags: boolean = false): string | undefined {
  const chainId = currencyIdToChain(currencyId)
  if (!chainId) {
    return undefined
  }
  const network = toUniswapWebAppLink(chainId)
  try {
    let tokenAddress = currencyIdToGraphQLAddress(currencyId)
    // in case it's a native token
    if (tokenAddress === null) {
      // this is how web app handles native tokens
      tokenAddress = BACKEND_NATIVE_CHAIN_ADDRESS_STRING
    }
    const tokenUrl = `${uniswapUrls.webInterfaceTokensUrl}/${network}/${tokenAddress}`
    return addMobileUTMTags ? tokenUrl + `?${UTM_TAGS_MOBILE}` : tokenUrl
  } catch (_) {
    return undefined
  }
}

export function getTwitterLink(twitterName: string): string {
  return `https://twitter.com/${twitterName}`
}
