import { nftApi } from 'src/features/nfts/api'

// TODO: key by contract address when available
export function useNFT(owner: Address, openseaSlug: string, tokenId: string) {
  return nftApi.useNftBalancesQuery(
    { owner },
    {
      selectFromResult: ({ data }) => ({
        asset: data?.[openseaSlug].find((asset) => asset.token_id === tokenId),
      }),
    }
  )
}
