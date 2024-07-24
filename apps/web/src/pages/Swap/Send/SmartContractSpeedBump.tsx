import { Dialog } from 'components/Dialog/Dialog'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'

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
          title: <Trans i18nKey="common.cancel.button" />,
          onClick: onCancel,
        },
        right: {
          title: <Trans i18nKey="common.continue.button" />,
          onClick: onConfirm,
        },
      }}
    />
  )
}
