import { ColumnCenter } from 'components/Column'
import { Dialog } from 'components/Dialog/Dialog'
import { UserIcon } from 'components/Icons/UserIcon'
import Identicon, { IdenticonType, useIdenticonType } from 'components/Identicon'
import Row from 'components/Row'
import { Trans } from 'i18n'
import styled, { useTheme } from 'lib/styled-components'
import { useSendContext } from 'state/send/SendContext'
import { ThemedText } from 'theme/components'

const StyledUserIcon = styled(UserIcon)`
  width: 28px;
  height: 28px;
`

const RecipientInfo = styled(ColumnCenter)`
  padding: 20px 16px;
  border: 1px solid ${({ theme }) => theme.surface3};
  gap: 8px;
  border-radius: 20px;
`

export const NewAddressSpeedBumpModal = ({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) => {
  const theme = useTheme()
  const {
    derivedSendInfo: { recipientData },
  } = useSendContext()
  const identiconType = useIdenticonType(recipientData?.address)

  return (
    <Dialog
      isVisible={true}
      icon={<StyledUserIcon fill={theme.neutral2} />}
      title={<Trans i18nKey="speedBump.newAddress.warning.title" />}
      description={<Trans i18nKey="speedBump.newAddress.warning.description" />}
      body={
        <RecipientInfo>
          <Row justify="center" align="center" gap="xs">
            {(identiconType === IdenticonType.ENS_AVATAR || identiconType === IdenticonType.UNITAG_PROFILE_PICTURE) && (
              <Identicon data-testid="speedbump-identicon" size={16} account={recipientData?.address ?? ''} />
            )}
            <ThemedText.BodyPrimary lineHeight="24px">
              {recipientData?.ensName ?? recipientData?.address}
            </ThemedText.BodyPrimary>
          </Row>
          {recipientData?.ensName && (
            <ThemedText.LabelMicro lineHeight="16px">{recipientData?.address}</ThemedText.LabelMicro>
          )}
        </RecipientInfo>
      }
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
