import { Dialog } from 'components/Dialog/Dialog'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import styled from 'lib/styled-components'
import { Trans } from 'react-i18next'

const StyledAlertIcon = styled(AlertTriangleFilled)`
  path {
    fill: ${({ theme }) => theme.neutral2};
  }
`

export const SmartContractSpeedBumpModal = ({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) => {
  return (
    <Dialog
      isVisible={true}
      icon={<StyledAlertIcon size="28px" />}
      title={<Trans i18nKey="speedBump.smartContractAddress.warning.title">Is this a wallet address?</Trans>}
      description={<Trans i18nKey="speedBump.smartContractAddress.warning.description" />}
      onCancel={onCancel}
      buttonsConfig={{
        left: {
          title: <Trans i18nKey="common.button.cancel" />,
          onClick: onCancel,
        },
        right: {
          title: <Trans i18nKey="common.button.continue" />,
          onClick: onConfirm,
        },
      }}
    />
  )
}
