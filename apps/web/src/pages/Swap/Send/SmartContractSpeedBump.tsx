import { Dialog } from 'components/Dialog/Dialog'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import styled from 'lib/styled-components'
import { SendModalProps } from 'pages/Swap/Send/SendReviewModal'
import { useTranslation } from 'react-i18next'

const StyledAlertIcon = styled(AlertTriangleFilled)`
  path {
    fill: ${({ theme }) => theme.neutral2};
  }
`

export const SmartContractSpeedBumpModal = ({ isOpen, onDismiss, onConfirm }: SendModalProps) => {
  const { t } = useTranslation()
  return (
    <Dialog
      isVisible={isOpen}
      icon={<StyledAlertIcon size="28px" />}
      title={t('speedBump.smartContractAddress.warning.title')}
      description={t('speedBump.smartContractAddress.warning.description')}
      onCancel={onDismiss}
      buttonsConfig={{
        left: {
          title: t('common.button.cancel'),
          onClick: onDismiss,
        },
        right: {
          title: t('common.button.continue'),
          onClick: onConfirm,
        },
      }}
    />
  )
}
