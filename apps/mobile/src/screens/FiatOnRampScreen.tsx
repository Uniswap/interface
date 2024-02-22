import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ComponentProps, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput, TextInputProps } from 'react-native'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { useAppDispatch, useShouldShowNativeKeyboard } from 'src/app/hooks'
import { FiatOnRampStackParamList } from 'src/app/navigation/types'
import { FiatOnRampCtaButton } from 'src/components/fiatOnRamp/CtaButton'
import { Screen } from 'src/components/layout/Screen'
import {
  useFiatOnRampQuotes,
  useMeldFiatCurrencySupportInfo,
  useParseFiatOnRampError,
} from 'src/features/fiatOnRamp/aggregatorHooks'
import { FiatOnRampAmountSection } from 'src/features/fiatOnRamp/FiatOnRampAmountSection'
import { useFiatOnRampContext } from 'src/features/fiatOnRamp/FiatOnRampContext'
import { FiatOnRampCountryListModal } from 'src/features/fiatOnRamp/FiatOnRampCountryListModal'
import { FiatOnRampCountryPicker } from 'src/features/fiatOnRamp/FiatOnRampCountryPicker'
import { FiatOnRampTokenSelectorModal } from 'src/features/fiatOnRamp/FiatOnRampTokenSelector'
import { useFiatOnRampSupportedTokens } from 'src/features/fiatOnRamp/hooks'
import { FiatOnRampCurrency, InitialQuoteSelection } from 'src/features/fiatOnRamp/types'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { MobileEventProperties } from 'src/features/telemetry/types'
import { FiatOnRampScreens } from 'src/screens/Screens'
import { AnimatedFlex, Flex, Text } from 'ui/src'
import { usePrevious } from 'utilities/src/react/hooks'
import { DecimalPadLegacy } from 'wallet/src/components/legacy/DecimalPadLegacy'
import { useBottomSheetContext } from 'wallet/src/components/modals/BottomSheetContext'
import { HandleBar } from 'wallet/src/components/modals/HandleBar'
import { useFiatOnRampAggregatorServiceProvidersQuery } from 'wallet/src/features/fiatOnRamp/api'
import { FORQuote } from 'wallet/src/features/fiatOnRamp/types'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'

type Props = NativeStackScreenProps<FiatOnRampStackParamList, FiatOnRampScreens.AmountInput>

function selectInitialQuote(
  quotes: FORQuote[] | undefined,
  lastTransaction: undefined
): { quote: FORQuote | undefined; type: InitialQuoteSelection | undefined } {
  if (lastTransaction) {
    // setting "Recently used"
    // TODO:https://linear.app/uniswap/issue/MOB-2533/implement-recently-used-logic
  } else {
    // setting "Best overall"
    const initialQuote = quotes && quotes.length && quotes[0]
    if (initialQuote) {
      return {
        quote: quotes.reduce<FORQuote>((prev, curr) => {
          return curr.destinationAmount > prev.destinationAmount ? curr : prev
        }, initialQuote),
        type: InitialQuoteSelection.Best,
      }
    }
  }
  return { quote: undefined, type: undefined }
}

