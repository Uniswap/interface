import { Trans } from '@lingui/macro'
import { darken } from 'polished'
import { ReactNode } from 'react'
import styled from 'styled-components'

import Loader from 'components/Loader'
import { SUPPORTED_WALLET, SUPPORTED_WALLETS } from 'constants/wallets'

import { WarningBox } from './WarningBox'

const PendingSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 100%;
  & > * {
    width: 100%;
  }
`

const StyledLoader = styled(Loader)`
  margin-right: 1rem;
`

const LoadingMessage = styled.div<{ hasError?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: flex-start;
  border-radius: 16px;
  color: ${({ theme, hasError }) => (hasError ? theme.red1 : 'inherit')};
  border: 1px solid ${({ theme, hasError }) => (hasError ? theme.red1 : theme.text4)};
  width: 100%;
  & > * {
    padding: 1rem;
  }
`

const ErrorGroup = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: space-between;
  display: flex;
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size:14px;
  `}
`

const ErrorButton = styled.div`
  border-radius: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.primary};
  background-color: rgba(49, 203, 158, 0.2);
  padding: 0.5rem;
  font-weight: 600;
  user-select: none;
  min-width: 70px;
  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => darken(0.1, theme.bg7)};
  }
`

const LoadingWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  width: 100%;
`

export default function PendingView({
  walletKey,
  hasError = false,
  onClickTryAgain,
  context,
}: {
  walletKey?: SUPPORTED_WALLET
  hasError?: boolean
  onClickTryAgain: () => void
  context?: ReactNode
}) {
  const walletName = walletKey ? SUPPORTED_WALLETS[walletKey].name : ''

  return (
    <PendingSection>
      <LoadingMessage hasError={hasError}>
        <LoadingWrapper>
          {hasError ? (
            <ErrorGroup>
              <div>
                <Trans>Error connecting to {walletName}.</Trans>
              </div>
              <ErrorButton onClick={onClickTryAgain}>
                <Trans>Try Again</Trans>
              </ErrorButton>
            </ErrorGroup>
          ) : (
            <>
              <StyledLoader />
              <Trans>Initializing with {walletName}...</Trans>
            </>
          )}
        </LoadingWrapper>
      </LoadingMessage>
      <WarningBox walletKey={walletKey} />
      {context}
    </PendingSection>
  )
}
