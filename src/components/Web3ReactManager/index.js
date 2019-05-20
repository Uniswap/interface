import React, { useState, useEffect } from 'react'
import { useWeb3Context, Connectors } from 'web3-react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { useTranslation } from 'react-i18next'
import { isMobile } from 'react-device-detect'

import { ReactComponent as Spinner } from '../../assets/images/spinner.svg'
import { getNetworkName } from '../../utils'

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

function tryToSetConnector(setConnector, setError) {
  setConnector('Injected', { suppressAndThrowErrors: true }).catch(error => {
    if (error.code === Connector.errorCodes.UNSUPPORTED_NETWORK) {
      setError(error, { connectorName: 'Injected' })
    } else {
      setConnector('Network')
    }
  })
}

export default function Web3ReactManager({ children }) {
  const { t } = useTranslation()
  const { active, error, setConnector, setError } = useWeb3Context()

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
      const correctNetwork = getNetworkName(Number(process.env.REACT_APP_NETWORK_ID))
      return <Message>{`${t('wrongNetwork')}. ${t('switchNetwork', { correctNetwork })}`}</Message>
    } else {
      return <Message>{t('unknownError')}</Message>
    }
  } else if (!active) {
    return showLoader ? <PinkSpinner /> : null
  } else {
    return children
  }
}
