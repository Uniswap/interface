import React from 'react'
import styled from 'styled-components'
import Option from './Option'
import { SUPPORTED_WALLETS } from '../../constants'
import WalletConnectData from './WalletConnectData'
import { walletconnect, injected } from '../../connectors'
import { Spinner } from '../../theme'
import Circle from '../../assets/images/circle.svg'
import { darken } from 'polished'

const PendingSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 100%;
  & > * {
    width: 100%;
  }
`

const SpinnerWrapper = styled(Spinner)`
  font-size: 4rem;
  margin-right: 1rem;
  svg {
    path {
      color: ${({ theme }) => theme.placeholderGray};
    }
  }
`

const LoadingMessage = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: flex-start;
  border-radius: 12px;
  margin-bottom: 20px;
  color: ${({ theme, error }) => (error ? theme.salmonRed : 'inherit')};
  border: 1px solid ${({ theme, error }) => (error ? theme.salmonRed : theme.placeholderGray)};

  & > * {
    padding: 1rem;
  }
`

const ErrorGroup = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: flex-start;
`

const ErrorButton = styled.div`
  border-radius: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.textColor};
  background-color: ${({ theme }) => theme.placeholderGray};
  margin-left: 1rem;
  padding: 0.5rem;
  font-weight: 600;
  user-select: none;

  &:hover {
    cursor: pointer;
    background-color: ${({ theme }) => darken(0.1, theme.placeholderGray)};
  }
`

export default function PendingView({ uri = '', size, connector, error = false, tryActivation }) {
  const isMetamask = window.ethereum && window.ethereum.isMetaMask

  return (
    <PendingSection>
      <LoadingMessage error={error}>
        <div>
          {!error && <SpinnerWrapper src={Circle} />}
          {error ? (
            <ErrorGroup>
              <div>Error connecting.</div>
              <ErrorButton
                onClick={() => {
                  tryActivation(connector)
                }}
              >
                Try Again
              </ErrorButton>
            </ErrorGroup>
          ) : connector === walletconnect ? (
            'Scan QR code with a compatible wallet...'
          ) : (
            'Waiting for connection...'
          )}
        </div>
      </LoadingMessage>
      {!error && connector === walletconnect && <WalletConnectData size={size} uri={uri} />}
      {Object.keys(SUPPORTED_WALLETS).map(key => {
        const option = SUPPORTED_WALLETS[key]
        if (option.connector === connector) {
          if (option.connector === injected && isMetamask && option.name !== 'MetaMask') {
            return null
          } else {
            return (
              <Option
                key={key}
                clickable={false}
                color={option.color}
                header={option.name}
                subheader={option.description}
                icon={require('../../assets/images/' + option.iconName)}
              />
            )
          }
        }
        return true
      })}
    </PendingSection>
  )
}
