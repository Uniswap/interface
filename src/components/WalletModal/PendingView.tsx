import { AbstractConnector } from '@web3-react/abstract-connector'
import React from 'react'
import styled from 'styled-components'
import { SUPPORTED_WALLETS } from '../../constants'
import { injected } from '../../connectors'
import Loader from '../Loader'
import { TYPE } from '../../theme'
import { ButtonPrimary } from '../Button'
import { Box, Flex } from 'rebass'

const PendingSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  border: solid 1px ${({ theme }) => theme.text5};
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  padding: 20px;
  width: 100%;
  & > * {
    width: 100%;
  }
`

const StyledLoader = styled(Loader)`
  margin-right: 1rem;
  path {
    stroke: ${({ theme }) => theme.text5};
  }
`

const LoadingMessage = styled.div<{ error?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap};
  width: 100%;
  align-items: center;
  justify-content: flex-start;
  color: ${({ theme, error }) => (error ? theme.red1 : theme.text1)};
`

const ErrorGroup = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  flex-direction: column;
  justify-content: center;
`

const LoadingWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  justify-content: center;
  width: 100%;
`

export default function PendingView({
  connector,
  error = false,
  setPendingError,
  tryActivation
}: {
  connector?: AbstractConnector
  error?: boolean
  setPendingError: (error: boolean) => void
  tryActivation: (connector: AbstractConnector) => void
}) {
  const isMetamask = window?.ethereum?.isMetaMask

  return (
    <PendingSection>
      {Object.keys(SUPPORTED_WALLETS).map(key => {
        const option = SUPPORTED_WALLETS[key]
        if (option.connector === connector) {
          if (option.connector === injected) {
            if (isMetamask && option.name !== 'MetaMask') {
              return null
            }
            if (!isMetamask && option.name === 'MetaMask') {
              return null
            }
          }
          return (
            <Flex key={key} mb="28px" justifyContent="center">
              <Box mr="10px">
                <img src={require('../../assets/images/' + option.iconName)} alt="logo" width="24px" height="24px" />
              </Box>
              <Box>
                <TYPE.body color="white" fontWeight="500" fontSize="22px" lineHeight="27px">
                  {option.name}
                </TYPE.body>
              </Box>
            </Flex>
          )
        }
        return null
      })}
      <LoadingMessage error={error}>
        <LoadingWrapper>
          {error ? (
            <ErrorGroup>
              <TYPE.body
                color="red1"
                fontWeight="500"
                fontSize="20px"
                lineHeight="24px"
                letterSpacing="-0.01em"
                marginBottom="24px"
              >
                Error connecting.
              </TYPE.body>
              <ButtonPrimary
                padding="8px 14px"
                onClick={() => {
                  setPendingError(false)
                  connector && tryActivation(connector)
                }}
              >
                Try Again
              </ButtonPrimary>
            </ErrorGroup>
          ) : (
            <>
              <StyledLoader />
              <TYPE.body color="text4" fontWeight="500" fontSize="20px" lineHeight="24px" letterSpacing="-0.01em">
                Initializing...
              </TYPE.body>
            </>
          )}
        </LoadingWrapper>
      </LoadingMessage>
    </PendingSection>
  )
}
