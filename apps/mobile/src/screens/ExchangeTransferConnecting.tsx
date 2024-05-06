import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCountry } from 'react-native-localize'
import { useAppDispatch } from 'src/app/hooks'
import { Screen } from 'src/components/layout/Screen'
import {
  FiatOnRampConnectingView,
  SERVICE_PROVIDER_ICON_BORDER_RADIUS,
  SERVICE_PROVIDER_ICON_SIZE,
} from 'src/features/fiatOnRamp/FiatOnRampConnecting'
import { useFiatOnRampTransactionCreator } from 'src/features/fiatOnRamp/hooks'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { isAndroid } from 'uniswap/src/utils/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { ChainId } from 'wallet/src/constants/chains'
import { useFiatOnRampAggregatorTransferWidgetQuery } from 'wallet/src/features/fiatOnRamp/api'
import { FORTransferInstitution } from 'wallet/src/features/fiatOnRamp/types'
import { RemoteImage } from 'wallet/src/features/images/RemoteImage'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { InstitutionTransferEventName } from 'wallet/src/telemetry/constants'
import { openUri } from 'wallet/src/utils/linking'

// Design decision
const CONNECTING_TIMEOUT = 2 * ONE_SECOND_MS

const DEFAULT_TRANSFER_AMOUNT = 1
const DEFAULT_TRANSFER_CURRENCY = 'ETH'

export function ExchangeTransferConnecting({
  serviceProvider,
  onClose,
}: {
  serviceProvider: FORTransferInstitution
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const [timeoutElapsed, setTimeoutElapsed] = useState(false)

  const initialTypeInfo = useMemo(
    () => ({ institutionLogoUrl: serviceProvider.icon }),
    [serviceProvider.icon]
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
    sourceAmount: DEFAULT_TRANSFER_AMOUNT,
    sourceCurrencyCode: DEFAULT_TRANSFER_CURRENCY,
    countryCode: getCountry(),
    institutionId: serviceProvider.id,
    walletAddress: activeAccountAddress,
    externalSessionId: externalTransactionId,
    redirectURL: `${
      isAndroid ? uniswapUrls.appUrl : uniswapUrls.appBaseUrl
    }/?screen=transaction&fiatOnRamp=true&userAddress=${activeAccountAddress}`,
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

  return (
    <Screen>
      <FiatOnRampConnectingView
        serviceProviderLogo={
          <RemoteImage
            borderRadius={SERVICE_PROVIDER_ICON_BORDER_RADIUS}
            height={SERVICE_PROVIDER_ICON_SIZE}
            uri={serviceProvider.icon}
            width={SERVICE_PROVIDER_ICON_SIZE}
          />
        }
        serviceProviderName={serviceProvider.name}
      />
    </Screen>
  )
}
