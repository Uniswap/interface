import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'

import { Details } from '../../components/details/Details'
import { fetchSingleAsset } from '../../queries'
import { CollectionInfoForAsset, GenieAsset } from '../../types'

const Asset = () => {
  const { tokenId = '', contractAddress = '' } = useParams()

  const { data } = useQuery(['assetDetail', contractAddress, tokenId], () =>
    fetchSingleAsset({ contractAddress, tokenId })
  )

  let asset = {} as GenieAsset
  let collection = {} as CollectionInfoForAsset

  if (data) {
    asset = data[0] || {}
    collection = data[1] || {}
  }

  return (
    <div>
      {' '}
      <Details
        contractAddress={contractAddress}
        tokenId={tokenId}
        tokenType={asset.tokenType}
        blockchain="Ethereum"
        metadataUrl={asset.externalLink}
        totalSupply={collection.totalSupply}
      />
    </div>
  )
}

export default Asset
