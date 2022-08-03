import { GenieCollection } from '../../types'

export const fetchMultipleCollectionStats = async ({
  addresses,
}: {
  addresses: string[]
}): Promise<GenieCollection[]> => {
  const url = `${process.env.REACT_APP_GENIE_API_URL}/searchCollections`
  const filters = {
    address: { $in: addresses },
  }
  const payload = {
    filters,
    fields: {
      stats: 1,
      imageUrl: 1,
      address: 1,
      name: 1,
    },
  }

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  return data.data
}
