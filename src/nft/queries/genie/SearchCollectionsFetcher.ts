import { isAddress } from '@ethersproject/address'
import { blocklistedCollections } from 'nft/utils'

import { GenieCollection } from '../../types'

const MAX_SEARCH_RESULTS = 6

const NFT_API_URL = process.env.REACT_APP_TEMP_API_URL
export const fetchSearchCollections = async (addressOrName: string, recursive = false): Promise<GenieCollection[]> => {
  if (!NFT_API_URL) return Promise.resolve([])
  const url = `${NFT_API_URL}/nft/searchCollections`
  const isName = !isAddress(addressOrName.toLowerCase())

  if (!isName && !recursive) {
    try {
      return await fetchSearchCollections(addressOrName.toLowerCase(), true)
    } catch {
      return []
    }
  }

  const filters = isName
    ? {
        $or: [{ name: { $regex: addressOrName, $options: 'i' } }],
      }
    : { address: addressOrName }

  const payload = {
    filters,
    limit: 6,
    fields: {
      name: 1,
      imageUrl: 1,
      address: 1,
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
  if (isName) {
    const data = await r.json()
    const formattedData = data?.data
      ? data.data
          .filter((collection: { address: string }) => !blocklistedCollections.includes(collection.address))
          .map((collection: { stats: Record<string, unknown>; floorPrice: string }) => {
            return {
              ...collection,
              stats: {
                ...collection.stats,
                floor_price: collection.floorPrice,
              },
            }
          })
      : []
    return formattedData.slice(0, MAX_SEARCH_RESULTS)
  }
  const data = await r.json()

  return data.data ? [{ ...data.data[0], stats: { ...data.data[0].stats, floor_price: data.data[0].floorPrice } }] : []
}
