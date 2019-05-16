import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router'
import { useWeb3Context } from 'web3-react'
import { ethers } from 'ethers'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import ReactGA from 'react-ga'

import AddressInputPanel from '../../components/AddressInputPanel'
import OversizedPanel from '../../components/OversizedPanel'
import { useFactoryContract } from '../../hooks'
import { useTokenDetails } from '../../contexts/Tokens'
import { useTransactionAdder } from '../../contexts/Transactions'

function CreateExchange({ history, location }) {
  const { t } = useTranslation()
  const { account } = useWeb3Context()
  const factory = useFactoryContract()

  const [tokenAddress, setTokenAddress] = useState({
    address: '',
    name: ''
  })
  const [tokenAddressError, setTokenAddressError] = useState()

  const { name, symbol, decimals, exchangeAddress } = useTokenDetails(tokenAddress.address)
  const addTransaction = useTransactionAdder()

  // clear location state, if it exists
  useEffect(() => {
    if (location.state) {
      history.replace(location.pathname)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // validate everything
  const [errorMessage, setErrorMessage] = useState(!account && t('noWallet'))
  useEffect(() => {
    if (tokenAddressError) {
      setErrorMessage(t('invalidTokenAddress'))
    } else if (symbol === undefined || decimals === undefined || exchangeAddress === undefined) {
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
  }, [tokenAddress.address, symbol, decimals, exchangeAddress, account, t, tokenAddressError])

  async function createExchange() {
    const estimatedGasLimit = await factory.estimate.createExchange(tokenAddress.address)

    factory.createExchange(tokenAddress.address, { gasLimit: estimatedGasLimit }).then(response => {
      ReactGA.event({
        category: 'Pool',
        action: 'CreateExchange'
      })

      addTransaction(response)
    })
  }

  const isValid = errorMessage === null

  return (
    <>
      <AddressInputPanel
        title={t('tokenAddress')}
        initialInput={(location.state && location.state.tokenAddress) || ''}
        onChange={setTokenAddress}
        onError={setTokenAddressError}
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
