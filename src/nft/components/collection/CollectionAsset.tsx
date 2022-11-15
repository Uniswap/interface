import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { EventName, PageName } from '@uniswap/analytics-events'
import Tooltip from 'components/Tooltip'
import { Box } from 'nft/components/Box'
import { bodySmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useBag } from 'nft/hooks'
import { GenieAsset, Markets, TokenType } from 'nft/types'
import { formatWeiToDecimal, rarityProviderLogo } from 'nft/utils'
import { useCallback, useMemo } from 'react'
import { useEffect, useState } from 'react'
import styled from 'styled-components/macro'

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

const StyledContainer = styled.div`
  position: absolute;
  bottom: 12px;
  left: 0px;
  display: flex;
  justify-content: center;
  width: 100%;
  z-index: 2;
`

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

  const { erc1155TokenQuantity, isSelected, inSweep } = useMemo(() => {
    const matchingItems = itemsInBag.filter(
      (item) => asset.tokenId === item.asset.tokenId && asset.address === item.asset.address
    )
    const erc1155TokenQuantity = matchingItems.filter((x) => x.asset.tokenType === TokenType.ERC1155).length
    const isSelected = matchingItems.length > 0
    const inSweep = isSelected && matchingItems.some((x) => x.inSweep === true)
    return {
      erc1155TokenQuantity,
      isSelected,
      inSweep,
    }
  }, [asset, itemsInBag])

  const [showTooltip, setShowTooltip] = useState(false)
  const [prevIsSelected, setPrevIsSelected] = useState(isSelected)

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
    if (isSelected !== prevIsSelected && !inSweep) {
      setShowTooltip(true)
      const tooltipTimer = setTimeout(() => {
        setShowTooltip(false)
      }, TOOLTIP_TIMEOUT)

      return () => {
        clearTimeout(tooltipTimer)
        setPrevIsSelected(isSelected)
      }
    }
    return undefined
  }, [isSelected, prevIsSelected, inSweep])

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
      <Card.ImageContainer>
        <StyledContainer>
          <Tooltip
            text={
              <Box as="span" className={bodySmall} style={{ color: themeVars.colors.textPrimary }}>
                <Trans>{isSelected ? ADDED_TO_BAG_TOOLTIP_TEXT : REMOVED_FROM_BAG_TOOLTIP_TEXT}</Trans>{' '}
              </Box>
            }
            show={showTooltip}
            style={{ display: 'block' }}
            offsetX={0}
            offsetY={0}
            hideArrow={true}
            placement="bottom"
            showInline
          />
        </StyledContainer>
        {asset.tokenType === TokenType.ERC1155 && erc1155TokenQuantity > 0 && (
          <Card.Erc1155Controls quantity={erc1155TokenQuantity.toString()} />
        )}
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
            {asset.tokenType !== TokenType.ERC1155 && asset.marketplace && (
              <Card.MarketplaceIcon marketplace={asset.marketplace} />
            )}
          </Card.SecondaryRow>
        </Card.InfoContainer>
      </Card.DetailsContainer>
    </Card.Container>
  )
}
