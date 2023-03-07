import { SearchToken } from 'graphql/data/SearchTokens'
import { GenieCollection } from 'nft/types'

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
  collectionResults: GenieCollection[]
): [SearchToken[], GenieCollection[]] {
  const reducedTokens =
    tokenResults?.slice(0, isNFTPage ? 3 : collectionResults.length < 3 ? 8 - collectionResults.length : 5) ?? []
  const reducedCollections = collectionResults.slice(0, 8 - reducedTokens.length)
  return [reducedTokens, reducedCollections]
}
