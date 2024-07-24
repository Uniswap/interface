import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Screen } from 'src/components/layout/Screen'
import { useFiatOnRampTransactionCreator } from 'src/features/fiatOnRamp/hooks'
import { Flex, useIsDarkMode } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { FiatOnRampConnectingView } from 'uniswap/src/features/fiatOnRamp/FiatOnRampConnectingView'
import { useFiatOnRampAggregatorTransferWidgetQuery } from 'uniswap/src/features/fiatOnRamp/api'
import { ServiceProviderLogoStyles } from 'uniswap/src/features/fiatOnRamp/constants'
import { FORServiceProvider } from 'uniswap/src/features/fiatOnRamp/types'
import { getServiceProviderLogo } from 'uniswap/src/features/fiatOnRamp/utils'
import { InstitutionTransferEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { openUri } from 'uniswap/src/utils/linking'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { FiatPurchaseTransactionInfo } from 'wallet/src/features/transactions/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

// Design decision
const CONNECTING_TIMEOUT = 2 * ONE_SECOND_MS

export function ExchangeTransferConnecting({
  serviceProvider,
  onClose,
}: {
  serviceProvider: FORServiceProvider
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const [timeoutElapsed, setTimeoutElapsed] = useState(false)

  const initialTypeInfo = useMemo<Partial<FiatPurchaseTransactionInfo>>(
    () => ({ serviceProviderLogo: serviceProvider.logos, serviceProvider: serviceProvider.serviceProvider }),
    [serviceProvider],
  )

  const { externalTransactionId, dispatchAddTransaction } = useFiatOnRampTransactionCreator(
    activeAccountAddress,
    UniverseChainId.Mainnet,
    serviceProvider.serviceProvider,
    initialTypeInfo,
  )

  const onError = useCallback((): void => {
    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        errorMessage: t('common.error.general'),
      }),
    )
    onClose()
  }, [dispatch, onClose, t])

  useTimeout(() => {
    setTimeoutElapsed(true)
  }, CONNECTING_TIMEOUT)

  const {
    data: widgetData,
    isLoading: widgetLoading,
    error: widgetError,
  } = useFiatOnRampAggregatorTransferWidgetQuery({
    serviceProvider: serviceProvider.serviceProvider,
    walletAddress: activeAccountAddress,
    externalSessionId: externalTransactionId,
    redirectUrl: `${uniswapUrls.redirectUrlBase}/?screen=transaction&fiatOnRamp=true&userAddress=${activeAccountAddress}`,
  })

  useEffect(() => {
    if (widgetError) {
      onError()
      return
    }
    async function navigateToWidget(widgetUrl: string): Promise<void> {
      onClose()
      sendAnalyticsEvent(InstitutionTransferEventName.InstitutionTransferWidgetOpened, {
        externalTransactionId,
        serviceProvider: serviceProvider.serviceProvider,
      })

      await openUri(widgetUrl).catch(onError)
      dispatchAddTransaction()
    }
    if (timeoutElapsed && !widgetLoading && widgetData) {
      navigateToWidget(widgetData.widgetUrl).catch(() => undefined)
    }
  }, [
    dispatchAddTransaction,
    onClose,
    onError,
    timeoutElapsed,
    widgetData,
    widgetLoading,
    widgetError,
    externalTransactionId,
    serviceProvider,
  ])

  const isDarkMode = useIsDarkMode()
  const logoUrl = getServiceProviderLogo(serviceProvider.logos, isDarkMode)

  return (
    <Screen>
      <FiatOnRampConnectingView
        serviceProviderLogo={
          <Flex
            alignItems="center"
            height={ServiceProviderLogoStyles.icon.height}
            justifyContent="center"
            width={ServiceProviderLogoStyles.icon.width}
          >
            <ImageUri imageStyle={ServiceProviderLogoStyles.icon} uri={logoUrl} />
          </Flex>
        }
        serviceProviderName={serviceProvider.name}
      />
    </Screen>
  )
}
