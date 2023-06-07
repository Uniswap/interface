import { Trace } from '@uniswap/analytics'
import { InterfacePageName } from '@uniswap/analytics-events'
import { useDetailsV2Enabled } from 'featureFlags/flags/nftDetails'
import { useNftAssetDetails } from 'graphql/data/nft/Details'
import { AssetDetails } from 'nft/components/details/AssetDetails'
import { AssetDetailsLoading } from 'nft/components/details/AssetDetailsLoading'
import { AssetPriceDetails } from 'nft/components/details/AssetPriceDetails'
import { NftDetails } from 'nft/components/details/detailsV2/NftDetails'
import { Helmet } from 'react-helmet-async'
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

  @media (max-width: 960px) {
    display: none;
  }
`

const AssetPage = () => {
  const { tokenId = '', contractAddress = '' } = useParams()
  const { data, loading } = useNftAssetDetails(contractAddress, tokenId)
  const detailsV2Enabled = useDetailsV2Enabled()

  const [asset, collection] = data

  const collectionDescription =
    (collection && collection?.collectionDescription?.length && collection?.collectionDescription?.length > 150
      ? collection?.collectionDescription?.substring(0, 150) + '...'
      : collection?.collectionDescription + '...') || ''

  if (loading && !detailsV2Enabled) return <AssetDetailsLoading />
  return (
    <>
      <Helmet prioritizeSeoTags>
        <title>{asset?.name} on Uniswap</title>
        <meta property="og:image" content={asset?.imageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="600" />
        <meta property="og:title" content={asset?.name} />
        <meta property="og:description" content={collectionDescription} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={asset?.imageUrl} />
      </Helmet>
      <Trace
        page={InterfacePageName.NFT_DETAILS_PAGE}
        properties={{ collection_address: contractAddress, token_id: tokenId }}
        shouldLogImpression
      >
        {!!asset && !!collection ? (
          detailsV2Enabled ? (
            <NftDetails asset={asset} collection={collection} />
          ) : (
            <AssetContainer>
              <AssetDetails collection={collection} asset={asset} />
              <AssetPriceDetailsContainer>
                <AssetPriceDetails collection={collection} asset={asset} />
              </AssetPriceDetailsContainer>
            </AssetContainer>
          )
        ) : null}
      </Trace>
    </>
  )
}

export default AssetPage
