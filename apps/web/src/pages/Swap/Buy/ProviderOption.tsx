import { useMemo } from 'react'
import { useAddFiatOnRampTransaction } from 'state/fiatOnRampTransactions/hooks'
import { FiatOnRampTransactionStatus, FiatOnRampTransactionType } from 'state/fiatOnRampTransactions/types'
import { ExternalLink } from 'ui/src/components/icons'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { FORQuoteItem } from 'uniswap/src/features/fiatOnRamp/FORQuoteItem'
import { useFiatOnRampAggregatorWidgetQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { FORCountry, FORQuote, FORServiceProvider, FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { v4 as uuid } from 'uuid'

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
    const sessionIdPrefix = quote.serviceProvider === 'moonpay' ? 'MOONPAY' : ''
    return {
      serviceProvider: quote.serviceProvider,
      countryCode: selectedCountry.countryCode,
      destinationCurrencyCode: quoteCurrencyCode,
      sourceAmount: parseFloat(inputAmount),
      sourceCurrencyCode: meldSupportedFiatCurrency.code,
      walletAddress,
      externalSessionId: sessionIdPrefix + uuid(),
      redirectUrl: `${UNISWAP_WEB_URL}/buy`,
    }
  }, [
    inputAmount,
    meldSupportedFiatCurrency.code,
    quote.serviceProvider,
    quoteCurrencyCode,
    selectedCountry.countryCode,
    walletAddress,
  ])

  // TODO(WEB-4417): use the widgetUrl from the /quote response instead of prefetching for every provider.
  const { data, error } = useFiatOnRampAggregatorWidgetQuery(widgetQueryParams)

  return (
    <FORQuoteItem
      key={quote.serviceProvider}
      serviceProvider={quote.serviceProviderDetails}
      hoverIcon={<ExternalLink position="absolute" right="$spacing12" size={20} />}
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
          })
        } else if (error) {
          setErrorProvider(quote.serviceProviderDetails)
        }
      }}
    />
  )
}
