import { AssetDetails } from 'nft/components/details/AssetDetails'
import { Row } from 'nft/components/Flex'
import { useParams } from 'react-router-dom'

const Asset = () => {
  const { tokenId = '', contractAddress = '' } = useParams()

  return (
    <Row>
      <AssetDetails tokenId={tokenId} contractAddress={contractAddress} />
    </Row>
  )
}

export default Asset
