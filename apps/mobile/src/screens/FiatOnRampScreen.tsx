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
import { Flex, Text, isWeb, useIsDarkMode, useIsShortMobileDevice } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { HandleBar } from 'uniswap/src/components/modals/HandleBar'
import { PillMultiToggle } from 'uniswap/src/components/pill/PillMultiToggle'
import { MAX_FIAT_INPUT_DECIMALS } from 'uniswap/src/constants/transactions'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances'
import { useLocalFiatToUSDConverter } from 'uniswap/src/features/fiatCurrency/hooks'
import { FiatOnRampCountryPicker } from 'uniswap/src/features/fiatOnRamp/FiatOnRampCountryPicker'
import { TokenSelectorBalanceDisplay } from 'uniswap/src/features/fiatOnRamp/TokenSelectorBalanceDisplay'
import UnsupportedTokenModal from 'uniswap/src/features/fiatOnRamp/UnsupportedTokenModal'
import { getFiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import {
  useFiatOnRampQuotes,
  useFiatOnRampSupportedTokens,
  useFormatExactCurrencyAmount,
  useMeldFiatCurrencySupportInfo,
  useParseFiatOnRampError,
} from 'uniswap/src/features/fiatOnRamp/hooks'
import {
  FORCurrencyOrBalance,
  FORServiceProvider,
  FiatOnRampCurrency,
  InitialQuoteSelection,
  RampDirection,
  RampToggle,
} from 'uniswap/src/features/fiatOnRamp/types'
import {
  getServiceProviderLogo,
  isSupportedFORCurrency,
  selectInitialQuote,
} from 'uniswap/src/features/fiatOnRamp/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { FiatOffRampEventName, FiatOnRampEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { FORAmountEnteredProperties } from 'uniswap/src/features/telemetry/types'
import {
  DecimalPadCalculateSpace,
  DecimalPadCalculatedSpaceId,
  DecimalPadInput,
  DecimalPadInputRef,
} from 'uniswap/src/features/transactions/DecimalPadInput/DecimalPadInput'
import { useUSDTokenUpdater } from 'uniswap/src/features/transactions/hooks/useUSDTokenUpdater'
import { CurrencyField } from 'uniswap/src/types/currency'
import { FiatOnRampScreens } from 'uniswap/src/types/screens/mobile'
import { currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { truncateToMaxDecimals } from 'utilities/src/format/truncateToMaxDecimals'
import { isIOS } from 'utilities/src/platform'
import { usePrevious } from 'utilities/src/react/hooks'
import { DEFAULT_DELAY, useDebounce } from 'utilities/src/time/timing'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

type Props = NativeStackScreenProps<FiatOnRampStackParamList, FiatOnRampScreens.AmountInput>

const ON_SELECTION_CHANGE_WAIT_TIME_MS = 500

function preloadServiceProviderLogos(serviceProviders: FORServiceProvider[], isDarkMode: boolean): void {
  FastImage.preload(
    serviceProviders.map((sp) => ({ uri: getServiceProviderLogo(sp.logos, isDarkMode) })).filter((sp) => !!sp.uri),
  )
}

const PREDEFINED_AMOUNTS_SUPPORTED_CURRENCIES = ['usd', 'eur', 'gbp', 'aud', 'cad', 'sgd']

export function FiatOnRampScreen({ navigation }: Props): JSX.Element {
  const isOffRampEnabled = useFeatureFlag(FeatureFlags.FiatOffRamp)
  const [showUnsupportedTokenModal, setShowUnsupportedTokenModal] = useState(false)
  const [unsupportedCurrency, setUnsupportedCurrency] = useState<FiatOnRampCurrency>()
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
  } = useFiatOnRampContext()

  const { appFiatCurrencySupportedInMeld, meldSupportedFiatCurrency, supportedFiatCurrencies } =
    useMeldFiatCurrencySupportInfo(countryCode, false, isOffRamp ? RampDirection.OFFRAMP : RampDirection.ONRAMP)

  const debouncedFiatAmount = useDebounce(fiatAmount, DEFAULT_DELAY * 2)
  const debouncedTokenAmount = useDebounce(tokenAmount, DEFAULT_DELAY * 2)

  const activeAccount = useActiveAccountWithThrow()
  const { data: balancesById } = usePortfolioBalances({ address: activeAccount.address })
  const portfolioBalance = quoteCurrency.currencyInfo && balancesById?.[quoteCurrency.currencyInfo.currencyId]
  const formattedAmount = useFormatExactCurrencyAmount(
    portfolioBalance?.quantity.toString() || '0',
    quoteCurrency.currencyInfo?.currency,
  )

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
      setTokenAmount(parseFloat(amount))
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

  useEffect(() => {
    if (quotesLoading) {
      setSelectedQuote(undefined)
    }
  }, [quotesLoading, setSelectedQuote])

  const debouncedAmountsMatch = isTokenInputMode
    ? tokenAmount === debouncedTokenAmount
    : fiatAmount === debouncedFiatAmount

  // always eforce the amount used in the request to backend service
  const hasValidAmount = isOffRamp ? !!tokenAmount : !!fiatAmount

  const selectTokenLoading = hasValidAmount && (quotesLoading || !debouncedAmountsMatch) && !exceedsBalanceError

  const { useFiatOnRampAggregatorGetCountryQuery } = getFiatOnRampAggregatorApi()
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
    if (!quotes && (quotesError || !fiatAmount)) {
      setQuotesSections(undefined)
      setSelectedQuote(undefined)
    }
  }, [quotesError, quotes, setQuotesSections, setSelectedQuote, fiatAmount])

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

  const tokenMaxDecimals = quoteCurrency.currencyInfo?.currency.decimals

  const onChangeValue = (
    newAmount: string,
    source: FORAmountEnteredProperties['source'],
    newIsTokenInputMode?: boolean,
  ): void => {
    amountUpdatedTimeRef.current = Date.now()
    sendAnalyticsEvent(
      isOffRamp ? FiatOffRampEventName.FiatOffRampAmountEntered : FiatOnRampEventName.FiatOnRampAmountEntered,
      {
        source,
        amountUSD: fiatToUSDConverter(parseFloat(newAmount)),
      },
    )

    const currentIsTokenInputMode = newIsTokenInputMode !== undefined ? newIsTokenInputMode : isTokenInputMode

    const maxDecimals = currentIsTokenInputMode ? tokenMaxDecimals : MAX_FIAT_INPUT_DECIMALS

    // Appease TS this should not happen
    if (maxDecimals === undefined) {
      return
    }

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

    // update values
    valueRef.current = newAmount
    setValue(newAmount)

    // update cursor position and decimal pad disabled keys
    resetSelection({ start: valueRef.current.length, end: valueRef.current.length })
    decimalPadRef.current?.updateDisabledKeys()

    // toggle input mode
    setIsTokenInputMode((prev) => !prev)
  }, [isOffRamp, isTokenInputMode, resetSelection, selectedQuote, setIsTokenInputMode])

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
    rampDirection: isOffRamp ? RampDirection.OFFRAMP : RampDirection.ONRAMP,
  })

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
        },
      )
    }
  }

  // We only support predefined amounts for certain currencies.
  const predefinedAmountsSupported = PREDEFINED_AMOUNTS_SUPPORTED_CURRENCIES.includes(
    meldSupportedFiatCurrency.code.toLowerCase(),
  )

  const notAvailableInThisRegion = supportedFiatCurrencies?.length === 0

  const { errorText } = useParseFiatOnRampError(
    !notAvailableInThisRegion && quotesError,
    meldSupportedFiatCurrency.code,
    exceedsBalanceError,
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

  const { navigateToSwapFlow } = useWalletNavigation()
  const onAcceptUnsupportedTokenSwap = useCallback(() => {
    setShowUnsupportedTokenModal(false)

    if (unsupportedCurrency?.currencyInfo) {
      navigateToSwapFlow({
        currencyField: CurrencyField.INPUT,
        currencyAddress: currencyIdToAddress(unsupportedCurrency.currencyInfo?.currencyId),
        currencyChainId: unsupportedCurrency.currencyInfo?.currency.chainId,
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
  }, [setValue, setFiatAmount, setTokenAmount, valueRef, resetSelection, setSelectedQuote])

  const onPillToggle = (option: string | number): void => {
    setIsOffRamp(option === RampToggle.SELL)
    resetAmount()
    setQuoteCurrency(defaultCurrency)

    sendAnalyticsEvent(FiatOffRampEventName.FORBuySellToggled, {
      value: option === RampToggle.SELL ? RampToggle.SELL : RampToggle.BUY,
    })
  }

  // we only show loading when there are no errors and quote value is not empty
  const buttonDisabled =
    notAvailableInThisRegion ||
    selectTokenLoading ||
    !!quotesError ||
    !selectedQuote?.destinationAmount ||
    exceedsBalanceError

  return (
    <Screen edges={['top']}>
      <HandleBar backgroundColor="none" />
      <AnimatedFlex row height="100%" pt="$spacing12">
        {isSheetReady && (
          <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="$spacing16" px="$spacing24" width="100%">
            {isOffRampEnabled ? (
              <Flex row justifyContent="center" mt={isShortMobileDevice ? 0 : '$spacing6'}>
                <OffRampPopover
                  triggerContent={
                    <PillMultiToggle
                      defaultOption={RampToggle.BUY}
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
            ) : (
              <Flex row justifyContent="space-between">
                <Text variant="subheading1">{t('common.button.buy')}</Text>
                <FiatOnRampCountryPicker
                  countryCode={countryCode}
                  onPress={(): void => {
                    setSelectingCountry(true)
                  }}
                />
              </Flex>
            )}
            <FiatOnRampAmountSection
              ref={inputRef}
              appFiatCurrencySupported={appFiatCurrencySupportedInMeld}
              currency={quoteCurrency}
              errorText={errorText}
              fiatCurrencyInfo={meldSupportedFiatCurrency}
              notAvailableInThisRegion={notAvailableInThisRegion}
              predefinedAmountsSupported={predefinedAmountsSupported}
              quoteAmount={selectedQuote?.destinationAmount ?? 0}
              sourceAmount={selectedQuote?.sourceAmount ?? 0}
              quoteCurrencyAmountReady={Boolean(fiatAmount && selectedQuote)}
              selectTokenLoading={selectTokenLoading}
              value={value}
              onChoosePredifendAmount={(amount: string): void => {
                onChangeValue(amount, 'chip', false)
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

            <DecimalPadCalculateSpace id={DecimalPadCalculatedSpaceId.FiatOnRamp} decimalPadRef={decimalPadRef} />

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
                  formattedAmount={formattedAmount}
                  selectedCurrencyInfo={quoteCurrency.currencyInfo}
                  onPress={(): void => {
                    setShowTokenSelector(true)
                  }}
                />
              )}
              <Flex grow justifyContent="flex-end">
                <DecimalPadInput
                  ref={decimalPadRef}
                  maxDecimals={isTokenInputMode ? tokenMaxDecimals ?? MAX_FIAT_INPUT_DECIMALS : MAX_FIAT_INPUT_DECIMALS}
                  resetSelection={resetSelection}
                  selectionRef={selectionRef}
                  setValue={(newValue: string): void => {
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
                isLoading={selectTokenLoading}
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
          }}
          onClose={(): void => {
            setShowUnsupportedTokenModal(false)
          }}
        />
      )}
    </Screen>
  )
}
