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
      selectFromResult: ({ data }) => {
        if (!address || !tokenId) return {}

        const asset = data?.[address]?.find((a) => a.token_id === tokenId)
        return { asset }
      },
      refetchOnMountOrArgChange: true,
    }
  )
}
