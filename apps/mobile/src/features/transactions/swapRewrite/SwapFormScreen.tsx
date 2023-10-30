/* eslint-disable max-lines */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, TextInput, TextInputProps } from 'react-native'
import {
  FadeIn,
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
import { getReviewActionName, isWrapAction } from 'src/features/transactions/swap/utils'
import {
  SwapScreen,
  useSwapScreenContext,
} from 'src/features/transactions/swapRewrite/contexts/SwapScreenContext'
import { CurrencyInputPanel } from 'src/features/transactions/swapRewrite/CurrencyInputPanel'
import {
  DecimalPadInput,
  DecimalPadInputRef,
} from 'src/features/transactions/swapRewrite/DecimalPadInput'
import { GasAndWarningRows } from 'src/features/transactions/swapRewrite/GasAndWarningRows'
import { useParsedSwapWarnings } from 'src/features/transactions/swapRewrite/hooks/useParsedSwapWarnings'
import { SwapArrowButton } from 'src/features/transactions/swapRewrite/SwapArrowButton'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { AnimatedFlex, Button, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { useLocalizedFormatter } from 'wallet/src/features/language/formatter'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { createTransactionId } from 'wallet/src/features/transactions/utils'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { useSwapFormContext } from './contexts/SwapFormContext'
import { SwapFormHeader } from './SwapFormHeader'
import { TokenSelector } from './TokenSelector'

const SWAP_DIRECTION_BUTTON_SIZE = iconSizes.icon24
const SWAP_DIRECTION_BUTTON_INNER_PADDING = spacing.spacing8 + spacing.spacing2
const SWAP_DIRECTION_BUTTON_BORDER_WIDTH = spacing.spacing4

export function SwapFormScreen({ hideContent }: { hideContent: boolean }): JSX.Element {
  const { selectingCurrencyField } = useSwapFormContext()

  return (
    <>
      <SwapFormHeader />

      {!hideContent && <SwapFormContent />}

      {!hideContent && !!selectingCurrencyField && <TokenSelector />}
    </>
  )
}

function SwapFormContent(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { formatCurrencyAmount } = useLocalizedFormatter()

  const {
    derivedSwapInfo,
    exactAmountFiat,
    exactAmountFiatRef,
    exactAmountToken,
    exactAmountTokenRef,
    exactCurrencyField,
    focusOnCurrencyField,
    input,
    isFiatInput,
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

  useSwapAnalytics(derivedSwapInfo)

  useShowSwapNetworkNotification(chainId)

  const { walletNeedsRestore, openWalletRestoreModal } = useWalletRestore()

  const onRestorePress = (): void => {
    openWalletRestoreModal()
  }

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
      if (focusOnCurrencyField === CurrencyField.INPUT) {
        inputSelectionRef.current = { start, end }
      } else if (focusOnCurrencyField === CurrencyField.OUTPUT) {
        outputSelectionRef.current = { start, end }
      } else return
      // We reset the selection on the next tick because we need to wait for the native input to be updated.
      // This is needed because of the combination of state (delayed update) + ref (instant update) to improve performance.
      setTimeout(() => {
        inputRef.current?.setNativeProps?.({ selection: { start, end } })
      }, 0)
    },
    [focusOnCurrencyField]
  )

  const decimalPadSetValue = useCallback(
    (value: string): void => {
      if (!focusOnCurrencyField) {
        return
      }
      updateSwapForm({
        exactAmountFiat: isFiatInput ? value : undefined,
        exactAmountToken: !isFiatInput ? value : undefined,
        exactCurrencyField: focusOnCurrencyField,
      })
    },
    [focusOnCurrencyField, isFiatInput, updateSwapForm]
  )

  const reviewButtonHeightRef = useRef<number | null>(null)
  const bottomScreenHeightRef = useRef<number | null>(null)
  const [decimalPadReady, setDecimalPadReady] = useState(false)

  const updateDecimalPadMaxHeight = useCallback(() => {
    if (reviewButtonHeightRef.current !== null && bottomScreenHeightRef.current !== null) {
      decimalPadRef.current?.setMaxHeight(
        bottomScreenHeightRef.current - reviewButtonHeightRef.current
      )
    }
  }, [])

  const onReviewButtonLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      reviewButtonHeightRef.current = event.nativeEvent.layout.height
      updateDecimalPadMaxHeight()
    },
    [updateDecimalPadMaxHeight]
  )

  const onBottomScreenLayout = useCallback(
    (event: LayoutChangeEvent): void => {
      bottomScreenHeightRef.current = event.nativeEvent.layout.height
      updateDecimalPadMaxHeight()
    },
    [updateDecimalPadMaxHeight]
  )

  const onDecimalPadReady = useCallback(() => setDecimalPadReady(true), [])

  const decimalPadAndButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(decimalPadReady ? 1 : 0, { duration: Delay.Short / 2 }),
    }
  })

  const onInputSelectionChange = useCallback((start: number, end: number) => {
    inputSelectionRef.current = { start, end }
    decimalPadRef.current?.updateDisabledKeys()
  }, [])
  const onOutputSelectionChange = useCallback((start: number, end: number) => {
    outputSelectionRef.current = { start, end }
    decimalPadRef.current?.updateDisabledKeys()
  }, [])

  const onFocusInput = useCallback(
    (): void => updateSwapForm({ focusOnCurrencyField: CurrencyField.INPUT }),
    [updateSwapForm]
  )

  const onFocusOutput = useCallback(
    (): void => updateSwapForm({ focusOnCurrencyField: CurrencyField.OUTPUT }),
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
      isFiatInput
        ? updateSwapForm({ exactAmountFiat: amount, exactCurrencyField: CurrencyField.INPUT })
        : updateSwapForm({ exactAmountToken: amount, exactCurrencyField: CurrencyField.INPUT }),
    [isFiatInput, updateSwapForm]
  )

  const onSetExactAmountOutput = useCallback(
    (amount: string): void =>
      isFiatInput
        ? updateSwapForm({ exactAmountFiat: amount, exactCurrencyField: CurrencyField.OUTPUT })
        : updateSwapForm({ exactAmountToken: amount, exactCurrencyField: CurrencyField.OUTPUT }),
    [isFiatInput, updateSwapForm]
  )

  const onSetMax = useCallback(
    (amount: string): void => {
      updateSwapForm({
        exactAmountFiat: undefined,
        exactAmountToken: amount,
        exactCurrencyField: CurrencyField.INPUT,
        focusOnCurrencyField: undefined,
      })
      resetSelection(exactAmountTokenRef.current.length, exactAmountTokenRef.current.length)
    },
    [exactAmountTokenRef, resetSelection, updateSwapForm]
  )

  const onSwitchCurrencies = useCallback(() => {
    const newExactCurrencyField =
      exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
    updateSwapForm({
      exactCurrencyField: newExactCurrencyField,
      focusOnCurrencyField: newExactCurrencyField,
      input: output,
      output: input,
    })
  }, [exactCurrencyField, input, output, updateSwapForm])

  const derivedCurrencyField =
    exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

  const formattedDerivedValue = formatCurrencyAmount({
    value: currencyAmounts[derivedCurrencyField],
    type: NumberType.SwapTradeAmount,
    placeholder: '',
  })

  // TODO - improve this to update ref when calculating the derived state
  // instead of assigning ref based on the derived state
  const formattedDerivedValueRef = useRef(formattedDerivedValue)
  useEffect(() => {
    formattedDerivedValueRef.current = formattedDerivedValue
  }, [formattedDerivedValue])

  const exactValue = isFiatInput ? exactAmountFiat : exactAmountToken
  const exactValueRef = isFiatInput ? exactAmountFiatRef : exactAmountTokenRef

  // Animated background color on input panels based on focus
  const colorTransitionProgress = useDerivedValue(() => {
    return withTiming(focusOnCurrencyField === CurrencyField.INPUT ? 0 : 1, { duration: 250 })
  }, [focusOnCurrencyField])

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
      <AnimatedFlex entering={FadeIn} gap="$spacing2">
        <Trace section={SectionName.CurrencyInputPanel}>
          <AnimatedFlex
            borderColor="$surface3"
            borderRadius="$rounded20"
            borderWidth={1}
            paddingBottom="$spacing4"
            style={inputBackgroundStyle}>
            <CurrencyInputPanel
              ref={inputRef}
              currencyAmount={currencyAmounts[CurrencyField.INPUT]}
              currencyBalance={currencyBalances[CurrencyField.INPUT]}
              currencyInfo={currencies[CurrencyField.INPUT]}
              focus={focusOnCurrencyField === CurrencyField.INPUT}
              isCollapsed={
                focusOnCurrencyField
                  ? focusOnCurrencyField !== CurrencyField.INPUT
                  : exactCurrencyField !== CurrencyField.INPUT
              }
              isLoading={exactCurrencyField === CurrencyField.OUTPUT && isSwapDataLoading}
              resetSelection={resetSelection}
              showSoftInputOnFocus={false}
              usdValue={currencyAmountsUSDValue[CurrencyField.INPUT]}
              value={
                exactCurrencyField === CurrencyField.INPUT ? exactValue : formattedDerivedValue
              }
              onPressIn={onFocusInput}
              onSelectionChange={onInputSelectionChange}
              onSetExactAmount={onSetExactAmountInput}
              onSetMax={onSetMax}
              onShowTokenSelector={onShowTokenSelectorInput}
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
            paddingTop="$spacing4"
            position="relative"
            style={outputBackgroundStyle}>
            <CurrencyInputPanel
              ref={outputRef}
              isOutput
              currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
              currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
              currencyInfo={currencies[CurrencyField.OUTPUT]}
              focus={focusOnCurrencyField === CurrencyField.OUTPUT}
              isCollapsed={
                focusOnCurrencyField
                  ? focusOnCurrencyField !== CurrencyField.OUTPUT
                  : exactCurrencyField !== CurrencyField.OUTPUT
              }
              isLoading={exactCurrencyField === CurrencyField.INPUT && isSwapDataLoading}
              resetSelection={resetSelection}
              showNonZeroBalancesOnly={false}
              showSoftInputOnFocus={false}
              usdValue={currencyAmountsUSDValue[CurrencyField.OUTPUT]}
              value={
                exactCurrencyField === CurrencyField.OUTPUT ? exactValue : formattedDerivedValue
              }
              onPressIn={onFocusOutput}
              onSelectionChange={onOutputSelectionChange}
              onSetExactAmount={onSetExactAmountOutput}
              onShowTokenSelector={onShowTokenSelectorOutput}
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

        <GasAndWarningRows />
      </AnimatedFlex>

      {/*
        This container is used to calculate the space that the `DecimalPad` can use.
        We position the `DecimalPad` with `position: absolute` at the bottom of the screen instead of putting it inside this container
        in order to avoid any overflows while the `DecimalPad` is automatically resizing to find the right size for the screen.
      */}
      <Flex fill mt="$spacing8" onLayout={onBottomScreenLayout} />

      <AnimatedFlex
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

        <Flex opacity={decimalPadReady ? 1 : 0} onLayout={onReviewButtonLayout}>
          <ReviewButton
            isSwapDataLoading={isSwapDataLoading}
            walletNeedsRestore={!!walletNeedsRestore}
          />
        </Flex>
      </AnimatedFlex>
    </Flex>
  )
}

