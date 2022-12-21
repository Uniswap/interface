import { useTrace } from '@uniswap/analytics'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { EventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { OpacityHoverState } from 'components/Common'
import { useNftBalance } from 'graphql/data/nft/NftBalance'
import { CancelListingIcon, VerifiedIcon } from 'nft/components/icons'
import { useBag, useProfilePageState, useSellAsset } from 'nft/hooks'
import { CollectionInfoForAsset, GenieAsset, ProfilePageStateType, WalletAsset } from 'nft/types'
import {
  ethNumberStandardFormatter,
  fetchPrice,
  formatEthPrice,
  generateTweetForAsset,
  getMarketplaceIcon,
  timeLeft,
  useUsdPrice,
} from 'nft/utils'
import { shortenAddress } from 'nft/utils/address'
import { useMemo } from 'react'
import { Upload } from 'react-feather'
import { useQuery } from 'react-query'
import { Link, useNavigate } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'

const TWITTER_WIDTH = 560
const TWITTER_HEIGHT = 480

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
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 24px;

  @media (min-width: calc(960px + 1px)) {
    position: fixed;
    width: 360px;
    margin-top: 20px;
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
  position: relative;
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
  font-size: 16px;
  font-weight: 600;
  line-height: 20px;
  color: ${({ theme }) => theme.textSecondary};
  text-decoration: none;

  ${OpacityHoverState}
`

const OwnerInformationContainer = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 8px;
`

const AssetInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const AssetHeader = styled.div`
  display: -webkit-box;
  align-items: center;
  font-size: 28px;
  font-weight: 500;
  line-height: 36px;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ theme }) => theme.textPrimary};
`

const CollectionNameContainer = styled.div`
  display: flex;
  justify-content: space-between;
`

const CollectionHeader = styled.span`
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  color: ${({ theme }) => theme.textPrimary};
  text-decoration: none;
  ${OpacityHoverState};
`

const VerifiedIconContainer = styled.span`
  position: relative;
`

const StyledVerifiedIcon = styled(VerifiedIcon)`
  position: absolute;
  top: 0px;
`

const DefaultLink = styled(Link)`
  text-decoration: none;
`

const OwnerContainer = ({ asset }: { asset: WalletAsset }) => {
  const navigate = useNavigate()
  const { data: USDValue } = useQuery(['fetchPrice', {}], () => fetchPrice(), {})
  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const resetSellAssets = useSellAsset((state) => state.reset)

  const listing = asset.sellOrders && asset.sellOrders.length > 0 ? asset.sellOrders[0] : undefined
  const expirationDate = listing?.endAt ? new Date(listing.endAt) : undefined

  const USDPrice = useMemo(
    () => (USDValue && asset.floor_sell_order_price ? USDValue * asset.floor_sell_order_price : undefined),
    [USDValue, asset.floor_sell_order_price]
  )
  const trace = useTrace()

  const goToListPage = () => {
    resetSellAssets()
    navigate('/nfts/profile')
    selectSellAsset(asset)
    sendAnalyticsEvent(EventName.NFT_SELL_ITEM_ADDED, {
      collection_address: asset.asset_contract.address,
      token_id: asset.tokenId,
      ...trace,
    })
    setSellPageState(ProfilePageStateType.LISTING)
  }

  return (
    <BestPriceContainer>
      <HeaderRow>
        <ThemedText.SubHeader color="accentAction" fontWeight={500} lineHeight="24px">
          {listing ? 'Your Price' : 'List for Sale'}
        </ThemedText.SubHeader>
        {listing && (
          <ExternalLink href={listing.marketplaceUrl}>
            <MarketplaceIcon alt={listing.marketplace} src={getMarketplaceIcon(listing.marketplace)} />
          </ExternalLink>
        )}
      </HeaderRow>
      <PriceRow>
        {listing ? (
          <>
            <ThemedText.MediumHeader fontSize="28px" lineHeight="36px">
              {formatEthPrice(asset.priceInfo?.ETHPrice)} ETH
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
          <ThemedText.SubHeader lineHeight="20px" color="white">
            List
          </ThemedText.SubHeader>
        </BuyNowButton>
      ) : (
        <>
          <BuyNowButton assetInBag={false} margin={true} useAccentColor={false} onClick={goToListPage}>
            <ThemedText.SubHeader lineHeight="20px">Adjust listing</ThemedText.SubHeader>
          </BuyNowButton>
        </>
      )}
    </BestPriceContainer>
  )
}

const StyledLink = styled(Link)`
  text-decoration: none;
  ${OpacityHoverState}
`

const NotForSale = ({ collectionName, collectionUrl }: { collectionName: string; collectionUrl: string }) => {
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

export const AssetPriceDetails = ({ asset, collection }: AssetPriceDetailsProps) => {
  const { account } = useWeb3React()

  const cheapestOrder = asset.sellorders && asset.sellorders.length > 0 ? asset.sellorders[0] : undefined
  const expirationDate = cheapestOrder?.endAt ? new Date(cheapestOrder.endAt) : undefined

  const itemsInBag = useBag((s) => s.itemsInBag)
  const addAssetsToBag = useBag((s) => s.addAssetsToBag)
  const removeAssetsFromBag = useBag((s) => s.removeAssetsFromBag)
  const toggleBag = useBag((s) => s.toggleBag)
  const bagExpanded = useBag((s) => s.bagExpanded)

  const USDPrice = useUsdPrice(asset)

  const assetsFilter = [{ address: asset.address, tokenId: asset.tokenId }]
  const { walletAssets: ownerAssets } = useNftBalance(account ?? '', [], assetsFilter, 1)
  const walletAsset: WalletAsset | undefined = useMemo(() => ownerAssets?.[0], [ownerAssets])

  const { assetInBag } = useMemo(() => {
    return {
      assetInBag: itemsInBag.some(
        (item) => asset.tokenId === item.asset.tokenId && asset.address === item.asset.address
      ),
    }
  }, [asset, itemsInBag])

  const shareTweet = () => {
    window.open(
      generateTweetForAsset(asset),
      'newwindow',
      `left=${(window.screen.width - TWITTER_WIDTH) / 2}, top=${
        (window.screen.height - TWITTER_HEIGHT) / 2
      }, width=${TWITTER_WIDTH}, height=${TWITTER_HEIGHT}`
    )
  }

  const isOwner = asset.ownerAddress && !!walletAsset && account?.toLowerCase() === asset.ownerAddress?.toLowerCase()
  const isForSale = cheapestOrder && asset.priceInfo

  return (
    <Container>
      <AssetInfoContainer>
        <CollectionNameContainer>
          <DefaultLink to={`/nfts/collection/${asset.address}`}>
            <CollectionHeader>
              {collection.collectionName}
              <VerifiedIconContainer>{collection.isVerified && <StyledVerifiedIcon />}</VerifiedIconContainer>
            </CollectionHeader>
          </DefaultLink>
          <UploadLink onClick={shareTweet} target="_blank">
            <Upload size={20} strokeWidth={2} />
          </UploadLink>
        </CollectionNameContainer>
        <AssetHeader>{asset.name ?? `${asset.collectionName} #${asset.tokenId}`}</AssetHeader>
      </AssetInfoContainer>
      {isOwner ? (
        <OwnerContainer asset={walletAsset} />
      ) : isForSale ? (
        <BestPriceContainer>
          <HeaderRow>
            <ThemedText.SubHeader color="accentAction" fontWeight={500} lineHeight="24px">
              Best Price
            </ThemedText.SubHeader>
            <ExternalLink href={cheapestOrder.marketplaceUrl}>
              <MarketplaceIcon alt={cheapestOrder.marketplace} src={getMarketplaceIcon(cheapestOrder.marketplace)} />
            </ExternalLink>
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
                <ThemedText.SubHeader color="white" lineHeight="20px">
                  <span data-testid="nft-details-toggle-bag">{assetInBag ? 'Remove' : 'Add to Bag'}</span>
                </ThemedText.SubHeader>
              </BuyNowButton>
            </BuyNowButtonContainer>
          </div>
        </BestPriceContainer>
      ) : (
        <NotForSale collectionName={collection.collectionName ?? 'this collection'} collectionUrl={asset.address} />
      )}
      {isForSale && (
        <OwnerInformationContainer>
          {asset.tokenType !== 'ERC1155' && asset.ownerAddress && (
            <ThemedText.BodySmall color="textSecondary" lineHeight="20px">
              Seller:
            </ThemedText.BodySmall>
          )}
          <OwnerText
            target="_blank"
            href={`https://etherscan.io/address/${asset.ownerAddress}`}
            rel="noopener noreferrer"
          >
            {asset.tokenType === 'ERC1155' ? (
              ''
            ) : (
              <span> {isOwner ? 'You' : asset.ownerAddress && shortenAddress(asset.ownerAddress, 2, 4)}</span>
            )}
          </OwnerText>
        </OwnerInformationContainer>
      )}
    </Container>
  )
}
