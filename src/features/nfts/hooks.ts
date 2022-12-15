import { useMemo } from 'react'
import { PollingInterval } from 'src/constants/misc'
import { NftsQuery, useNftsQuery } from 'src/data/__generated__/types-and-hooks'
import { GqlResult } from 'src/features/dataApi/types'

export type GQLNftAsset = NonNullable<
  NonNullable<NonNullable<NonNullable<NftsQuery['portfolios']>[0]>['nftBalances']>[0]
>['ownedAsset']

// TODO(MOB-3390): deprecate this hook in favor of component queries
export function useNFT(
  owner: Address = '',
  address?: Address,
  tokenId?: string
): GqlResult<GQLNftAsset> {
  // TODO: [MOB-3893] do a direct cache lookup in Apollo using id instead of re-querying
  const { data, loading, refetch } = useNftsQuery({
    variables: { ownerAddress: owner },
    pollInterval: PollingInterval.Slow,
  })

  const nft = useMemo(
    () =>
      data?.portfolios?.[0]?.nftBalances?.find(
        (balance) =>
          balance?.ownedAsset?.nftContract?.address === address &&
          balance?.ownedAsset?.tokenId === tokenId
      )?.ownedAsset ?? undefined,
    [data, address, tokenId]
  )

  return { data: nft, loading, refetch }
}
