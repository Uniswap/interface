import { useWeb3React } from '@web3-react/core'
import { OpacityHoverState } from 'components/Common'
import { useNftBalanceQuery } from 'graphql/data/nft/NftBalance'
import useCopyClipboard from 'hooks/useCopyClipboard'
import { CancelListingIcon } from 'nft/components/icons'
import { useBag, useProfilePageState, useSellAsset } from 'nft/hooks'
import { CollectionInfoForAsset, GenieAsset, ProfilePageStateType, WalletAsset } from 'nft/types'
import { ethNumberStandardFormatter, formatEthPrice, getMarketplaceIcon, timeLeft, useUsdPrice } from 'nft/utils'
import { shortenAddress } from 'nft/utils/address'
import { useMemo } from 'react'
import { Upload } from 'react-feather'
import { Link, useNavigate } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

interface AssetPriceDetailsProps {
  asset: GenieAsset
  collection: CollectionInfoForAsset
}

const hoverState = css`
  :hover::after {
    border-radius: 12px;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${({ theme }) => theme.stateOverlayHover};
    z-index: 0;
  }

  :active::after {
    border-radius: 12px;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${({ theme }) => theme.stateOverlayPressed};
    z-index: 0;
  }
`

const Container = styled.div`
  width: 100%;

  @media (min-width: 960px) {
    position: fixed;
    width: 360px;
    margin-top: -6px;
  }
`

const BestPriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-radius: 16px;
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

const BuyNowButton = styled.div<{ assetInBag: boolean; margin: boolean; useAccentColor: boolean }>`
  width: 100%;
  background-color: ${({ theme, assetInBag, useAccentColor }) =>
    assetInBag ? theme.accentFailure : useAccentColor ? theme.accentAction : theme.backgroundInteractive};
  border-radius: 12px;
  padding: 10px 12px;
  margin-top: ${({ margin }) => (margin ? '12px' : '0px')};
  text-align: center;
  cursor: pointer;

  ${hoverState}
`

const BuyNowButtonContainer = styled.div`
  position: relative;
`

const Tertiary = styled(ThemedText.BodySecondary)`
  color: ${({ theme }) => theme.textTertiary};
`

const UploadLink = styled.a`
  color: ${({ theme }) => theme.textSecondary};
  cursor: pointer;

  ${OpacityHoverState}
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

const OwnerText = styled.a`
  font-size: 14px;
  line-height: 20px;
  color: ${({ theme }) => theme.textSecondary};
  text-decoration: none;

  ${OpacityHoverState}
`

const OwnerInformationContainer = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  display: flex;
  justify-content: space-between;
  padding: 0 8px;
  margin-bottom: 20px;
`

export const OwnerContainer = ({ asset }: { asset: GenieAsset }) => {
  const navigate = useNavigate()
  const USDPrice = useUsdPrice(asset)
  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const resetSellAssets = useSellAsset((state) => state.reset)
  const { account } = useWeb3React()
  const assetsFilter = [{ address: asset.address, tokenId: asset.tokenId }]
  const { walletAssets: ownerAssets } = useNftBalanceQuery(account ?? '', [], assetsFilter, 1)
  const walletAsset: WalletAsset = useMemo(() => ownerAssets[0], [ownerAssets])

  const listing = asset.sellorders && asset.sellorders.length > 0 ? asset.sellorders[0] : undefined
  const cheapestOrder = asset.sellorders && asset.sellorders.length > 0 ? asset.sellorders[0] : undefined
  const expirationDate = cheapestOrder ? new Date(cheapestOrder.endAt) : undefined

  const goToListPage = () => {
    resetSellAssets()
    navigate('/nfts/profile')
    selectSellAsset(walletAsset)
    setSellPageState(ProfilePageStateType.LISTING)
  }

  return (
    <Container>
      <BestPriceContainer>
        <HeaderRow>
          <ThemedText.SubHeader fontWeight={500} lineHeight="24px">
            {listing ? 'Your Price' : 'List for Sale'}
          </ThemedText.SubHeader>
          {listing && <MarketplaceIcon alt={listing.marketplace} src={getMarketplaceIcon(listing.marketplace)} />}
        </HeaderRow>
        <PriceRow>
          {listing ? (
            <>
              <ThemedText.MediumHeader fontSize="28px" lineHeight="36px">
                {formatEthPrice(asset.priceInfo.ETHPrice)}
              </ThemedText.MediumHeader>
              {USDPrice && (
                <ThemedText.BodySecondary lineHeight="24px">
                  {ethNumberStandardFormatter(USDPrice, true, true)}
                </ThemedText.BodySecondary>
              )}
            </>
          ) : (
            <ThemedText.BodySecondary fontSize="14px" lineHeight="20px">
              Get the best price for your NFT by selling with Uniswap.
            </ThemedText.BodySecondary>
          )}
        </PriceRow>
        {expirationDate && (
          <ThemedText.BodySecondary fontSize="14px">Sale ends: {timeLeft(expirationDate)}</ThemedText.BodySecondary>
        )}
        {!listing ? (
          <BuyNowButton assetInBag={false} margin={true} useAccentColor={true} onClick={goToListPage}>
            <ThemedText.SubHeader lineHeight="20px">List</ThemedText.SubHeader>
          </BuyNowButton>
        ) : (
          <>
            <BuyNowButton assetInBag={false} margin={true} useAccentColor={false} onClick={goToListPage}>
              <ThemedText.SubHeader lineHeight="20px">Adjust listing</ThemedText.SubHeader>
            </BuyNowButton>
          </>
        )}
      </BestPriceContainer>
    </Container>
  )
}