export function FiatOnRampScreen({ navigation }: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [selection, setSelection] = useState<TextInputProps['selection']>()
  const [value, setValue] = useState('')
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const inputRef = useRef<TextInput>(null)
  const [selectingCountry, setSelectingCountry] = useState(false)

  const { isSheetReady } = useBottomSheetContext()

  const {
    selectedQuote,
    setSelectedQuote,
    setQuotesSections,
    countryCode,
    setCountryCode,
    amount,
    setAmount,
    setBaseCurrencyInfo,
    setServiceProviders,
    quoteCurrency,
    setQuoteCurrency,
  } = useFiatOnRampContext()

  const resetSelection = (start: number, end?: number): void => {
    setSelection({ start, end: end ?? start })
  }

  const { showNativeKeyboard, onDecimalPadLayout, isLayoutPending, onInputPanelLayout } =
    useShouldShowNativeKeyboard()

  const { appFiatCurrencySupportedInMeld, meldSupportedFiatCurrency } =
    useMeldFiatCurrencySupportInfo()

  const {
    error: quotesError,
    loading: quotesLoading,
    quotes,
  } = useFiatOnRampQuotes({
    baseCurrencyAmount: amount,
    baseCurrencyCode: meldSupportedFiatCurrency.code,
    quoteCurrencyCode: quoteCurrency.currencyInfo?.currency.symbol,
    countryCode,
  })

  const {
    currentData: serviceProvidersResponse,
    isFetching: serviceProvidersLoading,
    error: serviceProvidersError,
  } = useFiatOnRampAggregatorServiceProvidersQuery()

  const { errorText, errorColor } = useParseFiatOnRampError(
    quotesError || serviceProvidersError,
    meldSupportedFiatCurrency.code
  )

  const prevQuotes = usePrevious(quotes)
  useEffect(() => {
    if (quotes && (!selectedQuote || prevQuotes !== quotes)) {
      const { quote, type } = selectInitialQuote(quotes, undefined)
      if (!quote) {
        return
      }
      const otherQuotes = quotes.filter((item) => item !== quote)
      setQuotesSections([
        { data: [quote], type },
        ...(otherQuotes.length ? [{ data: otherQuotes }] : []),
      ])
      setSelectedQuote(quote)
    }
  }, [prevQuotes, quotes, selectedQuote, setQuotesSections, setSelectedQuote, t])

  useEffect(() => {
    if (!quotes && (quotesError || serviceProvidersError || !amount)) {
      setQuotesSections(undefined)
      setSelectedQuote(undefined)
    }
  }, [amount, quotesError, serviceProvidersError, quotes, setQuotesSections, setSelectedQuote])

  const onSelectCountry: ComponentProps<typeof FiatOnRampCountryListModal>['onSelectCountry'] = (
    country
  ): void => {
    dispatch(
      pushNotification({
        type: AppNotificationType.ChooseCountry,
        countryName: country.displayName,
        countryCode: country.countryCode,
      })
    )
    setSelectingCountry(false)
    setCountryCode(country.countryCode)
  }

  const onChangeValue =
    (source: MobileEventProperties[MobileEventName.FiatOnRampAmountEntered]['source']) =>
    (newAmount: string): void => {
      sendMobileAnalyticsEvent(MobileEventName.FiatOnRampAmountEntered, {
        source,
      })
      setValue(newAmount)
      setAmount(newAmount ? parseFloat(newAmount) : 0)
    }

  // hide keyboard when user goes to token selector screen
  useEffect(() => {
    if (showTokenSelector) {
      inputRef.current?.blur()
    } else if (showNativeKeyboard) {
      inputRef.current?.focus()
    }
  }, [showNativeKeyboard, showTokenSelector])

  // we only show loading when there are no errors and quote value is not empty
  const buttonDisabled =
    serviceProvidersLoading ||
    !!serviceProvidersError ||
    quotesLoading ||
    !!quotesError ||
    !selectedQuote?.destinationAmount

  const onContinue = (): void => {
    if (
      quotes &&
      serviceProvidersResponse?.serviceProviders &&
      serviceProvidersResponse?.serviceProviders.length > 0 &&
      quoteCurrency?.currencyInfo?.currency
    ) {
      setBaseCurrencyInfo(meldSupportedFiatCurrency)
      setServiceProviders(serviceProvidersResponse.serviceProviders)
      navigation.navigate(FiatOnRampScreens.ServiceProviders)
    }
  }

  const {
    list: supportedTokensList,
    loading: supportedTokensLoading,
    error: supportedTokensError,
    refetch: supportedTokensRefetch,
  } = useFiatOnRampSupportedTokens({
    sourceCurrencyCode: meldSupportedFiatCurrency.code,
    countryCode,
  })

  return (
    <Screen edges={['top']}>
      <HandleBar backgroundColor="none" />
      <AnimatedFlex row height="100%" pt="$spacing12">
        {isSheetReady && (
          <AnimatedFlex
            entering={FadeIn}
            exiting={FadeOut}
            gap="$spacing16"
            px="$spacing24"
            width="100%">
            <Flex row alignItems="center" justifyContent="space-between">
              <Text variant="subheading1">{t('Buy')}</Text>
              <FiatOnRampCountryPicker
                countryCode={countryCode}
                onPress={(): void => {
                  setSelectingCountry(true)
                }}
              />
            </Flex>
            <FiatOnRampAmountSection
              predefinedAmountsSupported
              appFiatCurrencySupported={appFiatCurrencySupportedInMeld}
              currency={quoteCurrency}
              errorColor={errorColor}
              errorText={errorText}
              fiatCurrencyInfo={meldSupportedFiatCurrency}
              inputRef={inputRef}
              quoteAmount={selectedQuote?.destinationAmount ?? 0}
              quoteCurrencyAmountReady={Boolean(amount && selectedQuote)}
              selectTokenLoading={quotesLoading}
              setSelection={setSelection}
              showNativeKeyboard={showNativeKeyboard}
              showSoftInputOnFocus={showNativeKeyboard}
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
              pb="$spacing24"
              position="absolute"
              px="$spacing24"
              right={0}
              onLayout={onDecimalPadLayout}>
              {!showNativeKeyboard && (
                <DecimalPadLegacy
                  resetSelection={resetSelection}
                  selection={selection}
                  setValue={onChangeValue('textInput')}
                  value={value}
                />
              )}
              <FiatOnRampCtaButton
                eligible
                continueButtonText={t('Continue')}
                disabled={buttonDisabled}
                onPress={onContinue}
              />
            </AnimatedFlex>
          </AnimatedFlex>
        )}
      </AnimatedFlex>
      {selectingCountry && countryCode && (
        <FiatOnRampCountryListModal
          countryCode={countryCode}
          onClose={(): void => {
            setSelectingCountry(false)
          }}
          onSelectCountry={onSelectCountry}
        />
      )}
      {showTokenSelector && countryCode && (
        <FiatOnRampTokenSelectorModal
          error={supportedTokensError}
          list={supportedTokensList}
          loading={supportedTokensLoading}
          onClose={(): void => setShowTokenSelector(false)}
          onRetry={supportedTokensRefetch}
          onSelectCurrency={(newCurrency: FiatOnRampCurrency): void => {
            setQuoteCurrency(newCurrency)
            setShowTokenSelector(false)
          }}
        />
      )}
    </Screen>
  )
}
