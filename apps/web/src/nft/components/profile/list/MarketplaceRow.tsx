import { t } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { RowsCollpsedIcon, RowsExpandedIcon } from 'nft/components/icons'
import { getRoyalty, useHandleGlobalPriceToggle, useSyncPriceWithGlobalMethod } from 'nft/components/profile/list/utils'
import { useSellAsset } from 'nft/hooks'
import { useNativeUsdPrice } from 'nft/hooks/useUsdPrice'
import { ListingMarket, WalletAsset } from 'nft/types'
import { getMarketplaceIcon } from 'nft/utils'
import { Dispatch, DispatchWithoutAction, useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { PriceTextInput } from './PriceTextInput'
import { RoyaltyTooltip } from './RoyaltyTooltip'
import { RemoveIconWrap, SetPriceMethod } from './shared'

const LastPriceInfo = styled(Column)`
  text-align: left;
  display: none;
  flex: 1;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    display: flex;
  }
`

const FloorPriceInfo = styled(Column)`
  text-align: left;
  display: none;
  flex: 1;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    display: flex;
  }
`

const RemoveMarketplaceWrap = styled(RemoveIconWrap)`
  top: 8px;
  left: 16px;
  z-index: 3;
`

const MarketIconsWrapper = styled(Row)`
  position: relative;
  margin-right: 12px;
  width: 44px;
  justify-content: flex-end;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: none;
  }
`

const MarketIconWrapper = styled(Column)`
  position: relative;
  cursor: pointer;
`

const MarketIcon = styled.div<{ index: number }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  z-index: ${({ index }) => 2 - index};
  margin-left: ${({ index }) => `${index === 0 ? 0 : -8}px`};
  outline: 1px solid ${({ theme }) => theme.surface3};
`

const ExpandMarketIconWrapper = styled.div`
  cursor: pointer;
  margin-left: 4px;
  height: 28px;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: none;
  }
`

const FeeColumnWrapper = styled(Column)`
  flex: 1;
  align-items: flex-end;
  display: none;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    display: flex;
  }
`

const FeeWrapper = styled.div`
  width: min-content;
  white-space: nowrap;
`

const ReturnColumn = styled(Column)`
  flex: 1.5;
  display: none;

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    display: flex;
  }
