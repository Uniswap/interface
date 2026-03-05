import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex } from 'ui/src'
import { Power } from 'ui/src/components/icons'
import { ContextMenu, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
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
  const { value: isMenuOpen, setTrue: openMenu, setFalse: closeMenu } = useBooleanState(false)

  const activeAccount = useActiveAccountWithThrow()

  if (isEditing !== undefined || setIsEditing) {
    logger.warn(
      'DappEllipsisDropdown.web.tsx',
      'render',
      '`isEditing` and/or `setIsEditing` are not expected to be defined',
    )
  }

  const menuOptions: MenuOptionItem[] = [
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
  ]

  return (
    <ContextMenu
      menuItems={menuOptions}
      triggerMode={ContextMenuTriggerMode.Primary}
      isOpen={isMenuOpen}
      openMenu={openMenu}
      closeMenu={closeMenu}
      offsetY={2}
    >
      <DappEllipsisDropdownIcon />
    </ContextMenu>
  )
}
