import { Trans } from '@lingui/macro'
// eslint-disable-next-line no-restricted-imports
import { t } from '@lingui/macro'
import { Box } from 'nft/components/Box'
import { SortDropdown } from 'nft/components/common/SortDropdown'
import { Column, Row } from 'nft/components/Flex'
import { AttachPriceIcon, EditPriceIcon } from 'nft/components/icons'
import { NumericInput } from 'nft/components/layout/Input'
import { badge, body, bodySmall, subheadSmall } from 'nft/css/common.css'
import { useSellAsset } from 'nft/hooks'
import { DropDownOption, ListingMarket, ListingWarning, WalletAsset } from 'nft/types'
import { formatEth, formatUsdPrice } from 'nft/utils/currency'
import { fetchPrice } from 'nft/utils/fetchPrice'
import { Dispatch, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components/macro'

import * as styles from './ListPage.css'
import { NFTListRow } from './NFTListRow'

const TableHeader = styled.div`
  display: flex;
  position: sticky;
  align-items: center;
  top: 72px;
  padding-top: 24px;
  padding-bottom: 24px;
  z-index: 1;
  background-color: ${({ theme }) => theme.backgroundBackdrop};
`

export enum SetPriceMethod {
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
      <TableHeader>
        <Column
          marginLeft="0"
          transition="500"
          className={bodySmall}
          color="textSecondary"
          flex={{ sm: '2', md: '1.5' }}
        >
          <Trans>NFT</Trans>
        </Column>
        <Row flex={{ sm: '1', md: '3' }}>
          <Column
            className={bodySmall}
            color="textSecondary"
            flex="1"
            display={{ sm: 'none', md: 'none', xl: 'flex' }}
            textAlign="left"
          >
            <Trans>Floor</Trans>
          </Column>
          <Column
            className={bodySmall}
            color="textSecondary"
            flex="1"
            display={{ sm: 'none', md: 'none', xl: 'flex' }}
            textAlign="left"
          >
            <Trans>Last</Trans>
          </Column>
          <Column className={subheadSmall} flex="2">
            <SortDropdown dropDownOptions={priceDropdownOptions} mini miniPrompt={t`Set price by`} />
          </Column>

          <Column
            className={bodySmall}
            color="textSecondary"
            flex="1"
            display={{ sm: 'none', md: 'none', lg: 'flex' }}
            textAlign="right"
          >
            <Trans>Fees</Trans>
          </Column>
          <Column
            className={bodySmall}
            display={{ sm: 'none', md: 'none', lg: 'flex' }}
            color="textSecondary"
            flex="1.5"
            textAlign="right"
          >
            <Trans>You receive</Trans>
          </Column>
        </Row>
      </TableHeader>
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
  shrink?: boolean
}

export const PriceTextInput = ({
  listPrice,
  setListPrice,
  isGlobalPrice,
  setGlobalOverride,
  globalOverride,
  warning,
  asset,
  shrink,
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
      if (listPrice < (asset?.floorPrice ?? 0)) setWarningType(WarningType.BELOW_FLOOR)
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
        borderWidth="2px"
        borderStyle="solid"
        marginRight="auto"
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
          style={{ width: shrink ? '54px' : '68px' }}
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
            {!!asset.lastPrice && (
              <Row display={asset.lastPrice ? 'flex' : 'none'} marginRight="8">
                LAST: {formatEth(asset.lastPrice)} ETH
              </Row>
            )}
            {!!asset.floorPrice && (
              <Row display={asset.floorPrice ? 'flex' : 'none'}>FLOOR: {formatEth(asset.floorPrice)} ETH</Row>
            )}
          </>
        ) : (
          <>
            {warning
              ? warning.message
              : warningType !== WarningType.NONE && (
                  <>
                    {warningType}
                    {warningType === WarningType.BELOW_FLOOR
                      ? formatEth(asset?.floorPrice ?? 0)
                      : formatEth(asset?.floor_sell_order_price ?? 0)}
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

export const EthPriceDisplay = ({ ethPrice = 0 }: { ethPrice?: number }) => {
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
                {ethPrice} ETH
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
