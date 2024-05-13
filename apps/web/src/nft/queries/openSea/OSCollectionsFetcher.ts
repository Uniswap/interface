import { infiniteQueryOptions } from '@tanstack/react-query'
import { RefetchInterval } from 'constants/query'
import { WALLET_COLLECTIONS_PAGINATION_LIMIT } from 'nft/components/profile/view/ProfilePage'
import { WalletCollection } from '../../types'

export function getOSCollectionsInfiniteQueryOptions(address: string) {
  return infiniteQueryOptions({
    queryKey: ['ownerCollections', { address }],
    queryFn: async ({ pageParam }) => {
      const params = {
        asset_owner: address,
        offset: `${pageParam * WALLET_COLLECTIONS_PAGINATION_LIMIT}`,
        limit: `${WALLET_COLLECTIONS_PAGINATION_LIMIT}`,
      }

      const res = await OSCollectionsFetcher(params)

      return {
        data: res,
        nextPage: pageParam + 1,
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastGroup) => (lastGroup.data.length === 0 ? undefined : lastGroup.nextPage),
    refetchInterval: RefetchInterval.MEDIUM,
  })
}

const OSCollectionsFetcher = async ({ params }: any): Promise<WalletCollection[]> => {
  let hasEmptyFields = false

  for (const v of Object.values(params)) {
    if (v === undefined) {
      hasEmptyFields = true
    }
  }
  if (hasEmptyFields) return []

  const r = await fetch(`https://api.opensea.io/api/v1/collections?${new URLSearchParams(params).toString()}`)
  const walletCollections = await r.json()
  if (walletCollections) {
    return walletCollections
      .filter((collection: any) => collection.primary_asset_contracts.length)
      .map((collection: any) => ({
        address: collection.primary_asset_contracts[0].address,
        name: collection.name,
        image: collection.image_url,
        count: collection.owned_asset_count,
      }))
  } else {
    return []
  }
}
