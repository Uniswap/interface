import { GqlSearchToken } from 'graphql/data/SearchTokens'
import { GenieCollection } from 'nft/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getCurrencySafetyInfo } from 'uniswap/src/features/dataApi/utils'
import {
  NFTCollectionSearchResult,
  SearchResultType,
  TokenSearchResult,
} from 'uniswap/src/features/search/SearchResult'
import { tokenAddressOrNativeAddress } from 'uniswap/src/features/search/utils'

/**
 * Organizes the number of Token and NFT results to be shown to a user depending on if they're in the NFT or Token experience
 * If not an nft page show up to 5 tokens, else up to 3. Max total suggestions of 8
 * @param isNFTPage boolean if user is currently on an nft page
 * @param tokenResults array of FungibleToken results
 * @param collectionResults array of NFT Collection results
 * @returns an array of Fungible Tokens and an array of NFT Collections with correct number of results to be shown
 */
export function organizeSearchResults(
  isNFTPage: boolean,
  tokenResults: GqlSearchToken[],
  collectionResults: GenieCollection[],
): [GqlSearchToken[], GenieCollection[]] {
  const reducedTokens =
    tokenResults?.slice(0, isNFTPage ? 3 : collectionResults.length < 3 ? 8 - collectionResults.length : 5) ?? []
  const reducedCollections = collectionResults.slice(0, 8 - reducedTokens.length)
  return [reducedTokens, reducedCollections]
}

export const searchTokenToTokenSearchResult = (
  searchToken: GqlSearchToken & { chainId: UniverseChainId; address: string },
): TokenSearchResult => {
  return {
    type: SearchResultType.Token,
    chainId: searchToken.chainId,
    symbol: searchToken.symbol ?? '',
    address: tokenAddressOrNativeAddress(searchToken.address, searchToken.chainId),
    name: searchToken.name ?? null,
    logoUrl: searchToken.project?.logoUrl ?? null,
    safetyLevel: searchToken.project?.safetyLevel ?? null,
    safetyInfo: getCurrencySafetyInfo(searchToken.project?.safetyLevel, searchToken.protectionInfo),
    feeData: searchToken.feeData ?? null,
  }
}

export const searchGenieCollectionToTokenSearchResult = (searchToken: GenieCollection): NFTCollectionSearchResult => {
  return {
    type: SearchResultType.NFTCollection,
    chainId: UniverseChainId.Mainnet,
    address: searchToken.address ?? '',
    name: searchToken.name ?? '',
    imageUrl: searchToken.imageUrl,
    isVerified: searchToken.isVerified ?? false,
  }
}
