import { Trans } from '@lingui/macro'
import { ButtonEmpty, ButtonPrimary } from 'components/Button'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { AbstractConnector } from 'web3-react-abstract-connector'

import Loader from '../Loader'

const PendingSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 100%;
  & > * {
    width: 100%;
  }
`

const LoaderContainer = styled.div`
  margin: 16px 0;
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: center;
`

const LoadingMessage = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: center;
  border-radius: 12px;

  & > * {
    padding: 1rem;
  }
`

const ErrorGroup = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: flex-start;
`

const LoadingWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
`

export default function PendingView({
  connector,
  error = false,
  setPendingError,
  tryActivation,
  resetAccountView,
}: {
  connector?: AbstractConnector
  error?: boolean
  setPendingError: (error: boolean) => void
  tryActivation: (connector: AbstractConnector) => void
  resetAccountView: () => void
}) {
  return (
    <PendingSection>
      <LoadingMessage>
        <LoadingWrapper>
          {error ? (
            <ErrorGroup>
              <ThemedText.MediumHeader marginBottom={12}>
                <Trans>Error connecting</Trans>
              </ThemedText.MediumHeader>
              <ThemedText.Body fontSize={14} marginBottom={36} textAlign="center">
                <Trans>
                  The connection attempt failed. Please click try again and follow the steps to connect in your wallet.
                </Trans>
              </ThemedText.Body>
              <ButtonPrimary
                $borderRadius="12px"
                padding="12px"
                onClick={() => {
                  setPendingError(false)
                  connector && tryActivation(connector)
                }}
              >
                <Trans>Try Again</Trans>
              </ButtonPrimary>
              <ButtonEmpty width="fit-content" padding="0" marginTop={20}>
                <ThemedText.Link fontSize={12} onClick={resetAccountView}>
                  <Trans>Back to wallet selection</Trans>
                </ThemedText.Link>
              </ButtonEmpty>
            </ErrorGroup>
          ) : (
            <>
              <ThemedText.Black fontSize={20} marginY={16}>
                <LoaderContainer>
                  <Loader stroke="currentColor" size="32px" />
                </LoaderContainer>
                <Trans>Connecting...</Trans>
              </ThemedText.Black>
            </>
          )}
        </LoadingWrapper>
      </LoadingMessage>
    </PendingSection>
  )
}
