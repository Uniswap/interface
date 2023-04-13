import { CollectionInfoForAsset, GenieAsset } from 'nft/types'

interface NftDetailsProps {
  asset: GenieAsset
  collection: CollectionInfoForAsset
}

// eslint-disable-next-line import/no-unused-modules
export const NftDetails = ({ asset, collection }: NftDetailsProps) => {
  return (
    <div>
      Details page for {asset.name} from {collection.collectionName}
    </div>
  )
}
