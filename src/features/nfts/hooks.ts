import { nftApi } from 'src/features/nfts/api'
import { NFTAsset } from 'src/features/nfts/types'
import { getChecksumAddress } from 'src/utils/addresses'

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

        const asset = data?.[getChecksumAddress(address)]?.find((a) => a.token_id === tokenId)
        return { asset }
      },
      refetchOnMountOrArgChange: true,
    }
  )
}
