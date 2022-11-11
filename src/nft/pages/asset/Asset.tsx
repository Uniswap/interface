import { Trace } from '@uniswap/analytics'
import { PageName } from '@uniswap/analytics-events'
import { useDetailsQuery } from 'graphql/data/nft/Details'
import { AssetDetails } from 'nft/components/details/AssetDetails'
import { AssetPriceDetails } from 'nft/components/details/AssetPriceDetails'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components/macro'

const AssetContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  gap: 60px;
  padding: 48px 48px 0 48px;

  @media (max-width: 960px) {
    padding: 40px 40px 0 40px;
  }
  @media (max-width: 540px) {
    padding: 20px 20px 0 20px;
  }
  @media (max-width: 420px) {
    padding: 16px 16px 0 16px;
  }
`

const AssetPriceDetailsContainer = styled.div`
  min-width: 360px;
  position: relative;
  padding-right: 100px;

  @media (max-width: 960px) {
    display: none;
  }
`

const Asset = () => {
  const { tokenId = '', contractAddress = '' } = useParams()
  const data = useDetailsQuery(contractAddress, tokenId)

  const [asset, collection] = useMemo(() => data ?? [], [data])

  return (
    <>
      <Trace
        page={PageName.NFT_DETAILS_PAGE}
        properties={{ collection_address: contractAddress, token_id: tokenId }}
        shouldLogImpression
      >
        {asset && collection ? (
          <AssetContainer>
            <AssetDetails collection={collection} asset={asset} />
            <AssetPriceDetailsContainer>
              <AssetPriceDetails collection={collection} asset={asset} />
            </AssetPriceDetailsContainer>
          </AssetContainer>
        ) : (
          <div>Holder for loading ...</div>
        )}
      </Trace>
    </>
  )
}

export default Asset
