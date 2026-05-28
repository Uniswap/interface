import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NotificationToast } from 'uniswap/src/components/notifications/NotificationToast'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { NetworkChangedNotification as NetworkChangedNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function NetworkChangedNotification({
  notification: { chainId, flow, hideDelay = 2 * ONE_SECOND_MS },
}: {
  notification: NetworkChangedNotificationType
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <NotificationToast
      smallToast
      hideDelay={hideDelay}
      icon={<NetworkLogo chainId={chainId} size={iconSizes.icon24} />}
      title={getTitle({ t, flow, chainId })}
    />
  )
}

function getTitle({
  t,
  flow,
  chainId,
}: {
  t: TFunction
} & Pick<NetworkChangedNotificationType, 'flow' | 'chainId'>): string {
  const network = getChainLabel(chainId)

  switch (flow) {
    case 'send':
      return t('notification.send.network', { network })
    case 'swap':
      return t('notification.swap.network', { network })
    default:
      return t('notification.network.changed', { network })
  }
}
