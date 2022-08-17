import { Trans } from '@lingui/macro'
import { darken } from 'polished'
import React from 'react'
import styled from 'styled-components'

import Loader from '../Loader'
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
`

const ErrorButton = styled.div`
  border-radius: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.primary};
  background-color: rgba(49, 203, 158, 0.2);
  margin-left: 1rem;
  padding: 0.5rem;
  font-weight: 600;
  user-select: none;

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
  walletOptionKey,
  hasError = false,
  renderHelperText = () => null,
  onClickTryAgain,
}: {
  walletOptionKey?: string // key of SUPPORTED_WALLETS
  hasError?: boolean
  renderHelperText?: () => React.ReactNode
  onClickTryAgain: () => void
}) {
  const isMetamask = window?.ethereum?.isMetaMask
  const isCoin98 = window?.ethereum?.isCoin98 || !!window.coin98

  const isInjected = walletOptionKey === 'INJECTED' || walletOptionKey === 'COIN98'

  return (
    <PendingSection>
      <LoadingMessage hasError={hasError}>
        <LoadingWrapper>
          {hasError ? (
            <ErrorGroup>
              <div>
                <Trans>Error connecting.</Trans>
              </div>
              <ErrorButton onClick={onClickTryAgain}>
                <Trans>Try Again</Trans>
              </ErrorButton>
            </ErrorGroup>
          ) : (
            <>
              <StyledLoader />
              <Trans>Initializing...</Trans>
            </>
          )}
        </LoadingWrapper>
      </LoadingMessage>
      {isMetamask && isCoin98 && isInjected && <WarningBox option={walletOptionKey} />}
      {renderHelperText()}
    </PendingSection>
  )
}
