import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ButtonProps } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PresetPill } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/PresetPill'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import {
  getPresetAmount,
  isMaxPercentage,
  isPresetAmountDisabled,
} from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/utils'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/hooks/useMaxAmountSpend'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { MaxBalanceInfoModal } from 'uniswap/src/features/transactions/modals/MaxBalanceInfoModal'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useEvent } from 'utilities/src/react/hooks'

type ButtonPressEvent = Parameters<NonNullable<ButtonProps['onPress']>>[0]

interface PresetAmountButtonProps {
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency> | null | undefined
  onSetPresetValue: (amount: string, percentage: PresetPercentage) => void
  currencyField: CurrencyField
  elementName?: ElementName
  percentage: PresetPercentage
  transactionType?: TransactionType
  buttonProps?: ButtonProps
  actualGasFee?: string
  isGasCovered?: boolean
}

export function PresetAmountButton({
  currencyAmount,
  currencyBalance,
  percentage,
  elementName,
  onSetPresetValue,
  currencyField,
  transactionType,
  buttonProps,
  actualGasFee,
  isGasCovered,
}: PresetAmountButtonProps): JSX.Element {
  const isNativeAsset = !!currencyBalance?.currency.isNative
  const [isShowingMaxNativeBalanceModal, setIsShowingMaxNativeBalanceModal] = useState(false)

  const maxInputAmount = useMaxAmountSpend({
    currencyAmount: currencyBalance,
    txType: transactionType,
    actualGasFee,
    isGasCovered,
  })
  const presetValueAmount = useMemo(
    () =>
      getPresetAmount({
        percentage,
        currency: currencyBalance?.currency,
        rawBalanceAmount: currencyBalance?.quotient,
        maxInputAmount,
      }),
    [currencyBalance?.currency, currencyBalance?.quotient, percentage, maxInputAmount],
  )

  const disablePresetButton = isPresetAmountDisabled({ percentage, presetAmount: presetValueAmount, currencyAmount })

  const presetValueAmountRef = useRef(presetValueAmount)
  presetValueAmountRef.current = presetValueAmount

  const onPress = useEvent((event: ButtonPressEvent): void => {
    event.stopPropagation()

    if (presetValueAmountRef.current) {
      // We use `maxPresetAmountRef` instead of `maxPresetAmount` so that we can get the latest value
      // and avoid this callback function having to depend on `maxPresetAmount` because that would mean
      // it would recreate this function on every render (which would cause the button to re-render and ignore the `memo`).
      onSetPresetValue(presetValueAmountRef.current.toExact(), percentage)
    }
  })

  const onDisabledPress = useEvent((event: ButtonPressEvent): void => {
    event.stopPropagation()
    if (isNativeAsset) {
      setIsShowingMaxNativeBalanceModal(true)
    }
  })

  // We split this out into 2 components so it can be efficiently memoized.
  return (
    <PresetButtonContent
      percentage={percentage}
      isShowingMaxNativeBalanceModal={isShowingMaxNativeBalanceModal}
      disabled={disablePresetButton}
      currencyField={currencyField}
      elementName={elementName}
      isNativeAsset={isNativeAsset}
      currencySymbol={currencyBalance?.currency.symbol}
      setIsShowingMaxNativeBalanceModal={setIsShowingMaxNativeBalanceModal}
      {...buttonProps}
      onPress={onPress}
      onDisabledPress={onDisabledPress}
    />
  )
}

const PresetButtonContent = memo(function PresetButtonContentInner({
  percentage,
  disabled,
  onPress,
  onDisabledPress,
  currencyField,
  isShowingMaxNativeBalanceModal,
  isNativeAsset,
  currencySymbol,
  elementName,
  setIsShowingMaxNativeBalanceModal,
  ...rest
}: {
  percentage: PresetPercentage
  disabled: boolean
  onPress: NonNullable<ButtonProps['onPress']>
  onDisabledPress: NonNullable<ButtonProps['onDisabledPress']>
  currencyField: CurrencyField
  isShowingMaxNativeBalanceModal: boolean
  isNativeAsset: boolean
  elementName?: ElementName
  currencySymbol?: string
  setIsShowingMaxNativeBalanceModal: (value: boolean) => void
} & ButtonProps): JSX.Element {
  const { t } = useTranslation()

  const handleMaxBalanceInfoModalClose = useCallback(() => {
    setIsShowingMaxNativeBalanceModal(false)
  }, [setIsShowingMaxNativeBalanceModal])

  const isMax = isMaxPercentage(percentage)

  return (
    <MaxBalanceInfoModal
      isMax={isMax}
      // triggers on tap (mob)
      isModalOpen={isShowingMaxNativeBalanceModal}
      // triggers on hover (ext/web)
      isTooltipEnabled={isNativeAsset && disabled}
      currencySymbol={currencySymbol}
      onClose={handleMaxBalanceInfoModalClose}
    >
      <Trace
        logPress
        element={
          elementName ??
          (currencyField === CurrencyField.INPUT ? ElementName.SetPercentageInput : ElementName.SetPercentageOutput)
        }
        properties={{ percentage }}
      >
        <PresetPill
          disabled={disabled}
          testID={currencyField === CurrencyField.INPUT ? TestID.SetMaxInput : TestID.SetMaxOutput}
          onPress={onPress}
          onDisabledPress={onDisabledPress}
          {...rest}
        >
          {isMax ? t('swap.button.max') : `${percentage}%`}
        </PresetPill>
      </Trace>
    </MaxBalanceInfoModal>
  )
})
