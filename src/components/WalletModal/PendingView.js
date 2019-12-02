import React from 'react'
import styled from 'styled-components'
import Option from './Option'
import { SUPPORTED_WALLETS } from '../../constants'
import WalletConnectData from './WalletConnectData'
import { walletconnect } from '../../connectors'
import { Spinner } from '../../theme'
import Circle from '../../assets/images/circle.svg'

const PendingSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  width: 100%;
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
  width: 90%;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 20px;
  color: ${({ theme, error }) => (error ? theme.salmonRed : 'inherit')};
  border: 1px solid ${({ theme, error }) => (error ? theme.salmonRed : theme.placeholderGray)};
`

export default function PendingView({ uri = '', size, connector, error = false }) {
  return (
    <PendingSection>
      <LoadingMessage error={error}>
        {!error && <SpinnerWrapper src={Circle} />}
        <h5>
          {error
            ? 'Error connecting...'
            : connector === walletconnect
            ? 'Scan QR code with a compatible wallet...'
            : 'Follow prompt on mobile device...'}
        </h5>
      </LoadingMessage>
      {!error ? connector === walletconnect ? <WalletConnectData size={size} uri={uri} /> : '' : ''}
      {Object.keys(SUPPORTED_WALLETS).map(key => {
        const option = SUPPORTED_WALLETS[key]
        if (option.connector === connector) {
          return (
            <Option
              key={key}
              clickable={false}
              color={option.color}
              header={option.name}
              link={option.href}
              subheader={option.description}
              icon={require('../../assets/images/' + option.iconName)}
            />
          )
        }
      })}
    </PendingSection>
  )
}
