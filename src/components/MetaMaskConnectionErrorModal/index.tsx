import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { RowBetween } from 'components/Row'
import { AlertTriangle } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { CloseIcon, ThemedText } from 'theme'

import { useModalIsOpen, useToggleMetaMaskConnectionErrorModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'

const Wrapper = styled.div`
  width: 100%;
  position: relative;
  display: flex;
  flex-flow: column;
  align-items: center;
`

const Container = styled.div`
  width: 100%;
  padding: 32px 32px;
  display: flex;
  flex-flow: column;
  align-items: center;
`

const LogoContainer = styled.div`
  display: flex;
  gap: 16px;
`

const ShortColumn = styled(AutoColumn)`
  margin-top: 10px;
`

const InfoText = styled(Text)`
  padding: 0 12px 0 12px;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
`

const StyledButton = styled(ButtonPrimary)`
  margin-top: 24px;
  width: 100%;
  font-weight: 600;
`

const WarningIcon = styled(AlertTriangle)`
  width: 76px;
  height: 76px;
  margin-top: 4px;
  margin-bottom: 28px;
  stroke-width: 1px;
  margin-right: 4px;
  color: ${({ theme }) => theme.accentCritical};
`

const onReconnect = () => window.location.reload()

export default function MetaMaskConnectionErrorModal() {
  const modalOpen = useModalIsOpen(ApplicationModal.METAMASK_CONNECTION_ERROR)
  const toggleModal = useToggleMetaMaskConnectionErrorModal()

  return (
    <Modal isOpen={modalOpen} onDismiss={toggleModal} minHeight={false} maxHeight={90}>
      <Wrapper>
        <RowBetween style={{ padding: '1rem' }}>
          <div />
          <CloseIcon onClick={toggleModal} />
        </RowBetween>
        <Container>
          <AutoColumn>
            <LogoContainer>
              <WarningIcon />
            </LogoContainer>
          </AutoColumn>
          <ShortColumn>
            <InfoText>
              <ThemedText.HeadlineSmall marginBottom="8px">
                <Trans>Wallet disconnected</Trans>
              </ThemedText.HeadlineSmall>
              <ThemedText.BodySmall>
                <Trans>A MetaMask error caused your wallet to disconnect. Reload the page to reconnect.</Trans>
              </ThemedText.BodySmall>
            </InfoText>
          </ShortColumn>
          <StyledButton onClick={onReconnect}>
            <Trans>Reload</Trans>
          </StyledButton>
        </Container>
      </Wrapper>
    </Modal>
  )
}
