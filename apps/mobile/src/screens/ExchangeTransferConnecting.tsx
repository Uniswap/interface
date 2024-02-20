import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getCountry } from 'react-native-localize'
import { useAppDispatch } from 'src/app/hooks'
import {
  FiatOnRampConnectingView,
  SERVICE_PROVIDER_ICON_BORDER_RADIUS,
  SERVICE_PROVIDER_ICON_SIZE,
} from 'src/features/fiatOnRamp/FiatOnRampConnecting'
import { useFiatOnRampTransactionCreator } from 'src/features/fiatOnRamp/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { useFiatOnRampAggregatorTransferWidgetQuery } from 'wallet/src/features/fiatOnRamp/api'
import { FORTransferInstitution } from 'wallet/src/features/fiatOnRamp/types'
import { RemoteImage } from 'wallet/src/features/images/RemoteImage'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
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

  const { externalTransactionId, dispatchAddTransaction } =
    useFiatOnRampTransactionCreator(activeAccountAddress)

  const onError = useCallback((): void => {
    dispatch(
      pushNotification({
        type: AppNotificationType.Error,
        errorMessage: t('Something went wrong.'),
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
  })

  useEffect(() => {
    if (widgetError) {
      onError()
      return
    }
    if (timeoutElapsed && !widgetLoading && widgetData) {
      onClose()
      openUri(widgetData.widgetUrl).catch(onError)
      // TODO: Uncomment this when https://linear.app/uniswap/issue/MOB-2585/implement-polling-of-transaction-once-user-has-checked-out is implemented
      // dispatchAddTransaction()
    }
  }, [
    dispatchAddTransaction,
    onClose,
    onError,
    timeoutElapsed,
    widgetData,
    widgetLoading,
    widgetError,
  ])

  return (
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
  )
}
