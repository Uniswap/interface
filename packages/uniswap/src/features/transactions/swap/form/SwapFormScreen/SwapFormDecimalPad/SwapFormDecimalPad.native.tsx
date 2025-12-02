import type { MutableRefObject, RefObject } from 'react'
import { useCallback, useMemo, useState } from 'react'
import type { LayoutChangeEvent, TextInputProps } from 'react-native'
import { type ButtonProps, Flex, type FlexProps } from 'ui/src'
import {
  AmountInputPresets,
  PRESET_BUTTON_PROPS,
} from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/AmountInputPresets'
import { PresetAmountButton } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/PresetAmountButton'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { PRESET_PERCENTAGES } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/utils'
import { MAX_FIAT_INPUT_DECIMALS } from 'uniswap/src/constants/transactions'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import type { DecimalPadInputRef } from 'uniswap/src/features/transactions/components/DecimalPadInput/DecimalPadInput'
import {
  DecimalPadCalculatedSpaceId,
  DecimalPadCalculateSpace,
  DecimalPadInput,
} from 'uniswap/src/features/transactions/components/DecimalPadInput/DecimalPadInput'
import { useDecimalPadControlledField } from 'uniswap/src/features/transactions/swap/form/hooks/useDecimalPadControlledField'
import { useSwapFormScreenStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenStore'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { maybeLogFirstSwapAction } from 'uniswap/src/features/transactions/swap/utils/maybeLogFirstSwapAction'
import { CurrencyField } from 'uniswap/src/types/currency'
import { truncateToMaxDecimals } from 'utilities/src/format/truncateToMaxDecimals'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const SHORT_BREAKPOINT_STYLE: FlexProps['$short'] = { gap: '$none' }

const AMOUNT_INPUT_PRESET_BUTTON_PROPS: ButtonProps = {
  emphasis: 'tertiary',
  size: 'xsmall',
  // set to height of the button for full rounding
  borderRadius: 16,
  fill: true,
}

type SwapFormDecimalPadProps = {
  decimalPadRef: RefObject<DecimalPadInputRef>
  onSetPresetValue: (value: string, percentage: PresetPercentage) => void
  resetSelection: ({
    start,
    end,
    currencyField,
  }: {
    start: number
    end?: number
    currencyField?: CurrencyField
  }) => void
  inputSelectionRef: MutableRefObject<TextInputProps['selection']>
  outputSelectionRef: MutableRefObject<TextInputProps['selection']>
  decimalPadValueRef: MutableRefObject<string>
  onDecimalPadTriggerInputShake: () => void
}

function SwapFormDecimalPadContent({
  decimalPadRef,
  onSetPresetValue,
  resetSelection,
  inputSelectionRef,
  outputSelectionRef,
  decimalPadValueRef,
  onDecimalPadTriggerInputShake,
}: SwapFormDecimalPadProps): JSX.Element {
  const { isFiatMode, exactCurrencyField, updateSwapForm } = useSwapFormStore((s) => ({
    isFiatMode: s.isFiatMode,
    exactCurrencyField: s.exactCurrencyField,
    updateSwapForm: s.updateSwapForm,
  }))

  const { currencyAmounts, currencyBalances, currencies } = useSwapFormStoreDerivedSwapInfo((s) => ({
    currencyAmounts: s.currencyAmounts,
    currencyBalances: s.currencyBalances,
    currencies: s.currencies,
  }))

  const { value: isDecimalPadReady, setTrue: setDecimalPadIsReady } = useBooleanState(false)

  const decimalPadControlledField = useDecimalPadControlledField()

  const trace = useTrace()

  const setValue = useEvent((value: string): void => {
    const currentIsFiatMode = isFiatMode && decimalPadControlledField === exactCurrencyField
    const currentMaxDecimals = currentIsFiatMode
      ? MAX_FIAT_INPUT_DECIMALS
      : (currencies[decimalPadControlledField]?.currency.decimals ?? 0)

    // We disable the `DecimalPad` when the input reaches the max number of decimals,
    // but we still need to truncate in case the user moves the cursor and adds a decimal separator in the middle of the input.
    const truncatedValue = truncateToMaxDecimals({
      value,
      maxDecimals: currentMaxDecimals,
    })

    updateSwapForm({
      exactAmountFiat: currentIsFiatMode ? truncatedValue : undefined,
      exactAmountToken: !currentIsFiatMode ? truncatedValue : undefined,
      exactCurrencyField: decimalPadControlledField,
      focusOnCurrencyField: decimalPadControlledField,
      isFiatMode: currentIsFiatMode,
      presetPercentage: undefined,
    })

    maybeLogFirstSwapAction(trace)
  })

  const selection = useMemo(
    () => ({
      [CurrencyField.INPUT]: inputSelectionRef,
      [CurrencyField.OUTPUT]: outputSelectionRef,
    }),
    [inputSelectionRef, outputSelectionRef],
  )

  const maxDecimals = isFiatMode
    ? MAX_FIAT_INPUT_DECIMALS
    : (currencies[decimalPadControlledField]?.currency.decimals ?? 0)

  const [additionalElementsHeight, setAdditionalElementsHeight] = useState<number | undefined>(undefined)

  const onAmountInputPresetsLayout = useEvent((event: LayoutChangeEvent): void => {
    setAdditionalElementsHeight(event.nativeEvent.layout.height)
  })

  const renderPreset = useCallback(
    (preset: PresetPercentage) => (
      <PresetAmountButton
        percentage={preset}
        currencyAmount={currencyAmounts[CurrencyField.INPUT]}
        currencyBalance={currencyBalances[CurrencyField.INPUT]}
        currencyField={CurrencyField.INPUT}
        elementName={ElementName.PresetPercentage}
        buttonProps={{ ...PRESET_BUTTON_PROPS, ...AMOUNT_INPUT_PRESET_BUTTON_PROPS }}
        onSetPresetValue={onSetPresetValue}
      />
    ),
    [currencyAmounts[CurrencyField.INPUT], currencyBalances[CurrencyField.INPUT], onSetPresetValue],
  )

  return (
    <>
      <DecimalPadCalculateSpace
        id={DecimalPadCalculatedSpaceId.Swap}
        decimalPadRef={decimalPadRef}
        additionalElementsHeight={additionalElementsHeight}
      />

      <Flex
        $short={SHORT_BREAKPOINT_STYLE}
        animation="quick"
        bottom={0}
        gap="$spacing8"
        left={0}
        opacity={isDecimalPadReady ? 1 : 0}
        position="absolute"
        right={0}
      >
        <Flex grow justifyContent="flex-end">
          {/**
           * *********** IMPORTANT! ***********
           *
           * If you add any additional elements inside this `Flex` you need to add the height to `additionalElementsHeight`,
           * otherwise it will break the `DecimalPad` auto-resizing.
           *
           * *********** IMPORTANT! ***********
           */}
          {currencyBalances[CurrencyField.INPUT] && (
            <AmountInputPresets
              flex={1}
              gap="$gap8"
              pb="$padding16"
              presets={PRESET_PERCENTAGES}
              renderPreset={renderPreset}
              onLayout={onAmountInputPresetsLayout}
            />
          )}
          <DecimalPadInput
            ref={decimalPadRef}
            maxDecimals={maxDecimals}
            resetSelection={resetSelection}
            selectionRef={selection[decimalPadControlledField]}
            setValue={setValue}
            valueRef={decimalPadValueRef}
            onReady={setDecimalPadIsReady}
            onTriggerInputShakeAnimation={onDecimalPadTriggerInputShake}
          />
        </Flex>
      </Flex>
    </>
  )
}

export function SwapFormDecimalPad(): JSX.Element {
  const {
    decimalPadRef,
    inputSelectionRef,
    outputSelectionRef,
    decimalPadValueRef,
    resetSelection,
    onSetPresetValue,
    onDecimalPadTriggerInputShake,
  } = useSwapFormScreenStore((state) => ({
    decimalPadRef: state.decimalPadRef,
    inputSelectionRef: state.inputSelectionRef,
    outputSelectionRef: state.outputSelectionRef,
    decimalPadValueRef: state.decimalPadValueRef,
    resetSelection: state.resetSelection,
    onSetPresetValue: state.onSetPresetValue,
    onDecimalPadTriggerInputShake: state.onDecimalPadTriggerInputShake,
  }))

  return (
    <SwapFormDecimalPadContent
      decimalPadRef={decimalPadRef}
      resetSelection={resetSelection}
      inputSelectionRef={inputSelectionRef}
      outputSelectionRef={outputSelectionRef}
      decimalPadValueRef={decimalPadValueRef}
      onSetPresetValue={onSetPresetValue}
      onDecimalPadTriggerInputShake={onDecimalPadTriggerInputShake}
    />
  )
}
