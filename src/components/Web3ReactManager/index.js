import React, { useState, useEffect } from 'react'
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import { network } from '../../connectors'
import { useWalletModalContext } from '../../contexts/Wallet'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useEagerConnect, useInactiveListener } from '../../hooks'
import { Spinner } from '../../theme'
import Circle from '../../assets/images/circle.svg'

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

  const [showLoader, setShowLoader] = useState(false)

  // handle logic to recognize the connector currently being activated
  const [activatingConnector, setActivatingConnector] = useState()

  // used for setting error state in wallet modal (unsupported networks)
  const [{ setWalletError }] = useWalletModalContext()

  useEffect(() => {
    if (activatingConnector && activatingConnector === connector) {
      setActivatingConnector(undefined)
    }
  }, [activatingConnector, connector, setWalletError])

  // eagerly connect to the injected provider, if it exists and has granted access already
  const triedEager = useEagerConnect()

  // react to certain events on the ethereum provider, if it exists
  useInactiveListener(!triedEager || !!activatingConnector)

  // if error, reset to network connector
  useEffect(() => {
    if (error) {
      if (error instanceof UnsupportedChainIdError) {
        setWalletError(error) // can get rid of this with different route
      }
      setActivatingConnector(network)
      activate(network)
    }
  }, [setActivatingConnector, error, activate, setWalletError])

  // for resetting on logout after already trying eager on first load
  useEffect(() => {
    if (!active && !error && triedEager) {
      setActivatingConnector(network)
      activate(network)
    }
  }, [active, error, activate, triedEager])

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoader(true)
    }, 600)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  if (error) {
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
