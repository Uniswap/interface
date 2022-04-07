import { nftApi } from 'src/features/nfts/api'

export function useNFT(owner: Address, nftAddress: string, tokenId: string) {
  return nftApi.useNftBalancesQuery(
    { owner },
    {
      selectFromResult: ({ data }) => ({
        asset: data?.[nftAddress]?.find((asset) => asset.token_id === tokenId),
      }),
    }
  )
}
