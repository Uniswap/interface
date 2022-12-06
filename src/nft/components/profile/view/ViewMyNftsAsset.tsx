import { Trans } from '@lingui/macro'
import { useTrace } from '@uniswap/analytics'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { EventName } from '@uniswap/analytics-events'
import { MouseoverTooltip } from 'components/Tooltip'
import Tooltip from 'components/Tooltip'
import { Box } from 'nft/components/Box'
import * as Card from 'nft/components/collection/Card'
import { AssetMediaType } from 'nft/components/collection/Card'
import { bodySmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag, useIsMobile, useSellAsset } from 'nft/hooks'
import { TokenType, WalletAsset } from 'nft/types'
import { useEffect, useMemo, useRef, useState } from 'react'

const TOOLTIP_TIMEOUT = 2000

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

const getUnsupportedNftTextComponent = (asset: WalletAsset) => (
  <Box as="span" className={bodySmall} style={{ color: themeVars.colors.textPrimary }}>
    {asset.asset_contract.tokenType === TokenType.ERC1155 ? (
      <Trans>Selling ERC-1155s coming soon</Trans>
    ) : (
      <Trans>Blocked from trading</Trans>
    )}
  </Box>
)

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

  const [showTooltip, setShowTooltip] = useState(false)
  const isSelectedRef = useRef(isSelected)
  const trace = useTrace()
  const onCardClick = () => handleSelect(isSelected)

  const handleSelect = (removeAsset: boolean) => {
    if (removeAsset) {
      removeSellAsset(asset)
    } else {
      selectSellAsset(asset)
      sendAnalyticsEvent(EventName.NFT_SELL_ITEM_ADDED, {
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

  useEffect(() => {
    if (isSelected !== isSelectedRef.current) {
      setShowTooltip(true)
      isSelectedRef.current = isSelected
      const tooltipTimer = setTimeout(() => {
        setShowTooltip(false)
      }, TOOLTIP_TIMEOUT)

      return () => {
        clearTimeout(tooltipTimer)
      }
    }
    isSelectedRef.current = isSelected
    return undefined
  }, [isSelected, isSelectedRef])

  const assetMediaType = Card.useAssetMediaType(asset)
  const isDisabled = asset.asset_contract.tokenType === TokenType.ERC1155 || asset.susFlag

  return (
    <Card.Container
      asset={asset}
      selected={isSelected}
      addAssetToBag={() => handleSelect(false)}
      removeAssetFromBag={() => handleSelect(true)}
      onClick={onCardClick}
      isDisabled={isDisabled}
    >
      <Card.ImageContainer isDisabled={isDisabled}>
        <Tooltip
          text={
            <Box as="span" className={bodySmall} color="textPrimary">
              {isSelected ? <Trans>Added to bag</Trans> : <Trans>Removed from bag</Trans>}
            </Box>
          }
          show={showTooltip}
          style={{ display: 'block' }}
          offsetX={0}
          offsetY={-68}
          hideArrow={true}
          placement="bottom"
        >
          <MouseoverTooltip
            text={getUnsupportedNftTextComponent(asset)}
            placement="bottom"
            offsetX={0}
            offsetY={-60}
            hideArrow={true}
            style={{ display: 'block' }}
            disableHover={!isDisabled}
            timeout={isMobile ? TOOLTIP_TIMEOUT : undefined}
          >
            {getNftDisplayComponent(assetMediaType, mediaShouldBePlaying, setCurrentTokenPlayingMedia)}
          </MouseoverTooltip>
        </Tooltip>
      </Card.ImageContainer>
      <Card.DetailsContainer>
        <Card.ProfileNftDetails asset={asset} hideDetails={hideDetails} />
      </Card.DetailsContainer>
    </Card.Container>
  )
}
