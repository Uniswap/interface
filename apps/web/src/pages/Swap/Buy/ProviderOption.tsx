import { useMemo } from 'react'
import { useAddFiatOnRampTransaction } from 'state/fiatOnRampTransactions/hooks'
import { FiatOnRampTransactionStatus, FiatOnRampTransactionType } from 'state/fiatOnRampTransactions/types'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { FORQuoteItem } from 'uniswap/src/features/fiatOnRamp/FORQuoteItem'
import { useFiatOnRampAggregatorWidgetQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { FORCountry, FORQuote, FORServiceProvider, FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { createOnRampTransactionId } from 'uniswap/src/features/fiatOnRamp/utils'
import { FiatOnRampEventName } from 'uniswap/src/features/telemetry/constants'
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
}: ProviderOptionProps) {
  const addFiatOnRampTransaction = useAddFiatOnRampTransaction()

  const widgetQueryParams = useMemo(() => {
    return {
      serviceProvider: quote.serviceProviderDetails.serviceProvider,
      countryCode: selectedCountry.countryCode,
      destinationCurrencyCode: quoteCurrencyCode,
      sourceAmount: parseFloat(inputAmount),
      sourceCurrencyCode: meldSupportedFiatCurrency.code,
      walletAddress,
      externalSessionId: createOnRampTransactionId(quote.serviceProviderDetails.serviceProvider),
      redirectUrl: `${UNISWAP_WEB_URL}/buy`,
    }
  }, [
    inputAmount,
    meldSupportedFiatCurrency.code,
    quote.serviceProviderDetails.serviceProvider,
    quoteCurrencyCode,
    selectedCountry.countryCode,
    walletAddress,
  ])

  // TODO(WEB-4417): use the widgetUrl from the /quote response instead of prefetching for every provider.
  const { data, error, isLoading } = useFiatOnRampAggregatorWidgetQuery(widgetQueryParams)

  return (
    <FORQuoteItem
      key={quote.serviceProviderDetails.serviceProvider}
      serviceProvider={quote.serviceProviderDetails}
      hoverIcon={<ExternalLink position="absolute" right="$spacing12" size={20} />}
      isLoading={isLoading}
      onPress={async () => {
        if (data) {
          window.open(data.widgetUrl, '_blank')
          setConnectedProvider(quote.serviceProviderDetails)
          addFiatOnRampTransaction({
            externalSessionId: widgetQueryParams.externalSessionId,
            account: walletAddress,
            status: FiatOnRampTransactionStatus.INITIATED,
            forceFetched: false,
            addedAt: Date.now(),
            type: FiatOnRampTransactionType.BUY,
            syncedWithBackend: false,
            provider: quote.serviceProviderDetails.serviceProvider,
          })
          sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampWidgetOpened, {
            countryCode: selectedCountry.countryCode,
            countryState: selectedCountry.state,
            cryptoCurrency: quoteCurrencyCode,
            externalTransactionId: widgetQueryParams.externalSessionId,
            fiatCurrency: meldSupportedFiatCurrency.code,
            serviceProvider: quote.serviceProviderDetails.serviceProvider,
          })
        } else if (error) {
          setErrorProvider(quote.serviceProviderDetails)
        }
      }}
    />
  )
}
