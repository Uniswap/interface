/* eslint-disable complexity */
/* eslint-disable max-lines */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, TextInput, TextInputProps } from 'react-native'
import { Flex, Text, TouchableArea, isWeb, useIsShortMobileDevice, useSporeColors } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons'
import { iconSizes, spacing } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { useTransactionModalContext } from 'wallet/src/features/transactions/contexts/TransactionModalContext'
import { useSyncFiatAndTokenAmountUpdater } from 'wallet/src/features/transactions/hooks/useSyncFiatAndTokenAmountUpdater'
import { CurrencyInputPanel } from 'wallet/src/features/transactions/swap/CurrencyInputPanel'
import {
  DecimalPadInput,
  DecimalPadInputRef,
} from 'wallet/src/features/transactions/swap/DecimalPadInput'
import { GasAndWarningRows } from 'wallet/src/features/transactions/swap/GasAndWarningRows'
import { SwapArrowButton } from 'wallet/src/features/transactions/swap/SwapArrowButton'
import { SwapFormHeader } from 'wallet/src/features/transactions/swap/SwapFormHeader'
import { TransactionModalInnerContainer } from 'wallet/src/features/transactions/swap/TransactionModal'
import { useShowSwapNetworkNotification } from 'wallet/src/features/transactions/swap/trade/legacy/hooks'
import { isWrapAction } from 'wallet/src/features/transactions/swap/utils'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { ElementName, SectionName } from 'wallet/src/telemetry/constants'
// eslint-disable-next-line no-restricted-imports
import { formatCurrencyAmount } from 'utilities/src/format/localeBased'
import { SwapFormButton } from 'wallet/src/features/transactions/swap/SwapFormButton'
import { SwapTokenSelector } from 'wallet/src/features/transactions/swap/SwapTokenSelector'

const SWAP_DIRECTION_BUTTON_SIZE = {
  size: {
    regular: iconSizes.icon24,
    small: iconSizes.icon12,
  },
  innerPadding: {
    regular: spacing.spacing8 + spacing.spacing2,
    small: spacing.spacing8,
  },
  borderWidth: {
    regular: spacing.spacing4,
    small: spacing.spacing1,
  },
} as const

const WEB_CURRENCY_PANEL_INACTIVE_OPACITY = 0.6

const ON_SELECTION_CHANGE_WAIT_TIME_MS = 500

export function SwapFormScreen({ hideContent }: { hideContent: boolean }): JSX.Element {
  const { bottomSheetViewStyles } = useTransactionModalContext()
  const { selectingCurrencyField } = useSwapFormContext()

  const showMobileTokenSelector = !hideContent && !!selectingCurrencyField && !isWeb

  return (
    <TransactionModalInnerContainer fullscreen bottomSheetViewStyles={bottomSheetViewStyles}>
      <SwapFormHeader />

      {!hideContent && <SwapFormContent />}

      {showMobileTokenSelector && <SwapTokenSelector />}
    </TransactionModalInnerContainer>
  )
}

