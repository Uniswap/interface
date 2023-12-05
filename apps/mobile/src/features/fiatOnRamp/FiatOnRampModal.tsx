import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TextInput } from 'react-native'
import {
  FadeIn,
  FadeOut,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useAppDispatch, useShouldShowNativeKeyboard } from 'src/app/hooks'
import { FiatOnRampCtaButton } from 'src/components/fiatOnRamp/CtaButton'
import { DecimalPad } from 'src/components/input/DecimalPad'
import { TextInputProps } from 'src/components/input/TextInput'
import { useBottomSheetContext } from 'src/components/modals/BottomSheetContext'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { FiatOnRampTokenSelector } from 'src/components/TokenSelector/FiatOnRampTokenSelector'
import { FiatOnRampAmountSection } from 'src/features/fiatOnRamp/FiatOnRampAmountSection'
import {
  FiatOnRampConnectingView,
  SERVICE_PROVIDER_ICON_SIZE,
} from 'src/features/fiatOnRamp/FiatOnRampConnecting'
import {
  useMoonpayFiatCurrencySupportInfo,
  useMoonpayFiatOnRamp,
} from 'src/features/fiatOnRamp/hooks'
import { FiatOnRampCurrency } from 'src/features/fiatOnRamp/types'
import { closeModal } from 'src/features/modals/modalSlice'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName, ModalName } from 'src/features/telemetry/constants'
import { MobileEventProperties } from 'src/features/telemetry/types'
import { openUri } from 'src/utils/linking'
import { AnimatedFlex, Flex, Text, useDeviceDimensions, useSporeColors } from 'ui/src'
import MoonpayLogo from 'ui/src/assets/logos/svg/moonpay.svg'
import { NumberType } from 'utilities/src/format/types'
import { useTimeout } from 'utilities/src/time/timing'
import { getNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import { ANIMATE_SPRING_CONFIG } from 'wallet/src/features/transactions/utils'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

const MOONPAY_UNSUPPORTED_REGION_HELP_URL =
  'https://support.uniswap.org/hc/en-us/articles/11306664890381-Why-isn-t-MoonPay-available-in-my-region-'

const PREDEFINED_AMOUNTS_SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD']

const CONNECTING_TIMEOUT = 2000

export function FiatOnRampModal(): JSX.Element {
  const colors = useSporeColors()

  const dispatch = useAppDispatch()
  const onClose = useCallback((): void => {
    dispatch(closeModal({ name: ModalName.FiatOnRamp }))
  }, [dispatch])

  return (
    <BottomSheetModal
      fullScreen
      hideKeyboardOnDismiss
      backgroundColor={colors.surface1.get()}
      name={ModalName.FiatOnRamp}
      onClose={onClose}>
      <FiatOnRampContent onClose={onClose} />
    </BottomSheetModal>
  )
}

function FiatOnRampContent({ onClose }: { onClose: () => void }): JSX.Element {
  const { t } = useTranslation()
  const { fullWidth } = useDeviceDimensions()
  const { formatNumberOrString } = useLocalizationContext()
  const inputRef = useRef<TextInput>(null)

  const { isSheetReady } = useBottomSheetContext()

  const [showConnectingToMoonpayScreen, setShowConnectingToMoonpayScreen] = useState(false)

  const { showNativeKeyboard, onDecimalPadLayout, isLayoutPending, onInputPanelLayout } =
    useShouldShowNativeKeyboard()

  const [selection, setSelection] = useState<TextInputProps['selection']>()

  const resetSelection = (start: number, end?: number): void => {
    setSelection({ start, end: end ?? start })
  }

  const [value, setValue] = useState('')

  // We hardcode ETH as the starting currency
  const ethCurrencyInfo = useCurrencyInfo(
    buildCurrencyId(ChainId.Mainnet, getNativeAddress(ChainId.Mainnet))
  )

  const [currency, setCurrency] = useState<FiatOnRampCurrency>({
    currencyInfo: ethCurrencyInfo,
    moonpayCurrency: {
      code: 'eth',
      type: 'crypto',
      id: '',
      supportsLiveMode: true,
      supportsTestMode: true,
      isSupportedInUS: true,
      notAllowedUSStates: [],
    },
  })

  const { appFiatCurrencySupportedInMoonpay, moonpaySupportedFiatCurrency } =
    useMoonpayFiatCurrencySupportInfo()

  // We only support predefined amounts for certain currencies.
  // If the user's app fiat currency is not supported in Moonpay,
  // we fallback to USD (which does allow for predefined amounts)
  const predefinedAmountsSupported =
    PREDEFINED_AMOUNTS_SUPPORTED_CURRENCIES.includes(moonpaySupportedFiatCurrency.code) ||
    !appFiatCurrencySupportedInMoonpay

  // We might not have ethCurrencyInfo when this component is initially rendered.
  // If `ethCurrencyInfo` becomes available later while currency.currencyInfo is still unset, we update the currency state accordingly.
  useEffect(() => {
    if (ethCurrencyInfo && !currency.currencyInfo) {
      setCurrency({ ...currency, currencyInfo: ethCurrencyInfo })
    }
  }, [currency, currency.currencyInfo, ethCurrencyInfo])

  const {
    eligible,
    quoteAmount,
    isLoading,
    isError,
    externalTransactionId,
    dispatchAddTransaction,
    fiatOnRampHostUrl,
    quoteCurrencyAmountReady,
    quoteCurrencyAmountLoading,
    errorText,
    errorColor,
  } = useMoonpayFiatOnRamp({
    baseCurrencyAmount: value,
    quoteCurrencyCode: currency.moonpayCurrency.code,
  })

  useTimeout(
    async () => {
      if (fiatOnRampHostUrl) {
        await openUri(fiatOnRampHostUrl)
        dispatchAddTransaction()
        onClose()
      }
    },
    // setTimeout would be called inside this hook, only when delay >= 0
    showConnectingToMoonpayScreen ? CONNECTING_TIMEOUT : -1
  )

  const buttonEnabled =
    !isLoading && (!eligible || (!isError && fiatOnRampHostUrl && quoteCurrencyAmountReady))

  const showSoftInputOnFocus = showNativeKeyboard && eligible

  const onChangeValue =
    (source: MobileEventProperties[MobileEventName.FiatOnRampAmountEntered]['source']) =>
    (newAmount: string): void => {
      sendMobileAnalyticsEvent(MobileEventName.FiatOnRampAmountEntered, {
        source,
      })
      setValue(newAmount)
    }

  const [showTokenSelector, setShowTokenSelector] = useState(false)

  // hide keyboard when user goes to token selector screen
  useEffect(() => {
    if (showTokenSelector) {
      inputRef.current?.blur()
    } else if (showSoftInputOnFocus) {
      inputRef.current?.focus()
    }
  }, [showSoftInputOnFocus, showTokenSelector])

  const hideInnerContentRouter = showTokenSelector
  const screenXOffset = useSharedValue(hideInnerContentRouter ? -fullWidth : 0)

  useEffect(() => {
    const screenOffset = showTokenSelector ? 1 : 0
    screenXOffset.value = withSpring(-(fullWidth * screenOffset), ANIMATE_SPRING_CONFIG)
  }, [screenXOffset, showTokenSelector, fullWidth])

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenXOffset.value }],
  }))

  // we only show loading when there is no error text and value is not empty
  const selectTokenLoading = quoteCurrencyAmountLoading && !errorText && !!value

  return (
    <>
      {!showConnectingToMoonpayScreen && (
        <AnimatedFlex row height="100%" pb="$spacing12" style={wrapperStyle}>
          {isSheetReady && (
            <AnimatedFlex
              entering={FadeIn}
              exiting={FadeOut}
              gap="$spacing16"
              pb="$spacing16"
              px="$spacing24"
              width="100%">
              <Text variant="subheading1">{t('Buy')}</Text>
              <FiatOnRampAmountSection
                currency={currency}
                errorColor={errorColor}
                errorText={errorText}
                inputRef={inputRef}
                predefinedAmountsSupported={predefinedAmountsSupported}
                quoteAmount={quoteAmount}
                quoteCurrencyAmountReady={quoteCurrencyAmountReady}
                selectTokenLoading={selectTokenLoading}
                setSelection={setSelection}
                showNativeKeyboard={showNativeKeyboard}
                showSoftInputOnFocus={showSoftInputOnFocus}
                value={value}
                onChoosePredifendAmount={onChangeValue('chip')}
                onEnterAmount={onChangeValue('textInput')}
                onInputPanelLayout={onInputPanelLayout}
                onTokenSelectorPress={(): void => {
                  setShowTokenSelector(true)
                }}
              />
              <AnimatedFlex
                bottom={0}
                exiting={FadeOutDown}
                gap="$spacing8"
                left={0}
                opacity={isLayoutPending ? 0 : 1}
                position="absolute"
                px="$spacing24"
                right={0}
                onLayout={onDecimalPadLayout}>
                {!showNativeKeyboard && (
                  <DecimalPad
                    resetSelection={resetSelection}
                    selection={selection}
                    setValue={onChangeValue('textInput')}
                    value={value}
                  />
                )}
                <FiatOnRampCtaButton
                  analyticsProperties={{ externalTransactionId }}
                  continueButtonText={
                    appFiatCurrencySupportedInMoonpay ? t('Continue to checkout') : t('Checkout')
                  }
                  disabled={!buttonEnabled}
                  eligible={eligible}
                  isLoading={isLoading}
                  onPress={async (): Promise<void> => {
                    if (eligible) {
                      setShowConnectingToMoonpayScreen(true)
                    } else {
                      await openUri(MOONPAY_UNSUPPORTED_REGION_HELP_URL)
                    }
                  }}
                />
              </AnimatedFlex>
            </AnimatedFlex>
          )}
          {showTokenSelector && (
            <FiatOnRampTokenSelector
              onBack={(): void => setShowTokenSelector(false)}
              onSelectCurrency={(newCurrency: FiatOnRampCurrency): void => {
                setCurrency(newCurrency)
                setShowTokenSelector(false)
              }}
            />
          )}
        </AnimatedFlex>
      )}
      {showConnectingToMoonpayScreen && (
        <FiatOnRampConnectingView
          amount={formatNumberOrString({
            value,
            type: NumberType.FiatTokenPrice,
            currencyCode: moonpaySupportedFiatCurrency.code,
          })}
          quoteCurrencyCode={currency.currencyInfo?.currency.symbol}
          serviceProviderLogo={
            <Flex
              alignItems="center"
              borderRadius="$rounded20"
              height={SERVICE_PROVIDER_ICON_SIZE}
              justifyContent="center"
              style={styles.moonpayLogoWrapper}
              width={SERVICE_PROVIDER_ICON_SIZE}>
              <MoonpayLogo height={SERVICE_PROVIDER_ICON_SIZE} width={SERVICE_PROVIDER_ICON_SIZE} />
            </Flex>
          }
          serviceProviderName="MoonPay"
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  moonpayLogoWrapper: {
    backgroundColor: '#7D00FF',
  },
})