const StyledLink = styled(Link)`
  text-decoration: none;
  ${OpacityHoverState}
`

export const NotForSale = ({ collectionName, collectionUrl }: { collectionName: string; collectionUrl: string }) => {
  const theme = useTheme()

  return (
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
          <StyledLink to={`/nfts/collection/${collectionUrl}`}>
            <ThemedText.Link lineHeight="20px">{collectionName}</ThemedText.Link>
          </StyledLink>
        </DiscoveryContainer>
      </NotForSaleContainer>
    </BestPriceContainer>
  )
}

const SubHeader = styled(ThemedText.SubHeader)`
  color: ${({ theme }) => theme.textPrimary};
`

export const AssetPriceDetails = ({ asset, collection }: AssetPriceDetailsProps) => {
  const { account } = useWeb3React()

  const cheapestOrder = asset.sellorders && asset.sellorders.length > 0 ? asset.sellorders[0] : undefined
  const expirationDate = cheapestOrder ? new Date(cheapestOrder.endAt) : undefined

  const itemsInBag = useBag((s) => s.itemsInBag)
  const addAssetsToBag = useBag((s) => s.addAssetsToBag)
  const removeAssetsFromBag = useBag((s) => s.removeAssetsFromBag)
  const toggleBag = useBag((s) => s.toggleBag)
  const bagExpanded = useBag((s) => s.bagExpanded)

  const USDPrice = useUsdPrice(asset)
  const [, setCopied] = useCopyClipboard()

  const { assetInBag } = useMemo(() => {
    return {
      assetInBag: itemsInBag.some(
        (item) => asset.tokenId === item.asset.tokenId && asset.address === item.asset.address
      ),
    }
  }, [asset, itemsInBag])

  const isOwner = asset.owner ? account?.toLowerCase() === asset.owner?.address?.toLowerCase() : false

  if (isOwner) {
    return <OwnerContainer asset={asset} />
  }

  return (
    <Container>
      <OwnerInformationContainer>
        <OwnerText
          target="_blank"
          href={`https://etherscan.io/address/${asset.owner.address}`}
          rel="noopener noreferrer"
        >
          {asset.tokenType === 'ERC1155' ? (
            ''
          ) : (
            <span> Seller: {isOwner ? 'you' : asset.owner.address && shortenAddress(asset.owner.address, 2, 4)}</span>
          )}
        </OwnerText>
        <UploadLink
          onClick={() => {
            setCopied(window.location.href)
          }}
          target="_blank"
        >
          <Upload size={20} strokeWidth={2} />
        </UploadLink>
      </OwnerInformationContainer>

      {cheapestOrder && asset.priceInfo ? (
        <BestPriceContainer>
          <HeaderRow>
            <ThemedText.SubHeader fontWeight={500} lineHeight="24px">
              Best Price
            </ThemedText.SubHeader>
            <MarketplaceIcon alt={cheapestOrder.marketplace} src={getMarketplaceIcon(cheapestOrder.marketplace)} />
          </HeaderRow>
          <PriceRow>
            <ThemedText.MediumHeader fontSize="28px" lineHeight="36px">
              {formatEthPrice(asset.priceInfo.ETHPrice)} ETH
            </ThemedText.MediumHeader>
            {USDPrice && (
              <ThemedText.BodySecondary lineHeight="24px">
                {ethNumberStandardFormatter(USDPrice, true, true)}
              </ThemedText.BodySecondary>
            )}
          </PriceRow>
          {expirationDate && expirationDate > new Date() && (
            <Tertiary fontSize="14px">Sale ends: {timeLeft(expirationDate)}</Tertiary>
          )}
          <div>
            <BuyNowButtonContainer>
              <BuyNowButton
                assetInBag={assetInBag}
                margin={true}
                useAccentColor={true}
                onClick={() => {
                  assetInBag ? removeAssetsFromBag([asset]) : addAssetsToBag([asset])
                  if (!assetInBag && !bagExpanded) {
                    toggleBag()
                  }
                }}
              >
                <SubHeader color="white" lineHeight="20px">
                  <span>{assetInBag ? 'Remove' : 'Buy Now'}</span>
                </SubHeader>
              </BuyNowButton>
            </BuyNowButtonContainer>
          </div>
        </BestPriceContainer>
      ) : (
        <NotForSale collectionName={collection.collectionName ?? 'this collection'} collectionUrl={asset.address} />
      )}
    </Container>
  )
}
