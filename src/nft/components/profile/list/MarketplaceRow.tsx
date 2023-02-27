// eslint-disable-next-line no-restricted-imports
import { t } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { RowsCollpsedIcon, RowsExpandedIcon } from 'nft/components/icons'
import { useSellAsset } from 'nft/hooks'
import { ListingMarket, ListingWarning, WalletAsset } from 'nft/types'
import { LOOKS_RARE_CREATOR_BASIS_POINTS } from 'nft/utils'
import { formatEth, formatUsdPrice } from 'nft/utils/currency'
import { fetchPrice } from 'nft/utils/fetchPrice'
import { Dispatch, DispatchWithoutAction, useEffect, useMemo, useReducer, useState } from 'react'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ThemedText } from 'theme'

import { SetPriceMethod } from './NFTListingsGrid'
import { PriceTextInput } from './PriceTextInput'
import { RoyaltyTooltip } from './RoyaltyTooltip'
import { RemoveIconWrap } from './shared'

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

const MarketIcon = styled.img<{ index: number }>`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: cover;
  z-index: ${({ index }) => 2 - index};
  margin-left: ${({ index }) => `${index === 0 ? 0 : -8}px`};
  outline: 1px solid ${({ theme }) => theme.backgroundInteractive};
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

const getRoyalty = (listingMarket: ListingMarket, asset: WalletAsset) => {
  // LooksRare is a unique case where royalties for creators are a flat 0.5% or 50 basis points
  const baseFee = listingMarket.name === 'LooksRare' ? LOOKS_RARE_CREATOR_BASIS_POINTS : asset.basisPoints ?? 0

  return baseFee * 0.01
}

interface MarketplaceRowProps {
  globalPriceMethod?: SetPriceMethod
  globalPrice?: number
  setGlobalPrice: Dispatch<number | undefined>
  selectedMarkets: ListingMarket[]
  removeMarket?: () => void
  asset: WalletAsset
  showMarketplaceLogo: boolean
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
  showMarketplaceLogo,
  expandMarketplaceRows,
  toggleExpandMarketplaceRows,
  rowHovered,
}: MarketplaceRowProps) => {
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
  const showGlobalPrice = globalPriceMethod === SetPriceMethod.SAME_PRICE && !globalOverride && globalPrice

  const price = showGlobalPrice ? globalPrice : listPrice

  const fees = useMemo(() => {
    if (selectedMarkets.length === 1) {
      return getRoyalty(selectedMarkets[0], asset) + selectedMarkets[0].fee
    } else {
      let max = 0
      for (const selectedMarket of selectedMarkets) {
        const fee = selectedMarket.fee + getRoyalty(selectedMarket, asset)
        max = Math.max(fee, max)
      }

      return max
    }
  }, [asset, selectedMarkets])

  const feeInEth = price && (price * fees) / 100
  const userReceives = price && feeInEth && price - feeInEth

  useMemo(() => {
    for (const market of selectedMarkets) {
      if (market && asset && asset.basisPoints) {
        market.royalty = (market.name === 'LooksRare' ? LOOKS_RARE_CREATOR_BASIS_POINTS : asset.basisPoints) * 0.01
      }
    }
  }, [asset, selectedMarkets])

  useEffect(() => {
    if (globalPriceMethod === SetPriceMethod.FLOOR_PRICE) {
      setListPrice(asset?.floorPrice)
      setGlobalPrice(asset.floorPrice)
    } else if (globalPriceMethod === SetPriceMethod.LAST_PRICE) {
      setListPrice(asset.lastPrice)
      setGlobalPrice(asset.lastPrice)
    } else if (globalPriceMethod === SetPriceMethod.SAME_PRICE)
      listPrice && !globalPrice ? setGlobalPrice(listPrice) : setListPrice(globalPrice)

    setGlobalOverride(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalPriceMethod])

  useEffect(() => {
    if (selectedMarkets.length)
      for (const marketplace of selectedMarkets) setAssetListPrice(asset, listPrice, marketplace)
    else setAssetListPrice(asset, listPrice)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPrice])

  useEffect(() => {
    let price: number | undefined = undefined
    if (globalOverride) {
      if (!listPrice) setListPrice(globalPrice)
      price = listPrice ? listPrice : globalPrice
    } else {
      price = listPrice
    }
    if (selectedMarkets.length) for (const marketplace of selectedMarkets) setAssetListPrice(asset, price, marketplace)
    else setAssetListPrice(asset, price)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalOverride])

  useEffect(() => {
    if (globalPriceMethod === SetPriceMethod.SAME_PRICE && !globalOverride) {
      if (selectedMarkets.length)
        for (const marketplace of selectedMarkets) setAssetListPrice(asset, globalPrice, marketplace)
      else setAssetListPrice(asset, globalPrice)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalPrice])

  let warning: ListingWarning | undefined = undefined
  if (asset.listingWarnings && asset.listingWarnings?.length > 0) {
    if (showMarketplaceLogo) {
      for (const listingWarning of asset.listingWarnings) {
        if (listingWarning.marketplace.name === selectedMarkets[0].name) warning = listingWarning
      }
    } else {
      warning = asset.listingWarnings[0]
    }
  }

  return (
    <Row onMouseEnter={toggleMarketRowHovered} onMouseLeave={toggleMarketRowHovered}>
      <FloorPriceInfo>
        <ThemedText.BodyPrimary color="textSecondary" lineHeight="24px">
          {asset.floorPrice ? `${asset.floorPrice.toFixed(3)} ETH` : '-'}
        </ThemedText.BodyPrimary>
      </FloorPriceInfo>
      <LastPriceInfo>
        <ThemedText.BodyPrimary color="textSecondary" lineHeight="24px">
          {asset.lastPrice ? `${asset.lastPrice.toFixed(3)} ETH` : '-'}
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
                <MarketIcon alt={market.name} src={market.icon} index={index} />
                <RemoveMarketplaceWrap hovered={marketIconHovered && (expandMarketplaceRows ?? false)}>
                  <img width="20px" src="/nft/svgs/minusCircle.svg" alt="Remove item" />
                </RemoveMarketplaceWrap>
              </MarketIconWrapper>
            ))}
          </MarketIconsWrapper>
        )}
        {globalPriceMethod === SetPriceMethod.SAME_PRICE && !globalOverride ? (
          <PriceTextInput
            listPrice={globalPrice}
            setListPrice={setGlobalPrice}
            isGlobalPrice={true}
            setGlobalOverride={setGlobalOverride}
            globalOverride={globalOverride}
            warning={warning}
            asset={asset}
          />
        ) : (
          <PriceTextInput
            listPrice={listPrice}
            setListPrice={setListPrice}
            isGlobalPrice={false}
            setGlobalOverride={setGlobalOverride}
            globalOverride={globalOverride}
            warning={warning}
            asset={asset}
          />
        )}
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
            <ThemedText.BodyPrimary color="textSecondary">
              {fees > 0 ? `${fees}${selectedMarkets.length > 1 ? t`% max` : '%'}` : '--%'}
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
  const [ethConversion, setEthConversion] = useState(3000)
  useEffect(() => {
    fetchPrice().then((price) => {
      setEthConversion(price ?? 0)
    })
  }, [])

  return (
    <Row width="100%" justify="flex-end">
      <ThemedText.BodyPrimary lineHeight="24px" color={ethPrice ? 'textPrimary' : 'textSecondary'} textAlign="right">
        {ethPrice !== 0 ? (
          <Column>
            <span>{formatEth(ethPrice)} ETH</span>
            <ThemedText.BodyPrimary color="textSecondary">
              {formatUsdPrice(ethPrice * ethConversion)}
            </ThemedText.BodyPrimary>
          </Column>
        ) : (
          '- ETH'
        )}
      </ThemedText.BodyPrimary>
    </Row>
  )
}
