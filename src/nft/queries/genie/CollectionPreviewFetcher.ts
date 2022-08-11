export const CollectionPreviewFetcher = async (
  address: string
): Promise<
  [
    {
      name: string
      bannerImageUrl?: string
    }
  ]
> => {
  const url = `${process.env.REACT_APP_GENIE_API_URL}/collectionPreview?address=${address}`

  const controller = new AbortController()

  const timeoutId = setTimeout(() => controller.abort(), 3000)

  const r = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  clearInterval(timeoutId)
  const data = await r.json()

  return [
    {
      name: data.data.collectionName,
      bannerImageUrl: data.data.bannerImageUrl,
    },
  ]
}
