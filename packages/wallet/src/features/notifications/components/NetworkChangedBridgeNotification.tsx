import { Flex, Text } from 'ui/src'
import { Shuffle } from 'ui/src/components/icons/Shuffle'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { NetworkChangedBridgeNotification as NetworkChangedBridgeNotificationType } from 'uniswap/src/features/notifications/types'
import { NotificationToast } from 'wallet/src/features/notifications/components/NotificationToast'

export function NetworkChangedBridgeNotification({
  notification,
}: {
  notification: NetworkChangedBridgeNotificationType
}): JSX.Element {
  const fromNetwork = UNIVERSE_CHAIN_INFO[notification.fromChainId]?.label
  const toNetwork = UNIVERSE_CHAIN_INFO[notification.toChainId]?.label

  return (
    <NotificationToast
      smallToast
      hideDelay={notification.hideDelay}
      title=""
      contentOverride={
        <Flex row alignItems="center" gap="$spacing8" justifyContent="center">
          <Flex row centered gap="$spacing4">
            <NetworkLogo chainId={notification.fromChainId} size={iconSizes.icon20} />
            <Text variant="body2" color="$neutral1">
              {fromNetwork}
            </Text>
          </Flex>
          <Shuffle color="$neutral2" size={iconSizes.icon16} />
          <Flex row centered gap="$spacing4">
            <NetworkLogo chainId={notification.toChainId} size={iconSizes.icon20} />
            <Text variant="body2" color="$neutral1">
              {toNetwork}
            </Text>
          </Flex>
        </Flex>
      }
    />
  )
}
