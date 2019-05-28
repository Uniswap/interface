import React, { useState, useEffect } from 'react'
import { useWeb3Context, Connectors } from 'web3-react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { useTranslation } from 'react-i18next'
import { isMobile } from 'react-device-detect'

import { Spinner } from '../../theme'
import Circle from '../../assets/images/circle.svg'

const { Connector } = Connectors

const MessageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20rem;
`

const Message = styled.h2`
  color: ${({ theme }) => theme.uniswapPink};
`

const SpinnerWrapper = styled(Spinner)`
  font-size: 4rem;

  svg {
    path {
      color: ${({ theme }) => theme.uniswapPink};
    }
  }
`

function tryToSetConnector(setConnector, setError) {
  setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
    setConnector('Network')
  })
}

export default function Web3ReactManager({ children }) {
  const { t } = useTranslation()
  const { active, error, setConnector, setError } = useWeb3Context()
  // control whether or not we render the error, after parsing
  const blockRender = error && error.code && error.code === Connector.errorCodes.UNSUPPORTED_NETWORK

  useEffect(() => {
    if (!active && !error) {
      if (window.ethereum || window.web3) {
        if (isMobile) {
          tryToSetConnector(setConnector, setError)
        } else {
          const library = new ethers.providers.Web3Provider(window.ethereum || window.web3)
          library.listAccounts().then(accounts => {
            if (accounts.length >= 1) {
              tryToSetConnector(setConnector, setError)
            } else {
              setConnector('Network')
            }
          })
        }
      } else {
        setConnector('Network')
      }
    }
  }, [active, error, setConnector, setError])

  // parse the error
  useEffect(() => {
    if (error) {
      // if the user changes to the wrong network, unset the connector
      if (error.code === Connector.errorCodes.UNSUPPORTED_NETWORK) {
        setConnector('Network')
      }
    }
  }, [error, setConnector])

  const [showLoader, setShowLoader] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoader(true)
    }, 600)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  if (blockRender) {
    return null
  } else if (error) {
    return (
      <MessageWrapper>
        <Message>{t('unknownError')}</Message>
      </MessageWrapper>
    )
  } else if (!active) {
    return showLoader ? (
      <MessageWrapper>
        <SpinnerWrapper src={Circle} />
      </MessageWrapper>
    ) : null
  } else {
    return children
  }
}
