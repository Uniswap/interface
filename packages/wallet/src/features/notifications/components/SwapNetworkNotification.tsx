import { useTranslation } from 'react-i18next'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { CHAIN_INFO } from 'wallet/src/constants/chains'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'
import { SwapNetworkNotification as SwapNetworkNotificationType } from 'wallet/src/features/notifications/types'

export function SwapNetworkNotification({
  notification: { chainId, hideDelay },
}: {
  notification: SwapNetworkNotificationType
}): JSX.Element {
  const { t } = useTranslation()
  const network = CHAIN_INFO[chainId].label

  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={<NetworkLogo chainId={chainId} size={iconSizes.icon24} />}
      title={t('notification.swap.network', { network })}
    />
  )
}
