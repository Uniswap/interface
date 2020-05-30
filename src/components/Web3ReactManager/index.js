import React, { useEffect, useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { network } from '../../connectors'
import { useEagerConnect, useInactiveListener } from '../../hooks'
import { Spinner } from '../../theme'
import Circle from '../../assets/images/circle.svg'
import { NetworkContextName } from '../../constants'
import { getDefaultApiKeyHeaders, getIpAddress, getConnectorName, routes, sessionId } from '../../utils/api-signer'

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
  const { active, account } = useWeb3React()
  const { active: networkActive, error: networkError, activate: activateNetwork, connector } = useWeb3React(NetworkContextName)

  useEffect(() => {
    if (!!account) {
      getIpAddress()
        .then(ipAddress => {
          const body = {
            key: 'WALLET_SELECTED',
            data: {
              session_id: sessionId,
              ip_address: ipAddress,
              wallet_address: account,
              wallet_type: getConnectorName(connector),
            }
          }
          const options = {
            method: routes.insertEvent.method,
            headers: getDefaultApiKeyHeaders(),
            body: JSON.stringify(body)
          }
          return fetch(routes.insertEvent.url, options)
        })
    }
  }, [account])

  // try to eagerly connect to an injected provider, if it exists and has granted access already
  const triedEager = useEagerConnect()

  // After eagerly trying injected, if the network connect ever isn't active or in an error state, activate it.
  // TODO think about not doing this at all
  useEffect(() => {
    if (triedEager && !networkActive && !networkError && !active) {
      activateNetwork(network)
    }
  }, [triedEager, networkActive, networkError, activateNetwork, active])

  // 'pause' the network connector if we're ever connected to an account and it's active
  useEffect(() => {
    if (active && networkActive) {
      network.pause()
    }
  }, [active, networkActive])

  // 'resume' the network connector if we're ever not connected to an account and it's active
  useEffect(() => {
    if (!active && networkActive) {
      network.resume()
    }
  }, [active, networkActive])

  // when there's no account connected, react to logins (broadly speaking) on the injected provider, if it exists
  useInactiveListener(!triedEager)

  // handle delayed loader state
  const [showLoader, setShowLoader] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoader(true)
    }, 600)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  // on page load, do nothing until we've tried to connect to the injected connector
  if (!triedEager) {
    return null
  }

  // if the account context isn't active, and there's an error on the network context, it's an irrecoverable error
  if (!active && networkError) {
    return (
      <MessageWrapper>
        <Message>{t('unknownError')}</Message>
      </MessageWrapper>
    )
  }

  // if neither context is active, spin
  if (!active && !networkActive) {
    return showLoader ? (
      <MessageWrapper>
        <SpinnerWrapper src={Circle}/>
      </MessageWrapper>
    ) : null
  }

  return children
}
