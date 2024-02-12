import { Trans } from '@lingui/macro'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import GetHelp from 'components/Button/GetHelp'
import { ColumnCenter } from 'components/Column'
import AlertTriangleFilled from 'components/Icons/AlertTriangleFilled'
import Modal from 'components/Modal'
import Row from 'components/Row'
import styled from 'styled-components'
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

const StyledAlertIcon = styled(AlertTriangleFilled)`
  path {
    fill: ${({ theme }) => theme.neutral2};
  }
`

const StyledColumnCenter = styled(ColumnCenter)`
  gap: 16px;
`

export const SmartContractSpeedBumpModal = ({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void
  onConfirm: () => void
}) => {
  return (
    <Modal $scrollOverlay isOpen onDismiss={onCancel}>
      <ModalWrapper gap="lg">
        <Row gap="10px" width="100%" padding="4px 0px" justify="end" align="center">
          <GetHelp />
          <StyledReviewCloseIcon onClick={onCancel} />
        </Row>
        <StyledColumnCenter>
          <AlertIconContainer>
            <StyledAlertIcon size="28px" />
          </AlertIconContainer>
          <ColumnCenter gap="sm">
            <ThemedText.SubHeader>
              <Trans>Is this a wallet address?</Trans>
            </ThemedText.SubHeader>
            <ThemedText.BodySecondary textAlign="center">
              <Trans>
                You&apos;re about to send tokens to a special type of address - a smart contract. Double-check it&apos;s
                the address you intended to send to. If it&apos;s wrong, your tokens could be lost forever.
              </Trans>
            </ThemedText.BodySecondary>
          </ColumnCenter>
        </StyledColumnCenter>
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
