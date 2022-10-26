import { isAddress } from '@ethersproject/address'
import { groupBy } from 'nft/utils/groupBy'

import { GenieCollection } from '../../types'

export const CollectionStatsFetcher = async (addressOrName: string, recursive = false): Promise<GenieCollection> => {
  const isName = !isAddress(addressOrName.toLowerCase())
  const url = `${process.env.REACT_APP_GENIE_API_URL}/collections`

  if (!isName && !recursive) {
    try {
      return await CollectionStatsFetcher(addressOrName.toLowerCase(), true)
    } catch {
      // Handle Error
    }
  }

  const filters = isName
    ? {
        $or: [{ name: { $regex: addressOrName, $options: 'i' } }],
      }
    : { address: addressOrName }

  const payload = {
    filters,
    limit: isName ? 6 : 1,
    fields: isName
      ? {
          name: 1,
          imageUrl: 1,
          address: 1,
          stats: 1,
          floorPrice: 1,
        }
      : {
          traits: 1,
          stats: 1,
          'indexingStats.openSea': 1,
          imageUrl: 1,
          bannerImageUrl: 1,
          twitter: 1,
          externalUrl: 1,
          instagram: 1,
          discordUrl: 1,
          marketplaceCount: 1,
          floorPrice: 1,
        },
    offset: 0,
  }
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await r.json()
  // Need to restructure how traits are formatted to match GraphQL before this endpoint is deprecated
  const collections = data?.data
    ? data.data.map((collection: any) => {
        console.log(collection.traits)
        console.log(groupBy(collection.traits, 'trait_type'))
        return {
          ...collection,
          traits: collection.traits && groupBy(collection.traits, 'trait_type'),
        }
      })
    : {}
  return collections[0]
}
