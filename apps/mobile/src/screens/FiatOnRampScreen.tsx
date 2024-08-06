import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ComponentProps, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInputProps } from 'react-native'
import FastImage from 'react-native-fast-image'
import { FadeIn, FadeOut, FadeOutDown } from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { FiatOnRampStackParamList } from 'src/app/navigation/types'
import { FiatOnRampCtaButton } from 'src/components/fiatOnRamp/CtaButton'
import { Screen } from 'src/components/layout/Screen'
import { FiatOnRampAmountSection, FiatOnRampAmountSectionRef } from 'src/features/fiatOnRamp/FiatOnRampAmountSection'
import { useFiatOnRampContext } from 'src/features/fiatOnRamp/FiatOnRampContext'
import { FiatOnRampCountryListModal } from 'src/features/fiatOnRamp/FiatOnRampCountryListModal'
import { FiatOnRampTokenSelectorModal } from 'src/features/fiatOnRamp/FiatOnRampTokenSelector'
import { Flex, Text, isWeb, useIsDarkMode, useIsShortMobileDevice } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import { FiatOnRampCountryPicker } from 'uniswap/src/features/fiatOnRamp/FiatOnRampCountryPicker'
import { useFiatOnRampAggregatorGetCountryQuery } from 'uniswap/src/features/fiatOnRamp/api'
import {
  FORQuote,
  FORServiceProvider,
  FiatOnRampCurrency,
  InitialQuoteSelection,
} from 'uniswap/src/features/fiatOnRamp/types'
import { getServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'
import { FiatOnRampEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UniverseEventProperties } from 'uniswap/src/features/telemetry/types'
import { FiatOnRampScreens } from 'uniswap/src/types/screens/mobile'
import { truncateToMaxDecimals } from 'utilities/src/format/truncateToMaxDecimals'
import { usePrevious } from 'utilities/src/react/hooks'
import { DEFAULT_DELAY, useDebounce } from 'utilities/src/time/timing'
import { useLocalFiatToUSDConverter } from 'wallet/src/features/fiatCurrency/hooks'
import {
  useFiatOnRampQuotes,
  useFiatOnRampSupportedTokens,
  useMeldFiatCurrencySupportInfo,
  useParseFiatOnRampError,
} from 'wallet/src/features/fiatOnRamp/hooks'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import {
  DecimalPadCalculateSpace,
  DecimalPadInput,
  DecimalPadInputRef,
} from 'wallet/src/features/transactions/swap/DecimalPadInput'

type Props = NativeStackScreenProps<FiatOnRampStackParamList, FiatOnRampScreens.AmountInput>

const MAX_FIAT_INPUT_DECIMALS = 2
const ON_SELECTION_CHANGE_WAIT_TIME_MS = 500

function selectInitialQuote(quotes: FORQuote[] | undefined): {
  quote: FORQuote | undefined
  type: InitialQuoteSelection | undefined
} {
  const quoteFromLastUsedProvider = quotes?.find((q) => q.isMostRecentlyUsedProvider)
  if (quoteFromLastUsedProvider) {
    return {
      quote: quoteFromLastUsedProvider,
      type: InitialQuoteSelection.MostRecent,
    }
  }

  const bestQuote = quotes && quotes.length && quotes[0]
  if (bestQuote) {
    return {
      quote: quotes.reduce<FORQuote>((prev, curr) => {
        return curr.destinationAmount > prev.destinationAmount ? curr : prev
      }, bestQuote),
      type: InitialQuoteSelection.Best,
    }
  }
  return { quote: undefined, type: undefined }
}

function preloadServiceProviderLogos(serviceProviders: FORServiceProvider[], isDarkMode: boolean): void {
  FastImage.preload(
    serviceProviders.map((sp) => ({ uri: getServiceProviderLogo(sp.logos, isDarkMode) })).filter((sp) => !!sp.uri),
  )
}

const PREDEFINED_AMOUNTS_SUPPORTED_CURRENCIES = ['usd', 'eur', 'gbp', 'aud', 'cad', 'sgd']

export function FiatOnRampScreen({ navigation }: Props): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const isDarkMode = useIsDarkMode()
  const [value, setValue] = useState('')
  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const inputRef = useRef<FiatOnRampAmountSectionRef>(null)
  const [selectingCountry, setSelectingCountry] = useState(false)
  const [decimalPadReady, setDecimalPadReady] = useState(false)
  const decimalPadRef = useRef<DecimalPadInputRef>(null)
  const selectionRef = useRef<TextInputProps['selection']>()
  const valueRef = useRef<string>('')
  const amountUpdatedTimeRef = useRef<number>(0)

  const isShortMobileDevice = useIsShortMobileDevice()
  const { isSheetReady } = useBottomSheetContext()

  // passed to memo(...) component
  const onDecimalPadReady = useCallback(() => setDecimalPadReady(true), [])

  // passed to memo(...) component
  const onDecimalPadTriggerInputShake = useCallback(() => {
    inputRef.current?.triggerShakeAnimation()
  }, [inputRef])

  // passed to memo(...) component
  const resetSelection = useCallback(({ start, end }: { start: number; end?: number }): void => {
    selectionRef.current = { start, end }
    if (!isWeb && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.textInputRef.current?.setNativeProps?.({ selection: { start, end } })
      }, 0)
    }
  }, [])

  const {
    selectedQuote,
    setSelectedQuote,
    setQuotesSections,
    countryCode,
    setCountryCode,
    countryState,
    setCountryState,
    amount,
    setAmount,
    setBaseCurrencyInfo,
    quoteCurrency,
    setQuoteCurrency,
  } = useFiatOnRampContext()

  const { appFiatCurrencySupportedInMeld, meldSupportedFiatCurrency, supportedFiatCurrencies } =
    useMeldFiatCurrencySupportInfo(countryCode)

  const debouncedAmount = useDebounce(amount, DEFAULT_DELAY * 2)
  const {
    error: quotesError,
    loading: quotesLoading,
    quotes,
  } = useFiatOnRampQuotes({
    baseCurrencyAmount: debouncedAmount,
    baseCurrencyCode: meldSupportedFiatCurrency.code,
    quoteCurrencyCode: quoteCurrency.meldCurrencyCode,
    countryCode,
    countryState,
  })

  const selectTokenLoading = quotesLoading || amount !== debouncedAmount

  const { currentData: ipCountryData } = useFiatOnRampAggregatorGetCountryQuery()

  useEffect(() => {
    if (ipCountryData) {
      setCountryCode(ipCountryData.countryCode)
      setCountryState(ipCountryData.state)
    }
  }, [ipCountryData, setCountryCode, setCountryState])

  // preload service provider logos for given quotes for the next screen
  useEffect(() => {
    if (quotes) {
      preloadServiceProviderLogos(
        quotes.map((q) => q.serviceProviderDetails),
        isDarkMode,
      )
    }
  }, [quotes, isDarkMode])

  const prevQuotes = usePrevious(quotes)
  useEffect(() => {
    if (quotes && (!selectedQuote || prevQuotes !== quotes)) {
      const { quote, type } = selectInitialQuote(quotes)
      if (!quote) {
        return
      }
      if (type === InitialQuoteSelection.MostRecent) {
        const otherQuotes = quotes.filter((item) => item !== quote)
        setQuotesSections([{ data: [quote], type }, ...(otherQuotes.length ? [{ data: otherQuotes }] : [])])
      } else {
        setQuotesSections([{ data: quotes, type }])
      }
      setSelectedQuote(quote)
    }
  }, [prevQuotes, quotes, selectedQuote, setQuotesSections, setSelectedQuote, t])

  useEffect(() => {
    if (!quotes && (quotesError || !amount)) {
      setQuotesSections(undefined)
      setSelectedQuote(undefined)
    }
  }, [amount, quotesError, quotes, setQuotesSections, setSelectedQuote])

  const onSelectCountry: ComponentProps<typeof FiatOnRampCountryListModal>['onSelectCountry'] = (country): void => {
    dispatch(
      pushNotification({
        type: AppNotificationType.ChooseCountry,
        countryName: country.displayName,
        countryCode: country.countryCode,
      }),
    )
    setSelectingCountry(false)
    // UI does not allow to set the state
    setCountryState(undefined)
    setCountryCode(country.countryCode)
  }

  const fiatToUSDConverter = useLocalFiatToUSDConverter()

  const onChangeValue =
    (source: UniverseEventProperties[FiatOnRampEventName.FiatOnRampAmountEntered]['source']) =>
    (newAmount: string): void => {
      amountUpdatedTimeRef.current = Date.now()
      sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampAmountEntered, {
        source,
        amountUSD: fiatToUSDConverter(parseFloat(newAmount)),
      })
      const truncatedValue = truncateToMaxDecimals({
        value: newAmount,
        maxDecimals: MAX_FIAT_INPUT_DECIMALS,
      })

      valueRef.current = truncatedValue
      setValue(truncatedValue)
      setAmount(truncatedValue ? parseFloat(truncatedValue) : 0)
      // if user did not use Decimal Pad to enter value
      if (source !== 'textInput') {
        resetSelection({ start: valueRef.current.length, end: valueRef.current.length })
      }
      decimalPadRef.current?.updateDisabledKeys()
    }

  // we only show loading when there are no errors and quote value is not empty
  const buttonDisabled = selectTokenLoading || !!quotesError || !selectedQuote?.destinationAmount

  const onContinue = (): void => {
    if (quotes && quoteCurrency?.currencyInfo?.currency) {
      setBaseCurrencyInfo(meldSupportedFiatCurrency)
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

  const onSelectCurrency = (newCurrency: FiatOnRampCurrency): void => {
    setQuoteCurrency(newCurrency)
    setShowTokenSelector(false)
    if (newCurrency.currencyInfo?.currency.symbol) {
      sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampTokenSelected, {
        token: newCurrency.currencyInfo.currency.symbol.toLowerCase(),
      })
    }
  }

  // We only support predefined amounts for certain currencies.
  const predefinedAmountsSupported = PREDEFINED_AMOUNTS_SUPPORTED_CURRENCIES.includes(
    meldSupportedFiatCurrency.code.toLowerCase(),
  )

  const notAvailableInThisRegion = supportedFiatCurrencies?.length === 0

  const { errorText, errorColor } = useParseFiatOnRampError(
    !notAvailableInThisRegion && quotesError,
    meldSupportedFiatCurrency.code,
  )

  const onSelectionChange = useCallback(
    (start: number, end: number) => {
      if (Date.now() - amountUpdatedTimeRef.current < ON_SELECTION_CHANGE_WAIT_TIME_MS) {
        // We only want to trigger this callback when the user is manually moving the cursor,
        // but this function is also triggered when the input value is updated,
        // which causes issues on Android.
        // We use `amountUpdatedTimeRef` to check if the input value was updated recently,
        // and if so, we assume that the user is actually typing and not manually moving the cursor.
        return
      }
      selectionRef.current = { start, end }
      decimalPadRef.current?.updateDisabledKeys()
    },
    [amountUpdatedTimeRef],
  )

  return (
    <Screen edges={['top']}>
      <HandleBar backgroundColor="none" />
      <AnimatedFlex row height="100%" pt="$spacing12">
        {isSheetReady && (
          <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="$spacing16" px="$spacing24" width="100%">
            <Flex row alignItems="center" justifyContent="space-between">
              <Text variant="subheading1">{t('common.button.buy')}</Text>
              <FiatOnRampCountryPicker
                countryCode={countryCode}
                onPress={(): void => {
                  setSelectingCountry(true)
                }}
              />
            </Flex>
            <FiatOnRampAmountSection
              ref={inputRef}
              appFiatCurrencySupported={appFiatCurrencySupportedInMeld}
              currency={quoteCurrency}
              errorColor={errorColor}
              errorText={errorText}
              fiatCurrencyInfo={meldSupportedFiatCurrency}
              notAvailableInThisRegion={notAvailableInThisRegion}
              predefinedAmountsSupported={predefinedAmountsSupported}
              quoteAmount={selectedQuote?.destinationAmount ?? 0}
              quoteCurrencyAmountReady={Boolean(amount && selectedQuote)}
              selectTokenLoading={selectTokenLoading}
              value={value}
              onChoosePredifendAmount={onChangeValue('chip')}
              onEnterAmount={onChangeValue('textInput')}
              onSelectionChange={onSelectionChange}
              onTokenSelectorPress={(): void => {
                setShowTokenSelector(true)
              }}
            />
            <DecimalPadCalculateSpace decimalPadRef={decimalPadRef} isShortMobileDevice={isShortMobileDevice} />
            <AnimatedFlex
              bottom={0}
              exiting={FadeOutDown}
              gap="$spacing8"
              left={0}
              opacity={decimalPadReady ? 1 : 0}
              pb="$spacing24"
              position="absolute"
              px="$spacing24"
              right={0}
            >
              <Flex grow justifyContent="flex-end">
                <DecimalPadInput
                  ref={decimalPadRef}
                  maxDecimals={MAX_FIAT_INPUT_DECIMALS}
                  resetSelection={resetSelection}
                  selectionRef={selectionRef}
                  setValue={onChangeValue('textInput')}
                  valueRef={valueRef}
                  onReady={onDecimalPadReady}
                  onTriggerInputShakeAnimation={onDecimalPadTriggerInputShake}
                />
              </Flex>
              <FiatOnRampCtaButton
                eligible
                continueButtonText={t('common.button.continue')}
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
          onSelectCurrency={onSelectCurrency}
        />
      )}
    </Screen>
  )
}
