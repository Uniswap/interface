import { isE2eTestEnv, isExtensionApp, isMobileWeb, isWebAppDesktop } from '@universe/environment'
import type { FlexProps } from '@universe/mycelium'
import { TestID } from '@universe/test'
import {
  CurrencyInputPanel as CurrencyInputPanelView,
  type CurrencyInputPanelPresetsPlacement,
  type CurrencyInputPanelProps as CurrencyInputPanelViewProps,
} from '@universe/transactions-ui'
import { forwardRef, memo, useCallback, useImperativeHandle, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { TextInput } from 'react-native'
import { useDispatch } from 'react-redux'
import { useShakeAnimation } from 'ui/src'
import { useAmountInputText } from 'uniswap/src/components/AmountInput/useAmountInputText'
import { DefaultTokenOptions } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/DefaultTokenOptions'
import { QuickSelectDefaultTokenOptions } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/QuickSelectDefaultTokenOptions'
import { useCurrencyInputFontSize } from 'uniswap/src/components/CurrencyInputPanel/hooks/useCurrencyInputFontSize'
import { useCurrencyInputPanelPresets } from 'uniswap/src/components/CurrencyInputPanel/hooks/useCurrencyInputPanelPresets'
import { useDeferredCaret } from 'uniswap/src/components/CurrencyInputPanel/hooks/useDeferredCaret'
import { useIndicativeQuoteTextDisplay } from 'uniswap/src/components/CurrencyInputPanel/hooks/useIndicativeQuoteTextDisplay'
import { useInputFocusSync } from 'uniswap/src/components/CurrencyInputPanel/hooks/useInputFocusSync/useInputFocusSync'
import { useRefetchAnimationStyle } from 'uniswap/src/components/CurrencyInputPanel/hooks/useRefetchAnimationStyle'
import { getSelectTokenButtonProps } from 'uniswap/src/components/CurrencyInputPanel/SelectTokenButton'
import type { CurrencyInputPanelProps, CurrencyInputPanelRef } from 'uniswap/src/components/CurrencyInputPanel/types'
import { MAX_FIAT_INPUT_DECIMALS } from 'uniswap/src/constants/transactions'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/hooks/useMaxAmountSpend'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { useTokenAndFiatDisplayAmounts } from 'uniswap/src/features/transactions/hooks/useTokenAndFiatDisplayAmounts'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { MaxBalanceInfoModal } from 'uniswap/src/features/transactions/modals/MaxBalanceInfoModal'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

/**
 * The free-form layout props only ever arrive as the Toucan bid set (body4 lines, a 32px input row
 * without padding, an 8px accessory gap), which is the view's compact variant. Any of them selects it.
 */
function getPanelVariant({
  fiatValueVariant,
  balanceVariant,
  inputRowPaddingVertical,
  inputRowMinHeight,
  panelAccessoryPaddingTop,
}: CurrencyInputPanelProps): CurrencyInputPanelViewProps['variant'] {
  const hasCompactLayoutProps = [
    fiatValueVariant,
    balanceVariant,
    inputRowPaddingVertical,
    inputRowMinHeight,
    panelAccessoryPaddingTop,
  ].some((prop) => prop !== undefined)
  return hasCompactLayoutProps ? 'compact' : 'default'
}

/**
 * The free-form panel style only ever paints the $surface2 card, rounded all round (Toucan, LP
 * deposit) or squared at the bottom over an attached card (LP deposit).
 */
function getPanelCard(customPanelStyle: FlexProps | undefined): CurrencyInputPanelViewProps['card'] {
  if (!customPanelStyle?.backgroundColor) {
    return undefined
  }
  return customPanelStyle.borderBottomLeftRadius === '$none' ? 'top' : 'full'
}

export const CurrencyInputPanel = memo(
  forwardRef<CurrencyInputPanelRef, CurrencyInputPanelProps>(
    // oxlint-disable-next-line complexity -- long-lived component covering many input modes, now one mapping onto the view
    function CurrencyInputPanelInner(props, forwardedRef): JSX.Element {
      const {
        autoFocus,
        currencyAmount,
        currencyBalance,
        currencyField,
        currencyInfo,
        focus,
        isFiatMode = false,
        showMaxButtonOnly = false,
        showSoftInputOnFocus = false,
        tokenColor,
        onPressIn,
        onSelectionChange: selectionChange,
        onSetExactAmount,
        onSetPresetValue,
        onShowTokenSelector,
        onToggleIsFiatMode,
        resetSelection,
        disabled = false,
        onPressDisabled,
        headerLabel,
        transactionType,
        customPanelStyle,
        hidePresets,
        hideBalance,
        showFiatToggleIcon,
        headerAccessory,
        onBlur,
        panelAccessory,
        fontSizeOptions,
        inputSuffix,
        actualGasFee,
        isGasCovered,
      } = props

      const { t } = useTranslation()
      const dispatch = useDispatch()
      const { isTestnetModeEnabled } = useEnabledChains()
      const { isDisconnected } = useConnectionStatus()
      const { formatCurrencyAmount } = useLocalizationContext()
      const { code: fiatCurrencyCode, symbol: fiatCurrencySymbol } = useAppFiatCurrencyInfo()
      const { price: usdPrice } = useUSDCPrice(currencyInfo?.currency)

      const display = useIndicativeQuoteTextDisplay(props)
      const { value, usdValue } = display

      const isOutput = currencyField === CurrencyField.OUTPUT
      const showDefaultTokenOptions = isOutput && !currencyInfo
      const showInsufficientBalanceWarning =
        !isOutput && !!currencyBalance && !!currencyAmount && currencyBalance.lessThan(currencyAmount)

      // Where the presets render, from the old header, footer and Max button conditions.
      const isDesktop = isWebAppDesktop || isExtensionApp
      const showHeaderPresets =
        isDesktop && !hidePresets && !headerAccessory && !isOutput && !!headerLabel && !!currencyBalance
      const showFooterPresets =
        !showMaxButtonOnly &&
        !hidePresets &&
        !headerAccessory &&
        !isOutput &&
        (isMobileWeb || (isDesktop && !headerLabel))
      const showMaxButton = showMaxButtonOnly && !isOutput && !hidePresets && !!onSetPresetValue
      const presetsPlacement: CurrencyInputPanelPresetsPlacement | undefined = showHeaderPresets
        ? 'header'
        : showFooterPresets
          ? 'footer'
          : showMaxButton
            ? 'balance'
            : undefined

      const { presets, maxBalanceInfo } = useCurrencyInputPanelPresets({
        placement: presetsPlacement,
        currencyField,
        currencyAmount,
        currencyBalance,
        transactionType,
        actualGasFee,
        isGasCovered,
        onSetPresetValue,
      })

      const { shakeStyle, triggerShakeAnimation } = useShakeAnimation()

      const onPressDisabledWithShakeAnimation = useCallback((): void => {
        onPressDisabled?.()
        triggerShakeAnimation()
      }, [onPressDisabled, triggerShakeAnimation])

      // No actualGasFee here: the balance press always reserved the static gas amount.
      const maxInputAmount = useMaxAmountSpend({
        currencyAmount: currencyBalance,
        txType: transactionType,
        isGasCovered,
      })

      const handlePressBalance = useCallback(() => {
        if (isOutput) {
          // For the output (Buy) panel, set the exact output amount to the balance
          if (currencyBalance && currencyBalance.greaterThan(0)) {
            onSetExactAmount(currencyBalance.toExact())
          }
        } else {
          // For the input (Sell) panel, use max amount which accounts for gas reserves
          if (maxInputAmount && maxInputAmount.greaterThan(0)) {
            onSetPresetValue?.(maxInputAmount.toExact(), 'max')
          }
        }
      }, [isOutput, currencyBalance, maxInputAmount, onSetExactAmount, onSetPresetValue])

      const onToggleFiatMode = useCallback(() => {
        if (!usdPrice) {
          dispatch(
            pushNotification({
              type: AppNotificationType.Error,
              errorMessage: t('swap.error.fiatInputUnavailable', { fiatCurrencyCode }),
              hideDelay: ONE_SECOND_MS * 3,
            }),
          )
        } else {
          onToggleIsFiatMode(currencyField)
        }
      }, [currencyField, dispatch, fiatCurrencyCode, onToggleIsFiatMode, t, usdPrice])

      // In fiat mode, show equivalent token amount. In token mode, show equivalent fiat amount
      const fiatValue = useTokenAndFiatDisplayAmounts({ value, currencyInfo, currencyAmount, usdValue, isFiatMode })

      // The amount field only mounts with a token, so its clearing and keyboard effects wait for one.
      const { formattedValue, onChangeFormattedText } = useAmountInputText({
        value,
        onChangeText: onSetExactAmount,
        showSoftInputOnFocus,
        maxDecimals: isFiatMode ? MAX_FIAT_INPUT_DECIMALS : currencyInfo?.currency.decimals,
        isFieldMounted: !!currencyInfo,
      })

      // Keeps the old stepped sizing, which the view's own fitting does not reproduce exactly.
      const inputFontSize = useCurrencyInputFontSize({ value, focus, options: fontSizeOptions })

      const inputRef = useRef<TextInput | null>(null)
      const { selection, followNativeSelection, setCaret } = useDeferredCaret(value)

      useImperativeHandle(forwardedRef, () => ({
        textInputRef: inputRef,
        triggerShakeAnimation,
        setSelection: setCaret,
      }))

      useInputFocusSync({ inputRef, focus, value, currencyField, resetSelection })

      const onSelectionChange = useCallback(
        ({ start, end }: { start: number; end: number }) => {
          // Follow the caret the user moved, or the controlled `selection` would push ours back.
          followNativeSelection({ start, end })
          selectionChange?.(start, end)
        },
        [selectionChange, followNativeSelection],
      )

      const refetchAnimationStyle = useRefetchAnimationStyle(props)

      // Hide balance if panel is output, and no balance, or disconnected or the token selector is hidden
      const hideCurrencyBalance =
        (isOutput && currencyBalance?.equalTo(0)) || isDisconnected || !!hidePresets || !!hideBalance
      const canPressBalance = !disabled && (isOutput || !!onSetPresetValue) && !!currencyBalance?.greaterThan(0)
      const balance =
        currencyInfo && !hideCurrencyBalance
          ? {
              amount: formatCurrencyAmount({ value: currencyBalance, type: NumberType.TokenTx }),
              symbol: getSymbolDisplayText(currencyInfo.currency.symbol) ?? undefined,
              onPress: canPressBalance ? handlePressBalance : undefined,
            }
          : undefined

      const { token, accent, showChevron } = getSelectTokenButtonProps({
        selectedCurrencyInfo: currencyInfo,
        tokenColor,
      })

      const tokenOptions = showDefaultTokenOptions ? (
        isWebAppDesktop ? (
          <QuickSelectDefaultTokenOptions />
        ) : (
          <DefaultTokenOptions currencyField={CurrencyField.OUTPUT} />
        )
      ) : undefined

      return (
        <>
          <CurrencyInputPanelView
            // On iOS the pressable is one accessibility element, which hides the token button and
            // the amount input from the e2e test tree; only e2e builds opt out of that
            accessible={!isE2eTestEnv()}
            accessory={panelAccessory}
            amount={{
              value: formattedValue,
              onChangeValue: onChangeFormattedText,
              state: display.color === '$neutral3' ? 'indicative' : 'default',
              prefix: isFiatMode ? fiatCurrencySymbol : undefined,
              suffix: inputSuffix || undefined,
              fontSize: inputFontSize.fontSize,
              onFieldLayout: inputFontSize.onLayout,
              autoFocus: autoFocus ?? focus,
              onBlur,
              showSoftInputOnFocus,
              selection,
              onSelectionChange,
              inputRef,
              animatedStyle: refetchAnimationStyle,
              testID: isOutput ? TestID.AmountInputOut : TestID.AmountInputIn,
            }}
            balance={balance}
            card={getPanelCard(customPanelStyle)}
            disabled={disabled}
            fiatValue={isTestnetModeEnabled ? undefined : fiatValue}
            hasAmount={!!currencyAmount}
            headerAccessory={headerAccessory}
            inputRowAnimatedStyle={shakeStyle}
            isBalanceInsufficient={showInsufficientBalanceWarning}
            label={headerLabel}
            presets={presets}
            showFiatToggleIcon={showFiatToggleIcon}
            token={token}
            tokenButton={{
              hidden: !!hidePresets,
              accent,
              showChevron,
              testID: isOutput ? TestID.ChooseOutputToken : TestID.ChooseInputToken,
            }}
            tokenOptions={tokenOptions}
            tokenOptionsPlacement={isWebAppDesktop ? 'header' : 'input'}
            variant={getPanelVariant(props)}
            onPressDisabled={onPressDisabledWithShakeAnimation}
            onPressFiatValue={isTestnetModeEnabled ? onPressDisabledWithShakeAnimation : onToggleFiatMode}
            onPressIn={onPressIn}
            onPressSelectToken={onShowTokenSelector}
          />
          {presets && (
            <MaxBalanceInfoModal
              currencySymbol={currencyBalance?.currency.symbol}
              isMax={maxBalanceInfo.isMax}
              isModalOpen={maxBalanceInfo.isOpen}
              isTooltipEnabled={false}
              onClose={maxBalanceInfo.onClose}
            />
          )}
        </>
      )
    },
  ),
)
