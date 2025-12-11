/* eslint-disable max-lines */
/* eslint-disable complexity */
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { ComponentProps, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { OffRampPopover } from 'src/features/fiatOnRamp/OffRampPopover'
import { Flex, useIsDarkMode, useIsShortMobileDevice } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import { PillMultiToggle } from 'uniswap/src/components/pill/PillMultiToggle'
import { MAX_FIAT_INPUT_DECIMALS } from 'uniswap/src/constants/transactions'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import { useFiatOnRampAggregatorGetCountryQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { FiatOnRampCountryPicker } from 'uniswap/src/features/fiatOnRamp/FiatOnRampCountryPicker'
import {
  useFiatOnRampQuotes,
  useFiatOnRampSupportedTokens,
  useIsFORLoading,
  useMeldFiatCurrencySupportInfo,
  useParseFiatOnRampError,
} from 'uniswap/src/features/fiatOnRamp/hooks'
import { TokenSelectorBalanceDisplay } from 'uniswap/src/features/fiatOnRamp/TokenSelectorBalanceDisplay'
import {
  FiatOnRampCurrency,
  FORCurrencyOrBalance,
  FORServiceProvider,
  RampDirection,
  RampToggle,
} from 'uniswap/src/features/fiatOnRamp/types'
import UnsupportedTokenModal from 'uniswap/src/features/fiatOnRamp/UnsupportedTokenModal'
import {
  getServiceProviderLogo,
  isSupportedFORCurrency,
  organizeQuotesIntoSections,
} from 'uniswap/src/features/fiatOnRamp/utils'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { FiatOffRampEventName, FiatOnRampEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { FORAmountEnteredProperties } from 'uniswap/src/features/telemetry/types'
import {
  DecimalPadCalculatedSpaceId,
  DecimalPadCalculateSpace,
  DecimalPadInput,
  DecimalPadInputRef,
} from 'uniswap/src/features/transactions/components/DecimalPadInput/DecimalPadInput'
import { useUSDTokenUpdater } from 'uniswap/src/features/transactions/hooks/useUSDTokenUpdater'
import { CurrencyField } from 'uniswap/src/types/currency'
import { FiatOnRampScreens } from 'uniswap/src/types/screens/mobile'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { truncateToMaxDecimals } from 'utilities/src/format/truncateToMaxDecimals'
import { isIOS, isWebPlatform } from 'utilities/src/platform'
import { usePrevious } from 'utilities/src/react/hooks'
import { DEFAULT_DELAY, useDebounce } from 'utilities/src/time/timing'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<FiatOnRampStackParamList, FiatOnRampScreens.AmountInput>

const ON_SELECTION_CHANGE_WAIT_TIME_MS = 500
const MAX_TOKEN_DECIMALS = 9 // limited for design purposes
const MAX_INPUT_LENGTH = MAX_TOKEN_DECIMALS + 2

function preloadServiceProviderLogos(serviceProviders: FORServiceProvider[], isDarkMode: boolean): void {
  FastImage.preload(
    serviceProviders.map((sp) => ({ uri: getServiceProviderLogo(sp.logos, isDarkMode) })).filter((sp) => !!sp.uri),
  )
}

const PREDEFINED_AMOUNTS_SUPPORTED_CURRENCIES = ['usd', 'eur', 'gbp', 'aud', 'cad', 'sgd']
const US_STATES_WITH_RESTRICTIONS = 'US-NY'

// TokenSelectorBalanceDisplay height: 85 + FiatOnRampCtaButton height: 30 + padding: 10
const DECIMAL_PAD_EXTRA_ELEMENTS_HEIGHT = 125

export function FiatOnRampScreen({ navigation }: Props): JSX.Element {
  const [showUnsupportedTokenModal, setShowUnsupportedTokenModal] = useState(false)
  const [unsupportedCurrency, setUnsupportedCurrency] = useState<FiatOnRampCurrency>()
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const isDarkMode = useIsDarkMode()
  const {
    selectedQuote,
    setSelectedQuote,
    setQuotesSections,
    countryCode,
    setCountryCode,
    countryState,
    setCountryState,
    fiatAmount,
    setFiatAmount,
    tokenAmount,
    setTokenAmount,
    setBaseCurrencyInfo,
    quoteCurrency,
    defaultCurrency,
    setQuoteCurrency,
    setIsOffRamp,
    isOffRamp,
    isTokenInputMode,
    setIsTokenInputMode,
    externalTransactionIdSuffix,
    providers,
    currencyCode,
  } = useFiatOnRampContext()

  const [showTokenSelector, setShowTokenSelector] = useState(false)
  const inputRef = useRef<FiatOnRampAmountSectionRef>(null)
  const [selectingCountry, setSelectingCountry] = useState(false)
  const [decimalPadReady, setDecimalPadReady] = useState(false)
  const decimalPadRef = useRef<DecimalPadInputRef>(null)
  const selectionRef = useRef<TextInputProps['selection']>(undefined)
  const amountUpdatedTimeRef = useRef<number>(0)
  const [value, setValue] = useState('')
  const valueRef = useRef<string>('')

  // Initialize value state with prefilled amount if available
  useEffect(() => {
    const initialValue = isTokenInputMode ? (tokenAmount?.toString() ?? '') : (fiatAmount?.toString() ?? '')
    setValue(initialValue)
    valueRef.current = initialValue
  }, [isTokenInputMode, tokenAmount, fiatAmount])

  const isShortMobileDevice = useIsShortMobileDevice()
  const { isSheetReady } = useBottomSheetContext()

  // passed to memo(...) component
  const onDecimalPadReady = useCallback(() => setDecimalPadReady(true), [])

  // passed to memo(...) component
  const onDecimalPadTriggerInputShake = useCallback(() => {
    inputRef.current?.triggerShakeAnimation()
  }, [])

  // passed to memo(...) component
  const resetSelection = useCallback(({ start, end }: { start: number; end?: number }): void => {
    selectionRef.current = { start, end }
    if (!isWebPlatform && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.textInputRef.current?.setNativeProps({ selection: { start, end } })
      }, 0)
    }
  }, [])

  const { appFiatCurrencySupportedInMeld, meldSupportedFiatCurrency, supportedFiatCurrencies } =
    useMeldFiatCurrencySupportInfo({
      countryCode,
      skip: false,
      rampDirection: isOffRamp ? RampDirection.OFFRAMP : RampDirection.ONRAMP,
    })

  const debouncedFiatAmount = useDebounce(fiatAmount, DEFAULT_DELAY * 2)
  const debouncedTokenAmount = useDebounce(tokenAmount, DEFAULT_DELAY * 2)

  const activeAccount = useActiveAccountWithThrow()
  const { data: balancesById } = usePortfolioBalances({ evmAddress: activeAccount.address })
  const portfolioBalance = quoteCurrency.currencyInfo && balancesById?.[quoteCurrency.currencyInfo.currencyId]
  const tokenMaxDecimals = Math.min(quoteCurrency.currencyInfo?.currency.decimals ?? 0, MAX_TOKEN_DECIMALS)

  const exceedsBalanceError = useMemo(() => {
    if (!isOffRamp) {
      return false
    }

    if (isTokenInputMode) {
      if (tokenAmount && tokenAmount > (portfolioBalance?.quantity || 0)) {
        return true
      }
    } else {
      if (fiatAmount && fiatAmount > (portfolioBalance?.balanceUSD || 0)) {
        return true
      }
    }

    return false
  }, [fiatAmount, tokenAmount, isOffRamp, portfolioBalance, isTokenInputMode])

  useUSDTokenUpdater({
    isFiatInput: !isTokenInputMode,
    exactAmountToken: tokenAmount ? tokenAmount.toString() : '',
    exactAmountFiat: fiatAmount ? fiatAmount.toString() : '',
    onFiatAmountUpdated: (amount: string) => {
      setFiatAmount(parseFloat(amount))
    },
    onTokenAmountUpdated: (amount: string) => {
      const truncatedAmount = truncateToMaxDecimals({
        value: amount,
        maxDecimals: tokenMaxDecimals,
      })
      setTokenAmount(parseFloat(truncatedAmount))
    },
    currency: quoteCurrency.currencyInfo?.currency,
  })

  const {
    error: quotesError,
    loading: quotesLoading,
    quotes,
  } = useFiatOnRampQuotes({
    baseCurrencyAmount: isOffRamp ? debouncedTokenAmount : debouncedFiatAmount,
    baseCurrencyCode: meldSupportedFiatCurrency.code,
    quoteCurrencyCode: quoteCurrency.meldCurrencyCode,
    countryCode,
    countryState,
    rampDirection: isOffRamp ? RampDirection.OFFRAMP : RampDirection.ONRAMP,
    balanceError: exceedsBalanceError,
  })

  const debouncedAmountsMatch = isTokenInputMode
    ? tokenAmount === debouncedTokenAmount
    : fiatAmount === debouncedFiatAmount

  // always enforce the amount used in the request to backend service
  const hasValidAmount = isOffRamp ? !!tokenAmount : !!fiatAmount

  const isFORLoading = useIsFORLoading({
    hasValidAmount,
    debouncedAmountsMatch,
    quotesLoading,
    exceedsBalanceError,
  })

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

  const filteredQuotes = useMemo(() => {
    if (!quotes) {
      return undefined
    }

    // If specific providers are provided, only show quotes from the specified providers
    if (providers.length > 0) {
      const providerFilteredQuotes = quotes.filter((quote) =>
        providers.includes(quote.serviceProviderDetails.serviceProvider.toUpperCase()),
      )
      return providerFilteredQuotes.length > 0 ? providerFilteredQuotes : quotes
    }

    return quotes
  }, [quotes, providers])

  const prevQuotes = usePrevious(filteredQuotes)
  useEffect(() => {
    if (filteredQuotes && (!selectedQuote || prevQuotes !== filteredQuotes)) {
      const organizedQuotes = organizeQuotesIntoSections(filteredQuotes)
      if (organizedQuotes) {
        setQuotesSections(organizedQuotes.sections)
        setSelectedQuote(organizedQuotes.initialQuote)
      }
    }
  }, [prevQuotes, filteredQuotes, selectedQuote, setQuotesSections, setSelectedQuote])

  useEffect(() => {
    if (!filteredQuotes && (quotesError || !fiatAmount)) {
      setQuotesSections(undefined)
      setSelectedQuote(undefined)
    }
  }, [quotesError, filteredQuotes, setQuotesSections, setSelectedQuote, fiatAmount])

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

  const onChangeValue = (
    newAmount: string,
    source: FORAmountEnteredProperties['source'],
    newIsTokenInputMode?: boolean,
    // eslint-disable-next-line max-params
  ): void => {
    amountUpdatedTimeRef.current = Date.now()
    sendAnalyticsEvent(
      isOffRamp ? FiatOffRampEventName.FiatOffRampAmountEntered : FiatOnRampEventName.FiatOnRampAmountEntered,
      {
        source,
        amount: parseFloat(newAmount),
        cryptoCurrency: quoteCurrency.currencyInfo?.currency.symbol,
        fiatCurrency: meldSupportedFiatCurrency.code,
        chainId: quoteCurrency.currencyInfo?.currency.chainId,
        isTokenInputMode,
        externalTransactionIdSuffix,
      },
    )

    const currentIsTokenInputMode = newIsTokenInputMode !== undefined ? newIsTokenInputMode : isTokenInputMode

    const maxDecimals = currentIsTokenInputMode ? tokenMaxDecimals : MAX_FIAT_INPUT_DECIMALS

    const truncatedValue = truncateToMaxDecimals({
      value: newAmount,
      maxDecimals,
    })

    valueRef.current = truncatedValue
    setValue(truncatedValue)

    if (currentIsTokenInputMode) {
      setTokenAmount(truncatedValue ? parseFloat(truncatedValue) : 0)
    } else {
      setFiatAmount(truncatedValue ? parseFloat(truncatedValue) : 0)
    }

    // if user did not use Decimal Pad to enter value
    if (source !== 'textInput') {
      resetSelection({ start: valueRef.current.length, end: valueRef.current.length })
    }
    decimalPadRef.current?.updateDisabledKeys()

    if (newIsTokenInputMode !== undefined && newIsTokenInputMode !== isTokenInputMode) {
      setIsTokenInputMode(newIsTokenInputMode)
    }
  }

  const onToggleIsTokenInputMode = useCallback(() => {
    const { sourceAmount, destinationAmount } = selectedQuote ?? {}

    // Use the exact amounts from the backend so that the newly populated amount is exactly what the quote returns
    const fiatAmountFromQuote = isOffRamp ? destinationAmount : sourceAmount
    const tokenAmountFromQuote = isOffRamp ? sourceAmount : destinationAmount
    const newAmount = (isTokenInputMode ? fiatAmountFromQuote : tokenAmountFromQuote)?.toString() ?? ''

    const truncatedNewAmount = truncateToMaxDecimals({
      value: newAmount,
      maxDecimals: isTokenInputMode ? MAX_FIAT_INPUT_DECIMALS : MAX_TOKEN_DECIMALS,
    })

    // update values
    valueRef.current = truncatedNewAmount
    setValue(truncatedNewAmount)

    // update cursor position and decimal pad disabled keys
    resetSelection({ start: valueRef.current.length, end: valueRef.current.length })
    decimalPadRef.current?.updateDisabledKeys()

    // toggle input mode
    setIsTokenInputMode((prev) => !prev)
  }, [isOffRamp, isTokenInputMode, resetSelection, selectedQuote, setIsTokenInputMode])

  const onContinue = (): void => {
    if (filteredQuotes && quoteCurrency.currencyInfo?.currency) {
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
    rampDirection: isOffRamp ? RampDirection.OFFRAMP : RampDirection.ONRAMP,
  })

  useEffect(() => {
    if (!currencyCode || !supportedTokensList) {
      return
    }

    const matchingCurrency = supportedTokensList.find(
      (token) => token.meldCurrencyCode?.toLowerCase() === currencyCode.toLowerCase(),
    )

    matchingCurrency && setQuoteCurrency(matchingCurrency)
  }, [currencyCode, supportedTokensList, setQuoteCurrency])

  const onSelectCurrency = (currency: FORCurrencyOrBalance): void => {
    if (isTokenInputMode) {
      resetAmount()
    } else {
      setSelectedQuote(undefined)
      // This is done for formatting reasons.  The existing value may change if max decimals of new currency is different
      onChangeValue(value, 'changeAsset')
    }

    setShowTokenSelector(false)
    if (isSupportedFORCurrency(currency)) {
      setQuoteCurrency(currency)
    } else {
      setUnsupportedCurrency(currency)
      setShowUnsupportedTokenModal(true)
    }

    if (currency.currencyInfo?.currency.symbol) {
      sendAnalyticsEvent(
        isOffRamp ? FiatOffRampEventName.FiatOffRampTokenSelected : FiatOnRampEventName.FiatOnRampTokenSelected,
        {
          token: currency.currencyInfo.currency.symbol.toLowerCase(),
          isUnsupported: !isSupportedFORCurrency(currency),
          chainId: currency.currencyInfo.currency.chainId,
          externalTransactionIdSuffix,
        },
      )
    }
  }

  // We only support predefined amounts for certain currencies.
  const predefinedAmountsSupported = PREDEFINED_AMOUNTS_SUPPORTED_CURRENCIES.includes(
    meldSupportedFiatCurrency.code.toLowerCase(),
  )

  const notAvailableInThisRegion =
    supportedFiatCurrencies?.length === 0 ||
    (!supportedTokensLoading && supportedTokensList?.length === 0) ||
    (US_STATES_WITH_RESTRICTIONS.includes(countryState || '') && filteredQuotes?.length === 0)

  const { errorText } = useParseFiatOnRampError({
    error: !notAvailableInThisRegion && quotesError,
    currencyCode: meldSupportedFiatCurrency.code,
    tokenCode: quoteCurrency.currencyInfo?.currency.symbol,
    balanceError: exceedsBalanceError,
    noQuotesReturned: filteredQuotes?.length === 0,
  })

  const onSelectionChange = useCallback((start: number, end: number) => {
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
  }, [])

  const { navigateToSwapFlow } = useWalletNavigation()
  const onAcceptUnsupportedTokenSwap = useCallback(() => {
    setShowUnsupportedTokenModal(false)

    if (unsupportedCurrency?.currencyInfo) {
      sendAnalyticsEvent(FiatOffRampEventName.FiatOffRampUnsupportedTokenSwap, {
        token: unsupportedCurrency.currencyInfo.currency.symbol,
      })

      navigateToSwapFlow({
        currencyField: CurrencyField.INPUT,
        currencyAddress: currencyIdToAddress(unsupportedCurrency.currencyInfo.currencyId),
        currencyChainId: unsupportedCurrency.currencyInfo.currency.chainId,
      })
    }
  }, [navigateToSwapFlow, unsupportedCurrency])

  const resetAmount = useCallback(() => {
    setValue('')
    setFiatAmount(0)
    setTokenAmount(0)
    valueRef.current = ''
    resetSelection({ start: 0 })
    setSelectedQuote(undefined)
  }, [setFiatAmount, setTokenAmount, resetSelection, setSelectedQuote])

  const onPillToggle = (option: string | number): void => {
    setIsOffRamp(option === RampToggle.SELL)
    resetAmount()
    setQuoteCurrency(defaultCurrency)

    sendAnalyticsEvent(FiatOffRampEventName.FORBuySellToggled, {
      value: option === RampToggle.SELL ? RampToggle.SELL : RampToggle.BUY,
    })
  }

  const buttonDisabled =
    notAvailableInThisRegion ||
    isFORLoading ||
    !!quotesError ||
    !selectedQuote?.destinationAmount ||
    exceedsBalanceError

  return (
    <Screen edges={['top', 'bottom']}>
      <HandleBar backgroundColor="none" />
      <AnimatedFlex row height="100%" pt="$spacing12">
        {isSheetReady && (
          <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="$spacing16" px="$spacing24" width="100%">
            <Flex row justifyContent="center" mt={isShortMobileDevice ? 0 : '$spacing6'}>
              <OffRampPopover
                triggerContent={
                  <PillMultiToggle
                    defaultOption={isOffRamp ? RampToggle.SELL : RampToggle.BUY}
                    options={[
                      { value: RampToggle.BUY, display: t('common.button.buy') },
                      { value: RampToggle.SELL, display: t('common.button.sell') },
                    ]}
                    onSelectOption={onPillToggle}
                  />
                }
              />
              <Flex position="absolute" right={0} top="$spacing6">
                <FiatOnRampCountryPicker
                  countryCode={countryCode}
                  onPress={(): void => {
                    setSelectingCountry(true)
                  }}
                />
              </Flex>
            </Flex>
            <FiatOnRampAmountSection
              ref={inputRef}
              appFiatCurrencySupported={appFiatCurrencySupportedInMeld}
              currency={quoteCurrency}
              errorText={errorText}
              fiatCurrencyInfo={meldSupportedFiatCurrency}
              notAvailableInThisRegion={notAvailableInThisRegion}
              portfolioBalance={portfolioBalance}
              predefinedAmountsSupported={predefinedAmountsSupported}
              quoteAmount={selectedQuote?.destinationAmount ?? 0}
              sourceAmount={selectedQuote?.sourceAmount ?? 0}
              quoteCurrencyAmountReady={Boolean(fiatAmount && selectedQuote)}
              selectTokenLoading={isFORLoading}
              value={value}
              onChoosePredefinedValue={(val: string): void => {
                onChangeValue(val, 'chip', isOffRamp)
              }}
              onEnterAmount={(amount: string, newIsTokenInputMode?: boolean): void => {
                onChangeValue(amount, 'textInput', newIsTokenInputMode)
              }}
              onToggleIsTokenInputMode={onToggleIsTokenInputMode}
              onSelectionChange={onSelectionChange}
              onTokenSelectorPress={(): void => {
                setShowTokenSelector(true)
              }}
            />

            <DecimalPadCalculateSpace
              id={DecimalPadCalculatedSpaceId.FiatOnRamp}
              decimalPadRef={decimalPadRef}
              additionalElementsHeight={DECIMAL_PAD_EXTRA_ELEMENTS_HEIGHT}
              isDecimalPadReady={decimalPadReady}
            />

            <AnimatedFlex
              bottom={0}
              exiting={FadeOutDown}
              gap={isShortMobileDevice ? 0 : '$spacing8'}
              left={0}
              opacity={decimalPadReady ? 1 : 0}
              // android devices require more bottom padding
              pb={isShortMobileDevice && isIOS ? '$spacing4' : '$spacing24'}
              position="absolute"
              px="$spacing24"
              right={0}
            >
              {quoteCurrency.currencyInfo && (
                <TokenSelectorBalanceDisplay
                  disabled={notAvailableInThisRegion}
                  portfolioBalance={portfolioBalance}
                  selectedCurrencyInfo={quoteCurrency.currencyInfo}
                  onPress={(): void => {
                    setShowTokenSelector(true)
                  }}
                />
              )}
              <Flex grow justifyContent="flex-end">
                <DecimalPadInput
                  ref={decimalPadRef}
                  maxDecimals={isTokenInputMode ? tokenMaxDecimals : MAX_FIAT_INPUT_DECIMALS}
                  resetSelection={resetSelection}
                  selectionRef={selectionRef}
                  setValue={(newValue: string): void => {
                    if (newValue.length > MAX_INPUT_LENGTH) {
                      onDecimalPadTriggerInputShake()
                      return
                    }
                    onChangeValue(newValue, 'textInput')
                  }}
                  valueRef={valueRef}
                  onReady={onDecimalPadReady}
                  onTriggerInputShakeAnimation={onDecimalPadTriggerInputShake}
                />
              </Flex>
              <FiatOnRampCtaButton
                eligible
                continueButtonText={t('common.button.continue')}
                disabled={buttonDisabled}
                isLoading={isFORLoading}
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
          balancesById={balancesById}
          error={supportedTokensError}
          isOffRamp={isOffRamp}
          list={supportedTokensList}
          loading={supportedTokensLoading}
          selectedCurrency={quoteCurrency}
          onClose={(): void => setShowTokenSelector(false)}
          onRetry={supportedTokensRefetch}
          onSelectCurrency={onSelectCurrency}
        />
      )}
      {showUnsupportedTokenModal && (
        <UnsupportedTokenModal
          isVisible
          onAccept={onAcceptUnsupportedTokenSwap}
          onBack={(): void => {
            setShowUnsupportedTokenModal(false)
            setShowTokenSelector(true)
            sendAnalyticsEvent(FiatOffRampEventName.FiatOffRampUnsupportedTokenBack, {
              token: unsupportedCurrency?.currencyInfo?.currency.symbol,
            })
          }}
          onClose={(): void => {
            setShowUnsupportedTokenModal(false)
          }}
        />
      )}
    </Screen>
  )
}
