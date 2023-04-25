import { CollectionInfoForAsset, GenieAsset } from 'nft/types'
import styled from 'styled-components/macro'

import { DataPage } from './DataPage'

interface NftDetailsProps {
  asset: GenieAsset
  collection: CollectionInfoForAsset
}

const LandingPage = styled.div`
  height: 100vh;
`

export const NftDetails = ({ asset, collection }: NftDetailsProps) => {
  return (
    <>
      <LandingPage>
        Details page for {asset.name} from {collection.collectionName}
      </LandingPage>
      <DataPage />
    </>
  )
}
