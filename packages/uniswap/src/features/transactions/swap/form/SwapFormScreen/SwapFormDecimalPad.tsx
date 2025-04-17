import { MutableRefObject, RefObject, useMemo, useState } from 'react'
import type { LayoutChangeEvent, TextInputProps } from 'react-native'
import { Flex, type ButtonProps, type FlexProps } from 'ui/src'
import { AmountInputPresets } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets'
import { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/PresetAmountButton'
import { MAX_FIAT_INPUT_DECIMALS } from 'uniswap/src/constants/transactions'
import { Experiments, Layers, SwapPresetsProperties } from 'uniswap/src/features/gating/experiments'
import { useExperimentValueFromLayer } from 'uniswap/src/features/gating/hooks'
import {
  DecimalPadCalculateSpace,
  DecimalPadCalculatedSpaceId,
  DecimalPadInput,
  DecimalPadInputRef,
} from 'uniswap/src/features/transactions/DecimalPadInput/DecimalPadInput'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useDecimalPadControlledField } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/hooks/useDecimalPadControlledField'
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

export function SwapFormDecimalPad({
  decimalPadRef,
  onSetPresetValue,
  resetSelection,
  inputSelectionRef,
  outputSelectionRef,
  decimalPadValueRef,
  onDecimalPadTriggerInputShake,
}: SwapFormDecimalPadProps): JSX.Element {
  const areInputPresetsEnabled = useExperimentValueFromLayer<Layers.SwapPage, Experiments.SwapPresets, boolean>(
    Layers.SwapPage,
    SwapPresetsProperties.InputEnabled,
    false,
  )

  const {
    isFiatMode,
    exactCurrencyField,
    derivedSwapInfo: { currencyAmounts, currencyBalances, currencies },
    updateSwapForm,
  } = useSwapFormContext()

  const { value: isDecimalPadReady, setTrue: setDecimalPadIsReady } = useBooleanState(false)

  const decimalPadControlledField = useDecimalPadControlledField()

  const trace = useTrace()

  const setValue = useEvent((value: string): void => {
    const currentIsFiatMode = isFiatMode && decimalPadControlledField === exactCurrencyField
    const currentMaxDecimals = currentIsFiatMode
      ? MAX_FIAT_INPUT_DECIMALS
      : currencies[decimalPadControlledField]?.currency.decimals ?? 0

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
    : currencies[decimalPadControlledField]?.currency.decimals ?? 0

  const [additionalElementsHeight, setAdditionalElementsHeight] = useState<number | null>(null)

  const onAmountInputPresetsLayout = useEvent((event: LayoutChangeEvent): void => {
    setAdditionalElementsHeight(event.nativeEvent.layout.height)
  })

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
          {areInputPresetsEnabled && currencyBalances[CurrencyField.INPUT] && (
            <AmountInputPresets
              flex={1}
              gap="$gap8"
              pb="$padding16"
              currencyAmount={currencyAmounts[CurrencyField.INPUT]}
              currencyBalance={currencyBalances[CurrencyField.INPUT]}
              buttonProps={AMOUNT_INPUT_PRESET_BUTTON_PROPS}
              onSetPresetValue={onSetPresetValue}
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
