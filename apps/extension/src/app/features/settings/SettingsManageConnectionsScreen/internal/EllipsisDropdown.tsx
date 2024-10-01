import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { removeAllDappConnectionsForAccount } from 'src/app/features/dapp/actions'
import { ContextMenu, Flex, TouchableArea } from 'ui/src'
import { Ellipsis, Power } from 'ui/src/components/icons'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useActiveAccountAddress, useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

const PowerCircle = (): JSX.Element => (
  <Flex centered backgroundColor="red" borderRadius="$roundedFull" p="$spacing2" pt="$spacing1">
    <Power color="white" size="$icon.16" />
  </Flex>
)

export function EllipsisDropdown(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  // use undefined instead of null for typing
  const activeAccount = useActiveAccountWithThrow()
  const activeConnectedAddress = useActiveAccountAddress() ?? undefined

  return (
    <ContextMenu
      closeOnClick
      itemId="connections-ellipsis-dropdown"
      menuOptions={[
        {
          label: t('settings.setting.connections.disconnectAll'),
          onPress: async (): Promise<void> => {
            await removeAllDappConnectionsForAccount(activeAccount)
            sendAnalyticsEvent(ExtensionEventName.DappDisconnectAll, {
              activeConnectedAddress,
            })
            dispatch(
              pushNotification({
                type: AppNotificationType.Success,
                title: t('common.text.disconnected'),
              }),
            )
          },
          Icon: PowerCircle,
          destructive: true,
        },
      ]}
      offset={{ mainAxis: 2 }}
      onLeftClick={true}
    >
      <TouchableArea borderRadius="$roundedFull" hoverStyle={{ backgroundColor: '$surface2Hovered' }} p="$spacing8">
        <Ellipsis color="$neutral2" size="$icon.16" />
      </TouchableArea>
    </ContextMenu>
  )
}
