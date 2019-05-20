import React, { useState, useEffect } from 'react'
import { useWeb3Context, Connectors } from 'web3-react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { useTranslation } from 'react-i18next'
import { isMobile } from 'react-device-detect'

import { ReactComponent as Spinner } from '../../assets/images/spinner.svg'

const { Connector } = Connectors

const Message = styled.h2`
  display: flex;
  align-items: center;
  height: 100%;
  margin: -1rem 0 0 0;
  color: ${({ theme }) => theme.uniswapPink};
  text-align: center;
`

const PinkSpinner = styled(Spinner)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 5rem;
  margin: -1rem auto 0 auto;
  stroke: ${({ theme }) => theme.uniswapPink};
`

export default function Web3ReactManager({ children }) {
  const { t } = useTranslation()
  const { active, error, setConnector, setError } = useWeb3Context()

  // start web3-react on page-load
  // useEffect(() => {
  //   setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
  //     if (error.code === Connector.errorCodes.UNSUPPORTED_NETWORK) {
  //       setError(error, { connectorName: 'Injected' })
  //     } else {
  //       setConnector('Infura')
  //     }
  //   })
  // }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // // if the metamask user logs out, set the infura provider
  // useEffect(() => {
  //   if (error && error.code === InjectedConnector.errorCodes.UNLOCK_REQUIRED) {
  //     setConnector('Infura')
  //   }
  // }, [error, connectorName, setConnector])

  useEffect(() => {
    if (!active) {
      if (window.ethereum || window.web3) {
        try {
          const library = new ethers.providers.Web3Provider(window.ethereum || window.web3)
          library.listAccounts().then(accounts => {
            if (accounts.length >= 1) {
              setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
                if (error.code === Connector.errorCodes.UNSUPPORTED_NETWORK) {
                  setError(error)
                } else {
                  setConnector('Network')
                }
              })
            } else {
              setConnector('Network')
            }
          })
        } catch {
          setConnector('Network')
        }
      } else {
        setConnector('Network')
      }
    }
  }, [active, setConnector, setError])

  const [showLoader, setShowLoader] = useState(false)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowLoader(true)
    }, 750)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  if (error) {
    if (error.code === Connector.errorCodes.UNSUPPORTED_NETWORK) {
      const correctNetwork = process.env.REACT_APP_NETWORK_NAME || 'Main Ethereum Network'

      return <Message>{`${t('wrongNetwork')}. ${t('switchNetwork', { correctNetwork })}`}</Message>
    } else {
      console.error(error)
      return <Message>{t('unknownError')}</Message>
    }
  } else if (!active) {
    return showLoader ? <PinkSpinner /> : null
  } else {
    return children
  }
}
