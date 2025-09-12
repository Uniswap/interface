import { skipToken } from '@reduxjs/toolkit/query/react'
import { useMemo } from 'react'
import { useAddFiatOnRampTransaction } from 'state/fiatOnRampTransactions/hooks'
import { FiatOnRampTransactionStatus, FiatOnRampTransactionType } from 'state/fiatOnRampTransactions/types'
import {
  useFiatOnRampAggregatorOffRampWidgetQuery,
  useFiatOnRampAggregatorWidgetQuery,
} from 'uniswap/src/features/fiatOnRamp/api'
import { FORQuoteItem } from 'uniswap/src/features/fiatOnRamp/FORQuoteItem'
import {
  FiatCurrencyInfo,
  FORCountry,
  FORFilters,
  FORQuote,
  FORServiceProvider,
  RampDirection,
} from 'uniswap/src/features/fiatOnRamp/types'
import { createOnRampTransactionId } from 'uniswap/src/features/fiatOnRamp/utils'
import { FiatOffRampEventName, FiatOnRampEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

interface ProviderOptionProps {
  quote: FORQuote
  selectedCountry: FORCountry
  quoteCurrencyCode: string
  inputAmount: string
  meldSupportedFiatCurrency: FiatCurrencyInfo
  walletAddress: string
  setConnectedProvider: (provider: FORServiceProvider) => void
  setErrorProvider: (provider: FORServiceProvider) => void
  rampDirection: RampDirection
  paymentMethodFilter?: FORFilters
  hidden?: boolean
}

export function ProviderOption({
  quote,
  selectedCountry,
  quoteCurrencyCode,
  inputAmount,
  meldSupportedFiatCurrency,
  walletAddress,
  setConnectedProvider,
  setErrorProvider,
  rampDirection,
  paymentMethodFilter,
  hidden = false,
}: ProviderOptionProps) {
  const addFiatOnRampTransaction = useAddFiatOnRampTransaction()
  const externalSessionId = useMemo(
    () => createOnRampTransactionId(quote.serviceProviderDetails.serviceProvider),
    [quote.serviceProviderDetails.serviceProvider],
  )

  const widgetOnRampQueryParams = useMemo(() => {
    const redirectUrl = new URL('/buy', window.location.origin)

    return {
      serviceProvider: quote.serviceProviderDetails.serviceProvider,
      countryCode: selectedCountry.countryCode,
      destinationCurrencyCode: quoteCurrencyCode,
      sourceAmount: parseFloat(inputAmount),
      sourceCurrencyCode: meldSupportedFiatCurrency.code,
      walletAddress,
      externalSessionId,
      redirectUrl: redirectUrl.toString(),
    }
  }, [
    externalSessionId,
    inputAmount,
    meldSupportedFiatCurrency.code,
    quote.serviceProviderDetails.serviceProvider,
    quoteCurrencyCode,
    selectedCountry.countryCode,
    walletAddress,
  ])

  const widgetOffRampQueryParams = useMemo(() => {
    const redirectUrl = new URL('/sell', window.location.origin)
    redirectUrl.searchParams.set('externalTransactionId', externalSessionId)

    return {
      serviceProvider: quote.serviceProviderDetails.serviceProvider,
      countryCode: selectedCountry.countryCode,
      baseCurrencyCode: quoteCurrencyCode,
      sourceAmount: parseFloat(inputAmount),
      quoteCurrencyCode: meldSupportedFiatCurrency.code,
      refundWalletAddress: walletAddress,
      externalCustomerId: walletAddress,
      externalSessionId,
      redirectUrl: redirectUrl.toString(),
    }
  }, [
    externalSessionId,
    inputAmount,
    meldSupportedFiatCurrency.code,
    quote.serviceProviderDetails.serviceProvider,
    quoteCurrencyCode,
    selectedCountry.countryCode,
    walletAddress,
  ])

  const {
    data: onRampWidgetData,
    error: onRampWidgetError,
    isLoading: onRampWidgetLoading,
  } = useFiatOnRampAggregatorWidgetQuery(rampDirection === RampDirection.ONRAMP ? widgetOnRampQueryParams : skipToken)

  const {
    data: offRampWidgetData,
    error: offRampWidgetError,
    isLoading: offRampWidgetLoading,
  } = useFiatOnRampAggregatorOffRampWidgetQuery(
    rampDirection === RampDirection.OFFRAMP ? widgetOffRampQueryParams : skipToken,
  )

  const data = onRampWidgetData || offRampWidgetData
  const error = onRampWidgetError || offRampWidgetError
  const isLoading = onRampWidgetLoading || offRampWidgetLoading

  return (
    <FORQuoteItem
      key={quote.serviceProviderDetails.serviceProvider}
      serviceProvider={quote.serviceProviderDetails}
      isLoading={isLoading}
      showPaymentMethods={!paymentMethodFilter}
      isRecent={quote.isMostRecentlyUsedProvider}
      hidden={hidden}
      onPress={async () => {
        if (data) {
          window.open(data.widgetUrl, '_blank')

          setConnectedProvider(quote.serviceProviderDetails)
          addFiatOnRampTransaction({
            externalSessionId,
            account: walletAddress,
            status: FiatOnRampTransactionStatus.INITIATED,
            forceFetched: false,
            addedAt: Date.now(),
            type:
              rampDirection === RampDirection.ONRAMP ? FiatOnRampTransactionType.BUY : FiatOnRampTransactionType.SELL,
            syncedWithBackend: false,
            provider: quote.serviceProviderDetails.serviceProvider,
          })
          sendAnalyticsEvent(
            rampDirection === RampDirection.ONRAMP
              ? FiatOnRampEventName.FiatOnRampWidgetOpened
              : FiatOffRampEventName.FiatOffRampWidgetOpened,
            {
              countryCode: selectedCountry.countryCode,
              countryState: selectedCountry.state,
              cryptoCurrency: quoteCurrencyCode,
              externalTransactionId: externalSessionId,
              fiatCurrency: meldSupportedFiatCurrency.code,
              serviceProvider: quote.serviceProviderDetails.serviceProvider,
              paymentMethodFilter,
            },
          )
        } else if (error) {
          setErrorProvider(quote.serviceProviderDetails)
        }
      }}
    />
  )
}
