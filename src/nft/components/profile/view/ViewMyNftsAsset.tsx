import { Trans } from '@lingui/macro'
import { MouseoverTooltip } from 'components/Tooltip'
import { Box } from 'nft/components/Box'
import * as Card from 'nft/components/collection/Card'
import { AssetMediaType } from 'nft/components/collection/Card'
import { bodySmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag, useIsMobile, useSellAsset } from 'nft/hooks'
import { WalletAsset } from 'nft/types'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
const NFT_DETAILS_HREF = (asset: WalletAsset) =>
  `/nfts/asset/${asset.asset_contract.address}/${asset.tokenId}?origin=profile`

interface ViewMyNftsAssetProps {
  asset: WalletAsset
  isSellMode: boolean
  mediaShouldBePlaying: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
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
  isSellMode,
  mediaShouldBePlaying,
  setCurrentTokenPlayingMedia,
}: ViewMyNftsAssetProps) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const removeSellAsset = useSellAsset((state) => state.removeSellAsset)
  const cartExpanded = useBag((state) => state.bagExpanded)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const isSelected = useMemo(() => {
    return sellAssets.some(
      (item) => item.tokenId === asset.tokenId && item.asset_contract.address === asset.asset_contract.address
    )
  }, [asset, sellAssets])

  const onCardClick = () => {
    isSellMode ? handleSelect(isSelected) : navigate(NFT_DETAILS_HREF(asset))
  }

  const handleSelect = (removeAsset: boolean) => {
    removeAsset ? removeSellAsset(asset) : selectSellAsset(asset)
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

  const isDisabled = asset.asset_contract.tokenType === 'ERC1155' || (isSellMode && asset.susFlag)
  const disabledTooltipText =
    asset.asset_contract.tokenType === 'ERC1155' ? 'ERC-1155 support coming soon' : 'Blocked from trading'

  return (
    <Card.Container
      asset={asset}
      selected={isSelected}
      addAssetToBag={() => handleSelect(false)}
      removeAssetFromBag={() => handleSelect(true)}
      onClick={onCardClick}
      isDisabled={isDisabled}
    >
      <MouseoverTooltip
        text={
          <Box as="span" className={bodySmall} style={{ color: themeVars.colors.textPrimary }}>
            <Trans>{disabledTooltipText}</Trans>{' '}
          </Box>
        }
        placement="bottom"
        offsetX={0}
        offsetY={-100}
        style={{ display: 'block' }}
        disableHover={!isDisabled}
      >
        <Card.ImageContainer>
          {getNftDisplayComponent(assetMediaType, mediaShouldBePlaying, setCurrentTokenPlayingMedia)}
        </Card.ImageContainer>
      </MouseoverTooltip>
      <Card.DetailsContainer>
        <Card.ProfileNftDetails asset={asset} isSellMode={isSellMode} />
      </Card.DetailsContainer>
    </Card.Container>
  )
}
