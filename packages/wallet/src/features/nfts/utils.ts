import { NftsTabQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NFTKeyToVisibility } from 'uniswap/src/features/favorites/slice'
import { NFTItem } from 'wallet/src/features/nfts/types'

export function formatNftItems(data: NftsTabQuery | undefined): NFTItem[] | undefined {
  const items = data?.nftBalances?.edges?.flatMap((item) => item.node)
  if (!items) {
    return undefined
  }

  const nfts = items
    .filter((item) => item?.ownedAsset?.nftContract?.address && item?.ownedAsset?.tokenId)
    .map((item): NFTItem => {
      return {
        name: item?.ownedAsset?.name ?? undefined,
        description: item?.ownedAsset?.description ?? undefined,
        contractAddress: item?.ownedAsset?.nftContract?.address ?? undefined,
        tokenId: item?.ownedAsset?.tokenId ?? undefined,
        imageUrl: item?.ownedAsset?.image?.url ?? undefined,
        thumbnailUrl: item?.ownedAsset?.thumbnail?.url ?? undefined,
        collectionName: item?.ownedAsset?.collection?.name ?? undefined,
        isVerifiedCollection: item?.ownedAsset?.collection?.isVerified ?? undefined,
        floorPrice: item?.ownedAsset?.collection?.markets?.[0]?.floorPrice?.value ?? undefined,
        isSpam: item?.ownedAsset?.isSpam ?? undefined,
        imageDimensions:
          item?.ownedAsset?.image?.dimensions?.height && item?.ownedAsset?.image?.dimensions?.width
            ? {
                width: item?.ownedAsset?.image.dimensions.width,
                height: item?.ownedAsset?.image.dimensions.height,
              }
            : undefined,
        chain: item?.ownedAsset?.chain,
      }
    })
  return nfts
}

export const getNFTAssetKey = (address: Address, token_id: string): string => {
  // Backend returns both checksummed and non-checksummed addresses
  // so we need to lowercase it to be able to compare them
  return `nftItem.${address.toLowerCase()}.${token_id}`
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
