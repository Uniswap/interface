import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex } from 'ui/src'
import { CopyAlt } from 'ui/src/components/icons/CopyAlt'
import { Person } from 'ui/src/components/icons/Person'
import { InfoRow } from 'uniswap/src/components/activity/details/InfoRow'
import { TransactionParticipantDisplay } from 'uniswap/src/components/activity/details/TransactionParticipantDisplay'
import { TransactionParticipantRowProps } from 'uniswap/src/components/activity/details/types'
import { ContextMenu, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { isMobileApp } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function TransactionParticipantRow({
  address,
  isSend = false,
  onClose,
}: TransactionParticipantRowProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { navigateToExternalProfile } = useUniswapContext()

  const { value: isContextMenuOpen, setTrue: openContextMenu, setFalse: closeContextMenu } = useBooleanState(false)

  const onCopyAddress = async (): Promise<void> => {
    await setClipboard(address)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.Address,
      }),
    )
  }

  const onViewProfile = (): void => {
    navigateToExternalProfile({ address })
    onClose()
  }

  const options: MenuOptionItem[] = [
    {
      label: t('common.copy.address'),
      onPress: onCopyAddress,
      Icon: CopyAlt,
    },
    ...(isMobileApp
      ? [
          {
            label: t('common.view.profile'),
            onPress: onViewProfile,
            Icon: Person,
          },
        ]
      : []),
  ]

  return (
    <InfoRow label={isSend ? t('common.text.recipient') : t('common.text.sender')}>
      <Flex>
        <ContextMenu
          isPlacementAbove
          menuItems={options}
          triggerMode={ContextMenuTriggerMode.Primary}
          isOpen={isContextMenuOpen}
          closeMenu={closeContextMenu}
          openMenu={openContextMenu}
        >
          <TransactionParticipantDisplay address={address} />
        </ContextMenu>
      </Flex>
    </InfoRow>
  )
}
