import { GraphQLApi } from '@universe/api'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { EMPTY_NFT_ITEM, HIDDEN_NFTS_ROW } from 'uniswap/src/features/nfts/constants'
import { NFTItem } from 'uniswap/src/features/nfts/types'
import { NFTKeyToVisibility } from 'uniswap/src/features/visibility/slice'

export function formatNftItems(data: GraphQLApi.NftsTabQuery | undefined): NFTItem[] | undefined {
  const items = data?.nftBalances?.edges.flatMap((item) => item.node)
  if (!items) {
    return undefined
  }

  const nfts = items
    .filter((item) => item.ownedAsset?.nftContract?.address && item.ownedAsset.tokenId)
    .map((item): NFTItem => {
      return {
        name: item.ownedAsset?.name ?? undefined,
        description: item.ownedAsset?.description ?? undefined,
        contractAddress: item.ownedAsset?.nftContract?.address ?? undefined,
        tokenId: item.ownedAsset?.tokenId ?? undefined,
        imageUrl: item.ownedAsset?.image?.url ?? undefined,
        thumbnailUrl: item.ownedAsset?.thumbnail?.url ?? undefined,
        collectionName: item.ownedAsset?.collection?.name ?? undefined,
        isVerifiedCollection: item.ownedAsset?.collection?.isVerified ?? undefined,
        floorPrice: item.ownedAsset?.collection?.markets?.[0]?.floorPrice?.value ?? undefined,
        isSpam: item.ownedAsset?.isSpam ?? undefined,
        imageDimensions:
          item.ownedAsset?.image?.dimensions?.height && item.ownedAsset.image.dimensions.width
            ? {
                width: item.ownedAsset.image.dimensions.width,
                height: item.ownedAsset.image.dimensions.height,
              }
            : undefined,
        chain: item.ownedAsset?.chain,
      }
    })
  return nfts
}

export const getNFTAssetKey = (address: Address, token_id: string): string => {
  // Backend returns both checksummed and non-checksummed addresses
  // so we need to normalize it to be able to compare them
  return `nftItem.${normalizeTokenAddressForCache(address)}.${token_id}`
}

export const getIsNftHidden = ({
  contractAddress,
  tokenId,
  isSpam,
  nftVisibility,
}: {
  contractAddress?: string
  tokenId?: string
  isSpam?: boolean
  nftVisibility: NFTKeyToVisibility
}): boolean => {
  if (!contractAddress || !tokenId) {
    return true
  }
  const nftKey = getNFTAssetKey(contractAddress, tokenId)
  const nftIsVisible = nftVisibility[nftKey]?.isVisible ?? isSpam === false
  return !nftIsVisible
}

/**
 * Builds the nfts array structure from shown and hidden NFT arrays.
 * This matches the pattern used in useGroupNftsByVisibility.
 *
 * @param shownNfts - Array of shown NFT items
 * @param hiddenNfts - Array of hidden NFT items
 * @param showHidden - Whether hidden NFTs should be included in the result
 * @param allPagesFetched - Whether all pages have been fetched (affects special string insertion)
 * @returns Array containing NFTItems and special strings (EMPTY_NFT_ITEM, HIDDEN_NFTS_ROW)
 */
export function buildNftsArray({
  shownNfts,
  hiddenNfts,
  showHidden,
  allPagesFetched,
}: {
  shownNfts: NFTItem[]
  hiddenNfts: NFTItem[]
  showHidden: boolean
  allPagesFetched: boolean
}): Array<NFTItem | string> {
  return [
    ...shownNfts,
    ...(hiddenNfts.length && allPagesFetched
      ? [
          // to fill the gap for odd number of shown elements in 2 columns layout
          ...(shownNfts.length % 2 ? [EMPTY_NFT_ITEM] : []),
          HIDDEN_NFTS_ROW,
        ]
      : []),
    ...(showHidden && allPagesFetched ? hiddenNfts : []),
  ]
}

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
export function filterNft(item: NFTItem, searchQuery?: string): boolean {
  if (!searchQuery?.trim()) {
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
