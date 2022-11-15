import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { EventName, PageName } from '@uniswap/analytics-events'
import Tooltip from 'components/Tooltip'
import { Box } from 'nft/components/Box'
import { bodySmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag } from 'nft/hooks'
import { GenieAsset, Markets } from 'nft/types'
import { formatWeiToDecimal, rarityProviderLogo } from 'nft/utils'
import { useCallback, useMemo } from 'react'
import { useEffect, useState } from 'react'

import { useAssetMediaType, useNotForSale } from './Card'
import { AssetMediaType } from './Card'
import * as Card from './Card'

interface CollectionAssetProps {
  asset: GenieAsset
  isMobile: boolean
  mediaShouldBePlaying: boolean
  setCurrentTokenPlayingMedia: (tokenId: string | undefined) => void
  rarityVerified?: boolean
}

const TOOLTIP_TIMEOUT = 2000
const ADDED_TO_BAG_TOOLTIP_TEXT = 'Added to bag'
const REMOVED_FROM_BAG_TOOLTIP_TEXT = 'Removed from bag'

export const CollectionAsset = ({
  asset,
  isMobile,
  mediaShouldBePlaying,
  setCurrentTokenPlayingMedia,
  rarityVerified,
}: CollectionAssetProps) => {
  const bagManuallyClosed = useBag((state) => state.bagManuallyClosed)
  const addAssetsToBag = useBag((state) => state.addAssetsToBag)
  const removeAssetsFromBag = useBag((state) => state.removeAssetsFromBag)
  const itemsInBag = useBag((state) => state.itemsInBag)
  const bagExpanded = useBag((state) => state.bagExpanded)
  const setBagExpanded = useBag((state) => state.setBagExpanded)
  const trace = useTrace({ page: PageName.NFT_COLLECTION_PAGE })
  const [selectedForBag, setSelectedForBag] = useState(false)

  const { quantity, isSelected } = useMemo(() => {
    return {
      quantity: itemsInBag.filter(
        (x) => x.asset.tokenType === 'ERC1155' && x.asset.tokenId === asset.tokenId && x.asset.address === asset.address
      ).length,
      isSelected: itemsInBag.some(
        (item) => asset.tokenId === item.asset.tokenId && asset.address === item.asset.address
      ),
    }
  }, [asset, itemsInBag])

  const notForSale = useNotForSale(asset)
  const assetMediaType = useAssetMediaType(asset)

  const { provider, rarityLogo } = useMemo(() => {
    return {
      provider: asset?.rarity?.providers?.find(
        ({ provider: _provider }) => _provider === asset.rarity?.primaryProvider
      ),
      rarityLogo: rarityProviderLogo[asset.rarity?.primaryProvider ?? 0] ?? '',
    }
  }, [asset])

  const handleAddAssetToBag = useCallback(() => {
    addAssetsToBag([asset])
    setSelectedForBag(true)
    if (!bagExpanded && !isMobile && !bagManuallyClosed) {
      setBagExpanded({ bagExpanded: true })
    }
    sendAnalyticsEvent(EventName.NFT_BUY_ADDED, {
      collection_address: asset.address,
      token_id: asset.tokenId,
      token_type: asset.tokenType,
      ...trace,
    })
  }, [addAssetsToBag, asset, bagExpanded, bagManuallyClosed, isMobile, setBagExpanded, trace])

  useEffect(() => {
    if (selectedForBag) {
      const showTooltip = setTimeout(() => {
        setSelectedForBag(false)
      }, TOOLTIP_TIMEOUT)

      return () => {
        clearTimeout(showTooltip)
      }
    }
    return undefined
  }, [selectedForBag, setSelectedForBag])

  const handleRemoveAssetFromBag = useCallback(() => {
    removeAssetsFromBag([asset])
  }, [asset, removeAssetsFromBag])

  return (
    <Card.Container
      asset={asset}
      selected={isSelected}
      addAssetToBag={handleAddAssetToBag}
      removeAssetFromBag={handleRemoveAssetFromBag}
    >
      <Tooltip
        text={
          <Box as="span" className={bodySmall} style={{ color: themeVars.colors.textPrimary }}>
            <Trans>{isSelected ? ADDED_TO_BAG_TOOLTIP_TEXT : REMOVED_FROM_BAG_TOOLTIP_TEXT}</Trans>{' '}
          </Box>
        }
        show={selectedForBag}
        style={{ display: 'block' }}
        offsetX={0}
        offsetY={-52}
        hideArrow={true}
        placement="bottom"
      >
        <Card.ImageContainer>
          {asset.tokenType === 'ERC1155' && quantity > 0 && <Card.Erc1155Controls quantity={quantity.toString()} />}
          {asset.rarity && provider && (
            <Card.Ranking
              rarity={asset.rarity}
              provider={provider}
              rarityVerified={!!rarityVerified}
              rarityLogo={rarityLogo}
            />
          )}
          {assetMediaType === AssetMediaType.Image ? (
            <Card.Image />
          ) : assetMediaType === AssetMediaType.Video ? (
            <Card.Video shouldPlay={mediaShouldBePlaying} setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia} />
          ) : (
            <Card.Audio shouldPlay={mediaShouldBePlaying} setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia} />
          )}
        </Card.ImageContainer>
      </Tooltip>
      <Card.DetailsContainer>
        <Card.InfoContainer>
          <Card.PrimaryRow>
            <Card.PrimaryDetails>
              <Card.PrimaryInfo>{asset.name ? asset.name : `#${asset.tokenId}`}</Card.PrimaryInfo>
              {asset.susFlag && <Card.Suspicious />}
            </Card.PrimaryDetails>
            <Card.DetailsLink />
          </Card.PrimaryRow>
          <Card.SecondaryRow>
            <Card.SecondaryDetails>
              <Card.SecondaryInfo>
                {notForSale ? '' : `${formatWeiToDecimal(asset.priceInfo.ETHPrice, true)} ETH`}
              </Card.SecondaryInfo>
              {(asset.marketplace === Markets.NFTX || asset.marketplace === Markets.NFT20) && <Card.Pool />}
            </Card.SecondaryDetails>
            {asset.tokenType !== 'ERC1155' && asset.marketplace && (
              <Card.MarketplaceIcon marketplace={asset.marketplace} />
            )}
          </Card.SecondaryRow>
        </Card.InfoContainer>
      </Card.DetailsContainer>
    </Card.Container>
  )
}
