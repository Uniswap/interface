import { Box } from 'nft/components/Box'
import { SortDropdown } from 'nft/components/common/SortDropdown'
import { Column, Row } from 'nft/components/Flex'
import { AttachPriceIcon, EditPriceIcon, RowsCollpsedIcon, RowsExpandedIcon, VerifiedIcon } from 'nft/components/icons'
import { NumericInput } from 'nft/components/layout/Input'
import { badge, body, bodySmall, subheadSmall } from 'nft/css/common.css'
import { useSellAsset } from 'nft/hooks'
import { DropDownOption, ListingMarket, ListingWarning, WalletAsset } from 'nft/types'
import { LOOKS_RARE_CREATOR_BASIS_POINTS } from 'nft/utils'
import { formatEth, formatUsdPrice } from 'nft/utils/currency'
import { fetchPrice } from 'nft/utils/fetchPrice'
import { Dispatch, FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import * as styles from './ListPage.css'

enum SetPriceMethod {
  SAME_PRICE,
  FLOOR_PRICE,
  PREV_LISTING,
}

export const NFTListingsGrid = ({ selectedMarkets }: { selectedMarkets: ListingMarket[] }) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const [globalPriceMethod, setGlobalPriceMethod] = useState<SetPriceMethod>()
  const [globalPrice, setGlobalPrice] = useState<number>()

  const priceDropdownOptions: DropDownOption[] = useMemo(
    () => [
      {
        displayText: 'Same price',
        onClick: () => setGlobalPriceMethod(SetPriceMethod.SAME_PRICE),
      },
      {
        displayText: 'Floor price',
        onClick: () => setGlobalPriceMethod(SetPriceMethod.FLOOR_PRICE),
      },
      {
        displayText: 'Prev. listing',
        onClick: () => setGlobalPriceMethod(SetPriceMethod.PREV_LISTING),
      },
    ],
    []
  )

  return (
    <Column>
      <Row marginTop="20">
        <Column
          marginLeft={selectedMarkets.length > 1 ? '36' : '0'}
          transition="500"
          className={bodySmall}
          color="textSecondary"
          flex="2"
        >
          NFT
        </Column>
        <Row flex={{ sm: '1.5', md: '3' }}>
          <Column className={subheadSmall} flex="1.5">
            <SortDropdown dropDownOptions={priceDropdownOptions} mini miniPrompt="Set price by" />
          </Column>
          <Column
            className={bodySmall}
            color="textSecondary"
            flex="1"
            display={{ sm: 'none', md: 'flex' }}
            textAlign="right"
          >
            Marketplace fee
          </Column>
          <Column
            className={bodySmall}
            color="textSecondary"
            flex="1"
            display={{ sm: 'none', md: 'flex' }}
            textAlign="right"
          >
            Royalties
          </Column>
          <Column
            className={bodySmall}
            color="textSecondary"
            style={{ flex: '1.5' }}
            display={{ sm: 'none', md: 'flex' }}
            textAlign="right"
          >
            You receive
          </Column>
        </Row>
      </Row>
      {sellAssets.map((asset) => {
        return (
          <>
            <NFTListRow
              asset={asset}
              globalPriceMethod={globalPriceMethod}
              globalPrice={globalPrice}
              setGlobalPrice={setGlobalPrice}
              selectedMarkets={selectedMarkets}
            />
            {sellAssets.indexOf(asset) < sellAssets.length - 1 && <hr className={styles.nftDivider} />}
          </>
        )
      })}
    </Column>
  )
}

enum WarningType {
  BELOW_FLOOR = 'LISTING BELOW FLOOR ',
  ALREADY_LISTED = 'ALREADY LISTED FOR ',
  NONE = '',
}

interface PriceTextInputProps {
  listPrice?: number
  setListPrice: Dispatch<number | undefined>
  isGlobalPrice: boolean
  setGlobalOverride: Dispatch<boolean>
  globalOverride: boolean
  warning?: ListingWarning
  asset: WalletAsset
}

