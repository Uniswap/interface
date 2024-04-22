import { ColumnCenter } from 'components/Column'
import { Dialog } from 'components/Dialog/Dialog'
import { UserIcon } from 'components/Icons/UserIcon'
import Row from 'components/Row'
import { Unicon } from 'components/Unicon'
import { Trans } from 'i18n'
import { useSendContext } from 'state/send/SendContext'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { UniconV2 } from 'ui/src/components/UniconV2'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

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
  const uniconsV2Enabled = useFeatureFlag(FeatureFlags.UniconsV2)

  return (
    <Dialog
      isVisible={true}
      icon={<StyledUserIcon fill={theme.neutral2} />}
      title={<Trans>New address</Trans>}
      description={
        <Trans>
          You haven&apos;t transacted with this address before. Make sure it&apos;s the correct address before
          continuing.
        </Trans>
      }
      body={
        <RecipientInfo>
          <Row justify="center" align="center" gap="xs">
            {uniconsV2Enabled ? (
              <UniconV2 size={16} address={recipientData?.address ?? ''} />
            ) : (
              <Unicon size={16} address={recipientData?.address ?? ''} />
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
          title: <Trans>Cancel</Trans>,
          onClick: onCancel,
        },
        right: {
          title: <Trans>Continue</Trans>,
          onClick: onConfirm,
        },
      }}
    />
  )
}
