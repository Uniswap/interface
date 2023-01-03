import { Trans } from '@lingui/macro'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { AttachPriceIcon, EditPriceIcon } from 'nft/components/icons'
import { NumericInput } from 'nft/components/layout/Input'
import { badge, body } from 'nft/css/common.css'
import { useSellAsset } from 'nft/hooks'
import { ListingWarning, WalletAsset } from 'nft/types'
import { formatEth } from 'nft/utils/currency'
import { Dispatch, FormEvent, useEffect, useRef, useState } from 'react'

enum WarningType {
  BELOW_FLOOR,
  ALREADY_LISTED,
  NONE,
}

const getWarningMessage = (warning: WarningType) => {
  let message = <></>
  switch (warning) {
    case WarningType.BELOW_FLOOR:
      message = <Trans>LISTING BELOW FLOOR </Trans>
      break
    case WarningType.ALREADY_LISTED:
      message = <Trans>ALREADY LISTED FOR </Trans>
      break
  }
  return message
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
        right={{ sm: '0', md: 'unset' }}
      >
        {warning
          ? warning.message
          : warningType !== WarningType.NONE && (
              <>
                {getWarningMessage(warningType)}
                &nbsp;
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
                  {warningType === WarningType.BELOW_FLOOR ? <Trans>DISMISS</Trans> : <Trans>REMOVE ITEM</Trans>}
                </Box>
              </>
            )}
      </Row>
    </Column>
  )
}
