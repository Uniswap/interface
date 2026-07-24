import { useMemo } from 'react'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { useFiatOnRampAggregatorTransferWidgetQuery } from 'uniswap/src/features/fiatOnRamp/hooks/useFiatOnRampQueries'
import type { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { FiatOnRampEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { uuid } from 'utilities/src/primitives/uuid'
import { useEvent } from 'utilities/src/react/hooks'
import { useOpenReceiveCryptoModal } from '~/components/ReceiveCryptoModal/useOpenReceiveCryptoModal'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { getOnRampRedirectUrl } from '~/pages/Swap/Buy/onRampRedirectUrl'
import { useAddFiatOnRampTransaction } from '~/state/fiatOnRampTransactions/hooks'
import { FiatOnRampTransactionStatus, FiatOnRampTransactionType } from '~/state/fiatOnRampTransactions/types'
import { ReceiveModalState } from '~/types/receiveCryptoModal'
export interface UseCexTransferProviderPressOptions {
  onWidgetOpened?: (provider: FORServiceProvider) => void
  onWidgetError?: (provider: FORServiceProvider) => void
}

export function useCexTransferProviderPress(
  serviceProvider: FORServiceProvider | undefined,
  { onWidgetOpened, onWidgetError }: UseCexTransferProviderPressOptions = {},
): { onPress: () => void; isLoading: boolean } {
  const addFiatOnRampTransaction = useAddFiatOnRampTransaction()
  const externalTransactionId = useMemo(() => uuid(), [])

  // if user is connected on multiple platforms, instead of directly calling the widget, clicking ProviderOption will open ChooseMultiPlatformProvider screen instead
  const activeAddresses = useActiveAddresses()
  const walletAddress = activeAddresses.evmAddress ?? activeAddresses.svmAddress
  const isSinglePlatform =
    !!walletAddress && (activeAddresses.evmAddress === undefined || activeAddresses.svmAddress === undefined)

  const singlePlatformWidgetQueryParams = useMemo(() => {
    return {
      serviceProvider: serviceProvider?.serviceProvider ?? '',
      walletAddress: walletAddress ?? '', // satisfy typecheck: useFiatOnRampAggregatorTransferWidgetQuery will only query if walletAddress is defined
      externalSessionId: externalTransactionId,
      redirectUrl: getOnRampRedirectUrl({ origin: UNISWAP_WEB_URL }),
    }
  }, [walletAddress, serviceProvider, externalTransactionId])

  const shouldFetchWidget = !!serviceProvider && isSinglePlatform

  // TODO(WEB-4417): use the widgetUrl from the /transfer-service-providers response instead of prefetching for every provider.
  const { data, error, isLoading } = useFiatOnRampAggregatorTransferWidgetQuery(singlePlatformWidgetQueryParams, {
    skip: !shouldFetchWidget,
  })

  const openMultiPlatformFlow = useOpenReceiveCryptoModal(
    serviceProvider
      ? { modalState: ReceiveModalState.CEX_TRANSFER_CHOOSE_PLATFORM, serviceProvider }
      : { modalState: ReceiveModalState.CEX_TRANSFER },
  )

  // if user is connected on single platform, directly open the widget, otherwise open the ChooseMultiPlatformProvider flow
  const onPress = useEvent(() => {
    if (!serviceProvider) {
      return
    }
    if (isSinglePlatform) {
      if (data) {
        onWidgetOpened?.(serviceProvider)

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
        onWidgetError?.(serviceProvider)
      }
    } else {
      openMultiPlatformFlow()
    }
  })

  return { onPress, isLoading }
}
