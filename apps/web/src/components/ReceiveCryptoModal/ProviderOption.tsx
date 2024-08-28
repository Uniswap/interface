import { useMemo } from 'react'
import { FiatOnRampTransactionStatus, FiatOnRampTransactionType } from 'state/fiatOnRampTransactions/types'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { FORQuoteItem } from 'uniswap/src/features/fiatOnRamp/FORQuoteItem'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { v4 as uuid } from 'uuid'

import { useAddFiatOnRampTransaction } from 'state/fiatOnRampTransactions/hooks'
import { useFiatOnRampAggregatorTransferWidgetQuery } from 'uniswap/src/features/fiatOnRamp/api'

interface ProviderOptionProps {
  serviceProvider: FORServiceProvider
  walletAddress: string
  setConnectedProvider: (provider: FORServiceProvider) => void
  setErrorProvider: (provider: FORServiceProvider) => void
}

export function ProviderOption({
  walletAddress,
  serviceProvider,
  setConnectedProvider,
  setErrorProvider,
}: ProviderOptionProps) {
  const addFiatOnRampTransaction = useAddFiatOnRampTransaction()
  const externalTransactionId = useMemo(() => uuid(), [])

  const widgetQueryParams = useMemo(() => {
    return {
      serviceProvider: serviceProvider.serviceProvider,
      walletAddress,
      externalSessionId: externalTransactionId,
      redirectUrl: `${UNISWAP_WEB_URL}/buy`,
    }
  }, [walletAddress, serviceProvider, externalTransactionId])

  // TODO(WEB-4417): use the widgetUrl from the /transfer-service-providers response instead of prefetching for every provider.
  const { data, error, isLoading } = useFiatOnRampAggregatorTransferWidgetQuery(widgetQueryParams)

  return (
    <FORQuoteItem
      key={serviceProvider.name}
      serviceProvider={serviceProvider}
      hoverIcon={<ExternalLink position="absolute" right="$spacing12" size={20} />}
      isLoading={isLoading}
      onPress={async () => {
        if (data) {
          window.open(data.widgetUrl, '_blank')
          setConnectedProvider(serviceProvider)
          addFiatOnRampTransaction({
            externalSessionId: externalTransactionId,
            account: walletAddress,
            status: FiatOnRampTransactionStatus.INITIATED,
            forceFetched: false,
            addedAt: Date.now(),
            type: FiatOnRampTransactionType.TRANSFER,
            syncedWithBackend: false,
            provider: serviceProvider.serviceProvider,
          })
        } else if (error) {
          setErrorProvider(serviceProvider)
        }
      }}
    />
  )
}
