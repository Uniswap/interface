import { SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, TouchableAreaEvent } from 'ui/src'
import { ButtonProps } from 'ui/src/components/buttons/Button/types'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/useMaxAmountSpend'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { MaxBalanceInfoModal } from 'uniswap/src/features/transactions/modals/MaxBalanceInfoModal'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'

const PRESET_MAX = 100
export type PresetPercentage = 25 | 50 | 75 | 100

/**
 * Returns the currency amount for the specified percentage of the passed in raw value.
 * If the currency amount is less than the max amount the user has it returns 0.
 */
function getPercentageOfCurrencyAmount({
  currency,
  rawBalanceAmount,
  percent,
  rawMaxAmount,
}: {
  currency: Maybe<Currency>
  rawBalanceAmount: Maybe<JSBI>
  percent: PresetPercentage
  rawMaxAmount?: JSBI
}): Maybe<CurrencyAmount<Currency>> {
  if (!rawBalanceAmount) {
    return undefined
  }

  const rawPercentageValue = JSBI.divide(JSBI.multiply(rawBalanceAmount, JSBI.BigInt(percent)), JSBI.BigInt(100))

  const amount = JSBI.GT(rawPercentageValue, rawMaxAmount) ? '0' : rawPercentageValue.toString()

  return getCurrencyAmount({
    value: amount,
    valueType: ValueType.Raw,
    currency,
  })
}

interface PresetAmountButtonProps {
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency> | null | undefined
  onSetPresetValue: (amount: string, isLessThanMax?: boolean) => void
  currencyField: CurrencyField
  percentage?: PresetPercentage
  transactionType?: TransactionType
  buttonProps?: ButtonProps
}

export function PresetAmountButton({
  currencyAmount,
  currencyBalance,
  percentage = 100,
  onSetPresetValue,
  currencyField,
  transactionType,
  buttonProps,
}: PresetAmountButtonProps): JSX.Element {
  const isNativeAsset = !!currencyBalance?.currency.isNative
  const [isShowingMaxNativeBalanceModal, setIsShowingMaxNativeBalanceModal] = useState(false)

  const maxInputAmount = useMaxAmountSpend({ currencyAmount: currencyBalance, txType: transactionType })
  const presetValueAmount = useMemo(() => {
    if (percentage === 100) {
      return maxInputAmount
    }

    return getPercentageOfCurrencyAmount({
      currency: currencyBalance?.currency,
      rawBalanceAmount: currencyBalance?.quotient,
      percent: percentage,
      rawMaxAmount: maxInputAmount?.quotient,
    })
  }, [currencyBalance?.currency, currencyBalance?.quotient, percentage, maxInputAmount])

  // Disable max button if max already set or when balance is not sufficient
  const disablePresetButton =
    !presetValueAmount ||
    !presetValueAmount.greaterThan(0) ||
    (percentage === PRESET_MAX && currencyAmount?.toExact() === presetValueAmount.toExact())

  const presetValueAmountRef = useRef(presetValueAmount)
  presetValueAmountRef.current = presetValueAmount

  const onPress = useCallback(
    (event: TouchableAreaEvent): void => {
      event.stopPropagation()

      if (disablePresetButton) {
        if (isNativeAsset) {
          setIsShowingMaxNativeBalanceModal(true)
        }
        return
      }

      if (presetValueAmountRef.current) {
        // We use `maxPresetAmountRef` instead of `maxPresetAmount` so that we can get the latest value
        // and avoid this callback function having to depend on `maxPresetAmount` because that would mean
        // it would recreate this function on every render (which would cause the button to re-render and ignore the `memo`).
        onSetPresetValue(presetValueAmountRef.current.toExact(), percentage < PRESET_MAX)
      }
    },
    [disablePresetButton, onSetPresetValue, isNativeAsset, percentage],
  )

  // We split this out into 2 components so it can be efficiently memoized.
  return (
    <PresetButtonContent
      percentage={percentage}
      isShowingMaxNativeBalanceModal={isShowingMaxNativeBalanceModal}
      disabled={disablePresetButton}
      currencyField={currencyField}
      isNativeAsset={isNativeAsset}
      currencySymbol={currencyBalance?.currency.symbol}
      setIsShowingMaxNativeBalanceModal={setIsShowingMaxNativeBalanceModal}
      {...buttonProps}
      onPress={onPress}
    />
  )
}

const PresetButtonContent = memo(function _PresetButtonContent({
  percentage,
  disabled,
  onPress,
  currencyField,
  isShowingMaxNativeBalanceModal,
  isNativeAsset,
  currencySymbol,
  setIsShowingMaxNativeBalanceModal,
  size = 'xxsmall',
  variant = 'branded',
  emphasis = 'secondary',
  fill = false,
  py,
}: {
  percentage: PresetPercentage
  disabled: boolean
  onPress: (event: TouchableAreaEvent) => void
  currencyField: CurrencyField
  isShowingMaxNativeBalanceModal: boolean
  isNativeAsset: boolean
  currencySymbol?: string
  setIsShowingMaxNativeBalanceModal: (value: boolean) => void
} & ButtonProps): JSX.Element {
  const { t } = useTranslation()

  const handleMaxBalanceInfoModalClose = useCallback(() => {
    setIsShowingMaxNativeBalanceModal(false)
  }, [setIsShowingMaxNativeBalanceModal])

  const isMax = percentage === PRESET_MAX

  return (
    <Trace
      logPress
      eventOnTrigger={SwapEventName.SWAP_MAX_TOKEN_AMOUNT_SELECTED}
      element={currencyField === CurrencyField.INPUT ? ElementName.SetMaxInput : ElementName.SetMaxOutput}
    >
      <MaxBalanceInfoModal
        isMax={isMax}
        // triggers on tap (mob)
        isModalOpen={isShowingMaxNativeBalanceModal}
        // triggers on hover (ext/web)
        isTooltipEnabled={isNativeAsset && disabled}
        currencySymbol={currencySymbol}
        onClose={handleMaxBalanceInfoModalClose}
      >
        <Button
          fill={fill}
          py={py}
          variant={variant}
          emphasis={emphasis}
          size={size}
          isDisabled={disabled}
          testID={currencyField === CurrencyField.INPUT ? TestID.SetMaxInput : TestID.SetMaxOutput}
          onPress={onPress}
        >
          {isMax ? t('swap.button.max') : `${percentage}%`}
        </Button>
      </MaxBalanceInfoModal>
    </Trace>
  )
})
