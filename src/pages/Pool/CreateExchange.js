import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { ethers } from 'ethers'
import classnames from 'classnames'
import { withRouter } from 'react-router'
import { useTranslation } from 'react-i18next'
import ReactGA from 'react-ga'
import { useWeb3Context } from 'web3-react'

import { addPendingTx } from '../../ducks/web3connect'
import AddressInputPanel from '../../components/AddressInputPanel'
import OversizedPanel from '../../components/OversizedPanel'
import { addExchange } from '../../ducks/addresses'
import { useSignerOrProvider, useFactoryContract } from '../../hooks'
import { isAddress, getTokenDetails, getExchangeDetails, errorCodes } from '../../utils'

function CreateExchange({ history, location, addExchange, addPendingTx }) {
  const { t } = useTranslation()
  const context = useWeb3Context()
  const signerOrProvider = useSignerOrProvider()
  const factory = useFactoryContract()

  const [tokenAddress, setTokenAddress] = useState(location.state && location.state.tokenAddress)
  const [errorMessage, _setErrorMessage] = useState(context.account ? undefined : t('noWallet'))
  const [tokenDetails, setTokenDetails] = useState()

  // wrap _setErrorMessage to ensure an account is in context
  function setErrorMessage(value) {
    if (value) {
      _setErrorMessage(value)
    } else if (!context.account) {
      _setErrorMessage(t('noWallet'))
    } else {
      _setErrorMessage()
    }
  }

  // clear state, if it exists
  useEffect(() => {
    if (location.state) {
      history.replace(location.pathname)
    }
  }, [])

  // handle changes to tokenAddress
  useEffect(() => {
    let stale = false

    // happy path
    if (isAddress(tokenAddress)) {
      const tokenDetailsPromise = getTokenDetails(tokenAddress, signerOrProvider)
      const exchangeDetailsPromise = getExchangeDetails(context.networkId, tokenAddress, signerOrProvider)

      Promise.all([tokenDetailsPromise, exchangeDetailsPromise])
        .then(([tokenDetails, exchangeDetails]) => {
          if (!stale) {
            if (exchangeDetails.exchangeAddress !== ethers.constants.AddressZero) {
              addExchange({
                tokenAddress,
                label: tokenDetails.symbol,
                exchangeAddress: exchangeDetails.exchangeAddress
              })
              setErrorMessage(t('exchangeExists', { tokenAddress }))
            }
            setTokenDetails(tokenDetails)
          }
        })
        .catch(error => {
          if (!stale) {
            if (error.code === errorCodes.TOKEN_DETAILS_DECIMALS) {
              setErrorMessage(t('invalidDecimals'))
            } else if (error.code === errorCodes.TOKEN_DETAILS_SYMBOL) {
              setErrorMessage(t('invalidSymbol'))
            } else {
              setErrorMessage(t('invalidTokenAddress'))
            }
          }
        })
    }
    // is tokenAddress is empty, there's no error
    else if (tokenAddress === undefined || tokenAddress === '') {
      setErrorMessage()
    }
    // tokenAddress is not a proper address
    else {
      setErrorMessage(t('invalidTokenAddress'))
    }

    return () => {
      stale = true
      setErrorMessage()
      setTokenDetails()
    }
  }, [tokenAddress, signerOrProvider, context.networkId])

  async function createExchange() {
    const estimatedGasLimit = await factory.estimate.createExchange(tokenAddress)

    factory.createExchange(tokenAddress, { gasLimit: estimatedGasLimit }).then(details => {
      addPendingTx(details.hash)
      setErrorMessage()
      setTokenAddress()
      ReactGA.event({
        category: 'Pool',
        action: 'CreateExchange'
      })
    })
  }

  const isValid = isAddress(tokenAddress) && !errorMessage && tokenDetails && tokenDetails.tokenAddress === tokenAddress

  return (
    <>
      <AddressInputPanel
        title={t('tokenAddress')}
        value={tokenAddress}
        onChange={input => setTokenAddress(input)}
        errorMessage={errorMessage === t('noWallet') ? '' : errorMessage}
      />
      <OversizedPanel hideBottom>
        <div className="pool__summary-panel">
          <div className="pool__exchange-rate-wrapper">
            <span className="pool__exchange-rate">{t('symbol')}</span>
            <span>{tokenDetails ? tokenDetails.symbol : ' - '}</span>
          </div>
          <div className="pool__exchange-rate-wrapper">
            <span className="swap__exchange-rate">{t('decimals')}</span>
            <span>{tokenDetails ? tokenDetails.decimals : ' - '}</span>
          </div>
        </div>
      </OversizedPanel>
      <div className="create-exchange__summary-panel">
        <div
          className={classnames('create-exchange__summary-text', {
            'create-exchange--error': !!errorMessage
          })}
        >
          {!!errorMessage ? errorMessage : t('enterTokenCont')}
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

export default withRouter(
  connect(
    undefined,
    dispatch => ({
      addExchange: opts => dispatch(addExchange(opts)),
      addPendingTx: id => dispatch(addPendingTx(id))
    })
  )(CreateExchange)
)
