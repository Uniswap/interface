import React, { useState, useEffect, useCallback } from 'react'
import classnames from 'classnames'
import { useTranslation } from 'react-i18next'
import ReactGA from 'react-ga'
import { useWeb3Context } from 'web3-react'
import { ethers } from 'ethers'

import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import ContextualInfo from '../../components/ContextualInfo'
import OversizedPanel from '../../components/OversizedPanel'
import ArrowDownBlue from '../../assets/images/arrow-down-blue.svg'
import ArrowDownGrey from '../../assets/images/arrow-down-grey.svg'
import { useExchangeContract } from '../../hooks'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useTokenDetails } from '../../contexts/Tokens'
import { useAddressBalance } from '../../contexts/Balances'
import { calculateGasMargin, amountFormatter } from '../../utils'

// denominated in bips
const ALLOWED_SLIPPAGE = ethers.utils.bigNumberify(200)

// denominated in seconds
const DEADLINE_FROM_NOW = 60 * 15

// denominated in bips
const GAS_MARGIN = ethers.utils.bigNumberify(1000)

function getExchangeRate(inputValue, inputDecimals, outputValue, outputDecimals, invert = false) {
  try {
    if (
      inputValue &&
      (inputDecimals || inputDecimals === 0) &&
      outputValue &&
      (outputDecimals || outputDecimals === 0)
    ) {
      const factor = ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18))

      if (invert) {
        return inputValue
          .mul(factor)
          .div(outputValue)
          .mul(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(outputDecimals)))
          .div(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(inputDecimals)))
      } else {
        return outputValue
          .mul(factor)
          .div(inputValue)
          .mul(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(inputDecimals)))
          .div(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(outputDecimals)))
      }
    }
  } catch {}
}

function getMarketRate(reserveETH, reserveToken, decimals, invert = false) {
  return getExchangeRate(reserveETH, 18, reserveToken, decimals, invert)
}

function calculateSlippageBounds(value) {
  if (value) {
    const offset = value.mul(ALLOWED_SLIPPAGE).div(ethers.utils.bigNumberify(10000))
    const minimum = value.sub(offset)
    const maximum = value.add(offset)
    return {
      minimum: minimum.lt(ethers.constants.Zero) ? ethers.constants.Zero : minimum,
      maximum: maximum.gt(ethers.constants.MaxUint256) ? ethers.constants.MaxUint256 : maximum
    }
  } else {
    return {}
  }
}

