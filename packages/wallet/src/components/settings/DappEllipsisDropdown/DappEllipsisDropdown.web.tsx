import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex } from 'ui/src'
import { Power } from 'ui/src/components/icons'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { ContextMenu } from 'wallet/src/components/menu/ContextMenu'
import { type DappEllipsisDropdownProps } from 'wallet/src/components/settings/DappEllipsisDropdown/DappEllipsisDropdown'
import { DappEllipsisDropdownIcon } from 'wallet/src/components/settings/DappEllipsisDropdown/internal/DappEllipsisDropdownIcon'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

const PowerCircle = (): JSX.Element => (
  <Flex centered backgroundColor="red" borderRadius="$roundedFull" p="$spacing2" pt="$spacing1">
    <Power color="white" size="$icon.16" />
  </Flex>
)

export function DappEllipsisDropdown({
  isEditing,
  setIsEditing,
  removeAllDappConnections,
}: DappEllipsisDropdownProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const activeAccount = useActiveAccountWithThrow()

  if (isEditing !== undefined || setIsEditing) {
    logger.warn(
      'DappEllipsisDropdown.web.tsx',
      'render',
      '`isEditing` and/or `setIsEditing` are not expected to be defined',
    )
  }

  return (
    <ContextMenu
      closeOnClick
      itemId="connections-ellipsis-dropdown"
      menuOptions={[
        {
          label: t('settings.setting.connections.disconnectAll'),
          onPress: async (): Promise<void> => {
            await removeAllDappConnections(activeAccount)
            sendAnalyticsEvent(ExtensionEventName.DappDisconnectAll, {
              activeConnectedAddress: activeAccount.address,
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
      <DappEllipsisDropdownIcon />
    </ContextMenu>
  )
}
