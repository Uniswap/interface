import { useTrace } from '@uniswap/analytics'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { NFTEventName } from '@uniswap/analytics-events'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import * as Card from 'nft/components/collection/Card'
import { AssetMediaType } from 'nft/components/collection/Card'
import { VerifiedIcon } from 'nft/components/icons'
import { useBag, useIsMobile, useSellAsset } from 'nft/hooks'
import { WalletAsset } from 'nft/types'
import { ethNumberStandardFormatter, floorFormatter } from 'nft/utils'
import { useMemo } from 'react'

interface ViewMyNftsAssetProps {
  asset: WalletAsset
  mediaShouldBePlaying: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
  hideDetails: boolean
}

const getNftDisplayComponent = (
  assetMediaType: AssetMediaType,
  mediaShouldBePlaying: boolean,
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
) => {
  switch (assetMediaType) {
    case AssetMediaType.Image:
      return <Card.Image />
    case AssetMediaType.Video:
      return <Card.Video shouldPlay={mediaShouldBePlaying} setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia} />
    case AssetMediaType.Audio:
      return <Card.Audio shouldPlay={mediaShouldBePlaying} setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia} />
  }
}

export const ViewMyNftsAsset = ({
  asset,
  mediaShouldBePlaying,
  setCurrentTokenPlayingMedia,
  hideDetails,
}: ViewMyNftsAssetProps) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const removeSellAsset = useSellAsset((state) => state.removeSellAsset)
  const cartExpanded = useBag((state) => state.bagExpanded)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()

  const isSelected = useMemo(() => {
    return sellAssets.some(
      (item) => item.tokenId === asset.tokenId && item.asset_contract.address === asset.asset_contract.address
    )
  }, [asset, sellAssets])

  const trace = useTrace()
  const onCardClick = () => handleSelect(isSelected)

  const handleSelect = (removeAsset: boolean) => {
    if (removeAsset) {
      removeSellAsset(asset)
    } else {
      selectSellAsset(asset)
      sendAnalyticsEvent(NFTEventName.NFT_SELL_ITEM_ADDED, {
        collection_address: asset.asset_contract.address,
        token_id: asset.tokenId,
        ...trace,
      })
    }
    if (
      !cartExpanded &&
      !sellAssets.find(
        (x) => x.tokenId === asset.tokenId && x.asset_contract.address === asset.asset_contract.address
      ) &&
      !isMobile
    )
      toggleCart()
  }

  const assetMediaType = Card.useAssetMediaType(asset)
  const isDisabled = asset.asset_contract.tokenType === NftStandard.Erc1155 || asset.susFlag
  const shouldShowUserListedPrice = !asset.notForSale && asset.asset_contract.tokenType !== NftStandard.Erc1155
  const assetName = () => {
    if (!asset.name && !asset.tokenId) return
    return asset.name ? asset.name : `#${asset.tokenId}`
  }

  return (
    <Card.Container
      asset={asset}
      selected={isSelected}
      addAssetToBag={() => handleSelect(false)}
      removeAssetFromBag={() => handleSelect(true)}
      onClick={onCardClick}
      isDisabled={isDisabled}
      doNotLinkToDetails={hideDetails}
    >
      <Card.ImageContainer>
        {getNftDisplayComponent(assetMediaType, mediaShouldBePlaying, setCurrentTokenPlayingMedia)}
      </Card.ImageContainer>
      <Card.DetailsContainer>
        <Card.InfoContainer>
          <Card.PrimaryRow>
            <Card.PrimaryDetails>
              <Card.PrimaryInfo>{!!asset.asset_contract.name && asset.asset_contract.name}</Card.PrimaryInfo>
              {asset.collectionIsVerified && <VerifiedIcon height="16px" width="16px" />}
            </Card.PrimaryDetails>
          </Card.PrimaryRow>
          <Card.SecondaryRow>
            <Card.SecondaryDetails>
              <Card.SecondaryInfo>{assetName()}</Card.SecondaryInfo>
            </Card.SecondaryDetails>
          </Card.SecondaryRow>
        </Card.InfoContainer>
        <Card.TertiaryInfoContainer>
          <Card.ActionButton>{isSelected ? `Remove from bag` : `List for sale`}</Card.ActionButton>
          <Card.TertiaryInfo>
            {shouldShowUserListedPrice && asset.floor_sell_order_price
              ? `${floorFormatter(asset.floor_sell_order_price)} ETH`
              : asset.lastPrice
              ? `Last sale: ${ethNumberStandardFormatter(asset.lastPrice)} ETH`
              : null}
          </Card.TertiaryInfo>
        </Card.TertiaryInfoContainer>
      </Card.DetailsContainer>
    </Card.Container>
  )
}