export default function RemoveLiquidity() {
  const { library, account, active } = useWeb3Context()
  const { t } = useTranslation()

  const addTransaction = useTransactionAdder()

  const [outputCurrency, setOutputCurrency] = useState('')
  const [value, setValue] = useState('')
  const [inputError, setInputError] = useState()
  const [valueParsed, setValueParsed] = useState()
  // parse value
  useEffect(() => {
    try {
      const parsedValue = ethers.utils.parseUnits(value, 18)
      setValueParsed(parsedValue)
    } catch {
      if (value !== '') {
        setInputError(t('inputNotValid'))
      }
    }

    return () => {
      setInputError()
      setValueParsed()
    }
  }, [t, value])

  const { symbol, decimals, exchangeAddress } = useTokenDetails(outputCurrency)

  const [totalPoolTokens, setTotalPoolTokens] = useState()
  const poolTokenBalance = useAddressBalance(account, exchangeAddress)
  const exchangeETHBalance = useAddressBalance(exchangeAddress, 'ETH')
  const exchangeTokenBalance = useAddressBalance(exchangeAddress, outputCurrency)

  // input validation
  useEffect(() => {
    if (valueParsed && poolTokenBalance) {
      if (valueParsed.gt(poolTokenBalance)) {
        setInputError(t('insufficientBalance'))
      } else {
        setInputError(null)
      }
    }
  }, [poolTokenBalance, t, valueParsed])

  const exchange = useExchangeContract(exchangeAddress)

  const ownershipPercentage =
    poolTokenBalance && totalPoolTokens && !totalPoolTokens.isZero()
      ? poolTokenBalance.mul(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18))).div(totalPoolTokens)
      : undefined
  const ownershipPercentageFormatted = ownershipPercentage && amountFormatter(ownershipPercentage, 16, 4)

  const ETHOwnShare =
    exchangeETHBalance &&
    ownershipPercentage &&
    exchangeETHBalance.mul(ownershipPercentage).div(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18)))
  const TokenOwnShare =
    exchangeTokenBalance &&
    ownershipPercentage &&
    exchangeTokenBalance.mul(ownershipPercentage).div(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18)))

  const ETHPer =
    exchangeETHBalance && totalPoolTokens && !totalPoolTokens.isZero()
      ? exchangeETHBalance.mul(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18))).div(totalPoolTokens)
      : undefined
  const tokenPer =
    exchangeTokenBalance && totalPoolTokens && !totalPoolTokens.isZero()
      ? exchangeTokenBalance.mul(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18))).div(totalPoolTokens)
      : undefined

  const ethWithdrawn =
    ETHPer &&
    valueParsed &&
    ETHPer.mul(valueParsed).div(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18)))
  const tokenWithdrawn =
    tokenPer &&
    valueParsed &&
    tokenPer.mul(valueParsed).div(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18)))

  const ethWithdrawnMin = ethWithdrawn ? calculateSlippageBounds(ethWithdrawn).minimum : undefined
  const tokenWithdrawnMin = tokenWithdrawn ? calculateSlippageBounds(tokenWithdrawn).minimum : undefined

  const fetchPoolTokens = useCallback(() => {
    if (exchange) {
      exchange.totalSupply().then(totalSupply => {
        setTotalPoolTokens(totalSupply)
      })
    }
  }, [exchange])
  useEffect(() => {
    fetchPoolTokens()
    library.on('block', fetchPoolTokens)

    return () => {
      library.removeListener('block', fetchPoolTokens)
    }
  }, [fetchPoolTokens, library])

  async function onRemoveLiquidity() {
    ReactGA.event({
      category: 'Pool',
      action: 'RemoveLiquidity'
    })

    const deadline = Math.ceil(Date.now() / 1000) + DEADLINE_FROM_NOW

    const estimatedGasLimit = await exchange.estimate.removeLiquidity(
      valueParsed,
      ethWithdrawnMin,
      tokenWithdrawnMin,
      deadline
    )

    exchange
      .removeLiquidity(valueParsed, ethWithdrawnMin, tokenWithdrawnMin, deadline, {
        gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
      })
      .then(response => {
        addTransaction(response)
      })
  }

  const b = text => <span className="swap__highlight-text">{text}</span>

  function renderTransactionDetails() {
    ReactGA.event({
      category: 'TransactionDetail',
      action: 'Open'
    })

    return (
      <div>
        <div className="pool__summary-modal__item">
          {t('youAreRemoving')} {b(`${amountFormatter(ethWithdrawnMin, 18, 4)} ETH`)} {t('and')}{' '}
          {b(`${amountFormatter(tokenWithdrawnMin, decimals, Math.min(decimals, 4))} ${symbol}`)} {t('outPool')}
        </div>
        <div className="pool__summary-modal__item">
          {t('youWillRemove')} {b(amountFormatter(valueParsed, 18, 4))} {t('liquidityTokens')}
        </div>
        <div className="pool__summary-modal__item">
          {t('totalSupplyIs')} {b(amountFormatter(totalPoolTokens, 18, 4))}
        </div>
        <div className="pool__summary-modal__item">
          {t('tokenWorth')} {b(amountFormatter(ETHPer, 18, 4))} ETH {t('and')}{' '}
          {b(amountFormatter(tokenPer, decimals, Math.min(4, decimals)))} {symbol}
        </div>
      </div>
    )
  }

  function renderSummary() {
    let contextualInfo = ''
    let isError = false

    if (inputError) {
      contextualInfo = inputError
      isError = true
    } else if (!outputCurrency || outputCurrency === 'ETH') {
      contextualInfo = t('selectTokenCont')
    } else if (!valueParsed) {
      contextualInfo = t('enterValueCont')
    } else if (!account) {
      contextualInfo = t('noWallet')
      isError = true
    }

    return (
      <ContextualInfo
        key="context-info"
        openDetailsText={t('transactionDetails')}
        closeDetailsText={t('hideDetails')}
        contextualInfo={contextualInfo}
        isError={isError}
        renderTransactionDetails={renderTransactionDetails}
      />
    )
  }

  function formatBalance(value) {
    return `Balance: ${value}`
  }

  const isActive = active && account
  const isValid = inputError === null

  const marketRate = getMarketRate(exchangeETHBalance, exchangeTokenBalance, decimals)

  return (
    <>
      <CurrencyInputPanel
        title={t('poolTokens')}
        extraText={poolTokenBalance && formatBalance(amountFormatter(poolTokenBalance, 18, 4))}
        extraTextClickHander={() => {
          if (poolTokenBalance) {
            const valueToSet = poolTokenBalance
            if (valueToSet.gt(ethers.constants.Zero)) {
              setValue(amountFormatter(valueToSet, 18, 18, false))
            }
          }
        }}
        onCurrencySelected={setOutputCurrency}
        onValueChange={setValue}
        value={value}
        errorMessage={inputError}
        selectedTokenAddress={outputCurrency}
      />
      <OversizedPanel>
        <div className="swap__down-arrow-background">
          <img className="swap__down-arrow" src={isValid ? ArrowDownBlue : ArrowDownGrey} alt="arrow" />
        </div>
      </OversizedPanel>
      <CurrencyInputPanel
        title={t('output')}
        description={ethWithdrawn && tokenWithdrawn ? `(${t('estimated')})` : ''}
        key="remove-liquidity-input"
        renderInput={() =>
          ethWithdrawn && tokenWithdrawn ? (
            <div className="remove-liquidity__output">
              <div className="remove-liquidity__output-text">{`${amountFormatter(
                ethWithdrawn,
                18,
                4,
                false
              )} ETH`}</div>
              <div className="remove-liquidity__output-plus"> + </div>
              <div className="remove-liquidity__output-text">{`${amountFormatter(
                tokenWithdrawn,
                decimals,
                Math.min(4, decimals)
              )} ${symbol}`}</div>
            </div>
          ) : (
            <div className="remove-liquidity__output" />
          )
        }
        disableTokenSelect
        disableUnlock
      />
      <OversizedPanel key="remove-liquidity-input-under" hideBottom>
        <div className="pool__summary-panel">
          <div className="pool__exchange-rate-wrapper">
            <span className="pool__exchange-rate">{t('exchangeRate')}</span>
            {marketRate ? <span>{`1 ETH = ${amountFormatter(marketRate, 18, 4)} ${symbol}`}</span> : ' - '}
          </div>
          <div className="pool__exchange-rate-wrapper">
            <span className="swap__exchange-rate">{t('currentPoolSize')}</span>
            {exchangeETHBalance && exchangeTokenBalance && decimals ? (
              <span>{`${amountFormatter(exchangeETHBalance, 18, 4)} ETH + ${amountFormatter(
                exchangeTokenBalance,
                decimals,
                Math.min(decimals, 4)
              )} ${symbol}`}</span>
            ) : (
              ' - '
            )}
          </div>
          <div className="pool__exchange-rate-wrapper">
            <span className="swap__exchange-rate">
              {t('yourPoolShare')} ({ownershipPercentageFormatted && ownershipPercentageFormatted}%)
            </span>
            {ETHOwnShare && TokenOwnShare ? (
              <span>
                {`${amountFormatter(ETHOwnShare, 18, 4)} ETH + ${amountFormatter(
                  TokenOwnShare,
                  decimals,
                  Math.min(decimals, 4)
                )} ${symbol}`}
              </span>
            ) : (
              ' - '
            )}
          </div>
        </div>
      </OversizedPanel>
      {renderSummary()}
      <div className="pool__cta-container">
        <button
          className={classnames('pool__cta-btn', {
            'pool__cta-btn--inactive': !isActive
          })}
          disabled={!isValid}
          onClick={onRemoveLiquidity}
        >
          {t('removeLiquidity')}
        </button>
      </div>
    </>
  )
}
