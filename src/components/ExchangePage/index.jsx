import React, { useEffect, useReducer, useState } from 'react'
import ReactGA from 'react-ga'
import { createBrowserHistory } from 'history'
import { ethers } from 'ethers'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { useExchangeContract, useWeb3React } from '../../hooks'
import { brokenTokens } from '../../constants'
import { amountFormatter, getProviderOrSigner, isAddress, MIN_DECIMALS, MIN_DECIMALS_EXCHANGE_RATE } from '../../utils'
import { DELEGATE_ADDRESS, DMG_ADDRESS, INITIAL_TOKENS_CONTEXT, useTokenDetails } from '../../contexts/Tokens'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useAddressBalance, useExchangeReserves } from '../../contexts/Balances'
import { useDolomiteOrderBooks } from '../../contexts/DolomiteOrderBooks'
import { useAddressAllowance } from '../../contexts/Allowances'
import { useWalletModalToggle } from '../../contexts/Application'

import { Button } from '../../theme'
import CurrencyInputPanel from '../CurrencyInputPanel'
import AddressInputPanel from '../AddressInputPanel'
import OversizedPanel from '../OversizedPanel'
import TransactionDetails from '../TransactionDetails'
import ArrowDown from '../../assets/svg/SVGArrowDown'
import WarningCard from '../WarningCard'
import { constructLoopringOrder, toDolomiteOrder } from '../../connectors/Loopring/LoopringOrderHelper'
import { exchange } from '../../connectors'
import { Zero } from 'ethers/constants'
import { getSignableData } from '../../connectors/Loopring/LoopringEIP712Schema'

const INPUT = 0
const OUTPUT = 1

const ETH_TO_TOKEN = 0
const TOKEN_TO_ETH = 1
const TOKEN_TO_TOKEN = 2

// denominated in bips
const ALLOWED_SLIPPAGE_DEFAULT = 50
const TOKEN_ALLOWED_SLIPPAGE_DEFAULT = 50

// 15 minutes, denominated in seconds
const DEFAULT_DEADLINE_FROM_NOW = 60 * 15

// % above the calculated gas cost that we actually send, denominated in bips
const GAS_MARGIN = ethers.utils.bigNumberify(1000)

const DownArrowBackground = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: center;
  align-items: center;
`

const WrappedArrowDown = ({ clickable, active, ...rest }) => <ArrowDown {...rest} />
const DownArrow = styled(WrappedArrowDown)`
  color: ${({ theme, active }) => (active ? theme.royalBlue : theme.chaliceGray)};
  width: 0.625rem;
  height: 0.625rem;
  position: relative;
  padding: 0.875rem;
  cursor: ${({ clickable }) => clickable && 'pointer'};
`

const ExchangeRateWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  color: ${({ theme }) => theme.doveGray};
  font-size: 0.75rem;
  padding: 0.5rem 1rem;
`

const ExchangeRate = styled.span`
  flex: 1 1 auto;
  width: 0;
  color: ${({ theme }) => theme.doveGray};
`

const Flex = styled.div`
  display: flex;
  justify-content: center;
  padding: 2rem;

  button {
    max-width: 20rem;
  }
`

function getSwapType(inputCurrency, outputCurrency) {
  if (!inputCurrency || !outputCurrency) {
    return null
  } else if (inputCurrency === 'ETH') {
    return ETH_TO_TOKEN
  } else if (outputCurrency === 'ETH') {
    return TOKEN_TO_ETH
  } else {
    return TOKEN_TO_TOKEN
  }
}

function calculateTokenOutputFromInput(inputAmount, books) {
  return calculateTokenValueFromOtherValue(inputAmount, books, false)
}

function calculateTokenInputFromOutput(outputAmount, books) {
  return calculateTokenValueFromOtherValue(outputAmount, books, true)
}

