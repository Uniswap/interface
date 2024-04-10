import { t } from '@lingui/macro'
import { InterfacePageName } from '@uniswap/analytics-events'
import { Trace } from 'analytics'
import { useNftAssetDetails } from 'graphql/data/nft/Details'
import { AssetDetails } from 'nft/components/details/AssetDetails'
import { AssetDetailsLoading } from 'nft/components/details/AssetDetailsLoading'
import { AssetPriceDetails } from 'nft/components/details/AssetPriceDetails'
import { blocklistedCollections } from 'nft/utils'
import { Helmet } from 'react-helmet-async/lib/index'
import { Navigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

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

  @media (max-width: 960px) {
    display: none;
  }
`

const AssetPage = () => {
  const { tokenId = '', contractAddress = '' } = useParams()
  const { data, loading } = useNftAssetDetails(contractAddress, tokenId)

  const [asset, collection] = data

  if (blocklistedCollections.includes(contractAddress)) {
    return <Navigate to="/nfts" replace />
  }

  if (loading) return <AssetDetailsLoading />
  return (
    <>
      <Helmet>
        <title>
          {asset.name ?? ''} {asset.name ? '|' : ''} {collection.collectionName ?? t`Explore NFTs`} on Uniswap
        </title>
      </Helmet>
      <Trace
        page={InterfacePageName.NFT_DETAILS_PAGE}
        properties={{ collection_address: contractAddress, token_id: tokenId }}
        shouldLogImpression
      >
        {!!asset && !!collection ? (
          <AssetContainer>
            <AssetDetails collection={collection} asset={asset} />
            <AssetPriceDetailsContainer>
              <AssetPriceDetails collection={collection} asset={asset} />
            </AssetPriceDetailsContainer>
          </AssetContainer>
        ) : null}
      </Trace>
    </>
  )
}

export default AssetPage
