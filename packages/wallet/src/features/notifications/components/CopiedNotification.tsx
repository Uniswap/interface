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
      title = t('Address copied')
      break
    case CopyNotificationType.ContractAddress:
      title = t('Contract address copied')
      break
    case CopyNotificationType.TransactionId:
      title = t('Transaction ID copied')
      break
    case CopyNotificationType.Image:
      title = t('Image copied')
      break
  }

  return <SuccessNotification notification={{ title, hideDelay }} />
}