function ReviewButton({
  isSwapDataLoading,
  walletNeedsRestore,
}: {
  isSwapDataLoading: boolean
  walletNeedsRestore: boolean
}): JSX.Element {
  const { t } = useTranslation()

  const { setScreen } = useSwapScreenContext()
  const { derivedSwapInfo, updateSwapForm } = useSwapFormContext()

  const { wrapType, trade } = derivedSwapInfo

  const { isBlocked, isBlockedLoading } = useIsBlockedActiveAddress()

  const noValidSwap = !isWrapAction(wrapType) && !trade.trade

  const { blockingWarning } = useParsedSwapWarnings()

  const reviewButtonDisabled =
    isSwapDataLoading ||
    noValidSwap ||
    !!blockingWarning ||
    isBlocked ||
    isBlockedLoading ||
    walletNeedsRestore

  const onReview = useCallback(() => {
    updateSwapForm({ txId: createTransactionId() })
    setScreen(SwapScreen.SwapReview)
  }, [setScreen, updateSwapForm])

  return (
    <Trace logPress element={ElementName.SwapReview}>
      <Button
        disabled={reviewButtonDisabled}
        size="large"
        testID={ElementName.ReviewSwap}
        onPress={onReview}>
        {getReviewActionName(t, wrapType)}
      </Button>
    </Trace>
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
