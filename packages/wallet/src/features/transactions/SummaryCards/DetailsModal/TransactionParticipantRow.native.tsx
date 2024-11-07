import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useDispatch } from 'react-redux'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/types'
import { setClipboard } from 'uniswap/src/utils/clipboard'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { InfoRow } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/InfoRow'
import { TransactionParticipantDisplay } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/TransactionParticipantDisplay'
import { TransactionParticipantRowProps } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/types'

export function TransactionParticipantRow({
  onClose,
  address,
  isSend = false,
}: TransactionParticipantRowProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { navigateToExternalProfile } = useWalletNavigation()

  const onCopyAddress = (): void => {
    setClipboard(address)
      .then(() => {
        dispatch(
          pushNotification({
            type: AppNotificationType.Copied,
            copyType: CopyNotificationType.Address,
          }),
        )
      })
      .catch(() => {
        // setClipboard shouldn't ever error
      })
  }

  const onViewProfile = (): void => {
    navigateToExternalProfile({ address })
    onClose()
  }

  const menuActions = useMemo(() => {
    return [{ title: t('common.copy.address') }, { title: t('common.view.profile') }]
  }, [t])

  return (
    <InfoRow label={isSend ? t('common.text.recipient') : t('common.text.sender')}>
      <ContextMenu
        dropdownMenuMode
        actions={menuActions}
        onPress={(e): void => {
          // Emitted index based on order of menu action array
          // Copy address
          if (e.nativeEvent.index === 0) {
            onCopyAddress()
          }
          // View profile
          if (e.nativeEvent.index === 1) {
            onViewProfile()
          }
        }}
      >
        <TransactionParticipantDisplay address={address} />
      </ContextMenu>
    </InfoRow>
  )
}
