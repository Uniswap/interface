import { AssetDetails } from 'nft/components/details/AssetDetails'
import { AssetPriceDetails } from 'nft/components/details/AssetPriceDetails'
import { fetchSingleAsset } from 'nft/queries'
import { useMemo } from 'react'
import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'
import styled from 'styled-components/macro'

const AssetContainer = styled.div`
  display: flex;
  padding-right: 116px;
  padding-left: 116px;
`

const Asset = () => {
  const { tokenId = '', contractAddress = '' } = useParams()
  const { data } = useQuery(
    ['assetDetail', contractAddress, tokenId],
    () => fetchSingleAsset({ contractAddress, tokenId }),
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )

  const asset = useMemo(() => (data ? data[0] : undefined), [data])
  const collection = useMemo(() => (data ? data[1] : undefined), [data])

  return (
    <>
      {asset && collection ? (
        <AssetContainer>
          <AssetDetails collection={collection} asset={asset} />
          <AssetPriceDetails collection={collection} asset={asset} />
        </AssetContainer>
      ) : (
        <div>Holder for loading ...</div>
      )}
    </>
  )
}

export default Asset