function calculateTokenValueFromOtherValue(valueAmount, books, isValueAmountOutputValue) {
  if (!books) {
    return ethers.constants.Zero
  } else {
    let fillAmount = ethers.constants.Zero
    let outputAmount = ethers.constants.Zero
    for (let i = 0; i < books.sellDepths.length; i++) {
      const tuple = books.sellDepths[i]
      const secondaryAmount = new ethers.utils.BigNumber(tuple.total.value.toLocaleString('fullwide', { useGrouping: false }))
      const primaryAmount = new ethers.utils.BigNumber(tuple.quantity.value.toLocaleString('fullwide', { useGrouping: false }))

      const tupleInputAmount = isValueAmountOutputValue ? primaryAmount : secondaryAmount
      const tupleOutputAmount = isValueAmountOutputValue ? secondaryAmount : primaryAmount

      if (fillAmount.add(tupleInputAmount).lt(valueAmount)) {
        fillAmount = fillAmount.add(tupleInputAmount)
        outputAmount = outputAmount.add(tupleOutputAmount)
      } else {
        const innerFillAmount = valueAmount.sub(fillAmount)
        fillAmount = fillAmount.add(innerFillAmount)

        const outputFillAmount = isValueAmountOutputValue ?
          innerFillAmount.mul(tupleOutputAmount).div(tupleInputAmount) :
          innerFillAmount.mul(tupleOutputAmount).div(tupleInputAmount)
        outputAmount = outputAmount.add(outputFillAmount)
        break
      }
    }
    return outputAmount
  }
}

function calculateSlippageBounds(value, token = false, tokenAllowedSlippage, allowedSlippage) {
  if (value) {
    const offset = value.mul(token ? tokenAllowedSlippage : allowedSlippage).div(ethers.utils.bigNumberify(10000))
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

function getInitialSwapState(state) {
  return {
    independentValue: state.exactFieldURL && state.exactAmountURL ? state.exactAmountURL : '', // this is a user input
    dependentValue: '', // this is a calculated number
    independentField: state.exactFieldURL === 'output' ? OUTPUT : INPUT,
    inputCurrency: state.inputCurrencyURL ? state.inputCurrencyURL : state.outputCurrencyURL === 'ETH' ? '' : 'ETH',
    outputCurrency: state.outputCurrencyURL
      ? state.outputCurrencyURL === 'ETH'
        ? !state.inputCurrencyURL || (state.inputCurrencyURL && state.inputCurrencyURL !== 'ETH')
          ? 'ETH'
          : ''
        : state.outputCurrencyURL
      : state.initialCurrency
        ? state.initialCurrency
        : ''
  }
}

function swapStateReducer(state, action) {
  switch (action.type) {
    case 'FLIP_INDEPENDENT': {
      const { independentField, inputCurrency, outputCurrency } = state
      return {
        ...state,
        dependentValue: '',
        independentField: independentField === INPUT ? OUTPUT : INPUT,
        inputCurrency: outputCurrency,
        outputCurrency: inputCurrency
      }
    }
    case 'SELECT_CURRENCY': {
      const { inputCurrency, outputCurrency } = state
      const { field, currency } = action.payload

      const newInputCurrency = field === INPUT ? currency : inputCurrency
      const newOutputCurrency = field === OUTPUT ? currency : outputCurrency

      if (newInputCurrency === newOutputCurrency) {
        return {
          ...state,
          inputCurrency: field === INPUT ? currency : '',
          outputCurrency: field === OUTPUT ? currency : ''
        }
      } else {
        return {
          ...state,
          inputCurrency: newInputCurrency,
          outputCurrency: newOutputCurrency
        }
      }
    }
    case 'UPDATE_INDEPENDENT': {
      const { field, value } = action.payload
      const { dependentValue, independentValue } = state
      return {
        ...state,
        independentValue: value,
        dependentValue: value === independentValue ? dependentValue : '',
        independentField: field
      }
    }
    case 'UPDATE_DEPENDENT': {
      return {
        ...state,
        dependentValue: action.payload
      }
    }
    default: {
      return getInitialSwapState()
    }
  }
}

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
          .mul(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(outputDecimals)))
          .div(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(inputDecimals)))
          .div(outputValue)
      } else {
        return outputValue
          .mul(factor)
          .mul(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(inputDecimals)))
          .div(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(outputDecimals)))
          .div(inputValue)
      }
    }
  } catch {
  }
}

