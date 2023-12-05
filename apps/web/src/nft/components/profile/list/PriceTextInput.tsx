import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import Row from 'components/Row'
import { BrokenLinkIcon } from 'nft/components/icons'
import { NumericInput } from 'nft/components/layout/Input'
import { useUpdateInputAndWarnings } from 'nft/components/profile/list/utils'
import { body } from 'nft/css/common.css'
import { useSellAsset } from 'nft/hooks'
import { WalletAsset } from 'nft/types'
import { Dispatch, useRef, useState } from 'react'
import { AlertTriangle, Link } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { colors } from 'theme/colors'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { WarningType } from './shared'

const PriceTextInputWrapper = styled(Column)`
  gap: 12px;
  position: relative;
`

const InputWrapper = styled(Row)<{ borderColor: string }>`
  height: 48px;
  color: ${({ theme }) => theme.neutral3};
  padding: 12px;
  border: 2px solid;
  border-radius: 8px;
  border-color: ${({ borderColor }) => borderColor};
  margin-right: auto;
  box-sizing: border-box;
`

const CurrencyWrapper = styled.div<{ listPrice?: number }>`
  color: ${({ listPrice, theme }) => (listPrice ? theme.neutral1 : theme.neutral2)};
`

const GlobalPriceIcon = styled.div`
  display: flex;
  cursor: pointer;
  position: absolute;
  bottom: 32px;
  right: -10px;
  background-color: ${({ theme }) => theme.surface1};
  border-radius: 50%;
  height: 28px;
  width: 28px;
  align-items: center;
  justify-content: center;
`

const WarningRow = styled(Row)`
  gap: 4px;
`

const WarningMessage = styled(Row)<{ $color: string }>`
  top: 52px;
  width: max-content;
  position: absolute;
  right: 0;
  font-weight: 535;
  font-size: 10px;
  line-height: 12px;
  color: ${({ $color }) => $color};

  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    right: unset;
  }
`

const WarningAction = styled.div`
  cursor: pointer;
  color: ${({ theme }) => theme.accent1};
`

const getWarningMessage = (warning: WarningType) => {
  let message = <></>
  switch (warning) {
    case WarningType.BELOW_FLOOR:
      message = <Trans>below floor price.</Trans>
      break
    case WarningType.ALREADY_LISTED:
      message = <Trans>Already listed at</Trans>
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
  asset: WalletAsset
}

export const PriceTextInput = ({
  listPrice,
  setListPrice,
  isGlobalPrice,
  setGlobalOverride,
  globalOverride,
  asset,
}: PriceTextInputProps) => {
  const { formatNumberOrString, formatDelta } = useFormatter()
  const [warningType, setWarningType] = useState(WarningType.NONE)
  const removeSellAsset = useSellAsset((state) => state.removeSellAsset)
  const showResolveIssues = useSellAsset((state) => state.showResolveIssues)
  const inputRef = useRef() as React.MutableRefObject<HTMLInputElement>
  const theme = useTheme()

  const percentBelowFloor = (1 - (listPrice ?? 0) / (asset.floorPrice ?? 0)) * 100
  const warningColor =
    (showResolveIssues && !listPrice) ||
    warningType === WarningType.ALREADY_LISTED ||
    (warningType === WarningType.BELOW_FLOOR && percentBelowFloor >= 20)
      ? colors.red400
      : warningType === WarningType.BELOW_FLOOR
      ? theme.deprecated_accentWarning
      : isGlobalPrice || !!listPrice
      ? theme.accent1
      : theme.neutral2

  const setPrice = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!listPrice && event.target.value.includes('.') && parseFloat(event.target.value) === 0) {
      return
    }
    const val = parseFloat(event.target.value)
    setListPrice(isNaN(val) ? undefined : val)
  }

  useUpdateInputAndWarnings(setWarningType, inputRef, asset, listPrice)

  return (
    <PriceTextInputWrapper>
      <InputWrapper borderColor={warningColor}>
        <NumericInput
          as="input"
          pattern="[0-9]"
          borderStyle="none"
          className={body}
          color={{ placeholder: 'neutral2', default: 'neutral1' }}
          placeholder="0"
          backgroundColor="none"
          width={{ sm: '54', md: '68' }}
          ref={inputRef}
          onChange={setPrice}
        />
        <CurrencyWrapper listPrice={listPrice}>&nbsp;ETH</CurrencyWrapper>
        {(isGlobalPrice || globalOverride) && (
          <GlobalPriceIcon onClick={() => setGlobalOverride(!globalOverride)}>
            {globalOverride ? <BrokenLinkIcon /> : <Link size={20} color={warningColor} />}
          </GlobalPriceIcon>
        )}
      </InputWrapper>
      <WarningMessage $color={warningColor}>
        {warningType !== WarningType.NONE && (
          <WarningRow>
            <AlertTriangle height={16} width={16} color={warningColor} />
            <span>
              {warningType === WarningType.BELOW_FLOOR && `${formatDelta(percentBelowFloor)} `}
              {getWarningMessage(warningType)}
              &nbsp;
              {warningType === WarningType.ALREADY_LISTED &&
                `${formatNumberOrString({
                  input: asset?.floor_sell_order_price ?? 0,
                  type: NumberType.NFTToken,
                })} ETH`}
            </span>
            <WarningAction
              onClick={() => {
                warningType === WarningType.ALREADY_LISTED && removeSellAsset(asset)
                setWarningType(WarningType.NONE)
              }}
            >
              {warningType === WarningType.BELOW_FLOOR ? <Trans>Dismiss</Trans> : <Trans>Remove item</Trans>}
            </WarningAction>
          </WarningRow>
        )}
      </WarningMessage>
    </PriceTextInputWrapper>
  )
}
