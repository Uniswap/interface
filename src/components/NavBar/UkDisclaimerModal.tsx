import { Trans } from '@lingui/macro'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Column from 'components/Column'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { useCloseModal, useModalIsOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import styled from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'

const Wrapper = styled(Column)`
  padding: 8px;
`

const ButtonContainer = styled(Column)`
  padding: 8px 12px 4px;
`

const StyledThemeButton = styled(ThemeButton)`
  width: 100%;
`

export function UkDisclaimerModal() {
  const isOpen = useModalIsOpen(ApplicationModal.UK_DISCLAIMER)
  const closeModal = useCloseModal()

  return (
    <Modal isOpen={isOpen} onDismiss={closeModal}>
      <Wrapper gap="md">
        <Row justify="flex-end" padding="8px 0px 4px">
          <CloseIcon size={24} onClick={() => closeModal()} />
        </Row>
        <Column gap="sm">
          <ThemedText.HeadlineLarge padding="0px 8px" fontSize="24px" lineHeight="32px" fontWeight={500}>
            <Trans>Disclaimer for UK residents</Trans>
          </ThemedText.HeadlineLarge>
          <ThemedText.BodyPrimary padding="8px 8px 12px" lineHeight="24px" fontWeight={500}>
            <Trans>
              This web application is provided as a tool for users to interact with the Uniswap Protocol on their own
              initiative, with no endorsement or recommendation of cryptocurrency trading activities. In doing so,
              Uniswap is not recommending that users or potential users engage in cryptoasset trading activity, and
              users or potential users of the web application should not regard this webpage or its contents as
              involving any form of recommendation, invitation or inducement to deal in cryptoassets.
            </Trans>
          </ThemedText.BodyPrimary>
        </Column>
        <ButtonContainer gap="md">
          <StyledThemeButton size={ButtonSize.large} emphasis={ButtonEmphasis.medium} onClick={() => closeModal()}>
            <Trans>Dismiss</Trans>
          </StyledThemeButton>
        </ButtonContainer>
      </Wrapper>
    </Modal>
  )
}