function getMarketRate(
  swapType,
  inputReserveETH,
  inputReserveToken,
  inputDecimals,
  outputReserveETH,
  outputReserveToken,
  outputDecimals,
  invert = false
) {
  if (swapType === ETH_TO_TOKEN) {
    return getExchangeRate(outputReserveETH, 18, outputReserveToken, outputDecimals, invert)
  } else if (swapType === TOKEN_TO_ETH) {
    return getExchangeRate(inputReserveToken, inputDecimals, inputReserveETH, 18, invert)
  } else if (swapType === TOKEN_TO_TOKEN) {
    const factor = ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18))
    const firstRate = getExchangeRate(inputReserveToken, inputDecimals, inputReserveETH, 18)
    const secondRate = getExchangeRate(outputReserveETH, 18, outputReserveToken, outputDecimals)
    try {
      return !!(firstRate && secondRate) ? firstRate.mul(secondRate).div(factor) : undefined
    } catch {
    }
  }
}

export default function ExchangePage({ initialCurrency, sending = false, params }) {
  const { t } = useTranslation()
  const { library, account, chainId, error } = useWeb3React()

  const urlAddedTokens = {}
  if (params.inputCurrency) {
    urlAddedTokens[params.inputCurrency] = false
  }
  if (params.outputCurrency) {
    urlAddedTokens[params.outputCurrency] = false
  }
  if (isAddress(initialCurrency)) {
    urlAddedTokens[initialCurrency] = true
  }

  const addTransaction = useTransactionAdder()

  // check if URL specifies valid slippage, if so use as default
  const initialSlippage = (token = false) => {
    let slippage = Number.parseInt(params.slippage)
    if (!isNaN(slippage) && (slippage === 0 || slippage >= 1)) {
      return slippage // round to match custom input availability
    }
    // check for token <-> token slippage option
    return token ? TOKEN_ALLOWED_SLIPPAGE_DEFAULT : ALLOWED_SLIPPAGE_DEFAULT
  }

  // check URL params for recipient, only on send page
  const initialRecipient = () => {
    if (sending && params.recipient) {
      return params.recipient
    }
    return ''
  }

  const [brokenTokenWarning, setBrokenTokenWarning] = useState()

  const [deadlineFromNow, setDeadlineFromNow] = useState(DEFAULT_DEADLINE_FROM_NOW)

  const [rawSlippage, setRawSlippage] = useState(() => initialSlippage())
  const [rawTokenSlippage, setRawTokenSlippage] = useState(() => initialSlippage(true))

  const allowedSlippageBig = ethers.utils.bigNumberify(rawSlippage)
  const tokenAllowedSlippageBig = ethers.utils.bigNumberify(rawTokenSlippage)

  // analytics
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }, [])

  // core swap state
  const [swapState, dispatchSwapState] = useReducer(
    swapStateReducer,
    {
      initialCurrency: initialCurrency,
      inputCurrencyURL: params.inputCurrency,
      outputCurrencyURL: params.outputCurrency,
      exactFieldURL: params.exactField,
      exactAmountURL: params.exactAmount
    },
    getInitialSwapState
  )

  const { independentValue, dependentValue, independentField, inputCurrency, outputCurrency } = swapState

  useEffect(() => {
    setBrokenTokenWarning(false)
    for (let i = 0; i < brokenTokens.length; i++) {
      if (
        brokenTokens[i].toLowerCase() === outputCurrency.toLowerCase() ||
        brokenTokens[i].toLowerCase() === inputCurrency.toLowerCase()
      ) {
        setBrokenTokenWarning(true)
      }
    }
  }, [outputCurrency, inputCurrency])

  const [recipient, setRecipient] = useState({
    address: initialRecipient(),
    name: ''
  })
  const [recipientError, setRecipientError] = useState()

  // get swap type from the currency types
  const swapType = getSwapType(inputCurrency, outputCurrency)

  // get decimals and exchange address for each of the currency types
  const { symbol: inputSymbol, decimals: inputDecimals, exchangeAddress: inputExchangeAddress } = useTokenDetails(
    inputCurrency
  )
  const { symbol: outputSymbol, decimals: outputDecimals, exchangeAddress: outputExchangeAddress } = useTokenDetails(
    outputCurrency
  )

  const inputExchangeContract = useExchangeContract(inputExchangeAddress)
  const outputExchangeContract = useExchangeContract(outputExchangeAddress)
  const contract = swapType === ETH_TO_TOKEN ? outputExchangeContract : inputExchangeContract

  // get input allowance
  const inputAllowance = useAddressAllowance(account, inputCurrency, DELEGATE_ADDRESS)

  // fetch reserves for each of the currency types
  const primarySymbol = INITIAL_TOKENS_CONTEXT['1'][DMG_ADDRESS].symbol
  const secondarySymbol = INITIAL_TOKENS_CONTEXT['1'][inputCurrency].symbol
  const orderBooks = useDolomiteOrderBooks(primarySymbol, secondarySymbol)
  const { reserveETH: inputReserveETH, reserveToken: inputReserveToken } = useExchangeReserves(inputCurrency)
  const { reserveETH: outputReserveETH, reserveToken: outputReserveToken } = useExchangeReserves(outputCurrency)

  // get balances for each of the currency types
  const inputBalance = useAddressBalance(account, inputCurrency)
  const outputBalance = useAddressBalance(account, outputCurrency)
  const inputBalanceFormatted = !!(inputBalance && Number.isInteger(inputDecimals))
    ? amountFormatter(inputBalance, inputDecimals, Math.min(MIN_DECIMALS, inputDecimals))
    : ''
  const outputBalanceFormatted = !!(outputBalance && Number.isInteger(outputDecimals))
    ? amountFormatter(outputBalance, outputDecimals, Math.min(MIN_DECIMALS, outputDecimals))
    : ''

  // compute useful transforms of the data above
  const independentDecimals = independentField === INPUT ? inputDecimals : outputDecimals
  const dependentDecimals = independentField === OUTPUT ? inputDecimals : outputDecimals

  // declare/get parsed and formatted versions of input/output values
  const [independentValueParsed, setIndependentValueParsed] = useState()
  const dependentValueFormatted = !!(dependentValue && (dependentDecimals || dependentDecimals === 0))
    ? amountFormatter(dependentValue, dependentDecimals, Math.min(MIN_DECIMALS, dependentDecimals), false)
    : ''
  const inputValueParsed = independentField === INPUT ? independentValueParsed : dependentValue
  const inputValueFormatted = independentField === INPUT ? independentValue : dependentValueFormatted
  const outputValueParsed = independentField === OUTPUT ? independentValueParsed : dependentValue
  const outputValueFormatted = independentField === OUTPUT ? independentValue : dependentValueFormatted

  // validate + parse independent value
  const [independentError, setIndependentError] = useState()
  useEffect(() => {
    if (independentValue && (independentDecimals || independentDecimals === 0)) {
      try {
        const parsedValue = ethers.utils.parseUnits(independentValue, independentDecimals)

        if (parsedValue.lte(ethers.constants.Zero) || parsedValue.gte(ethers.constants.MaxUint256)) {
          throw Error()
        } else {
          setIndependentValueParsed(parsedValue)
          setIndependentError(null)
        }
      } catch {
        setIndependentError(t('inputNotValid'))
      }

      return () => {
        setIndependentValueParsed()
        setIndependentError()
      }
    }
  }, [independentValue, independentDecimals, t])

  // // calculate slippage from target rate
  const { minimum: dependentValueMinimum, maximum: dependentValueMaximum } = calculateSlippageBounds(
    dependentValue,
    swapType === TOKEN_TO_TOKEN,
    tokenAllowedSlippageBig,
    allowedSlippageBig
  )


  // validate input allowance + balance
  const [inputError, setInputError] = useState()
  const [showUnlock, setShowUnlock] = useState(false)
  useEffect(() => {
    const inputValueCalculation = independentField === INPUT ? independentValueParsed : dependentValueMaximum
    if (inputBalance && (inputAllowance || inputCurrency === 'ETH') && inputValueCalculation) {
      if (inputBalance.lt(inputValueCalculation)) {
        setInputError(t('insufficientBalance'))
      } else if (inputCurrency !== 'ETH' && inputAllowance.lt(inputValueCalculation)) {
        setInputError(t('unlockTokenCont'))
        setShowUnlock(true)
      } else {
        setInputError(null)
        setShowUnlock(false)
      }
      return () => {
        setInputError()
        setShowUnlock(false)
      }
    }
  }, [independentField, independentValueParsed, dependentValueMaximum, inputBalance, inputCurrency, inputAllowance, t])

  // calculate dependent value
  useEffect(() => {
    const amount = independentValueParsed

    if (amount) {
      try {
        if (independentField === INPUT) {
          const calculatedDependentValue = calculateTokenOutputFromInput(amount, orderBooks)
          if (calculatedDependentValue.lte(ethers.constants.Zero)) {
            throw Error()
          }
          dispatchSwapState({
            type: 'UPDATE_DEPENDENT',
            payload: calculatedDependentValue
          })
        } else {
          const calculatedDependentValue = calculateTokenInputFromOutput(amount, orderBooks)
          if (calculatedDependentValue.lte(ethers.constants.Zero)) {
            throw Error()
          }
          dispatchSwapState({
            type: 'UPDATE_DEPENDENT',
            payload: calculatedDependentValue
          })
        }
      } catch (error) {
        setIndependentError(t('orderBooksLoading'))
      }
      return () => {
        dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: '' })
      }
    }
  }, [
    independentValueParsed,
    swapType,
    orderBooks,
    independentField,
    t
  ])

  useEffect(() => {
    const history = createBrowserHistory()
    history.push(window.location.pathname + '')
  }, [])

  const [inverted, setInverted] = useState(false)
  const exchangeRate = getExchangeRate(inputValueParsed, inputDecimals, outputValueParsed, outputDecimals)
  const exchangeRateInverted = getExchangeRate(inputValueParsed, inputDecimals, outputValueParsed, outputDecimals, true)

  const marketRate = getMarketRate(
    swapType,
    inputReserveETH,
    inputReserveToken,
    inputDecimals,
    outputReserveETH,
    outputReserveToken,
    outputDecimals
  )

  const percentSlippage =
    exchangeRate && marketRate && !marketRate.isZero()
      ? exchangeRate
        .sub(marketRate)
        .abs()
        .mul(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18)))
        .div(marketRate)
        .sub(ethers.utils.bigNumberify(3).mul(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(15))))
      : undefined
  const percentSlippageFormatted = percentSlippage && amountFormatter(percentSlippage, 16, 2)
  const slippageWarning =
    percentSlippage &&
    percentSlippage.gte(ethers.utils.parseEther('.05')) &&
    percentSlippage.lt(ethers.utils.parseEther('.2')) // [5% - 20%)
  const highSlippageWarning = percentSlippage && percentSlippage.gte(ethers.utils.parseEther('.2')) // [20+%

  const isValid = sending
    ? exchangeRate && inputError === null && independentError === null && recipientError === null && deadlineFromNow
    : exchangeRate && inputError === null && independentError === null && deadlineFromNow

  const estimatedText = `(${t('estimated')})`

  function formatBalance(value) {
    return `Balance: ${value}`
  }

  async function onSwap() {
    let loopringOrder, value

    let dependentValueStandardized
    let independentValueParsedStandardized
    if (independentField === INPUT) {
      // tokenS == SECONDARY
      const independentPriceDecimals = INITIAL_TOKENS_CONTEXT['1'][inputCurrency].priceDecimals
      const independentDecimals = INITIAL_TOKENS_CONTEXT['1'][inputCurrency].decimals
      const independentDecimalsPriceFactor = new ethers.utils.BigNumber(10).pow(independentDecimals - independentPriceDecimals)

      // tokenB == PRIMARY
      const dependentPriceDecimals = 8 - independentPriceDecimals
      const dependentDecimals = INITIAL_TOKENS_CONTEXT['1'][DMG_ADDRESS].decimals
      const dependentDecimalsFactor = new ethers.utils.BigNumber(10).pow(dependentDecimals)
      const dependentTruncationDecimalsFactor = new ethers.utils.BigNumber(10).pow(dependentDecimals - dependentPriceDecimals)

      dependentValueStandardized = dependentValue.div(dependentTruncationDecimalsFactor).mul(dependentTruncationDecimalsFactor)

      const priceWithPremiumStandardized = independentValueParsed.mul(dependentDecimalsFactor).div(dependentValueStandardized) // get price
        .mul(11).div(10) // premium
        .div(independentDecimalsPriceFactor).mul(independentDecimalsPriceFactor) // standardized

      independentValueParsedStandardized = priceWithPremiumStandardized.mul(dependentValueStandardized).div(dependentDecimalsFactor)

      loopringOrder = constructLoopringOrder(
        library,
        {
          primaryToken: DMG_ADDRESS,
          owner: account,
          tokenB: DMG_ADDRESS,
          tokenS: inputCurrency,
          amountB: dependentValueStandardized.toHexString(),
          amountS: independentValueParsedStandardized.toHexString(),
          feeAmount: Zero,
          validUntil: null,
          transferDataS: null,
          broker: null,
          tokenRecipient: account,
        }
      )
    } else if (independentField === OUTPUT) {
      // tokenS == SECONDARY == DEPENDENT
      const dependentPriceDecimals = INITIAL_TOKENS_CONTEXT['1'][inputCurrency].priceDecimals
      const dependentDecimals = INITIAL_TOKENS_CONTEXT['1'][inputCurrency].decimals
      const dependentDecimalsPriceFactor = new ethers.utils.BigNumber(10).pow(dependentDecimals - dependentPriceDecimals)
      const dependentDecimalsFactor = new ethers.utils.BigNumber(10).pow(dependentDecimals)

      // tokenB == PRIMARY == INDEPENDENT
      const independentPriceDecimals = 8 - dependentPriceDecimals
      const independentDecimals = INITIAL_TOKENS_CONTEXT['1'][DMG_ADDRESS].decimals
      const independentDecimalsFactor = new ethers.utils.BigNumber(10).pow(independentDecimals)
      const independentPriceDecimalsFactor = new ethers.utils.BigNumber(10).pow(independentDecimals - independentPriceDecimals)

      independentValueParsedStandardized = independentValueParsed.div(independentPriceDecimalsFactor).mul(independentPriceDecimalsFactor)

      const priceWithPremiumStandardized = dependentValue.mul(dependentDecimalsFactor).div(independentValueParsedStandardized) // get price
        .mul(11).div(10) // premium
        .div(dependentDecimalsPriceFactor).mul(dependentDecimalsPriceFactor) // standardized

      dependentValueStandardized = priceWithPremiumStandardized.mul(independentValueParsedStandardized).div(independentDecimalsFactor)

      loopringOrder = constructLoopringOrder(
        library,
        {
          primaryToken: DMG_ADDRESS,
          owner: account,
          tokenS: inputCurrency,
          tokenB: DMG_ADDRESS,
          amountB: independentValueParsedStandardized.toHexString(),
          amountS: dependentValueStandardized.toHexString(),
          feeAmount: Zero,
          validUntil: null,
          transferDataS: null,
          broker: null,
          tokenRecipient: account,
        }
      )
    }

    const signableData = getSignableData(loopringOrder)
    const signer = getProviderOrSigner(library, account)

    let signaturePromise
    if (typeof signer.signTypedMessage === 'function') {
      signaturePromise = signer.signTypedMessage(signableData)
    } else {
      signaturePromise = new Promise((respond, reject) => {
        library.provider.sendAsync({
          method: 'eth_signTypedData',
          params: [account, JSON.stringify(signableData)],
          from: account
        }, function(err, result) {
          if (err || result.error) reject(err || result.error.message)
          else respond(result.result)
        })
      })
    }

    signaturePromise
      .then(signature => {
        const data = {
          orderType: 'MARKET',
          tokenB: loopringOrder.tokenB,
          tokenS: loopringOrder.tokenS,
          side: 'BUY',
          estimatedNumberOfFills: 16,
          constantNetworkFeePremium: 0,
          perMatchNetworkFee: 0,
        }
        const dolomiteOrder = toDolomiteOrder(
          loopringOrder,
          signature,
          data,
        )
        exchange.orders.createOrder(dolomiteOrder)
      })
      .then(response => {
        // TODO - log events
        console.log('response ', response)
      })
      .catch(error => {
        console.error('Could not submit order due to error ', error)
      })
  }

  const [customSlippageError, setcustomSlippageError] = useState('')

  const toggleWalletModal = useWalletModalToggle()

  const newInputDetected =
    inputCurrency !== 'ETH' && inputCurrency && !INITIAL_TOKENS_CONTEXT[chainId].hasOwnProperty(inputCurrency)

  const newOutputDetected =
    outputCurrency !== 'ETH' && outputCurrency && !INITIAL_TOKENS_CONTEXT[chainId].hasOwnProperty(outputCurrency)

  const [showInputWarning, setShowInputWarning] = useState(false)
  const [showOutputWarning, setShowOutputWarning] = useState(false)

  useEffect(() => {
    if (newInputDetected) {
      setShowInputWarning(false)
    } else {
      setShowInputWarning(false)
    }
  }, [newInputDetected, setShowInputWarning])

  useEffect(() => {
    if (newOutputDetected) {
      setShowOutputWarning(false)
    } else {
      setShowOutputWarning(false)
    }
  }, [newOutputDetected, setShowOutputWarning])

  return (
    <>
      {showInputWarning && (
        <WarningCard
          onDismiss={() => {
            setShowInputWarning(false)
          }}
          urlAddedTokens={urlAddedTokens}
          currency={inputCurrency}
        />
      )}
      {showOutputWarning && (
        <WarningCard
          onDismiss={() => {
            setShowOutputWarning(false)
          }}
          urlAddedTokens={urlAddedTokens}
          currency={outputCurrency}
        />
      )}
      <CurrencyInputPanel
        title={t('input')}
        urlAddedTokens={urlAddedTokens}
        description={''}
        extraText={inputBalanceFormatted && formatBalance(inputBalanceFormatted)}
        extraTextClickHander={() => {
          if (inputBalance && inputDecimals) {
            const valueToSet = inputCurrency === 'ETH' ? inputBalance.sub(ethers.utils.parseEther('.1')) : inputBalance
            if (valueToSet.gt(ethers.constants.Zero)) {
              dispatchSwapState({
                type: 'UPDATE_INDEPENDENT',
                payload: {
                  value: amountFormatter(valueToSet, inputDecimals, Math.min(MIN_DECIMALS, inputDecimals), false),
                  field: INPUT
                }
              })
            }
          }
        }}
        onCurrencySelected={inputCurrency => {
          dispatchSwapState({
            type: 'SELECT_CURRENCY',
            payload: { currency: inputCurrency, field: INPUT }
          })
        }}
        onValueChange={inputValue => {
          dispatchSwapState({
            type: 'UPDATE_INDEPENDENT',
            payload: { value: inputValue, field: INPUT }
          })
        }}
        showUnlock={showUnlock}
        selectedTokens={[inputCurrency, outputCurrency]}
        selectedTokenAddress={inputCurrency}
        value={inputValueFormatted}
        errorMessage={inputError ? inputError : independentField === INPUT ? independentError : ''}
      />
      <OversizedPanel>
        <DownArrowBackground>
          <DownArrow
            onClick={() => {
              // We don't allow switching the order side for now
              // dispatchSwapState({ type: 'FLIP_INDEPENDENT' })
            }}
            // clickable={true}
            alt="swap"
            active={isValid}
          />
        </DownArrowBackground>
      </OversizedPanel>
      <CurrencyInputPanel
        title={t('output')}
        description={estimatedText}
        extraText={outputBalanceFormatted && formatBalance(outputBalanceFormatted)}
        urlAddedTokens={urlAddedTokens}
        onCurrencySelected={outputCurrency => {
          dispatchSwapState({
            type: 'SELECT_CURRENCY',
            payload: { currency: outputCurrency, field: OUTPUT }
          })
        }}
        onValueChange={outputValue => {
          dispatchSwapState({
            type: 'UPDATE_INDEPENDENT',
            payload: { value: outputValue, field: OUTPUT }
          })
        }}
        selectedTokens={[inputCurrency, outputCurrency]}
        selectedTokenAddress={outputCurrency}
        value={outputValueFormatted}
        errorMessage={independentField === OUTPUT ? independentError : ''}
        disableTokenSelect
        disableUnlock
      />
      {sending ? (
        <>
          <OversizedPanel>
            <DownArrowBackground>
              <DownArrow active={isValid} alt="arrow"/>
            </DownArrowBackground>
          </OversizedPanel>
          <AddressInputPanel onChange={setRecipient} onError={setRecipientError} initialInput={recipient}/>
        </>
      ) : (
        ''
      )}
      <OversizedPanel hideBottom>
        <ExchangeRateWrapper
          onClick={() => {
            setInverted(inverted => !inverted)
          }}
        >
          <ExchangeRate>{t('exchangeRate')}</ExchangeRate>
          {inverted ? (
            <span>
              {exchangeRate
                ? `1 ${inputSymbol} = ${amountFormatter(exchangeRate, 18, MIN_DECIMALS_EXCHANGE_RATE, false)} ${outputSymbol}`
                : ' - '}
            </span>
          ) : (
            <span>
              {exchangeRate
                ? `1 ${outputSymbol} = ${amountFormatter(exchangeRateInverted, 18, MIN_DECIMALS_EXCHANGE_RATE, false)} ${inputSymbol}`
                : ' - '}
            </span>
          )}
        </ExchangeRateWrapper>
      </OversizedPanel>
      <TransactionDetails
        account={account}
        setRawSlippage={setRawSlippage}
        setRawTokenSlippage={setRawTokenSlippage}
        rawSlippage={rawSlippage}
        slippageWarning={slippageWarning}
        highSlippageWarning={highSlippageWarning}
        brokenTokenWarning={brokenTokenWarning}
        setDeadline={setDeadlineFromNow}
        deadline={deadlineFromNow}
        inputError={inputError}
        independentError={independentError}
        inputCurrency={inputCurrency}
        outputCurrency={outputCurrency}
        independentValue={independentValue}
        independentValueParsed={independentValueParsed}
        independentField={independentField}
        INPUT={INPUT}
        inputValueParsed={inputValueParsed}
        outputValueParsed={outputValueParsed}
        inputSymbol={inputSymbol}
        outputSymbol={outputSymbol}
        dependentValueMinimum={dependentValueMinimum}
        dependentValueMaximum={dependentValueMaximum}
        dependentDecimals={dependentDecimals}
        independentDecimals={independentDecimals}
        percentSlippageFormatted={percentSlippageFormatted}
        setcustomSlippageError={setcustomSlippageError}
        recipientAddress={recipient.address}
        sending={sending}
      />
      <Flex>
        <Button
          disabled={
            brokenTokenWarning ? true : !account && !error ? false : !isValid || customSlippageError === 'invalid'
          }
          onClick={account && !error ? onSwap : toggleWalletModal}
          warning={highSlippageWarning || customSlippageError === 'warning'}
          loggedOut={!account}
        >
          {brokenTokenWarning
            ? 'Swap'
            : !account
              ? t('connectToWallet')
              : sending
                ? highSlippageWarning || customSlippageError === 'warning'
                  ? t('sendAnyway')
                  : t('send')
                : highSlippageWarning || customSlippageError === 'warning'
                  ? t('swapAnyway')
                  : t('swap')}
        </Button>
      </Flex>
    </>
  )
}
