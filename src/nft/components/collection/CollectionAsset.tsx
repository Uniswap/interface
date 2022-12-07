import { BigNumber } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, useTrace } from '@uniswap/analytics'
import { EventName, PageName } from '@uniswap/analytics-events'
import { MouseoverTooltip } from 'components/Tooltip'
import Tooltip from 'components/Tooltip'
import { useSellOrdersQuery } from 'graphql/data/nft/Details'
import { Box } from 'nft/components/Box'
import { bodySmall } from 'nft/css/common.css'
import { useBag } from 'nft/hooks'
import { GenieAsset, isPooledMarket, TokenType } from 'nft/types'
import { formatWeiToDecimal, rarityProviderLogo } from 'nft/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

const StyledContainer = styled.div`
  position: absolute;
  bottom: 12px;
  left: 0px;
  display: flex;
  justify-content: center;
  width: 100%;
  z-index: 2;
  pointer-events: none;
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
  const usedSweep = useBag((state) => state.usedSweep)
  const itemsInBag = useBag((state) => state.itemsInBag)
  const bagExpanded = useBag((state) => state.bagExpanded)
  const setBagExpanded = useBag((state) => state.setBagExpanded)
  const trace = useTrace({ page: PageName.NFT_COLLECTION_PAGE })

  const { quantitySelected } = useMemo(() => {
    const quantitySelected = itemsInBag.filter(
      (item) => asset.tokenId === item.asset.tokenId && asset.address === item.asset.address
    ).length
    return {
      quantitySelected,
    }
  }, [asset, itemsInBag])

  const isSelected = quantitySelected > 0
  const isErc1155 = asset.tokenType === TokenType.ERC1155
  const sellOrders = useSellOrdersQuery(asset.address, asset.tokenId, isSelected && isErc1155)

  const [showTooltip, setShowTooltip] = useState(false)
  const quantitySelectedRef = useRef(quantitySelected)

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
    if (BigNumber.from(asset.priceInfo?.ETHPrice ?? 0).gte(0)) {
      const assetToAdd: GenieAsset =
        isErc1155 && isSelected && sellOrders && sellOrders?.length >= quantitySelected
          ? {
              ...asset,
              priceInfo: {
                ...asset.priceInfo,
                ETHPrice: parseEther(sellOrders[quantitySelected].price.value.toString()).toString(),
                basePrice: parseEther(sellOrders[quantitySelected].price.value.toString()).toString(),
              },
            }
          : asset
      addAssetsToBag([assetToAdd])
      if (!bagExpanded && !isMobile && !bagManuallyClosed) {
        setBagExpanded({ bagExpanded: true })
      }
      sendAnalyticsEvent(EventName.NFT_BUY_ADDED, {
        collection_address: asset.address,
        token_id: asset.tokenId,
        token_type: asset.tokenType,
        ...trace,
      })
    }
  }, [
    addAssetsToBag,
    asset,
    bagExpanded,
    bagManuallyClosed,
    isErc1155,
    isMobile,
    isSelected,
    quantitySelected,
    sellOrders,
    setBagExpanded,
    trace,
  ])

  const handleRemoveAssetFromBag = useCallback(() => {
    removeAssetsFromBag([asset])
  }, [asset, removeAssetsFromBag])

  const handleRemoveErc1155FromBag = useCallback(() => {
    if (!isErc1155) return
    const tokens = itemsInBag
      .filter((item) => item.asset.address === asset.address && item.asset.tokenId === asset.tokenId)
      .map((item) => item.asset)
    if (tokens.length === 0) return

    const mostExpensiveAsset = tokens.reduce(
      (acc, cur) => (BigNumber.from(cur.priceInfo.basePrice).gte(BigNumber.from(acc.priceInfo.basePrice)) ? cur : acc),
      tokens[0]
    )
    removeAssetsFromBag([mostExpensiveAsset])
  }, [asset, isErc1155, itemsInBag, removeAssetsFromBag])

  useEffect(() => {
    if (quantitySelected !== quantitySelectedRef.current && !usedSweep) {
      setShowTooltip(true)
      quantitySelectedRef.current = quantitySelected
      const tooltipTimer = setTimeout(() => {
        setShowTooltip(false)
      }, TOOLTIP_TIMEOUT)

      return () => {
        clearTimeout(tooltipTimer)
      }
    }
    quantitySelectedRef.current = quantitySelected
    return undefined
  }, [quantitySelected, quantitySelectedRef, usedSweep])

  return (
    <Card.Container
      asset={asset}
      selected={isSelected}
      addAssetToBag={handleAddAssetToBag}
      removeAssetFromBag={isErc1155 ? handleRemoveErc1155FromBag : handleRemoveAssetFromBag}
    >
      <Card.ImageContainer isDisabled={asset.notForSale}>
        <StyledContainer>
          <Tooltip
            text={
              <Box as="span" className={bodySmall} color="textPrimary">
                {isSelected ? <Trans>Added to bag</Trans> : <Trans>Removed from bag</Trans>}
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
        {asset.rarity && provider && (
          <Card.Ranking
            rarity={asset.rarity}
            provider={provider}
            rarityVerified={!!rarityVerified}
            rarityLogo={rarityLogo}
          />
        )}
        {isErc1155 && <Card.Erc1155Controls quantity={quantitySelected} />}
        <MouseoverTooltip
          text={
            <Box as="span" className={bodySmall} color="textPrimary">
              <Trans>This item is not for sale</Trans>
            </Box>
          }
          placement="bottom"
          offsetX={0}
          offsetY={-50}
          style={{ display: 'block' }}
          hideArrow={true}
          disableHover={!asset.notForSale}
          timeout={isMobile ? TOOLTIP_TIMEOUT : undefined}
        >
          {assetMediaType === AssetMediaType.Image ? (
            <Card.Image />
          ) : assetMediaType === AssetMediaType.Video ? (
            <Card.Video shouldPlay={mediaShouldBePlaying} setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia} />
          ) : (
            <Card.Audio shouldPlay={mediaShouldBePlaying} setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia} />
          )}
        </MouseoverTooltip>
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
              {isPooledMarket(asset.marketplace) && <Card.Pool />}
            </Card.SecondaryDetails>
            {!isErc1155 && asset.marketplace && <Card.MarketplaceIcon marketplace={asset.marketplace} />}
          </Card.SecondaryRow>
        </Card.InfoContainer>
      </Card.DetailsContainer>
    </Card.Container>
  )
}