const PriceTextInput = ({
  listPrice,
  setListPrice,
  isGlobalPrice,
  setGlobalOverride,
  globalOverride,
  warning,
  asset,
}: PriceTextInputProps) => {
  const [focused, setFocused] = useState(false)
  const [warningType, setWarningType] = useState(WarningType.NONE)
  const removeMarketplaceWarning = useSellAsset((state) => state.removeMarketplaceWarning)
  const removeSellAsset = useSellAsset((state) => state.removeSellAsset)
  const inputRef = useRef() as React.MutableRefObject<HTMLInputElement>

  useEffect(() => {
    inputRef.current.value = listPrice !== undefined ? `${listPrice}` : ''
    setWarningType(WarningType.NONE)
    if (!warning && listPrice) {
      if (listPrice < asset.floorPrice) setWarningType(WarningType.BELOW_FLOOR)
      else if (asset.floor_sell_order_price && listPrice >= asset.floor_sell_order_price)
        setWarningType(WarningType.ALREADY_LISTED)
    } else if (warning && listPrice && listPrice >= 0) removeMarketplaceWarning(asset, warning)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPrice])

  return (
    <Column gap="12" position="relative">
      <Row
        color="textTertiary"
        height="44"
        width="min"
        padding="4"
        borderRadius="8"
        borderWidth="1px"
        borderStyle="solid"
        borderColor={
          warningType !== WarningType.NONE && !focused
            ? 'orange'
            : isGlobalPrice
            ? 'accentAction'
            : listPrice != null
            ? 'textSecondary'
            : 'blue400'
        }
      >
        <NumericInput
          as="input"
          pattern="[0-9]"
          borderStyle="none"
          className={body}
          color={{ placeholder: 'textSecondary', default: 'textPrimary' }}
          placeholder="0"
          marginRight="0"
          marginLeft="14"
          backgroundColor="none"
          style={{ width: '68px' }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
          }}
          ref={inputRef}
          onChange={(v: FormEvent<HTMLInputElement>) => {
            if (!listPrice && v.currentTarget.value.includes('.') && parseFloat(v.currentTarget.value) === 0) {
              return
            }
            const val = parseFloat(v.currentTarget.value)
            setListPrice(isNaN(val) ? undefined : val)
          }}
        />
        <Box color={listPrice && listPrice >= 0 ? 'textPrimary' : 'textSecondary'} marginRight="16">
          &nbsp;ETH
        </Box>
        <Box
          cursor="pointer"
          display={isGlobalPrice || globalOverride ? 'block' : 'none'}
          position="absolute"
          style={{ marginTop: '-36px', marginLeft: '124px' }}
          backgroundColor="backgroundSurface"
          onClick={() => setGlobalOverride(!globalOverride)}
        >
          {globalOverride ? <AttachPriceIcon /> : <EditPriceIcon />}
        </Box>
      </Row>
      <Row
        top="52"
        width="max"
        className={badge}
        color={warningType === WarningType.BELOW_FLOOR && !focused ? 'orange' : 'textSecondary'}
        position="absolute"
      >
        {focused ? (
          <>
            <Row display={asset.lastPrice ? 'flex' : 'none'} marginRight="8">
              LAST: {formatEth(asset.lastPrice)} ETH
            </Row>
            <Row display={asset.floorPrice ? 'flex' : 'none'}>FLOOR: {formatEth(asset.floorPrice)} ETH</Row>
          </>
        ) : (
          <>
            {warning
              ? warning.message
              : warningType !== WarningType.NONE && (
                  <>
                    {warningType}
                    {warningType === WarningType.BELOW_FLOOR
                      ? formatEth(asset.floorPrice)
                      : formatEth(asset.floor_sell_order_price)}
                    ETH
                    <Box
                      color={warningType === WarningType.BELOW_FLOOR ? 'accentAction' : 'orange'}
                      marginLeft="8"
                      cursor="pointer"
                      onClick={() => {
                        warningType === WarningType.ALREADY_LISTED && removeSellAsset(asset)
                        setWarningType(WarningType.NONE)
                      }}
                    >
                      {warningType === WarningType.BELOW_FLOOR ? 'DISMISS' : 'REMOVE ITEM'}
                    </Box>
                  </>
                )}
          </>
        )}
      </Row>
    </Column>
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
      <Row width="full" justifyContent="flex-end">
        {ethPrice !== 0 ? (
          <>
            <Column>
              <Box className={body} color="textPrimary" marginLeft="12" marginRight="0">
                {ethPrice} ETH
              </Box>
              <Box className={body} color="textSecondary" marginLeft="12" marginRight="0">
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

function maxMarketFee(markets: ListingMarket[]): number {
  let max = -1
  markets.forEach((market) => {
    if (market.fee > max) {
      max = market.fee
    }
  })
  return max
}

interface MarketplaceRowProps {
  globalPriceMethod?: SetPriceMethod
  globalPrice?: number
  setGlobalPrice: Dispatch<number | undefined>
  selectedMarkets: ListingMarket[]
  removeMarket?: () => void
  asset: WalletAsset
  showMarketplaceLogo: boolean
}

const MarketplaceRow = ({
  globalPriceMethod,
  globalPrice,
  setGlobalPrice,
  selectedMarkets,
  removeMarket = undefined,
  asset,
  showMarketplaceLogo,
}: MarketplaceRowProps) => {
  const [listPrice, setListPrice] = useState<number>()
  const [globalOverride, setGlobalOverride] = useState(false)
  const showGlobalPrice = globalPriceMethod === SetPriceMethod.SAME_PRICE && !globalOverride && globalPrice
  const setAssetListPrice = useSellAsset((state) => state.setAssetListPrice)
  const removeAssetMarketplace = useSellAsset((state) => state.removeAssetMarketplace)
  const [hovered, setHovered] = useState(false)
  const handleHover = () => setHovered(!hovered)

  const marketplaceFee = selectedMarkets.length > 0 ? maxMarketFee(selectedMarkets) : 0
  const price = showGlobalPrice ? globalPrice : listPrice
  // LooksRare is a unique case where royalties for creators are a flat 0.5% or 50 basis points
  const royalties =
    (selectedMarkets.length === 1 && selectedMarkets[0].name === 'LooksRare'
      ? LOOKS_RARE_CREATOR_BASIS_POINTS
      : asset.basisPoints) * 0.01
  const feeInEth = price && (price * (royalties + marketplaceFee)) / 100
  const userReceives = price && feeInEth && price - feeInEth

  useEffect(() => {
    if (globalPriceMethod === SetPriceMethod.FLOOR_PRICE) {
      setListPrice(asset.floorPrice)
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
    <Row transition="500" marginLeft={selectedMarkets.length > 1 ? '20' : '0'}>
      {showMarketplaceLogo && (
        <Column
          position="relative"
          cursor="pointer"
          onMouseEnter={handleHover}
          onMouseLeave={handleHover}
          style={{ marginLeft: '-28px' }}
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
      <Column style={{ flex: '1.5' }}>
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
      </Column>
      <Row flex="1" display={{ sm: 'none', md: 'flex' }}>
        <Box className={body} color="textSecondary" width="full" textAlign="right">
          {marketplaceFee > 0 ? marketplaceFee + (selectedMarkets.length > 1 ? '% MAX' : '%') : '--%'}
        </Box>
      </Row>
      <Row flex="1" display={{ sm: 'none', md: 'flex' }}>
        <Box className={body} color="textSecondary" width="full" textAlign="right">
          {royalties.toFixed(1)}%
        </Box>
      </Row>
      <Row style={{ flex: '1.5' }} display={{ sm: 'none', md: 'flex' }}>
        <Column width="full">
          <EthPriceDisplay ethPrice={userReceives} />
        </Column>
      </Row>
    </Row>
  )
}

interface NFTListRowProps {
  asset: WalletAsset
  globalPriceMethod?: SetPriceMethod
  setGlobalPrice: Dispatch<number | undefined>
  globalPrice?: number
  selectedMarkets: ListingMarket[]
}

const NFTListRow = ({ asset, globalPriceMethod, globalPrice, setGlobalPrice, selectedMarkets }: NFTListRowProps) => {
  const [expandMarketplaceRows, setExpandMarketplaceRows] = useState(false)
  const removeAsset = useSellAsset((state) => state.removeSellAsset)
  const [localMarkets, setLocalMarkets] = useState([])
  const [hovered, setHovered] = useState(false)
  const handleHover = () => setHovered(!hovered)

  useEffect(() => {
    setLocalMarkets(JSON.parse(JSON.stringify(selectedMarkets)))
    selectedMarkets.length < 2 && setExpandMarketplaceRows(false)
  }, [selectedMarkets])

  return (
    <Row marginTop="24" marginBottom="24">
      <Row flexWrap="nowrap" flex="2" marginTop="0" marginBottom="auto" minWidth="0">
        <Box
          transition="500"
          style={{
            maxWidth: localMarkets.length > 1 ? '28px' : '0',
            opacity: localMarkets.length > 1 ? '1' : '0',
          }}
          cursor="pointer"
          onClick={() => setExpandMarketplaceRows(!expandMarketplaceRows)}
        >
          {expandMarketplaceRows ? <RowsExpandedIcon /> : <RowsCollpsedIcon />}
        </Box>
        <Box
          position="relative"
          cursor="pointer"
          onMouseEnter={handleHover}
          onMouseLeave={handleHover}
          onClick={() => {
            removeAsset(asset)
          }}
        >
          <Box className={styles.removeAsset} visibility={hovered ? 'visible' : 'hidden'} position="absolute">
            <Box as="img" width="32" src="/nft/svgs/minusCircle.svg" alt="Remove item" />
          </Box>
          <Box
            as="img"
            alt={asset.name}
            width="48"
            height="48"
            borderRadius="8"
            marginLeft={localMarkets.length > 1 ? '8' : '0'}
            marginRight="8"
            transition="500"
            src={asset.imageUrl || '/nft/svgs/image-placeholder.svg'}
          />
        </Box>
        <Column gap="4" minWidth="0">
          <Box paddingRight="8" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" className={subheadSmall}>
            {asset.name ? asset.name : `#${asset.tokenId}`}
          </Box>
          <Box paddingRight="8" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" className={bodySmall}>
            {asset.collection?.name}
            {asset.collectionIsVerified && <VerifiedIcon style={{ marginBottom: '-5px' }} />}
          </Box>
        </Column>
      </Row>
      <Column flex={{ sm: '1', md: '3' }} gap="24">
        {expandMarketplaceRows ? (
          localMarkets.map((market, index) => {
            return (
              <MarketplaceRow
                globalPriceMethod={globalPriceMethod}
                globalPrice={globalPrice}
                setGlobalPrice={setGlobalPrice}
                selectedMarkets={[market]}
                removeMarket={() => localMarkets.splice(index, 1)}
                asset={asset}
                showMarketplaceLogo={true}
                key={index}
              />
            )
          })
        ) : (
          <MarketplaceRow
            globalPriceMethod={globalPriceMethod}
            globalPrice={globalPrice}
            setGlobalPrice={setGlobalPrice}
            selectedMarkets={localMarkets}
            asset={asset}
            showMarketplaceLogo={false}
          />
        )}
      </Column>
    </Row>
  )
}
