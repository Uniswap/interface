import { buttonHoverState } from 'components/Common'
import { getTotalEthValue } from 'nft/components/bag/profile/utils'
import { useSellAsset } from 'nft/hooks'
import { Listing, WalletAsset } from 'nft/types'
import { formatUsdPrice } from 'nft/utils/currency'
import { fetchPrice } from 'nft/utils/fetchPrice'
import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const FloatingBannerGradientContainer = styled.div`
  position: fixed;
  display: flex;
  justify-content: center;
  bottom: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, #000000 100%);
  width: calc(100% - 360px);
  left: calc((100% - 360px) / 2);
  transform: translateX(-50%);
  padding-top: 48px;
  padding-bottom: 48px;
`

const FloatingBannerContainer = styled.div`
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px;
  display: flex;
  width: 900px;
  justify-content: space-between;
  align-items: center;
  padding: 24px 48px;
`

const Content = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`

const ListButton = styled.button`
  position: relative;
  background-color: ${({ theme }) => theme.accentAction};
  color: ${({ theme }) => theme.white};
  border: none;
  font-weight: 500;
  border-radius: 12px;
  padding: 10px 12px;
  text-align: center;
  font-size: 16px;

  ${buttonHoverState}

  &:disabled {
    opacity: 0.3;
  }
`

export const FloatingBanner = () => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const totalEthListingValue = useMemo(() => getTotalEthValue(sellAssets), [sellAssets])
  const [ethConversion, setEthConversion] = useState(3000)

  useEffect(() => {
    fetchPrice().then((price) => {
      setEthConversion(price ?? 0)
    })
  }, [])

  const listingsMissingPrice = useMemo(() => {
    const listingsMissingPrice: [WalletAsset, Listing][] = []

    for (const asset of sellAssets) {
      if (asset.newListings) {
        for (const listing of asset.newListings) {
          if (!listing.price) listingsMissingPrice.push([asset, listing])
        }
      }
    }

    return listingsMissingPrice.length > 0
  }, [sellAssets])

  return (
    <FloatingBannerGradientContainer>
      <FloatingBannerContainer>
        <ThemedText.HeadlineSmall fontWeight={500}>Proceeds if sold</ThemedText.HeadlineSmall>
        <Content>
          <ThemedText.HeadlineSmall
            color={totalEthListingValue === 0 ? 'textSecondary' : 'textPrimary'}
            fontWeight={500}
          >
            {' '}
            {totalEthListingValue === 0 ? '-' : totalEthListingValue} ETH
          </ThemedText.HeadlineSmall>
          {totalEthListingValue !== 0 && (
            <ThemedText.HeadlineSmall color="textSecondary" fontWeight={500}>
              {formatUsdPrice(totalEthListingValue * ethConversion)}
            </ThemedText.HeadlineSmall>
          )}
          <ListButton disabled={listingsMissingPrice} onClick={() => true}>
            {listingsMissingPrice ? 'Set prices to continue' : 'Start listing'}
          </ListButton>
        </Content>
      </FloatingBannerContainer>
    </FloatingBannerGradientContainer>
  )
}
