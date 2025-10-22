import { ReceiveModalState } from 'components/ReceiveCryptoModal/types'
import { useOpenReceiveCryptoModal } from 'components/ReceiveCryptoModal/useOpenReceiveCryptoModal'
import { useActiveAddresses } from 'features/accounts/store/hooks'
import { useMemo } from 'react'
import { useAddFiatOnRampTransaction } from 'state/fiatOnRampTransactions/hooks'
import { FiatOnRampTransactionStatus, FiatOnRampTransactionType } from 'state/fiatOnRampTransactions/types'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { useFiatOnRampAggregatorTransferWidgetQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { FORQuoteItem } from 'uniswap/src/features/fiatOnRamp/FORQuoteItem'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { FiatOnRampEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useEvent } from 'utilities/src/react/hooks'
import { v4 as uuid } from 'uuid'

interface ProviderOptionProps {
  serviceProvider: FORServiceProvider
  setConnectedProvider: (provider: FORServiceProvider) => void
  setErrorProvider: (provider: FORServiceProvider) => void
}

export function ProviderOption({ serviceProvider, setConnectedProvider, setErrorProvider }: ProviderOptionProps) {
  const addFiatOnRampTransaction = useAddFiatOnRampTransaction()
  const externalTransactionId = useMemo(() => uuid(), [])

  const activeAddresses = useActiveAddresses()

  // if user is connected on multiple platforms, instead of directly calling the widget, clicking ProviderOption will open ChooseMultiPlatformProvider screen instead
  const walletAddress = activeAddresses.evmAddress ?? activeAddresses.svmAddress
  const isSinglePlatform =
    walletAddress && (activeAddresses.evmAddress === undefined || activeAddresses.svmAddress === undefined)
  const singlePlatformWidgetQueryParams = useMemo(() => {
    return {
      serviceProvider: serviceProvider.serviceProvider,
      walletAddress: walletAddress ?? '', // satisfy typecheck: useFiatOnRampAggregatorTransferWidgetQuery will only query if walletAddress is defined
      externalSessionId: externalTransactionId,
      redirectUrl: `${UNISWAP_WEB_URL}/buy`,
    }
  }, [walletAddress, serviceProvider, externalTransactionId])

  // TODO(WEB-4417): use the widgetUrl from the /transfer-service-providers response instead of prefetching for every provider.
  const { data, error, isLoading } = useFiatOnRampAggregatorTransferWidgetQuery(singlePlatformWidgetQueryParams, {
    skip: !isSinglePlatform,
  })

  const openChooseMultiPlatformProviderScreen = useOpenReceiveCryptoModal({
    modalState: ReceiveModalState.CEX_TRANSFER_CHOOSE_PLATFORM,
    serviceProvider,
  })

  const onClickProviderOption = useEvent(() => {
    if (isSinglePlatform) {
      if (data) {
        setConnectedProvider(serviceProvider)

        window.open(data.widgetUrl, '_blank')
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
        sendAnalyticsEvent(FiatOnRampEventName.FiatOnRampTransferWidgetOpened, {
          externalTransactionId,
          serviceProvider: serviceProvider.serviceProvider,
        })
      } else if (error) {
        setErrorProvider(serviceProvider)
      }
    } else {
      openChooseMultiPlatformProviderScreen()
    }
  })

  return (
    <FORQuoteItem
      key={serviceProvider.name}
      serviceProvider={serviceProvider}
      isLoading={isLoading}
      onPress={onClickProviderOption}
    />
  )
}
