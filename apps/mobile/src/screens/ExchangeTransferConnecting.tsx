import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCountry } from 'react-native-localize'
import { useAppDispatch } from 'src/app/hooks'
import { Screen } from 'src/components/layout/Screen'
import { FiatOnRampConnectingView } from 'src/features/fiatOnRamp/FiatOnRampConnecting'
import { ServiceProviderLogoStyles } from 'src/features/fiatOnRamp/constants'
import { useFiatOnRampTransactionCreator } from 'src/features/fiatOnRamp/hooks'
import { Flex, useIsDarkMode } from 'ui/src'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { ChainId } from 'wallet/src/constants/chains'
import { useFiatOnRampAggregatorTransferWidgetQuery } from 'wallet/src/features/fiatOnRamp/api'
import { FORServiceProvider } from 'wallet/src/features/fiatOnRamp/types'
import { getServiceProviderLogo } from 'wallet/src/features/fiatOnRamp/utils'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { InstitutionTransferEventName } from 'wallet/src/telemetry/constants'
import { openUri } from 'wallet/src/utils/linking'

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
  const dispatch = useAppDispatch()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const [timeoutElapsed, setTimeoutElapsed] = useState(false)

  const initialTypeInfo = useMemo(
    () => ({ serviceProviderLogo: serviceProvider.logos }),
    [serviceProvider.logos]
  )

  const { externalTransactionId, dispatchAddTransaction } = useFiatOnRampTransactionCreator(
    activeAccountAddress,
    ChainId.Mainnet,
    initialTypeInfo
  )

  const onError = useCallback((): void => {
    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        errorMessage: t('common.error.general'),
      })
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
    countryCode: getCountry(),
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
      sendWalletAnalyticsEvent(InstitutionTransferEventName.InstitutionTransferWidgetOpened, {
        externalTransactionId,
        institutionName: serviceProvider.name,
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
    serviceProvider?.name,
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
            width={ServiceProviderLogoStyles.icon.width}>
            <ImageUri imageStyle={ServiceProviderLogoStyles.icon} uri={logoUrl} />
          </Flex>
        }
        serviceProviderName={serviceProvider.name}
      />
    </Screen>
  )
}
