import { PageName } from 'analytics/constants'
import { Trace } from 'analytics/Trace'
import { NftGraphQlVariant, useNftGraphQlFlag } from 'featureFlags/flags/nftGraphQl'
import { useDetailsQuery } from 'graphql/data/nft/Details'
import { AssetDetails } from 'nft/components/details/AssetDetails'
import { AssetPriceDetails } from 'nft/components/details/AssetPriceDetails'
import { fetchSingleAsset } from 'nft/queries'
import { CollectionStatsFetcher } from 'nft/queries'
import { useMemo } from 'react'
import { useQuery } from 'react-query'
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
  const isNftGraphQl = useNftGraphQlFlag() === NftGraphQlVariant.Enabled

  const { data } = useQuery(
    ['assetDetail', contractAddress, tokenId],
    () => fetchSingleAsset({ contractAddress, tokenId }),
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )
  const gqlData = useDetailsQuery(contractAddress, tokenId)

  const asset = useMemo(() => (isNftGraphQl ? gqlData && gqlData[0] : data && data[0]), [data, gqlData, isNftGraphQl])
  const collection = useMemo(
    () => (isNftGraphQl ? gqlData && gqlData[1] : data && data[1]),
    [data, gqlData, isNftGraphQl]
  )

  const { data: collectionStats } = useQuery(['collectionStats', contractAddress], () =>
    CollectionStatsFetcher(contractAddress)
  )

  return (
    <>
      <Trace
        page={PageName.NFT_DETAILS_PAGE}
        properties={{ collection_address: contractAddress, token_id: tokenId }}
        shouldLogImpression
      >
        {asset && collection ? (
          <AssetContainer>
            <AssetDetails collection={collection} asset={asset} collectionStats={collectionStats} />
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
