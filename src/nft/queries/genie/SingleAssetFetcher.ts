import { CollectionInfoForAsset, GenieAsset } from '../../types'

export const fetchSingleAsset = async ({
  contractAddress,
  tokenId,
}: {
  contractAddress: string
  tokenId?: string
}): Promise<[GenieAsset, CollectionInfoForAsset]> => {
  const url = `${process.env.REACT_APP_GENIE_API_URL}/assetDetails?address=${contractAddress}&tokenId=${tokenId}`
  const r = await fetch(url)
  const data = await r.json()
  return [data.asset[0], data.collection]
}
