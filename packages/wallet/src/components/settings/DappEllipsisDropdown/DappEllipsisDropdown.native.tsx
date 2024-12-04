import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { type DappEllipsisDropdownProps } from 'wallet/src/components/settings/DappEllipsisDropdown/DappEllipsisDropdown'
import { DappEllipsisDropdownIcon } from 'wallet/src/components/settings/DappEllipsisDropdown/internal/DappEllipsisDropdownIcon'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function DappEllipsisDropdown({
  removeAllDappConnections,
  setIsEditing,
  isEditing,
}: DappEllipsisDropdownProps): JSX.Element {
  const { t } = useTranslation()
  const activeAccount = useActiveAccountWithThrow()

  return (
    <ContextMenu
      dropdownMenuMode
      actions={[
        {
          title: t('settings.setting.connections.disconnectAll'),
          destructive: true,
          systemIcon: 'trash',
        },
        {
          title: t('common.edit.button'),
          selected: isEditing,
          systemIcon: 'square.and.pencil',
        },
      ]}
      onPress={async (e): Promise<void> => {
        const { index } = e.nativeEvent

        switch (index) {
          case 0:
            setIsEditing?.(false)
            await removeAllDappConnections(activeAccount)
            break
          case 1:
            setIsEditing?.(!isEditing)
            break
        }
      }}
    >
      <DappEllipsisDropdownIcon />
    </ContextMenu>
  )
}
