import React, { useState, useEffect } from 'react'
import { Connectors } from 'web3-react'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useEagerConnect, useInactiveListener } from '../../hooks'

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

export default function Web3ReactManager({ children }) {
  const { t } = useTranslation()
  const context = useWeb3React()
  const { connector, activate, active, error } = context

  // handle logic to eagerly connect to the injected ethereum provider, if it exists and has granted access already
  const triedEager = useEagerConnect()

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = useState()

  // handle logic to connect in reaction to certain events on the injected ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector)

  // control whether or not we render the error, after parsing
  const blockRender = error && error.code && error.code === Connector.errorCodes.UNSUPPORTED_NETWORK

  // reset the
  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined)
    }
  }, [activatingConnector, connector])

  useEffect(() => {
    if (error) {
      // if the user changes to the wrong network, unset the connector
      if (error.code === Connector.errorCodes.UNSUPPORTED_NETWORK) {
        activate('Network', { suppressAndThrowErrors: true }).catch(error => {
          error(error)
        })
      }
    }
  })

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
