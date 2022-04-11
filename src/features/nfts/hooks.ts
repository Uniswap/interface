import { nftApi } from 'src/features/nfts/api'
import { NFTAsset } from 'src/features/nfts/types'

export function useNFT(
  owner: Address = '',
  address?: Address,
  tokenId?: string
): { asset?: NFTAsset.Asset } {
  return nftApi.useNftBalancesQuery(
    { owner },
    {
      selectFromResult: ({ data }) =>
        address && tokenId
          ? {
              asset: data?.[address]?.find((asset) => asset.token_id === tokenId),
            }
          : {},
    }
  )
}
