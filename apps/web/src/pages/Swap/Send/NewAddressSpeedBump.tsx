import { Trans } from '@lingui/macro'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import GetHelp from 'components/Button/GetHelp'
import { ColumnCenter } from 'components/Column'
import { UserIcon } from 'components/Icons/UserIcon'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { Unicon } from 'components/Unicon'
import { useSendContext } from 'state/send/SendContext'
import styled, { useTheme } from 'styled-components'
import { ClickableStyle, CloseIcon, ThemedText } from 'theme/components'

const ModalWrapper = styled(ColumnCenter)`
  background-color: ${({ theme }) => theme.surface1};
  border-radius: 20px;
  outline: 1px solid ${({ theme }) => theme.surface3};
  width: 100%;
  padding: 16px 24px;
`

const StyledReviewCloseIcon = styled(CloseIcon)`
  ${ClickableStyle}
`

const StyledButton = styled(ThemeButton)`
  display: flex;
  flex-grow: 1;
  height: 40px;
`

const AlertIconContainer = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.surface3};
  width: 48px;
  height: 48px;
  justify-content: center;
  align-items: center;
  border-radius: 12px;
`

const StyledUserIcon = styled(UserIcon)`
  width: 28px;
  height: 28px;
`

const StyledColumnCenter = styled(ColumnCenter)`
  gap: 16px;
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

  return (
    <Modal $scrollOverlay isOpen onDismiss={onCancel}>
      <ModalWrapper gap="lg">
        <Row gap="10px" width="100%" padding="4px 0px" justify="end" align="center">
          <GetHelp />
          <StyledReviewCloseIcon onClick={onCancel} />
        </Row>
        <StyledColumnCenter>
          <AlertIconContainer>
            <StyledUserIcon fill={theme.neutral2} />
          </AlertIconContainer>
          <ColumnCenter gap="sm">
            <ThemedText.SubHeader>
              <Trans>New address</Trans>
            </ThemedText.SubHeader>
            <ThemedText.BodySecondary textAlign="center">
              <Trans>
                You haven&apos;t transacted with this address before. Make sure it&apos;s the correct address before
                continuing.
              </Trans>
            </ThemedText.BodySecondary>
          </ColumnCenter>
        </StyledColumnCenter>
        <RecipientInfo>
          <Row justify="center" align="center" gap="xs">
            <Unicon size={16} address={recipientData?.address ?? ''} />
            <ThemedText.BodyPrimary lineHeight="24px">
              {recipientData?.ensName ?? recipientData?.address}
            </ThemedText.BodyPrimary>
          </Row>
          {recipientData?.ensName && (
            <ThemedText.LabelMicro lineHeight="16px">{recipientData?.address}</ThemedText.LabelMicro>
          )}
        </RecipientInfo>
        <Row align="center" justify="center" gap="md">
          <StyledButton size={ButtonSize.small} emphasis={ButtonEmphasis.medium} onClick={onCancel}>
            <Trans>Cancel</Trans>
          </StyledButton>
          <StyledButton size={ButtonSize.small} emphasis={ButtonEmphasis.medium} onClick={onConfirm}>
            <Trans>Continue</Trans>
          </StyledButton>
        </Row>
      </ModalWrapper>
    </Modal>
  )
}
