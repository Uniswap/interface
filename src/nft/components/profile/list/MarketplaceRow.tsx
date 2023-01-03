// eslint-disable-next-line no-restricted-imports
import { t } from '@lingui/macro'
import { MouseoverTooltip } from 'components/Tooltip'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { body, bodySmall } from 'nft/css/common.css'
import { useSellAsset } from 'nft/hooks'
import { ListingMarket, ListingWarning, WalletAsset } from 'nft/types'
import { LOOKS_RARE_CREATOR_BASIS_POINTS } from 'nft/utils'
import { formatEth, formatUsdPrice } from 'nft/utils/currency'
import { fetchPrice } from 'nft/utils/fetchPrice'
import { Dispatch, useEffect, useMemo, useState } from 'react'

import * as styles from './ListPage.css'
import { SetPriceMethod } from './NFTListingsGrid'
import { PriceTextInput } from './PriceTextInput'
import { RoyaltyTooltip } from './RoyaltyTooltip'

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
}: MarketplaceRowProps) => {
  const [listPrice, setListPrice] = useState<number>()
  const [globalOverride, setGlobalOverride] = useState(false)
  const showGlobalPrice = globalPriceMethod === SetPriceMethod.SAME_PRICE && !globalOverride && globalPrice
  const setAssetListPrice = useSellAsset((state) => state.setAssetListPrice)
  const removeAssetMarketplace = useSellAsset((state) => state.removeAssetMarketplace)
  const [hovered, setHovered] = useState(false)
  const handleHover = () => setHovered(!hovered)

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
    } else if (globalPriceMethod === SetPriceMethod.PREV_LISTING) {
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
      price = globalPrice
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
    <Row transition="500" marginLeft="0">
      <Column
        className={bodySmall}
        color="textSecondary"
        textAlign="left"
        flex="1"
        display={{ sm: 'none', xxl: 'flex' }}
      >
        {asset.floorPrice ? `${asset.floorPrice.toFixed(3)} ETH` : '-'}
      </Column>
      <Column
        className={bodySmall}
        color="textSecondary"
        textAlign="left"
        flex="1"
        display={{ sm: 'none', xxl: 'flex' }}
      >
        {asset.lastPrice ? `${asset.lastPrice.toFixed(3)} ETH` : '-'}
      </Column>

      <Row flex="2">
        {showMarketplaceLogo && (
          <Column
            position="relative"
            cursor="pointer"
            onMouseEnter={handleHover}
            onMouseLeave={handleHover}
            onClick={(e) => {
              e.stopPropagation()
              removeAssetMarketplace(asset, selectedMarkets[0])
              removeMarket && removeMarket()
            }}
          >
            <Box className={styles.removeMarketplace} visibility={hovered ? 'visible' : 'hidden'} position="absolute">
              <Box as="img" width="32" src="/nft/svgs/minusCircle.svg" alt="Remove item" />
            </Box>
            <Box
              as="img"
              alt={selectedMarkets[0].name}
              width="28"
              height="28"
              borderRadius="4"
              objectFit="cover"
              src={selectedMarkets[0].icon}
              marginRight="16"
            />
          </Column>
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
            shrink={expandMarketplaceRows}
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
            shrink={expandMarketplaceRows}
          />
        )}
      </Row>

      <Column flex="1" display={{ sm: 'none', lg: 'flex' }}>
        <Box className={body} color="textSecondary" width="full" textAlign="right">
          <MouseoverTooltip
            text={
              <Row>
                <Box width="full" fontSize="14">
                  {selectedMarkets.map((selectedMarket, index) => {
                    return <RoyaltyTooltip selectedMarket={selectedMarket} key={index} />
                  })}
                </Box>
              </Row>
            }
            placement="left"
          >
            {fees > 0 ? `${fees}${selectedMarkets.length > 1 ? t`% max` : '%'}` : '--%'}
          </MouseoverTooltip>
        </Box>
      </Column>

      <Column flex="1.5" display={{ sm: 'none', lg: 'flex' }}>
        <Column width="full">
          <EthPriceDisplay ethPrice={userReceives} />
        </Column>
      </Column>
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
    <Column width="full">
      <Row width="full" justifyContent="flex-end" color={ethPrice !== 0 ? 'textPrimary' : 'textSecondary'}>
        {ethPrice !== 0 ? (
          <>
            <Column>
              <Box className={body} color="textPrimary" textAlign="right" marginLeft="12" marginRight="0">
                {formatEth(ethPrice)} ETH
              </Box>
              <Box className={body} color="textSecondary" textAlign="right" marginLeft="12" marginRight="0">
                {formatUsdPrice(ethPrice * ethConversion)}
              </Box>
            </Column>
          </>
        ) : (
          '- ETH'
        )}
      </Row>
    </Column>
  )
}