`

interface MarketplaceRowProps {
  globalPriceMethod?: SetPriceMethod
  globalPrice?: number
  setGlobalPrice: Dispatch<number | undefined>
  selectedMarkets: ListingMarket[]
  removeMarket?: () => void
  asset: WalletAsset
  expandMarketplaceRows?: boolean
  rowHovered?: boolean
  toggleExpandMarketplaceRows: DispatchWithoutAction
}

export const MarketplaceRow = ({
  globalPriceMethod,
  globalPrice,
  setGlobalPrice,
  selectedMarkets,
  removeMarket = undefined,
  asset,
  expandMarketplaceRows,
  toggleExpandMarketplaceRows,
  rowHovered,
}: MarketplaceRowProps) => {
  const { formatNumberOrString, formatDelta } = useFormatter()
  const setAssetListPrice = useSellAsset((state) => state.setAssetListPrice)
  const removeAssetMarketplace = useSellAsset((state) => state.removeAssetMarketplace)
  const [marketIconHovered, toggleMarketIconHovered] = useReducer((s) => !s, false)
  const [marketRowHovered, toggleMarketRowHovered] = useReducer((s) => !s, false)
  const [listPrice, setListPrice] = useState<number | undefined>(
    () =>
      asset.newListings?.find((listing) =>
        expandMarketplaceRows ? listing.marketplace.name === selectedMarkets?.[0].name : !!listing.price
      )?.price
  )
  const [globalOverride, setGlobalOverride] = useState(false)

  const showGlobalPrice = globalPriceMethod === SetPriceMethod.SAME_PRICE && !globalOverride
  const price = showGlobalPrice ? globalPrice : listPrice
  const setPrice = useCallback(
    (price?: number) => {
      showGlobalPrice ? setGlobalPrice(price) : setListPrice(price)
      for (const marketplace of selectedMarkets) setAssetListPrice(asset, price, marketplace)
    },
    [asset, selectedMarkets, setAssetListPrice, setGlobalPrice, showGlobalPrice]
  )

  const fees = useMemo(() => {
    let maxFee = 0
    for (const selectedMarket of selectedMarkets) {
      const fee = getRoyalty(selectedMarket, asset) + selectedMarket.fee
      maxFee = Math.max(fee, maxFee)
    }

    return maxFee
  }, [asset, selectedMarkets])

  const feeInEth = price && (price * fees) / 100
  const userReceives = price && feeInEth && price - feeInEth

  useHandleGlobalPriceToggle(globalOverride, setListPrice, setPrice, listPrice, globalPrice)
  useSyncPriceWithGlobalMethod(
    asset,
    setListPrice,
    setGlobalPrice,
    setGlobalOverride,
    listPrice,
    globalPrice,
    globalPriceMethod
  )

  // When in Same Price Mode and not overriding, update local price when global price changes
  useEffect(() => {
    if (showGlobalPrice) {
      setPrice(globalPrice)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalPrice])

  return (
    <Row onMouseEnter={toggleMarketRowHovered} onMouseLeave={toggleMarketRowHovered}>
      <FloorPriceInfo>
        <ThemedText.BodyPrimary color="neutral2" lineHeight="24px">
          {formatNumberOrString({
            input: asset.floorPrice,
            type: NumberType.NFTToken,
          }) + asset.floorPrice
            ? ' ETH'
            : ''}
        </ThemedText.BodyPrimary>
      </FloorPriceInfo>
      <LastPriceInfo>
        <ThemedText.BodyPrimary color="neutral2" lineHeight="24px">
          {asset.lastPrice ? `${formatNumberOrString({ input: asset.lastPrice, type: NumberType.NFTToken })} ETH` : '-'}
        </ThemedText.BodyPrimary>
      </LastPriceInfo>

      <Row flex="2">
        {(expandMarketplaceRows || selectedMarkets.length > 1) && (
          <MarketIconsWrapper onMouseEnter={toggleMarketIconHovered} onMouseLeave={toggleMarketIconHovered}>
            {selectedMarkets.map((market, index) => (
              <MarketIconWrapper
                key={market.name + asset.collection?.address + asset.tokenId}
                onClick={(e) => {
                  e.stopPropagation()
                  removeAssetMarketplace(asset, market)
                  removeMarket && removeMarket()
                }}
              >
                <MarketIcon index={index}>{getMarketplaceIcon(market.name, '20')}</MarketIcon>
                <RemoveMarketplaceWrap hovered={marketIconHovered && (expandMarketplaceRows ?? false)}>
                  <img width="20px" src="/nft/svgs/minusCircle.svg" alt="Remove item" />
                </RemoveMarketplaceWrap>
              </MarketIconWrapper>
            ))}
          </MarketIconsWrapper>
        )}
        <PriceTextInput
          listPrice={price}
          setListPrice={setPrice}
          isGlobalPrice={showGlobalPrice}
          setGlobalOverride={setGlobalOverride}
          globalOverride={globalOverride}
          asset={asset}
        />
        {rowHovered && ((expandMarketplaceRows && marketRowHovered) || selectedMarkets.length > 1) && (
          <ExpandMarketIconWrapper onClick={toggleExpandMarketplaceRows}>
            {expandMarketplaceRows ? <RowsExpandedIcon /> : <RowsCollpsedIcon />}
          </ExpandMarketIconWrapper>
        )}
      </Row>

      <FeeColumnWrapper>
        <MouseoverTooltip
          text={<RoyaltyTooltip selectedMarkets={selectedMarkets} asset={asset} fees={feeInEth} />}
          placement="left"
        >
          <FeeWrapper>
            <ThemedText.BodyPrimary color="neutral2">
              {fees > 0 ? `${formatDelta(fees)}${selectedMarkets.length > 1 ? t`max` : ''}` : '--%'}
            </ThemedText.BodyPrimary>
          </FeeWrapper>
        </MouseoverTooltip>
      </FeeColumnWrapper>

      <ReturnColumn>
        <EthPriceDisplay ethPrice={userReceives} />
      </ReturnColumn>
    </Row>
  )
}

const EthPriceDisplay = ({ ethPrice = 0 }: { ethPrice?: number }) => {
  const { formatNumberOrString } = useFormatter()
  const ethUsdPrice = useNativeUsdPrice()

  return (
    <Row width="100%" justify="flex-end">
      <ThemedText.BodyPrimary lineHeight="24px" color={ethPrice ? 'neutral1' : 'neutral2'} textAlign="right">
        {ethPrice !== 0 ? (
          <Column>
            <span>{formatNumberOrString({ input: ethPrice, type: NumberType.NFTToken })} ETH</span>
            <ThemedText.BodyPrimary color="neutral2">
              {formatNumberOrString({ input: ethPrice * ethUsdPrice, type: NumberType.FiatNFTToken })}
            </ThemedText.BodyPrimary>
          </Column>
        ) : (
          '- ETH'
        )}
      </ThemedText.BodyPrimary>
    </Row>
  )
}
