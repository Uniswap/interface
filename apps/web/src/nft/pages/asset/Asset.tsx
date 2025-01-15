import { InterfacePageName } from '@uniswap/analytics-events'
import { useNftAssetDetails } from 'graphql/data/nft/Details'
import styled from 'lib/styled-components'
import { AssetDetails } from 'nft/components/details/AssetDetails'
import { AssetDetailsLoading } from 'nft/components/details/AssetDetailsLoading'
import { AssetPriceDetails } from 'nft/components/details/AssetPriceDetails'
import { useDynamicBlocklistedNftCollections } from 'nft/utils'
import { useDynamicMetatags } from 'pages/metatags'
import { useMemo } from 'react'
import { Helmet } from 'react-helmet-async/lib/index'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router-dom'
import { formatNFTAssetMetatagTitleName } from 'shared-cloud/metatags'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isIFramed } from 'utils/isIFramed'

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
  const { t } = useTranslation()
  const { tokenId = '', contractAddress = '' } = useParams()
  const { data, loading } = useNftAssetDetails(contractAddress, tokenId)

  const [asset, collection] = data

  const metaTagProperties = useMemo(
    () => ({
      title: formatNFTAssetMetatagTitleName(asset.name, collection.collectionName, tokenId),
      image: window.location.origin + '/api/image/nfts/asset/' + contractAddress + '/' + tokenId,
      url: window.location.href,
      description:
        collection.collectionDescription ??
        'View traits, trading activity, descriptions, and other details on your NFTs.',
    }),
    [asset.name, collection.collectionDescription, collection.collectionName, contractAddress, tokenId],
  )
  const metaTags = useDynamicMetatags(metaTagProperties)
  const blocklistedCollections = useDynamicBlocklistedNftCollections()
  // Don't allow iFraming of this page. isIFramed(true) busts out of the iFrame by redirecting main page to current iFrame url
  // https://www.notion.so/uniswaplabs/What-is-not-allowed-to-be-iFramed-Clickjacking-protections-874f85f066c648afa0eb3480b3f47b5c#d0ebf1846c83475a86342a594f77eae5
  if (blocklistedCollections.includes(contractAddress) || isIFramed(true)) {
    return <Navigate to="/nfts" replace />
  }

  if (loading) {
    return <AssetDetailsLoading />
  }
  return (
    <>
      <Helmet>
        <title>
          {asset.name ?? ''} {asset.name ? '|' : ''} {collection.collectionName ?? t('nft.explore')} on Uniswap
        </title>
        {metaTags.map((tag, index) => (
          <meta key={index} {...tag} />
        ))}
        <meta name="robots" content="max-image-preview:large" />
      </Helmet>
      <Trace
        logImpression
        page={InterfacePageName.NFT_DETAILS_PAGE}
        properties={{ collection_address: contractAddress, token_id: tokenId }}
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
