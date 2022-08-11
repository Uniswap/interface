import { isAddress } from '@ethersproject/address'

import { GenieCollection } from '../../types'

export const fetchSearchCollections = async (addressOrName: string, recursive = false): Promise<GenieCollection[]> => {
  const url = `${process.env.REACT_APP_GENIE_V3_API_URL}/searchCollections`
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
    const data = (await r.json()) as { data: GenieCollection[] }
    return data?.data ? data.data.slice(0, 6) : []
  }
  const data = await r.json()

  return data.data ? [data.data[0]] : []
}
