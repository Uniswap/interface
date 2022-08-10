import { WalletCollection } from '../../types'

export const OSCollectionsFetcher = async ({ params }: any): Promise<WalletCollection[]> => {
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
      .filter(
        (collection: any) =>
          collection.primary_asset_contracts.length && collection.primary_asset_contracts[0].schema_name === 'ERC721'
      )
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
