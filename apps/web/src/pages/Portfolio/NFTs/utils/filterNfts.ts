import { NFTItem } from 'uniswap/src/features/nfts/types'

/**
 * Filters an NFT item based on a search query.
 * The search is case-insensitive and matches against:
 * - NFT name
 * - Collection name
 * - Token ID
 * - Contract address
 *
 * @param item - The NFT item to filter
 * @param searchQuery - The search query (will be converted to lowercase)
 * @returns true if the item matches the search query, false otherwise
 */
export function filterNft(item: NFTItem, searchQuery: string): boolean {
  if (!searchQuery.trim()) {
    return true
  }

  const lowercaseSearch = searchQuery.trim().toLowerCase()
  const name = item.name?.toLowerCase() ?? ''
  const collectionName = item.collectionName?.toLowerCase() ?? ''
  const tokenId = item.tokenId?.toLowerCase() ?? ''
  const contract = item.contractAddress?.toLowerCase() ?? ''

  return (
    name.includes(lowercaseSearch) ||
    collectionName.includes(lowercaseSearch) ||
    tokenId.includes(lowercaseSearch) ||
    contract.includes(lowercaseSearch)
  )
}
