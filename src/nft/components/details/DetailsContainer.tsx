import { CollectionInfoForAsset, GenieAsset, Trait } from 'nft/types'
import styled from 'styled-components/macro'
import { shortenAddress } from 'nft/utils/address'

const Details = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-gap: 40px;
`

const Header = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 600;
  font-size: 10px;
  line-height: 12px;
`

const Body = styled.div`
  color: ${({ theme }) => theme.textPrimary};
  font-size: 14px;
  line-height: 20px;
  margin-top: 8px;
`

const GridItem = ({ header, body }: { header: string; body: string }) => {
  return (
    <div>
      <Header>{header}</Header>
      <Body>{body}</Body>
    </div>
  )
}

const DetailsContainer = ({ asset, collection }: { asset: GenieAsset; collection: CollectionInfoForAsset }) => {
  const { address, tokenId, tokenType } = asset
  const { totalSupply } = collection

  return (
    <Details>
      <GridItem header="Contract Address" body={shortenAddress(address)} />
      <GridItem header="Token ID" body={tokenId} />
      <GridItem header="Token Standard" body={tokenType} />
      <GridItem header="Blockchain" body="Ethereum" />
      <GridItem header="Total Supply" body={`${totalSupply}`} />
    </Details>
  )
}

export default DetailsContainer
