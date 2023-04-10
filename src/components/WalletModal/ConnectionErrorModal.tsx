import { t, Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import Row from 'components/Row'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'
import { HoverableCloseIcon, ThemedText } from 'theme'
import { flexColumnNoWrap } from 'theme/styles'

const Wrapper = styled.div`
  ${flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 32px 24px;
`

const AlertTriangleIcon = styled(AlertTriangle)`
  width: 48px;
  height: 48px;
  stroke-width: 2px;
  margin: 32px;
  color: ${({ theme }) => theme.accentCritical};
`

type ErrorMessage = {
  icon: ReactNode
  title: string
  description: string
  displayRetryButton: boolean
}

const DEFAULT_MESSAGE: ErrorMessage = {
  icon: <AlertTriangleIcon />,
  title: t`Error connecting`,
  description: t`The connection attempt failed. Please click try again and follow the steps to connect in your wallet.`,
  displayRetryButton: true,
}

export default function ConnectionErrorModal({
  error,
  retryActivation,
  onDismiss,
}: {
  error?: any
  retryActivation: () => void
  onDismiss: () => void
}) {
  const { icon, title, description, displayRetryButton } = DEFAULT_MESSAGE

  return (
    <Modal isOpen={Boolean(error)} onDismiss={onDismiss}>
      <Wrapper>
        <Row justify="flex-end">
          <HoverableCloseIcon onClick={onDismiss} />
        </Row>
        {icon}
        <ThemedText.HeadlineSmall marginBottom="8px">{title}</ThemedText.HeadlineSmall>
        <ThemedText.BodyPrimary fontSize={16} marginBottom={24} lineHeight="24px" textAlign="center">
          {description}
        </ThemedText.BodyPrimary>
        {displayRetryButton ? (
          <ButtonPrimary onClick={retryActivation}>
            <Trans>Try Again</Trans>
          </ButtonPrimary>
        ) : (
          <ButtonPrimary onClick={onDismiss}>
            <Trans>Dismiss</Trans>
          </ButtonPrimary>
        )}
      </Wrapper>
    </Modal>
  )
}
