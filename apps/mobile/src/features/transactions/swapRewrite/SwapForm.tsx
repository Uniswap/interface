import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, TextInputProps, TouchableWithoutFeedback } from 'react-native'
import {
  FadeIn,
  FadeOut,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { Box } from 'src/components/layout'
import { useBottomSheetContext } from 'src/components/modals/BottomSheetContext'
import { HandleBar } from 'src/components/modals/HandleBar'
import Trace from 'src/components/Trace/Trace'
import { IS_ANDROID } from 'src/constants/globals'
import { ElementName, SectionName } from 'src/features/telemetry/constants'
import { useShouldShowNativeKeyboard } from 'src/features/transactions/hooks'
import { useSwapTxAndGasInfo } from 'src/features/transactions/swap/hooks'
import { CurrencyInputPanel } from 'src/features/transactions/swapRewrite/CurrencyInputPanel'
import { SwapArrowButton } from 'src/features/transactions/swapRewrite/SwapArrowButton'
import { BlockedAddressWarning } from 'src/features/trm/BlockedAddressWarning'
import { useWalletRestore } from 'src/features/wallet/hooks'
import { AnimatedFlex, Button, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { formatCurrencyAmount, formatUSDPrice, NumberType } from 'utilities/src/format/format'
import { useUSDValue } from 'wallet/src/features/gas/hooks'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { createTransactionId } from 'wallet/src/features/transactions/utils'
import { useIsBlockedActiveAddress } from 'wallet/src/features/trm/hooks'
import { SwapScreen, useSwapContext } from './SwapContext'
import { SwapFormHeader } from './SwapFormHeader'
import { TokenSelector } from './TokenSelector'

const SWAP_DIRECTION_BUTTON_SIZE = iconSizes.icon24
const SWAP_DIRECTION_BUTTON_INNER_PADDING = spacing.spacing8 + spacing.spacing2
const SWAP_DIRECTION_BUTTON_BORDER_WIDTH = spacing.spacing4

export function SwapForm(): JSX.Element {
  const { selectingCurrencyField } = useSwapContext()

  const { isSheetReady } = useBottomSheetContext()

  const insets = useSafeAreaInsets()

  const screenXOffset = useSharedValue(0)

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenXOffset.value }],
  }))

  return (
    <>
      <TouchableWithoutFeedback>
        <Box style={{ marginTop: insets.top }}>
          <HandleBar backgroundColor="none" />
          <AnimatedFlex grow row height="100%" style={wrapperStyle}>
            <Flex
              gap="$spacing16"
              pb={IS_ANDROID ? '$spacing32' : '$spacing16'}
              px="$spacing16"
              style={{ marginBottom: insets.bottom }}
              width="100%">
              <SwapFormHeader />
              {isSheetReady && <SwapFormContent />}
            </Flex>
          </AnimatedFlex>
        </Box>
      </TouchableWithoutFeedback>

      {!!selectingCurrencyField && <TokenSelector />}
    </>
  )
}

