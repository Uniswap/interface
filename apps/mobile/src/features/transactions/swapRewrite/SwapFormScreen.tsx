import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, TextInput, TextInputProps } from 'react-native'
import {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated'
import { Delay } from 'src/components/layout/Delayed'
import Trace from 'src/components/Trace/Trace'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { useSwapAnalytics } from 'src/features/transactions/swap/analytics'
import { useShowSwapNetworkNotification } from 'src/features/transactions/swap/hooks'
import { isWrapAction } from 'src/features/transactions/swap/utils'
import { useSwapBottomSheetModalContext } from 'src/features/transactions/swapRewrite/contexts/SwapBottomSheetModalContext'
import { CurrencyInputPanel } from 'src/features/transactions/swapRewrite/CurrencyInputPanel'
import {
  DecimalPadInput,
  DecimalPadInputRef,
} from 'src/features/transactions/swapRewrite/DecimalPadInput'
import { GasAndWarningRows } from 'src/features/transactions/swapRewrite/GasAndWarningRows'
import { useSyncFiatAndTokenAmountUpdater } from 'src/features/transactions/swapRewrite/hooks/useSyncFiatAndTokenAmountUpdater'
import { SwapArrowButton } from 'src/features/transactions/swapRewrite/SwapArrowButton'
import { SwapBottomSheetModalInnerContainer } from 'src/features/transactions/swapRewrite/SwapBottomSheetModal'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { AnimatedFlex, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { useSwapFormContext } from './contexts/SwapFormContext'
import { SwapFormHeader } from './SwapFormHeader'
import { TokenSelector } from './TokenSelector'
// eslint-disable-next-line no-restricted-imports
import { formatCurrencyAmount } from 'utilities/src/format/localeBased'

const SWAP_DIRECTION_BUTTON_SIZE = iconSizes.icon24
const SWAP_DIRECTION_BUTTON_INNER_PADDING = spacing.spacing8 + spacing.spacing2
const SWAP_DIRECTION_BUTTON_BORDER_WIDTH = spacing.spacing4

const ON_SELECTION_CHANGE_WAIT_TIME_MS = 500

export function SwapFormScreen({ hideContent }: { hideContent: boolean }): JSX.Element {
  const { handleContentLayout, bottomSheetViewStyles } = useSwapBottomSheetModalContext()
  const { selectingCurrencyField } = useSwapFormContext()

  return (
    <SwapBottomSheetModalInnerContainer
      fullscreen
      bottomSheetViewStyles={bottomSheetViewStyles}
      onLayout={handleContentLayout}>
      <SwapFormHeader />

      {!hideContent && <SwapFormContent />}

      {!hideContent && !!selectingCurrencyField && <TokenSelector />}
    </SwapBottomSheetModalInnerContainer>
  )
}

function SwapFormContent(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const {
    amountUpdatedTimeRef,
    derivedSwapInfo,
    exactAmountFiat,
    exactAmountFiatRef,
    exactAmountToken,
    exactAmountTokenRef,
    exactCurrencyField,
    focusOnCurrencyField,
    input,
    isFiatMode,
    output,
    updateSwapForm,
  } = useSwapFormContext()

  const {
    currencyAmounts,
    currencyBalances,
    currencies,
    currencyAmountsUSDValue,
    chainId,
    wrapType,
    trade,
  } = derivedSwapInfo

  // Updaters
  useSyncFiatAndTokenAmountUpdater()
  useSwapAnalytics(derivedSwapInfo)
  useShowSwapNetworkNotification(chainId)

  const { walletNeedsRestore, openWalletRestoreModal } = useWalletRestore()

  const onRestorePress = (): void => {
    openWalletRestoreModal()
  }

  const focusFieldIsInput = focusOnCurrencyField === CurrencyField.INPUT
  const focusFieldIsOutput = focusOnCurrencyField === CurrencyField.OUTPUT

  const exactFieldIsInput = exactCurrencyField === CurrencyField.INPUT
  const exactFieldIsOutput = exactCurrencyField === CurrencyField.OUTPUT

  // Quote is being fetched for first time
  const isSwapDataLoading = !isWrapAction(wrapType) && trade.loading

  const inputRef = useRef<TextInput>(null)
  const outputRef = useRef<TextInput>(null)
  const decimalPadRef = useRef<DecimalPadInputRef>(null)

  const inputSelectionRef = useRef<TextInputProps['selection']>()
  const outputSelectionRef = useRef<TextInputProps['selection']>()

  const selection = useMemo(
    () => ({
      [CurrencyField.INPUT]: inputSelectionRef,
      [CurrencyField.OUTPUT]: outputSelectionRef,
    }),
    [inputSelectionRef, outputSelectionRef]
  )

  const resetSelection = useCallback(
    (start: number, end?: number) => {
      // Update refs first to have the latest selection state available in the DecimalPadInput
      // component and property update disabled keys of the decimal pad.
      if (focusFieldIsInput) {
        inputSelectionRef.current = { start, end }
      } else if (focusFieldIsOutput) {
        outputSelectionRef.current = { start, end }
      } else return
      // We reset the selection on the next tick because we need to wait for the native input to be updated.
      // This is needed because of the combination of state (delayed update) + ref (instant update) to improve performance.
      setTimeout(() => {
        inputRef.current?.setNativeProps?.({ selection: { start, end } })
      }, 0)
    },
    [focusFieldIsInput, focusFieldIsOutput]
  )

  const decimalPadSetValue = useCallback(
    (value: string): void => {
      if (!focusOnCurrencyField) {
        return
      }
      updateSwapForm({
        exactAmountFiat: isFiatMode ? value : undefined,
        exactAmountToken: !isFiatMode ? value : undefined,
        exactCurrencyField: focusOnCurrencyField,
      })
    },
    [focusOnCurrencyField, isFiatMode, updateSwapForm]
  )

  const [decimalPadReady, setDecimalPadReady] = useState(true)

  const onBottomScreenLayout = useCallback((event: LayoutChangeEvent): void => {
    decimalPadRef.current?.setMaxHeight(event.nativeEvent.layout.height)
  }, [])

  const onDecimalPadReady = useCallback(() => setDecimalPadReady(true), [])

  const decimalPadAndButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(decimalPadReady ? 1 : 0, { duration: Delay.Short / 2 }),
    }
  })

  const onInputSelectionChange = useCallback(
    (start: number, end: number) => {
      if (Date.now() - amountUpdatedTimeRef.current < ON_SELECTION_CHANGE_WAIT_TIME_MS) {
        // We only want to trigger this callback when the user is manually moving the cursor,
        // but this function is also triggered when the input value is updated,
        // which causes issues on Android.
        // We use `amountUpdatedTimeRef` to check if the input value was updated recently,
        // and if so, we assume that the user is actually typing and not manually moving the cursor.
        return
      }
      inputSelectionRef.current = { start, end }
      decimalPadRef.current?.updateDisabledKeys()
    },
    [amountUpdatedTimeRef]
  )
  const onOutputSelectionChange = useCallback(
    (start: number, end: number) => {
      if (Date.now() - amountUpdatedTimeRef.current < ON_SELECTION_CHANGE_WAIT_TIME_MS) {
        // See explanation in `onInputSelectionChange`.
        return
      }
      outputSelectionRef.current = { start, end }
      decimalPadRef.current?.updateDisabledKeys()
    },
    [amountUpdatedTimeRef]
  )

  const onFocusInput = useCallback(
    (): void =>
      updateSwapForm({
        focusOnCurrencyField: CurrencyField.INPUT,
      }),
    [updateSwapForm]
  )

  const onFocusOutput = useCallback(
    (): void =>
      updateSwapForm({
        focusOnCurrencyField: CurrencyField.OUTPUT,
      }),
    [updateSwapForm]
  )

  const onShowTokenSelectorInput = useCallback((): void => {
    updateSwapForm({
      selectingCurrencyField: CurrencyField.INPUT,
    })
  }, [updateSwapForm])

  const onShowTokenSelectorOutput = useCallback((): void => {
    updateSwapForm({
      selectingCurrencyField: CurrencyField.OUTPUT,
    })
  }, [updateSwapForm])

  const onSetExactAmountInput = useCallback(
    (amount: string): void =>
      isFiatMode
        ? updateSwapForm({ exactAmountFiat: amount, exactCurrencyField: CurrencyField.INPUT })
        : updateSwapForm({ exactAmountToken: amount, exactCurrencyField: CurrencyField.INPUT }),
    [isFiatMode, updateSwapForm]
  )

  const onSetExactAmountOutput = useCallback(
    (amount: string): void =>
      isFiatMode
        ? updateSwapForm({ exactAmountFiat: amount, exactCurrencyField: CurrencyField.OUTPUT })
        : updateSwapForm({ exactAmountToken: amount, exactCurrencyField: CurrencyField.OUTPUT }),
    [isFiatMode, updateSwapForm]
  )

  const onSetMax = useCallback(
    (amount: string): void => {
      updateSwapForm({
        exactAmountFiat: undefined,
        exactAmountToken: amount,
        exactCurrencyField: CurrencyField.INPUT,
        focusOnCurrencyField: CurrencyField.INPUT,
      })
      resetSelection(0, 0)
    },
    [resetSelection, updateSwapForm]
  )

  // Reset selection based the new input value (token, or fiat), and toggle fiat mode
  const onToggleIsFiatMode = useCallback(() => {
    updateSwapForm({
      isFiatMode: !isFiatMode,
    })
    // Need to do the opposite of previous mode, as we're selecting the new value after mode update
    if (!isFiatMode) {
      resetSelection(exactAmountFiatRef.current.length, exactAmountFiatRef.current.length)
    } else {
      resetSelection(exactAmountTokenRef.current.length, exactAmountTokenRef.current.length)
    }
  }, [exactAmountFiatRef, exactAmountTokenRef, isFiatMode, resetSelection, updateSwapForm])

  const onSwitchCurrencies = useCallback(() => {
    const newExactCurrencyField = exactFieldIsInput ? CurrencyField.OUTPUT : CurrencyField.INPUT
    updateSwapForm({
      exactCurrencyField: newExactCurrencyField,
      focusOnCurrencyField: newExactCurrencyField,
      input: output,
      output: input,
    })
  }, [exactFieldIsInput, input, output, updateSwapForm])

  const derivedCurrencyField = exactFieldIsInput ? CurrencyField.OUTPUT : CurrencyField.INPUT

  // TODO gary MOB-2028 replace temporary hack to handle different separators
  // Replace with localized version of formatter
  const formattedDerivedValue = formatCurrencyAmount({
    amount: currencyAmounts[derivedCurrencyField],
    locale: 'en-US',
    type: NumberType.SwapTradeAmount,
    placeholder: '',
  })

  // TODO - improve this to update ref when calculating the derived state
  // instead of assigning ref based on the derived state
  const formattedDerivedValueRef = useRef(formattedDerivedValue)
  useEffect(() => {
    formattedDerivedValueRef.current = formattedDerivedValue
  }, [formattedDerivedValue])

  const exactValue = isFiatMode ? exactAmountFiat : exactAmountToken
  const exactValueRef = isFiatMode ? exactAmountFiatRef : exactAmountTokenRef

  // Animated background color on input panels based on focus
  const colorTransitionProgress = useDerivedValue(() => {
    return withTiming(focusFieldIsInput ? 0 : 1, { duration: 250 })
  }, [focusFieldIsInput])

  const inputBackgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        colorTransitionProgress.value,
        [0, 1],
        [colors.surface1.val, colors.surface2.val]
      ),
    }
  })

  const outputBackgroundStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        colorTransitionProgress.value,
        [0, 1],
        [colors.surface2.val, colors.surface1.val]
      ),
    }
  })

  return (
    <Flex grow gap="$spacing8" justifyContent="space-between">
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="$spacing2">
        <Trace section={SectionName.CurrencyInputPanel}>
          <AnimatedFlex
            borderColor="$surface3"
            borderRadius="$rounded20"
            borderWidth={1}
            paddingBottom={currencies[CurrencyField.INPUT] ? '$spacing4' : '$none'}
            style={inputBackgroundStyle}>
            <CurrencyInputPanel
              ref={inputRef}
              currencyAmount={currencyAmounts[CurrencyField.INPUT]}
              currencyBalance={currencyBalances[CurrencyField.INPUT]}
              currencyInfo={currencies[CurrencyField.INPUT]}
              focus={focusFieldIsInput}
              isCollapsed={focusOnCurrencyField ? !focusFieldIsInput : !exactFieldIsInput}
              isFiatMode={isFiatMode && exactFieldIsInput}
              isLoading={!exactFieldIsInput && isSwapDataLoading}
              resetSelection={resetSelection}
              showSoftInputOnFocus={false}
              usdValue={currencyAmountsUSDValue[CurrencyField.INPUT]}
              value={exactFieldIsInput ? exactValue : formattedDerivedValue}
              onPressIn={onFocusInput}
              onSelectionChange={onInputSelectionChange}
              onSetExactAmount={onSetExactAmountInput}
              onSetMax={onSetMax}
              onShowTokenSelector={onShowTokenSelectorInput}
              onToggleIsFiatMode={onToggleIsFiatMode}
            />
          </AnimatedFlex>
        </Trace>

        <SwitchCurrenciesButton onSwitchCurrencies={onSwitchCurrencies} />

        <Trace section={SectionName.CurrencyOutputPanel}>
          <AnimatedFlex
            borderColor="$surface3"
            borderRadius="$rounded20"
            borderWidth={1}
            overflow="hidden"
            paddingTop={currencies[CurrencyField.OUTPUT] ? '$spacing4' : '$none'}
            position="relative"
            style={outputBackgroundStyle}>
            <CurrencyInputPanel
              ref={outputRef}
              isOutput
              currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
              currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
              currencyInfo={currencies[CurrencyField.OUTPUT]}
              focus={focusFieldIsOutput}
              isCollapsed={focusOnCurrencyField ? !focusFieldIsOutput : !exactFieldIsOutput}
              isFiatMode={isFiatMode && exactFieldIsOutput}
              isLoading={!exactFieldIsOutput && isSwapDataLoading}
              resetSelection={resetSelection}
              showNonZeroBalancesOnly={false}
              showSoftInputOnFocus={false}
              usdValue={currencyAmountsUSDValue[CurrencyField.OUTPUT]}
              value={exactFieldIsOutput ? exactValue : formattedDerivedValue}
              onPressIn={onFocusOutput}
              onSelectionChange={onOutputSelectionChange}
              onSetExactAmount={onSetExactAmountOutput}
              onSetMax={onSetMax}
              onShowTokenSelector={onShowTokenSelectorOutput}
              onToggleIsFiatMode={onToggleIsFiatMode}
            />
            {walletNeedsRestore && (
              <TouchableArea onPress={onRestorePress}>
                <Flex
                  grow
                  row
                  alignItems="center"
                  alignSelf="stretch"
                  backgroundColor="$surface2"
                  borderBottomLeftRadius="$rounded16"
                  borderBottomRightRadius="$rounded16"
                  borderTopColor="$surface1"
                  borderTopWidth={1}
                  gap="$spacing8"
                  px="$spacing12"
                  py="$spacing12">
                  <Icons.InfoCircleFilled color={colors.DEP_accentWarning.val} size="$icon.20" />
                  <Text color="$DEP_accentWarning" variant="subheading2">
                    {t('Restore your wallet to swap')}
                  </Text>
                </Flex>
              </TouchableArea>
            )}
          </AnimatedFlex>
        </Trace>

        <Flex $short={{ mt: '$spacing8' }} mt="$spacing24">
          <GasAndWarningRows renderEmptyRows />
        </Flex>
      </AnimatedFlex>

      {/*
          This container is used to calculate the space that the `DecimalPad` can use.
          We position the `DecimalPad` with `position: absolute` at the bottom of the screen instead of
          putting it inside this container in order to avoid any overflows while the `DecimalPad`
          is automatically resizing to find the right size for the screen.
          */}
      <Flex fill mt="$spacing8" onLayout={onBottomScreenLayout} />

      <AnimatedFlex
        $short={{ gap: '$none' }}
        bottom={0}
        gap="$spacing8"
        left={0}
        position="absolute"
        right={0}
        style={decimalPadAndButtonAnimatedStyle}>
        <Flex grow justifyContent="flex-end">
          {focusOnCurrencyField && (
            <DecimalPadInput
              ref={decimalPadRef}
              resetSelection={resetSelection}
              selectionRef={focusOnCurrencyField ? selection[focusOnCurrencyField] : undefined}
              setValue={decimalPadSetValue}
              valueRef={
                focusOnCurrencyField === exactCurrencyField
                  ? exactValueRef
                  : formattedDerivedValueRef
              }
              onReady={onDecimalPadReady}
            />
          )}
        </Flex>
      </AnimatedFlex>
    </Flex>
  )
}

const SwitchCurrenciesButton = ({
  onSwitchCurrencies,
}: {
  onSwitchCurrencies: () => void
}): JSX.Element => {
  return (
    <Flex zIndex="$popover">
      <Flex alignItems="center" height={0} style={StyleSheet.absoluteFill}>
        <Flex
          alignItems="center"
          bottom={
            -(
              // (icon size + (top + bottom padding) + (top + bottom border)) / 2
              // to center the swap direction button vertically
              (
                SWAP_DIRECTION_BUTTON_SIZE +
                SWAP_DIRECTION_BUTTON_INNER_PADDING * 2 +
                SWAP_DIRECTION_BUTTON_BORDER_WIDTH * 2
              )
            ) / 2
          }
          position="absolute">
          <Trace logPress element={ElementName.SwitchCurrenciesButton}>
            <SwapArrowButton
              bg="$surface1"
              size={SWAP_DIRECTION_BUTTON_SIZE}
              onPress={onSwitchCurrencies}
            />
          </Trace>
        </Flex>
      </Flex>
    </Flex>
  )
}
