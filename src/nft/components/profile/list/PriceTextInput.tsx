import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { AttachPriceIcon, EditPriceIcon } from 'nft/components/icons'
import { NumericInput } from 'nft/components/layout/Input'
import { body } from 'nft/css/common.css'
import { useSellAsset } from 'nft/hooks'
import { ListingWarning, WalletAsset } from 'nft/types'
import { formatEth } from 'nft/utils/currency'
import { Dispatch, FormEvent, useEffect, useRef, useState } from 'react'
import styled, { useTheme } from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'
import { colors } from 'theme/colors'

const PriceTextInputWrapper = styled(Column)`
  gap: 12px;
  position: relative;
`

const InputWrapper = styled(Row)<{ borderColor: string }>`
  height: 44px;
  color: ${({ theme }) => theme.textTertiary};
  padding: 4px;
  border: 2px solid;
  border-radius: 8px;
  border-color: ${({ borderColor }) => borderColor};
  margin-right: auto;
  box-sizing: border-box;
`

const CurrencyWrapper = styled.div<{ listPrice: number | undefined }>`
  margin-right: 16px;
  color: ${({ listPrice, theme }) => (listPrice ? theme.textPrimary : theme.textSecondary)};
`

const GlobalPriceIcon = styled.div`
  display: block;
  cursor: pointer;
  position: absolute;
  top: -6px;
  right: -4px;
  background-color: ${({ theme }) => theme.backgroundSurface};
`

const WarningMessage = styled(Row)<{ warningType: WarningType }>`
  top: 52px;
  width: max-content;
  position: absolute;
  right: 0;
  font-weight: 600;
  font-size: 10px;
  line-height: 12px;
  color: ${({ warningType, theme }) => (warningType === WarningType.BELOW_FLOOR ? colors.red400 : theme.textSecondary)};

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    right: unset;
  }
`

const WarningAction = styled.div<{ warningType: WarningType }>`
  margin-left: 8px;
  cursor: pointer;
  color: ${({ warningType, theme }) => (warningType === WarningType.BELOW_FLOOR ? theme.accentAction : colors.red400)};
`

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
  const theme = useTheme()

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

  const borderColor =
    warningType !== WarningType.NONE && !focused
      ? colors.red400
      : isGlobalPrice
      ? theme.accentAction
      : listPrice != null
      ? theme.textSecondary
      : theme.accentAction

  return (
    <PriceTextInputWrapper>
      <InputWrapper borderColor={borderColor}>
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
        <CurrencyWrapper listPrice={listPrice}>&nbsp;ETH</CurrencyWrapper>
        {(isGlobalPrice || globalOverride) && (
          <GlobalPriceIcon onClick={() => setGlobalOverride(!globalOverride)}>
            {globalOverride ? <AttachPriceIcon /> : <EditPriceIcon />}
          </GlobalPriceIcon>
        )}
      </InputWrapper>
      <WarningMessage warningType={warningType}>
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
                <WarningAction
                  warningType={warningType}
                  onClick={() => {
                    warningType === WarningType.ALREADY_LISTED && removeSellAsset(asset)
                    setWarningType(WarningType.NONE)
                  }}
                >
                  {warningType === WarningType.BELOW_FLOOR ? <Trans>DISMISS</Trans> : <Trans>REMOVE ITEM</Trans>}
                </WarningAction>
              </>
            )}
      </WarningMessage>
    </PriceTextInputWrapper>
  )
}
