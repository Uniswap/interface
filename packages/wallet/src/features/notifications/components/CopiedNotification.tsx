import { useTranslation } from 'react-i18next'
import { SuccessNotification } from 'wallet/src/features/notifications/components/SuccessNotification'
import { CopyNotification, CopyNotificationType } from 'wallet/src/features/notifications/types'

export function CopiedNotification({
  notification: { hideDelay = 2000, copyType },
}: {
  notification: CopyNotification
}): JSX.Element | null {
  const { t } = useTranslation()

  let title
  switch (copyType) {
    case CopyNotificationType.Address:
      title = t('notification.copied.address')
      break
    case CopyNotificationType.Calldata:
      title = t('notification.copied.calldata')
      break
    case CopyNotificationType.ContractAddress:
      title = t('notification.copied.contractAddress')
      break
    case CopyNotificationType.TransactionId:
      title = t('notification.copied.transactionId')
      break
    case CopyNotificationType.Image:
      title = t('notification.copied.image')
      break
    case CopyNotificationType.TokenUrl:
      title = t('notification.copied.tokenUrl')
      break
    case CopyNotificationType.NftUrl:
      title = t('notification.copied.nftUrl')
      break
  }

  return <SuccessNotification notification={{ title, hideDelay }} />
}