function SwapFormContent(): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isShortMobileDevice = useIsShortMobileDevice()

  const { walletNeedsRestore, openWalletRestoreModal } = useTransactionModalContext()

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
    selectingCurrencyField,
  } = derivedSwapInfo

  const showWebInputTokenSelector = selectingCurrencyField === CurrencyField.INPUT && isWeb
  const showWebOutputTokenSelector = selectingCurrencyField === CurrencyField.OUTPUT && isWeb
  const showSwitchCurrencies = !showWebInputTokenSelector && !showWebOutputTokenSelector

  // Updaters
  useSyncFiatAndTokenAmountUpdater()
  useShowSwapNetworkNotification(chainId)

  const onRestorePress = (): void => {
    if (!openWalletRestoreModal) {
      throw new Error('Invalid call to `onRestorePress` with missing `openWalletRestoreModal`')
    }
    openWalletRestoreModal()
  }

  const exactFieldIsInput = exactCurrencyField === CurrencyField.INPUT
  const exactFieldIsOutput = exactCurrencyField === CurrencyField.OUTPUT
  const derivedCurrencyField = exactFieldIsInput ? CurrencyField.OUTPUT : CurrencyField.INPUT

  // We want the `DecimalPad` to always control one of the 2 inputs even when no input is focused,
  // which can happen after the user hits `Max`.
  const decimalPadControlledField = focusOnCurrencyField ?? exactCurrencyField

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
    ({
      start,
      end,
      currencyField,
    }: {
      start: number
      end?: number
      currencyField?: CurrencyField
    }) => {
      // Update refs first to have the latest selection state available in the DecimalPadInput
      // component and properly update disabled keys of the decimal pad.
      // We reset the native selection on the next tick because we need to wait for the native input to be updated.
      // This is needed because of the combination of state (delayed update) + ref (instant update) to improve performance.

      const _currencyField = currencyField ?? decimalPadControlledField
      const selectionRef =
        _currencyField === CurrencyField.INPUT ? inputSelectionRef : outputSelectionRef
      const inputFieldRef = _currencyField === CurrencyField.INPUT ? inputRef : outputRef

      selectionRef.current = { start, end }

      if (!isWeb) {
        setTimeout(() => {
          inputFieldRef.current?.setNativeProps?.({ selection: { start, end } })
        }, 0)
      }
    },
    [decimalPadControlledField]
  )

  const moveCursorToEnd = useCallback(
    (args?: { overrideIsFiatMode?: boolean }) => {
      const _isFiatMode = args?.overrideIsFiatMode ?? isFiatMode

      const amountRef =
        decimalPadControlledField === derivedCurrencyField
          ? formattedDerivedValueRef
          : _isFiatMode
          ? exactAmountFiatRef
          : exactAmountTokenRef

      if (_isFiatMode) {
        resetSelection({
          start: amountRef.current.length,
          end: amountRef.current.length,
        })
      } else {
        resetSelection({
          start: amountRef.current.length,
          end: amountRef.current.length,
        })
      }
    },
    [
      decimalPadControlledField,
      derivedCurrencyField,
      exactAmountFiatRef,
      exactAmountTokenRef,
      isFiatMode,
      resetSelection,
    ]
  )

  const decimalPadSetValue = useCallback(
    (value: string): void => {
      updateSwapForm({
        exactAmountFiat: isFiatMode ? value : undefined,
        exactAmountToken: !isFiatMode ? value : undefined,
        exactCurrencyField: decimalPadControlledField,
        focusOnCurrencyField: decimalPadControlledField,
      })
    },
    [decimalPadControlledField, isFiatMode, updateSwapForm]
  )

  const [decimalPadReady, setDecimalPadReady] = useState(false)

  const onBottomScreenLayout = useCallback((event: LayoutChangeEvent): void => {
    decimalPadRef.current?.setMaxHeight(event.nativeEvent.layout.height)
  }, [])

  const onDecimalPadReady = useCallback(() => setDecimalPadReady(true), [])

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
        focusOnCurrencyField: undefined,
      })

      // We want this update to happen on the next tick, after the input value is updated.
      setTimeout(() => {
        moveCursorToEnd()
        decimalPadRef.current?.updateDisabledKeys()
      }, 0)
    },
    [moveCursorToEnd, updateSwapForm]
  )

  // Reset selection based the new input value (token, or fiat), and toggle fiat mode
  const onToggleIsFiatMode = useCallback(
    (currencyField: CurrencyField) => {
      const newIsFiatMode = !isFiatMode
      updateSwapForm({
        isFiatMode: newIsFiatMode,
        exactCurrencyField: currencyField,
      })

      // We want this update to happen on the next tick, after the input value is updated.
      setTimeout(() => moveCursorToEnd({ overrideIsFiatMode: newIsFiatMode }), 0)
    },
    [isFiatMode, moveCursorToEnd, updateSwapForm]
  )

  const onSwitchCurrencies = useCallback(() => {
    const newExactCurrencyField = exactFieldIsInput ? CurrencyField.OUTPUT : CurrencyField.INPUT
    updateSwapForm({
      exactCurrencyField: newExactCurrencyField,
      focusOnCurrencyField: newExactCurrencyField,
      input: output,
      output: input,
    })
  }, [exactFieldIsInput, input, output, updateSwapForm])

  // Swap input requires numeric values, not localized ones
  const formattedDerivedValue = formatCurrencyAmount({
    amount: currencyAmounts[derivedCurrencyField],
    locale: 'en-US',
    type: NumberType.SwapTradeAmount,
    placeholder: '',
  })

  const formattedDerivedValueRef = useRef(formattedDerivedValue)
  formattedDerivedValueRef.current = formattedDerivedValue

  useEffect(() => {
    if (decimalPadControlledField === exactCurrencyField) {
      return
    }

    // When the `formattedDerivedValue` changes while the field that is not set as the `exactCurrencyField` is focused, we want to reset the cursor selection to the end of the input.
    // This to prevent an issue that happens with the cursor selection getting out of sync when a user changes focus from one input to another while a quote request in in flight.
    moveCursorToEnd()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedDerivedValue])

  const exactValue = isFiatMode ? exactAmountFiat : exactAmountToken
  const exactValueRef = isFiatMode ? exactAmountFiatRef : exactAmountTokenRef

  const decimalPadValueRef =
    decimalPadControlledField === exactCurrencyField ? exactValueRef : formattedDerivedValueRef

  const containerShadowProps = {
    shadowColor: colors.surface3.val,
    shadowRadius: 10,
  }
  const inputShadowProps = isWeb
    ? {
        ...containerShadowProps,
        shadowOpacity: showWebInputTokenSelector ? 0.08 : 0.04,
        zIndex: 1,
      }
    : undefined
  const outputShadowProps = isWeb
    ? {
        ...containerShadowProps,
        shadowOpacity: showWebOutputTokenSelector ? 0.08 : 0.04,
        zIndex: 2,
      }
    : undefined

  return (
    <Flex
      gap="$spacing8"
      grow={!isWeb}
      height={isWeb ? '100%' : undefined}
      justifyContent="space-between">
      <Flex
        animation="quick"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        gap="$spacing2"
        grow={isWeb}>
        <Trace section={SectionName.CurrencyInputPanel}>
          <Flex
            {...inputShadowProps}
            shrink
            animateOnly={['backgroundColor', 'opacity', 'shadowOpacity']}
            animation="quick"
            backgroundColor={
              isWeb || focusOnCurrencyField === CurrencyField.INPUT ? '$surface1' : '$surface2'
            }
            borderColor="$surface3"
            borderRadius="$rounded20"
            borderWidth={1}
            grow={showWebInputTokenSelector}
            opacity={showWebOutputTokenSelector ? WEB_CURRENCY_PANEL_INACTIVE_OPACITY : 1}
            overflow="hidden"
            pb={currencies[CurrencyField.INPUT] ? '$spacing4' : '$none'}>
            {showWebInputTokenSelector ? (
              <SwapTokenSelector />
            ) : (
              <CurrencyInputPanel
                ref={inputRef}
                currencyAmount={currencyAmounts[CurrencyField.INPUT]}
                currencyBalance={currencyBalances[CurrencyField.INPUT]}
                currencyField={CurrencyField.INPUT}
                currencyInfo={currencies[CurrencyField.INPUT]}
                focus={focusOnCurrencyField === CurrencyField.INPUT}
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
            )}
          </Flex>
        </Trace>

        {showSwitchCurrencies ? (
          <SwitchCurrenciesButton onSwitchCurrencies={onSwitchCurrencies} />
        ) : (
          <Flex />
        )}

        {!showWebInputTokenSelector && (
          <>
            <Trace section={SectionName.CurrencyOutputPanel}>
              <Flex
                {...outputShadowProps}
                shrink
                animateOnly={['backgroundColor', 'opacity', 'shadowOpacity']}
                animation="quick"
                backgroundColor={
                  isWeb || focusOnCurrencyField === CurrencyField.OUTPUT ? '$surface1' : '$surface2'
                }
                borderColor="$surface3"
                borderRadius="$rounded20"
                borderWidth={1}
                grow={showWebOutputTokenSelector}
                opacity={showWebInputTokenSelector ? WEB_CURRENCY_PANEL_INACTIVE_OPACITY : 1}
                overflow="hidden"
                position="relative"
                pt={currencies[CurrencyField.OUTPUT] ? '$spacing4' : '$none'}>
                {showWebOutputTokenSelector ? (
                  <Flex grow>
                    <SwapTokenSelector />
                  </Flex>
                ) : (
                  <CurrencyInputPanel
                    ref={outputRef}
                    currencyAmount={currencyAmounts[CurrencyField.OUTPUT]}
                    currencyBalance={currencyBalances[CurrencyField.OUTPUT]}
                    currencyField={CurrencyField.OUTPUT}
                    currencyInfo={currencies[CurrencyField.OUTPUT]}
                    focus={focusOnCurrencyField === CurrencyField.OUTPUT}
                    isFiatMode={isFiatMode && exactFieldIsOutput}
                    isLoading={!exactFieldIsOutput && isSwapDataLoading}
                    resetSelection={resetSelection}
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
                )}
                {walletNeedsRestore && !showWebOutputTokenSelector && (
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
                      <InfoCircleFilled color={colors.DEP_accentWarning.val} size="$icon.20" />
                      <Text color="$DEP_accentWarning" variant="subheading2">
                        {t('swap.form.warning.restore')}
                      </Text>
                    </Flex>
                  </TouchableArea>
                )}
              </Flex>
            </Trace>

            {!showWebOutputTokenSelector && (
              <Flex>
                {isWeb && (
                  <Flex pt="$spacing12">
                    <SwapFormButton />
                  </Flex>
                )}
                <Flex pt={isShortMobileDevice ? '$spacing8' : '$spacing12'}>
                  <GasAndWarningRows renderEmptyRows={!isWeb} />
                </Flex>
              </Flex>
            )}
          </>
        )}
        {isWeb && <Flex mt="$spacing48" />}
      </Flex>
      {!isWeb && (
        <>
          {/*
          This container is used to calculate the space that the `DecimalPad` can use.
          We position the `DecimalPad` with `position: absolute` at the bottom of the screen instead of
          putting it inside this container in order to avoid any overflows while the `DecimalPad`
          is automatically resizing to find the right size for the screen.
          */}
          <Flex
            fill
            mt={isShortMobileDevice ? '$spacing2' : '$spacing8'}
            onLayout={onBottomScreenLayout}
          />
          <Flex
            $short={{ gap: '$none' }}
            animation="quick"
            bottom={0}
            gap="$spacing8"
            left={0}
            opacity={decimalPadReady ? 1 : 0}
            position="absolute"
            right={0}>
            <Flex grow justifyContent="flex-end">
              <DecimalPadInput
                ref={decimalPadRef}
                resetSelection={resetSelection}
                selectionRef={selection[decimalPadControlledField]}
                setValue={decimalPadSetValue}
                valueRef={decimalPadValueRef}
                onReady={onDecimalPadReady}
              />
            </Flex>
          </Flex>
        </>
      )}
    </Flex>
  )
}

const SwitchCurrenciesButton = ({
  onSwitchCurrencies,
}: {
  onSwitchCurrencies: () => void
}): JSX.Element => {
  const isShortMobileDevice = useIsShortMobileDevice()
  const smallOrRegular = isShortMobileDevice ? 'small' : 'regular'

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
                SWAP_DIRECTION_BUTTON_SIZE.size[smallOrRegular] +
                SWAP_DIRECTION_BUTTON_SIZE.innerPadding[smallOrRegular] * 2 +
                SWAP_DIRECTION_BUTTON_SIZE.borderWidth[smallOrRegular] * 2
              )
            ) / 2
          }
          position="absolute">
          <Trace logPress element={ElementName.SwitchCurrenciesButton}>
            <SwapArrowButton
              backgroundColor="$surface1"
              size={SWAP_DIRECTION_BUTTON_SIZE.size[smallOrRegular]}
              testID={ElementName.SwitchCurrenciesButton}
              onPress={onSwitchCurrencies}
            />
          </Trace>
        </Flex>
      </Flex>
    </Flex>
  )
}
