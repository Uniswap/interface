import { SearchToken, TokenSearchResultWeb } from 'graphql/data/SearchTokens'
import { GenieCollection } from 'nft/types'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { SearchResultType } from 'uniswap/src/features/search/SearchResult'
import { UniverseChainId } from 'uniswap/src/types/chains'

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
  tokenResults: SearchToken[],
  collectionResults: GenieCollection[],
): [SearchToken[], GenieCollection[]] {
  const reducedTokens =
    tokenResults?.slice(0, isNFTPage ? 3 : collectionResults.length < 3 ? 8 - collectionResults.length : 5) ?? []
  const reducedCollections = collectionResults.slice(0, 8 - reducedTokens.length)
  return [reducedTokens, reducedCollections]
}

export const searchTokenToTokenSearchResult = (
  searchToken: SearchToken & { chainId: UniverseChainId; address: string; isToken: boolean; isNative: boolean },
): TokenSearchResultWeb => {
  return {
    type: SearchResultType.Token,
    chain: searchToken.chain,
    chainId: searchToken.chainId,
    symbol: searchToken.symbol ?? '',
    address: searchToken.address,
    name: searchToken.name ?? null,
    isToken: searchToken.isToken,
    isNative: searchToken.isNative,
    logoUrl: searchToken.project?.logoUrl ?? null,
    safetyLevel: searchToken.project?.safetyLevel ?? null,
  }
}

export const searchGenieCollectionToTokenSearchResult = (searchToken: GenieCollection): TokenSearchResultWeb => {
  return {
    type: SearchResultType.NFTCollection,
    chain: Chain.Ethereum,
    chainId: UniverseChainId.Mainnet,
    symbol: '',
    address: searchToken.address ?? '',
    name: searchToken.name ?? null,
    logoUrl: searchToken.imageUrl,
    safetyLevel: null,
    isNft: true,
  }
}
