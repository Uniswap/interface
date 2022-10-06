import { AssetDetails } from 'nft/components/details/AssetDetails'
import { AssetPriceDetails } from 'nft/components/details/AssetPriceDetails'
import { useParams } from 'react-router-dom'
import styled from 'styled-components/macro'

const AssetContainer = styled.div`
  display: flex;
  padding-right: 116px;
  padding-left: 116px;
`

const Asset = () => {
  const { tokenId = '', contractAddress = '' } = useParams()

  return (
    <AssetContainer>
      <AssetDetails tokenId={tokenId} contractAddress={contractAddress} />
      <AssetPriceDetails />
    </AssetContainer>
  )
}

export default Asset
