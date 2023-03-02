import { Trans } from '@lingui/macro'
import { useTrace } from '@uniswap/analytics'
import { sendAnalyticsEvent } from '@uniswap/analytics'
import { NFTEventName } from '@uniswap/analytics-events'
import { NftStandard } from 'graphql/data/__generated__/types-and-hooks'
import { Box } from 'nft/components/Box'
import * as Card from 'nft/components/collection/Card'
import { AssetMediaType } from 'nft/components/collection/Card'
import { VerifiedIcon } from 'nft/components/icons'
import { bodySmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag, useIsMobile, useSellAsset } from 'nft/hooks'
import { WalletAsset } from 'nft/types'
import { ethNumberStandardFormatter } from 'nft/utils'
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
    {asset.asset_contract.tokenType === NftStandard.Erc1155 ? (
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
  const isDisabled = asset.asset_contract.tokenType === NftStandard.Erc1155 || asset.susFlag
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
            {asset.lastPrice ? `Last sale: ${ethNumberStandardFormatter(asset.lastPrice)} ETH` : null}
          </Card.TertiaryInfo>
        </Card.TertiaryInfoContainer>
      </Card.DetailsContainer>
    </Card.Container>
  )
}
