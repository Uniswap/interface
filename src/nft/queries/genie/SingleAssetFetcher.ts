import { CollectionInfoForAsset, GenieAsset } from '../../types'

interface ReponseTrait {
  trait_type: string
  value: string
}

export const fetchSingleAsset = async ({
  contractAddress,
  tokenId,
}: {
  contractAddress: string
  tokenId?: string
}): Promise<[GenieAsset, CollectionInfoForAsset]> => {
  const url = `${process.env.REACT_APP_GENIE_V3_API_URL}/assetDetails?address=${contractAddress}&tokenId=${tokenId}`
  const r = await fetch(url)
  const data = await r.json()
  const asset = data.asset[0]

  asset.traits = asset.traits.map((trait: ReponseTrait) => ({ trait_type: trait.trait_type, trait_value: trait.value }))

  return [asset, data.collection]
}
