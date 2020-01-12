import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router'
import { createBrowserHistory } from 'history'
import { ethers } from 'ethers'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import ReactGA from 'react-ga'

import { useWeb3React, useFactoryContract } from '../../hooks'
import { Button } from '../../theme'
import AddressInputPanel from '../../components/AddressInputPanel'
import OversizedPanel from '../../components/OversizedPanel'
import { useTokenDetails } from '../../contexts/Tokens'
import { useTransactionAdder } from '../../contexts/Transactions'

const SummaryPanel = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  padding: 1rem 0;
`

const ExchangeRateWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  color: ${({ theme }) => theme.doveGray};
  font-size: 0.75rem;
  padding: 0.25rem 1rem 0;
`

const ExchangeRate = styled.span`
  flex: 1 1 auto;
  width: 0;
  color: ${({ theme }) => theme.doveGray};
`

const CreateExchangeWrapper = styled.div`
  color: ${({ theme }) => theme.doveGray};
  text-align: center;
  margin-top: 1rem;
  padding-top: 1rem;
`

const SummaryText = styled.div`
  font-size: 0.75rem;
  color: ${({ error, theme }) => error && theme.salmonRed};
`

const Flex = styled.div`
  display: flex;
  justify-content: center;
  padding: 2rem;

  button {
    max-width: 20rem;
  }
`

function CreateExchange({ location, params }) {
  const { t } = useTranslation()
  const { account } = useWeb3React()

  const factory = useFactoryContract()

  const [tokenAddress, setTokenAddress] = useState({
    address: params.tokenAddress ? params.tokenAddress : '',
    name: ''
  })
  const [tokenAddressError, setTokenAddressError] = useState()

  const { name, symbol, decimals, exchangeAddress } = useTokenDetails(tokenAddress.address)
  const addTransaction = useTransactionAdder()

  // clear url of query
  useEffect(() => {
    const history = createBrowserHistory()
    history.push(window.location.pathname + '')
  }, [])

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
        category: 'Transaction',
        action: 'Create Exchange'
      })

      addTransaction(response)
    })
  }

  const isValid = errorMessage === null

  return (
    <>
      <AddressInputPanel
        title={t('tokenAddress')}
        initialInput={
          params.tokenAddress
            ? { address: params.tokenAddress }
            : { address: (location.state && location.state.tokenAddress) || '' }
        }
        onChange={setTokenAddress}
        onError={setTokenAddressError}
      />
      <OversizedPanel hideBottom>
        <SummaryPanel>
          <ExchangeRateWrapper>
            <ExchangeRate>{t('name')}</ExchangeRate>
            <span>{name ? name : ' - '}</span>
          </ExchangeRateWrapper>
          <ExchangeRateWrapper>
            <ExchangeRate>{t('symbol')}</ExchangeRate>
            <span>{symbol ? symbol : ' - '}</span>
          </ExchangeRateWrapper>
          <ExchangeRateWrapper>
            <ExchangeRate>{t('decimals')}</ExchangeRate>
            <span>{decimals || decimals === 0 ? decimals : ' - '}</span>
          </ExchangeRateWrapper>
        </SummaryPanel>
      </OversizedPanel>
      <CreateExchangeWrapper>
        <SummaryText>{errorMessage ? errorMessage : t('enterTokenCont')}</SummaryText>
      </CreateExchangeWrapper>
      <Flex>
        <Button disabled={!isValid} onClick={createExchange}>
          {t('createExchange')}
        </Button>
      </Flex>
    </>
  )
}

export default withRouter(CreateExchange)