function SwapFormContent(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const {
    derivedSwapInfo,
    exactAmountFiat,
    exactAmountToken,
    exactCurrencyField,
    focusOnCurrencyField,
    input,
    isFiatInput,
    output,
    updateSwapForm,
  } = useSwapContext()

  const { currencyAmounts, currencyBalances, currencies, currencyAmountsUSDValue, chainId } =
    derivedSwapInfo

  const { gasFee } = useSwapTxAndGasInfo(
    derivedSwapInfo,
    // TODO: skip this query when we implement review screen
    false
  )
  const gasFeeUSD = useUSDValue(chainId, gasFee.value ?? undefined)

  const { isBlocked } = useIsBlockedActiveAddress()

  const { walletNeedsRestore, openWalletRestoreModal } = useWalletRestore()

  const onRestorePress = (): void => {
    Keyboard.dismiss()
    openWalletRestoreModal()
  }

  const { showNativeKeyboard, onDecimalPadLayout, isLayoutPending, onInputPanelLayout } =
    useShouldShowNativeKeyboard()

  const [inputSelection, setInputSelection] = useState<TextInputProps['selection']>()
  const [outputSelection, setOutputSelection] = useState<TextInputProps['selection']>()

  const selection = useMemo(
    () => ({
      [CurrencyField.INPUT]: inputSelection,
      [CurrencyField.OUTPUT]: outputSelection,
    }),
    [inputSelection, outputSelection]
  )

  const resetSelection = useCallback(
    (start: number, end?: number) => {
      if (focusOnCurrencyField === CurrencyField.INPUT) {
        setInputSelection({ start, end: end ?? start })
      } else if (focusOnCurrencyField === CurrencyField.OUTPUT) {
        setOutputSelection({ start, end: end ?? start })
      }
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

  const onInputSelectionChange = useCallback(
    (start: number, end: number) => setInputSelection({ start, end }),
    []
  )
  const onOutputSelectionChange = useCallback(
    (start: number, end: number) => setOutputSelection({ start, end }),
    []
  )

  const onFocusInput = useCallback(
    (): void => updateSwapForm({ focusOnCurrencyField: CurrencyField.INPUT }),
    [updateSwapForm]
  )

  const onFocusOutput = useCallback(
    (): void => updateSwapForm({ focusOnCurrencyField: CurrencyField.OUTPUT }),
    [updateSwapForm]
  )

  const onShowTokenSelectorInput = useCallback(
    (): void => updateSwapForm({ selectingCurrencyField: CurrencyField.INPUT }),
    [updateSwapForm]
  )

  const onShowTokenSelectorOutput = useCallback(
    (): void => updateSwapForm({ selectingCurrencyField: CurrencyField.OUTPUT }),
    [updateSwapForm]
  )

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
        focusOnCurrencyField: exactCurrencyField,
      })
    },
    [exactCurrencyField, updateSwapForm]
  )

  const onSwitchCurrencies = useCallback(() => {
    updateSwapForm({
      exactCurrencyField:
        exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT,
      focusOnCurrencyField: exactCurrencyField,
      input: output,
      output: input,
    })
  }, [exactCurrencyField, input, output, updateSwapForm])

  const derivedCurrencyField =
    exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

  const formattedDerivedValue = formatCurrencyAmount(
    currencyAmounts[derivedCurrencyField],
    NumberType.SwapTradeAmount,
    ''
  )

  const exactValue = isFiatInput ? exactAmountFiat : exactAmountToken

  // TODO: implement.
  const swapDataRefreshing = false

  const onReview = useCallback(() => {
    updateSwapForm({
      screen: SwapScreen.SwapReview,
      txId: createTransactionId(),
    })
  }, [updateSwapForm])

  return (
    <Flex grow gap="$spacing8" justifyContent="space-between">
      <AnimatedFlex
        entering={FadeIn}
        exiting={FadeOut}
        gap="$spacing2"
        onLayout={onInputPanelLayout}>
        <Trace section={SectionName.CurrencyInputPanel}>
          <Flex
            backgroundColor={
              focusOnCurrencyField === CurrencyField.INPUT ? '$surface1' : '$surface2'
            }
            borderColor="$surface3"
            borderRadius="$rounded20"
            borderWidth={1}>
            <CurrencyInputPanel
              currencyAmount={currencyAmounts[CurrencyField.INPUT]}
              currencyBalance={currencyBalances[CurrencyField.INPUT]}
              currencyInfo={currencies[CurrencyField.INPUT]}
              dimTextColor={exactCurrencyField === CurrencyField.OUTPUT && swapDataRefreshing}
              focus={focusOnCurrencyField === CurrencyField.INPUT}
              showSoftInputOnFocus={showNativeKeyboard}
              usdValue={currencyAmountsUSDValue[CurrencyField.INPUT]}
              value={
                exactCurrencyField === CurrencyField.INPUT ? exactValue : formattedDerivedValue
              }
              // TODO: implement warnings.
              warnings={[]}
              onPressIn={onFocusInput}
              onSelectionChange={showNativeKeyboard ? undefined : onInputSelectionChange}
              onSetExactAmount={onSetExactAmountInput}
              onSetMax={onSetMax}
              onShowTokenSelector={onShowTokenSelectorInput}
            />
          </Flex>
        </Trace>

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

        <Trace section={SectionName.CurrencyOutputPanel}>
          <Flex>
            <Flex
              backgroundColor={
                focusOnCurrencyField === CurrencyField.OUTPUT ? '$surface1' : '$surface2'
              }
              borderBottomLeftRadius={
                // TODO: maybe add this.
                //swapWarning || showRate || isBlocked ? '$none' : '$rounded20'
                '$rounded20'
              }
              borderBottomRightRadius={
                // TODO: maybe add this.
                // swapWarning || showRate || isBlocked ? '$none' : '$rounded20'
                '$rounded20'
              }
              borderColor="$surface3"
              borderRadius="$rounded20"
              borderWidth={1}
              overflow="hidden"
              position="relative">
              <CurrencyInputPanel
                isOutput
                currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
                currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
                currencyInfo={currencies[CurrencyField.OUTPUT]}
                dimTextColor={exactCurrencyField === CurrencyField.INPUT && swapDataRefreshing}
                focus={focusOnCurrencyField === CurrencyField.OUTPUT}
                showNonZeroBalancesOnly={false}
                showSoftInputOnFocus={showNativeKeyboard}
                usdValue={currencyAmountsUSDValue[CurrencyField.OUTPUT]}
                value={
                  exactCurrencyField === CurrencyField.OUTPUT ? exactValue : formattedDerivedValue
                }
                // TODO: implement warnings.
                warnings={[]}
                onPressIn={onFocusOutput}
                onSelectionChange={showNativeKeyboard ? undefined : onOutputSelectionChange}
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
                    <Icons.InfoCircleFilled
                      color={colors.DEP_accentWarning.val}
                      height={iconSizes.icon20}
                      width={iconSizes.icon20}
                    />
                    <Text color="$DEP_accentWarning" variant="subheading2">
                      {t('Restore your wallet to swap')}
                    </Text>
                  </Flex>
                </TouchableArea>
              )}
            </Flex>

            {/* TODO: add swap warnings */}
            {isBlocked && (
              <BlockedAddressWarning
                row
                alignItems="center"
                alignSelf="stretch"
                backgroundColor="$surface2"
                borderBottomLeftRadius="$rounded16"
                borderBottomRightRadius="$rounded16"
                flexGrow={1}
                mt="$spacing2"
                px="$spacing16"
                py="$spacing12"
              />
            )}
          </Flex>
        </Trace>
        {gasFeeUSD && (
          <Flex centered row gap="$spacing4" padding="$spacing16">
            <Icons.Gas
              color={colors.neutral2.val}
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
            <Text color="$neutral2" variant="body3">
              {formatUSDPrice(gasFeeUSD, NumberType.FiatGasPrice)}
            </Text>
          </Flex>
        )}
      </AnimatedFlex>
      <AnimatedFlex
        bottom={0}
        exiting={FadeOutDown}
        gap="$spacing8"
        left={0}
        opacity={isLayoutPending ? 0 : 1}
        position="absolute"
        right={0}
        onLayout={onDecimalPadLayout}>
        {!showNativeKeyboard && (
          <DecimalPad
            resetSelection={resetSelection}
            selection={focusOnCurrencyField ? selection[focusOnCurrencyField] : undefined}
            setValue={decimalPadSetValue}
            value={focusOnCurrencyField === exactCurrencyField ? exactValue : formattedDerivedValue}
          />
        )}
        <Trace logPress element={ElementName.SwapReview}>
          <Button size="large" testID={ElementName.ReviewSwap} onPress={onReview}>
            {t('Review swap')}
          </Button>
        </Trace>
      </AnimatedFlex>
    </Flex>
  )
}
