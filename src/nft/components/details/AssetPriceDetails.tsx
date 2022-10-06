import { CancelListingIcon } from 'nft/components/icons'
import { useBag } from 'nft/hooks'
import { CollectionInfoForAsset, GenieAsset } from 'nft/types'
import { ethNumberStandardFormatter, formatEthPrice, getMarketplaceIcon, timeLeft } from 'nft/utils'
import { useMemo } from 'react'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

interface AssetPriceDetailsProps {
  asset: GenieAsset
  collection: CollectionInfoForAsset
}

const Container = styled.div`
  margin-left: 86px;
`

const BestPriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
  width: 320px;
`

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
`

const PriceRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
`

const MarketplaceIcon = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-top: auto;
  margin-bottom: auto;
`

const BuyNowButton = styled.div<{ assetInBag: boolean }>`
  width: 100%;
  background-color: ${({ theme, assetInBag }) => (assetInBag ? theme.accentFailure : theme.accentAction)};
  border-radius: 12px;
  padding: 10px 12px;
  margin-top: 12px;
  text-align: center;
  cursor: pointer;
`

const NotForSaleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 48px 18px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`

const DiscoveryContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

export const AssetPriceDetails = ({ asset, collection }: AssetPriceDetailsProps) => {
  const theme = useTheme()
  const cheapestOrder = asset.sellorders && asset.sellorders.length > 0 ? asset.sellorders[0] : undefined
  const expirationDate = cheapestOrder ? new Date(cheapestOrder.orderClosingDate) : undefined
  const itemsInBag = useBag((s) => s.itemsInBag)
  const addAssetToBag = useBag((s) => s.addAssetToBag)
  const removeAssetFromBag = useBag((s) => s.removeAssetFromBag)

  const assetInBag = useMemo(() => {
    return itemsInBag.some((item) => item.asset.tokenId === asset.tokenId && item.asset.address === asset.address)
  }, [itemsInBag, asset])

  return (
    <Container>
      {cheapestOrder && asset.priceInfo ? (
        <BestPriceContainer>
          <HeaderRow>
            <ThemedText.SubHeader fontWeight={500} lineHeight={'24px'}>
              BestPrice
            </ThemedText.SubHeader>
            <MarketplaceIcon alt={cheapestOrder.marketplace} src={getMarketplaceIcon(cheapestOrder.marketplace)} />
          </HeaderRow>
          <PriceRow>
            <ThemedText.MediumHeader fontSize={'28px'} lineHeight={'36px'}>
              {formatEthPrice(asset.priceInfo.ETHPrice)}
            </ThemedText.MediumHeader>
            <ThemedText.BodySecondary lineHeight={'24px'}>
              {ethNumberStandardFormatter(asset.priceInfo.USDPrice, true, true)}
            </ThemedText.BodySecondary>
          </PriceRow>
          {expirationDate && (
            <ThemedText.BodySecondary fontSize={'14px'}>Sale ends: {timeLeft(expirationDate)}</ThemedText.BodySecondary>
          )}
          <BuyNowButton
            assetInBag={assetInBag}
            onClick={() => (assetInBag ? removeAssetFromBag(asset) : addAssetToBag(asset))}
          >
            <ThemedText.SubHeader lineHeight={'20px'}>{assetInBag ? 'Remove' : 'Buy Now'}</ThemedText.SubHeader>
          </BuyNowButton>
        </BestPriceContainer>
      ) : (
        <BestPriceContainer>
          <NotForSaleContainer>
            <CancelListingIcon width="79px" height="79px" color={theme.textTertiary} />
            <ThemedText.SubHeader fontWeight={500} lineHeight="24px">
              Not for sale
            </ThemedText.SubHeader>
            <DiscoveryContainer>
              <ThemedText.BodySecondary fontSize="14px" lineHeight="20px">
                Discover similar NFTs for sale in
              </ThemedText.BodySecondary>
              <ThemedText.Link lineHeight="20px">{collection.collectionName}</ThemedText.Link>
            </DiscoveryContainer>
          </NotForSaleContainer>
        </BestPriceContainer>
      )}
    </Container>
  )
}
