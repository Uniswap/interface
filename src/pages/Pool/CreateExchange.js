import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router'
import { useWeb3Context } from 'web3-react'
import { ethers } from 'ethers'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import ReactGA from 'react-ga'

import AddressInputPanel from '../../components/AddressInputPanel'
import OversizedPanel from '../../components/OversizedPanel'
import { useTokenDetails } from '../../contexts/Static'
import { useTransactionContext } from '../../contexts/Transaction'
import { useFactoryContract } from '../../hooks'
import { isAddress } from '../../utils'

function CreateExchange({ history, location }) {
  const { t } = useTranslation()
  const { account } = useWeb3Context()
  const factory = useFactoryContract()

  const [tokenAddress, setTokenAddress] = useState((location.state && location.state.tokenAddress) || '')
  const { name, symbol, decimals, exchangeAddress } = useTokenDetails(tokenAddress)
  const { addTransaction } = useTransactionContext()

  // clear location state, if it exists
  useEffect(() => {
    if (location.state) {
      history.replace(location.pathname)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // validate everything
  const [errorMessage, setErrorMessage] = useState(!account && t('noWallet'))
  useEffect(() => {
    if (tokenAddress && !isAddress(tokenAddress)) {
      setErrorMessage(t('invalidTokenAddress'))
    } else if (!tokenAddress || symbol === undefined || decimals === undefined || exchangeAddress === undefined) {
      setErrorMessage()
    } else if (symbol === null) {
      setErrorMessage(t('invalidSymbol'))
    } else if (decimals === null) {
      setErrorMessage(t('invalidDecimals'))
    } else if (exchangeAddress !== ethers.constants.AddressZero) {
      setErrorMessage(t('exchangeExists'))
    } else if (!account) {
      setErrorMessage(t('noWallet'))
    } else {
      setErrorMessage(null)
    }

    return () => {
      setErrorMessage()
    }
  }, [tokenAddress, symbol, decimals, exchangeAddress, account, t])

  async function createExchange() {
    const estimatedGasLimit = await factory.estimate.createExchange(tokenAddress)

    factory.createExchange(tokenAddress, { gasLimit: estimatedGasLimit }).then(response => {
      addTransaction(response.hash, response)
      ReactGA.event({
        category: 'Pool',
        action: 'CreateExchange'
      })
    })
  }

  const isValid = errorMessage === null

  return (
    <>
      <AddressInputPanel
        title={t('tokenAddress')}
        value={tokenAddress}
        onChange={input => {
          setTokenAddress(input)
        }}
        errorMessage={errorMessage === t('noWallet') ? '' : errorMessage}
      />
      <OversizedPanel hideBottom>
        <div className="pool__summary-panel">
          <div className="pool__exchange-rate-wrapper">
            <span className="pool__exchange-rate">{t('name')}</span>
            <span>{name ? name : ' - '}</span>
          </div>
          <div className="pool__exchange-rate-wrapper">
            <span className="pool__exchange-rate">{t('symbol')}</span>
            <span>{symbol ? symbol : ' - '}</span>
          </div>
          <div className="pool__exchange-rate-wrapper">
            <span className="swap__exchange-rate">{t('decimals')}</span>
            <span>{decimals || decimals === 0 ? decimals : ' - '}</span>
          </div>
        </div>
      </OversizedPanel>
      <div className="create-exchange__summary-panel">
        <div
          className={classnames('create-exchange__summary-text', {
            'create-exchange--error': !!errorMessage
          })}
        >
          {errorMessage ? errorMessage : t('enterTokenCont')}
        </div>
      </div>
      <div className="pool__cta-container">
        <button className="pool__cta-btn" disabled={!isValid} onClick={createExchange}>
          {t('createExchange')}
        </button>
      </div>
    </>
  )
}

export default withRouter(CreateExchange)
