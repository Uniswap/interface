import { CollectionInfoForAsset, GenieAsset } from 'nft/types'

import { DataPage } from './DataPage'
import { LandingPage } from './LandingPage'

interface NftDetailsProps {
  asset: GenieAsset
  collection: CollectionInfoForAsset
}

export const NftDetails = ({ asset, collection }: NftDetailsProps) => {
  return (
    <>
      <LandingPage asset={asset} collection={collection} />
      <DataPage asset={asset} />
    </>
  )
}
