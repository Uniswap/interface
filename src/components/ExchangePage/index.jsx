import React, { useEffect, useReducer, useState } from 'react'
import ReactGA from 'react-ga'
import { createBrowserHistory } from 'history'
import { ethers } from 'ethers'
import { BigNumber, bigNumberify, formatUnits, parseEther, parseUnits } from 'ethers/utils'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { useInterval, useTokenContract, useWeb3React } from '../../hooks'
import { brokenTokens } from '../../constants'
import {
  amountFormatter,
  calculateGasMargin,
  getProviderOrSigner,
  isAddress,
  MIN_DECIMALS,
  MIN_DECIMALS_EXCHANGE_RATE
} from '../../utils'
import {
  DECIMALS,
  DELEGATE_ADDRESS,
  DMG_ADDRESS,
  INITIAL_TOKENS_CONTEXT,
  MARKETS,
  MIN_ORDER,
  PRIMARY,
  PRIMARY_DECIMALS,
  SECONDARY_DECIMALS,
  SYMBOL,
  useTokenDetails,
  WETH_ADDRESS
} from '../../contexts/Tokens'
import { usePendingWrapping, useTransactionAdder } from '../../contexts/Transactions'
import { useAddressBalance } from '../../contexts/Balances'
import { useDolomiteOrderBooks } from '../../contexts/DolomiteOrderBooks'
import { useAddressAllowance } from '../../contexts/Allowances'
import { useWalletModalToggle } from '../../contexts/Application'
import CircularProgress from '@material-ui/core/CircularProgress'

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

import * as Sentry from '@sentry/browser'

import { getDefaultApiKeyHeaders, getIpAddress, routes, sessionId } from '../../utils/api-signer'

const INPUT = 0
const OUTPUT = 1

const ETH_TO_TOKEN = 0
const TOKEN_TO_ETH = 1
const TOKEN_TO_TOKEN = 2

// denominated in bips
const ALLOWED_SLIPPAGE_DEFAULT = 50
const TOKEN_ALLOWED_SLIPPAGE_DEFAULT = 50

// % above the calculated gas cost that we actually send, denominated in bips
const GAS_MARGIN = bigNumberify(1000)

const DownArrowBackground = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: center;
  align-items: center;
`

const WrappedArrowDown = ({ clickable, active, ...rest }) => <ArrowDown {...rest} />
const DownArrow = styled(WrappedArrowDown)`
  color: black;
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
  padding: 5px 2rem 2rem 2rem;

  button {
    max-width: 20rem;
  }

  svg {
    color: white !important;
  }
`

const ethBalanceBuffer = new BigNumber('50000000000000000')

function getEffectiveInputCurrency(inputCurrency) {
  if (inputCurrency === 'ETH') {
    return WETH_ADDRESS
  } else {
    return inputCurrency
  }
}

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

function calculateTokenOutputFromInput(inputAmount, books, inputCurrency, outputCurrency) {
  return calculateTokenValueFromOtherValue(inputAmount, books, inputCurrency, outputCurrency, false)
}

function calculateTokenInputFromOutput(outputAmount, books, inputCurrency, outputCurrency) {
  return calculateTokenValueFromOtherValue(outputAmount, books, inputCurrency, outputCurrency, true)
}

function calculateTokenValueFromOtherValue(valueAmount, books, inputCurrency, outputCurrency, isValueAmountOutputValue) {
  if (!books) {
    return ethers.constants.Zero
  } else {
    let fillAmount = ethers.constants.Zero
    let outputAmount = ethers.constants.Zero
    for (let i = 0; i < books.sellDepths.length; i++) {
      const tuple = books.sellDepths[i]
      const secondaryTokenDecimals = inputCurrency === DMG_ADDRESS ?
        INITIAL_TOKENS_CONTEXT['1'][outputCurrency][DECIMALS] :
        INITIAL_TOKENS_CONTEXT['1'][inputCurrency][DECIMALS]

      const rawPriceAmount = new BigNumber(tuple.price.value.toLocaleString('fullwide', { useGrouping: false }))
      const priceAmount = rawPriceAmount.mul(new BigNumber(10).pow(secondaryTokenDecimals - tuple.price.precision))

      const primaryAmount = new BigNumber(tuple.quantity.value.toLocaleString('fullwide', { useGrouping: false }))
      const secondaryAmount = primaryAmount.mul(priceAmount).div(new BigNumber(10).pow(tuple.quantity.precision))

      const tupleInputAmount = isValueAmountOutputValue ? primaryAmount : secondaryAmount
      const tupleOutputAmount = isValueAmountOutputValue ? secondaryAmount : primaryAmount

      if (fillAmount.add(tupleInputAmount).lt(valueAmount)) {
        fillAmount = fillAmount.add(tupleInputAmount)
        outputAmount = outputAmount.add(tupleOutputAmount)
      } else {
        const innerFillAmount = valueAmount.sub(fillAmount)
        fillAmount = fillAmount.add(innerFillAmount)

        const outputFillAmount = isValueAmountOutputValue
          ? innerFillAmount.mul(tupleOutputAmount).div(tupleInputAmount)
          : innerFillAmount.mul(tupleOutputAmount).div(tupleInputAmount)
        outputAmount = outputAmount.add(outputFillAmount)
        return outputAmount
      }
    }

    throw Error('INSUFFICIENT_LIQUIDITY')
  }
}

function calculateSlippageBounds(value, token = false, tokenAllowedSlippage, allowedSlippage) {
  if (value) {
    const offset = value.mul(token ? tokenAllowedSlippage : allowedSlippage).div(bigNumberify(10000))
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
      const factor = bigNumberify(10).pow(bigNumberify(18))

      if (invert) {
        return inputValue
          .mul(factor)
          .mul(bigNumberify(10).pow(bigNumberify(outputDecimals)))
          .div(bigNumberify(10).pow(bigNumberify(inputDecimals)))
          .div(outputValue)
      } else {
        return outputValue
          .mul(factor)
          .mul(bigNumberify(10).pow(bigNumberify(inputDecimals)))
          .div(bigNumberify(10).pow(bigNumberify(outputDecimals)))
          .div(inputValue)
      }
    }
  } catch {
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

  const [brokenTokenWarning, setBrokenTokenWarning] = useState(false)

  const [dolomiteOrderId, setDolomiteOrderId] = useState('')
  const [isAwaitingSignature, setIsAwaitingSignature] = useState(false)

  useInterval(() => {
    if (dolomiteOrderId) {
      fetch(`https://exchange-api.dolomite.io/v1/orders/${dolomiteOrderId}`)
        .then(response => response.json())
        .then(response => {
          const status = response['data']['order_status']
          if (status === 'FILLED') {
            // Clear out the order ID after a 3 second delay to allow for the 1-block delay to catch up.
            setTimeout(() => {
              setDolomiteOrderId('')
            }, 3000)
          }
        })
    }
  }, 1000)

  const [rawSlippage, setRawSlippage] = useState(() => initialSlippage())
  const [rawTokenSlippage, setRawTokenSlippage] = useState(() => initialSlippage(true))

  const allowedSlippageBig = bigNumberify(rawSlippage)
  const tokenAllowedSlippageBig = bigNumberify(rawTokenSlippage)

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
  const { symbol: inputSymbol, decimals: inputDecimals } = useTokenDetails(inputCurrency)
  const { symbol: outputSymbol, decimals: outputDecimals } = useTokenDetails(outputCurrency)

  const effectiveInputCurrency = getEffectiveInputCurrency(inputCurrency)
  const market = !!MARKETS['1'][`${inputCurrency}-${outputCurrency}`]
    ? MARKETS['1'][`${effectiveInputCurrency}-${outputCurrency}`]
    : MARKETS['1'][`${outputCurrency}-${effectiveInputCurrency}`]
  const inputFormatDecimals =
    market[PRIMARY] === effectiveInputCurrency ? market[PRIMARY_DECIMALS] : market[SECONDARY_DECIMALS]
  const outputFormatDecimals =
    market[PRIMARY] === outputCurrency ? market[PRIMARY_DECIMALS] : market[SECONDARY_DECIMALS]

  // get input allowance
  const inputAllowance = useAddressAllowance(account, effectiveInputCurrency, DELEGATE_ADDRESS)

  // fetch reserves for each of the currency types
  const primarySymbol = INITIAL_TOKENS_CONTEXT['1'][DMG_ADDRESS].symbol
  const secondarySymbol = INITIAL_TOKENS_CONTEXT['1'][effectiveInputCurrency].symbol
  const orderBooks = useDolomiteOrderBooks(primarySymbol, secondarySymbol)

  const tokenContract = useTokenContract(effectiveInputCurrency)

  // get balances for each of the currency types
  const inputBalance = useAddressBalance(account, inputCurrency)
  const outputBalance = useAddressBalance(account, outputCurrency)
  const inputBalanceFormatted = !!(inputBalance && Number.isInteger(inputDecimals))
    ? amountFormatter(inputBalance, inputDecimals, Math.min(MIN_DECIMALS, inputFormatDecimals))
    : ''
  const outputBalanceFormatted = !!(outputBalance && Number.isInteger(outputDecimals))
    ? amountFormatter(outputBalance, outputDecimals, Math.min(MIN_DECIMALS, outputFormatDecimals))
    : ''
  const isInputIndependent =
    independentField === INPUT ? effectiveInputCurrency === market[PRIMARY] : outputCurrency === market[PRIMARY]

  // compute useful transforms of the data above
  const independentDecimals = independentField === INPUT ? inputDecimals : outputDecimals
  const dependentDecimals = independentField === OUTPUT ? inputDecimals : outputDecimals

  const independentCurrency = independentField === INPUT ? effectiveInputCurrency : outputCurrency
  const dependentCurrency = independentField === OUTPUT ? effectiveInputCurrency : outputCurrency

  // declare/get parsed and formatted versions of input/output values
  const [independentValueParsed, setIndependentValueParsed] = useState()
  const dependentValueFormatted = !!(dependentValue && (dependentDecimals || dependentDecimals === 0))
    ? amountFormatter(
      dependentValue,
      dependentDecimals,
      Math.min(MIN_DECIMALS, isInputIndependent ? inputFormatDecimals : outputFormatDecimals),
      false
    )
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
        const parsedValue = parseUnits(independentValue, independentDecimals)
        let isPrimary
        if (independentField === INPUT) {
          isPrimary = market[PRIMARY] === effectiveInputCurrency
        } else {
          isPrimary = market[PRIMARY] === outputCurrency
        }

        let minValue
        if (isPrimary) {
          const decimalsDiff = INITIAL_TOKENS_CONTEXT['1'][market.primary][DECIMALS] - market[PRIMARY_DECIMALS]
          minValue = new BigNumber(10).pow(decimalsDiff)
        } else {
          const decimalsDiff = INITIAL_TOKENS_CONTEXT['1'][market.secondary][DECIMALS] - market[SECONDARY_DECIMALS]
          minValue = new BigNumber(10).pow(decimalsDiff)
        }

        if (parsedValue.lte(ethers.constants.Zero) || parsedValue.gte(ethers.constants.MaxUint256)) {
          throw Error()
        } else if (parsedValue.lt(minValue) || !parsedValue.mod(minValue).eq(0)) {
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
  }, [independentValue, independentDecimals, t, independentField, market, effectiveInputCurrency, outputCurrency])

  // // calculate slippage from target rate
  const { minimum: dependentValueMinimum, maximum: dependentValueMaximum } = calculateSlippageBounds(
    dependentValue,
    swapType === TOKEN_TO_TOKEN,
    tokenAllowedSlippageBig,
    allowedSlippageBig
  )

  const pendingWrapping = usePendingWrapping(effectiveInputCurrency)

  // validate input allowance + balance
  const [inputError, setInputError] = useState('')
  const [orderSubmissionError, setOrderSubmissionError] = useState('')
  const [showUnlock, setShowUnlock] = useState(false)
  const [showWrap, setShowWrap] = useState(false)
  useEffect(() => {
    const inputValueCalculation = independentField === INPUT ? independentValueParsed : dependentValueMaximum
    if (!!orderSubmissionError) {
      console.log('setting submission error: ', orderSubmissionError)
      setInputError(orderSubmissionError)
    } else if (inputBalance && inputAllowance && inputValueCalculation) {
      if (inputBalance.lt(inputValueCalculation)) {
        setInputError(t('insufficientBalance'))
      } else if (inputAllowance.lt(inputValueCalculation)) {
        setInputError(t('unlockTokenCont'))
        setShowUnlock(true)
        setShowWrap(false)
      } else if (inputCurrency === 'ETH' && inputValueCalculation.gt(inputBalance.sub(ethBalanceBuffer))) {
        setInputError(t('insufficientBalanceWithBuffer'))
        setShowWrap(false)
        setShowUnlock(false)
      } else if (inputValueCalculation.lt(INITIAL_TOKENS_CONTEXT['1'][effectiveInputCurrency][MIN_ORDER])) {
        const token = INITIAL_TOKENS_CONTEXT['1'][effectiveInputCurrency]
        const minimumOrder = token[MIN_ORDER]
        setInputError(`Minimum order is ${formatUnits(minimumOrder.toString(), token[DECIMALS])} ${token[SYMBOL]}`)
        setShowUnlock(false)
        setShowWrap(false)
      } else if (inputCurrency === 'ETH') {
        setInputError(null)
        setShowWrap(true)
        setShowUnlock(false)
      } else {
        setInputError(null)
        setShowUnlock(false)
        setShowWrap(false)
      }
      return () => {
        setInputError(null)
        setShowUnlock(false)
        setShowWrap(false)
      }
    }
  }, [
    independentField,
    independentValueParsed,
    dependentValueMaximum,
    inputBalance,
    effectiveInputCurrency,
    inputAllowance,
    t,
    inputCurrency,
    orderSubmissionError
  ])

  // calculate dependent value
  useEffect(() => {
    const amount = independentValueParsed

    if (amount) {
      try {
        if (independentField === INPUT) {
          const calculatedDependentValue = calculateTokenOutputFromInput(amount, orderBooks, effectiveInputCurrency, outputCurrency)
          if (calculatedDependentValue.lte(ethers.constants.Zero)) {
            throw Error()
          }
          dispatchSwapState({
            type: 'UPDATE_DEPENDENT',
            payload: calculatedDependentValue
          })
        } else {
          const calculatedDependentValue = calculateTokenInputFromOutput(amount, orderBooks, effectiveInputCurrency, outputCurrency)
          if (calculatedDependentValue.lte(ethers.constants.Zero)) {
            throw Error()
          }
          dispatchSwapState({
            type: 'UPDATE_DEPENDENT',
            payload: calculatedDependentValue
          })
        }
      } catch (error) {
        if (error.message === 'INSUFFICIENT_LIQUIDITY') {
          setIndependentError(t('insufficientLiquidity'))
        } else {
          setIndependentError(t('orderBooksLoading'))
        }
      }
      return () => {
        dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: '' })
      }
    }
  }, [independentValueParsed, swapType, orderBooks, independentField, t, effectiveInputCurrency, outputCurrency])

  useEffect(() => {
    const history = createBrowserHistory()
    history.push(window.location.pathname + '')
  }, [])

  const [inverted, setInverted] = useState(false)
  const exchangeRate = getExchangeRate(inputValueParsed, inputDecimals, outputValueParsed, outputDecimals)
  const exchangeRateInverted = getExchangeRate(inputValueParsed, inputDecimals, outputValueParsed, outputDecimals, true)

  const isValid = sending
    ? exchangeRate && inputError === null && independentError === null && recipientError === null
    : exchangeRate && inputError === null && independentError === null

  const estimatedText = `(${t('estimated')})`

  function formatBalance(value) {
    return `Balance: ${value}`
  }

  function onSwap() {
    onSwapAsync().catch(error => {
      if (error?.code !== 4001 && error?.code !== -32603) {
        // Ignore handled errors
        Sentry.captureException(error)
      }
    })
  }

  async function onSwapAsync() {
    setOrderSubmissionError('')

    let loopringOrder

    const secondaryMarketDecimals = market[SECONDARY_DECIMALS]
    const primaryMarketDecimals = market[PRIMARY_DECIMALS]
    const diffDecimals = secondaryMarketDecimals - primaryMarketDecimals

    // const primaryPriceDecimalsFactor = new BigNumber(10).pow(primaryMarketDecimals)
    // const secondaryPriceDecimalsFactor = new BigNumber(10).pow(secondaryMarketDecimals - primaryMarketDecimals)

    const dependentPriceDecimals = dependentCurrency === DMG_ADDRESS ? primaryMarketDecimals : diffDecimals
    // const dependentPriceDecimalsFactor = new BigNumber(10).pow(dependentDecimals - dependentPriceDecimals)

    const independentPriceDecimals = independentCurrency === DMG_ADDRESS ? primaryMarketDecimals : diffDecimals

    const dependentDecimalsFactor = new BigNumber(10).pow(dependentDecimals)
    const dependentTruncationDecimalsFactor = new BigNumber(10).pow(dependentDecimals - dependentPriceDecimals)

    // const independentDecimalsFactor = new BigNumber(10).pow(independentDecimals)
    const independentTruncationDecimalsFactor = new BigNumber(10).pow(independentDecimals - independentPriceDecimals)

    let dependentValueStandardized
    let independentValueParsedStandardized
    let loopringOrderData
    if (independentField === INPUT) {
      dependentValueStandardized = dependentValue
        .div(dependentTruncationDecimalsFactor)
        .mul(dependentTruncationDecimalsFactor)

      const priceWithPremiumStandardized = independentValueParsed
        .mul(dependentDecimalsFactor)
        .div(dependentValueStandardized) // get price
        .mul(11)
        .div(10) // premium
        .div(independentTruncationDecimalsFactor)
        .mul(independentTruncationDecimalsFactor) // standardized

      independentValueParsedStandardized = priceWithPremiumStandardized
        .mul(dependentValueStandardized)
        .div(dependentDecimalsFactor)

      loopringOrderData = {
        tokenB: outputCurrency,
        tokenS: effectiveInputCurrency,
        amountB: dependentValueStandardized.toHexString(),
        amountS: independentValueParsedStandardized.toHexString()
      }
    } else if (independentField === OUTPUT) {
      // tokenS == SECONDARY == DEPENDENT == INPUT
      // tokenB == PRIMARY == INDEPENDENT == OUTPUT
      const independentDecimalsFactor = new BigNumber(10).pow(independentDecimals)

      independentValueParsedStandardized = independentValueParsed
        .div(independentTruncationDecimalsFactor)
        .mul(independentTruncationDecimalsFactor)

      const priceWithPremiumStandardized = dependentValue
        .mul(independentDecimalsFactor)
        .div(independentValueParsedStandardized) // get price
        .mul(11)
        .div(10) // premium
        .div(dependentTruncationDecimalsFactor)
        .mul(dependentTruncationDecimalsFactor) // standardized

      dependentValueStandardized = priceWithPremiumStandardized
        .mul(independentValueParsedStandardized)
        .div(independentDecimalsFactor)

      loopringOrderData = {
        tokenS: effectiveInputCurrency,
        tokenB: outputCurrency,
        amountB: independentValueParsedStandardized.toHexString(),
        amountS: dependentValueStandardized.toHexString()
      }
    }

    let wrapPromise = Promise.resolve()
    if (showWrap && inputCurrency === 'ETH') {
      let amountToWrap = new BigNumber(loopringOrderData.amountS)
      const usableBalance = inputBalance.sub(ethBalanceBuffer) // 0.05
      amountToWrap = amountToWrap.gt(usableBalance) ? usableBalance : amountToWrap
      const estimatedGas = await tokenContract
        .estimate.deposit({ value: amountToWrap })
        .catch(error => {
          console.error('Error wrapping WETH due to error: ', error)
          return Promise.reject(error)
        })

      setIsAwaitingSignature(true)

      wrapPromise = tokenContract
        .deposit({
          gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN),
          value: amountToWrap
        })
        .then(tx => {
          console.log('Waiting for ETH to finish wrapping')
          setIsAwaitingSignature(false)
          addTransaction(tx, { wrapping: effectiveInputCurrency })
          return tx.wait()
        })
        .then(() => {
          console.log('Waiting 10 seconds for ETH wrapping to finish')
          setIsAwaitingSignature(true)
          return new Promise((resolve) => {
            setTimeout(() => {
              console.log('Finished waiting for ETH wrapping to finish')
              resolve()
            }, 7000)
          })
        })
        .then(() => {
          console.log(`Successfully wrapped ${amountToWrap} ETH`)
          dispatchSwapState({
            type: 'SELECT_CURRENCY',
            payload: { currency: effectiveInputCurrency, field: INPUT }
          })
          setShowWrap(false)
        })
        .catch(error => {
          setShowWrap(false)
          setIsAwaitingSignature(false)
          console.error('Could not wrap ETH due to error: ', error)
          return Promise.reject(error)
        })
    }

    await wrapPromise

    const orderSide = loopringOrderData.tokenB === DMG_ADDRESS ? 'BUY' : 'SELL'

    loopringOrder = constructLoopringOrder(library, {
      primaryToken: DMG_ADDRESS,
      owner: account,
      tokenB: loopringOrderData.tokenB,
      tokenS: loopringOrderData.tokenS,
      amountB: loopringOrderData.amountB,
      amountS: loopringOrderData.amountS,
      feeAmount: Zero,
      validUntil: null,
      transferDataS: null,
      broker: null,
      tokenRecipient: account
    })
    const signableData = getSignableData(loopringOrder)
    const signer = getProviderOrSigner(library, account)

    let signaturePromise
    if (typeof signer.signTypedMessage === 'function') {
      signaturePromise = signer.signTypedMessage(signableData)
    } else {
      signaturePromise = new Promise((respond, reject) => {
        library.provider.sendAsync(
          {
            method: 'eth_signTypedData',
            params: [account, JSON.stringify(signableData)],
            from: account
          },
          function(err, result) {
            if (err || result.error) reject(err || result.error.message)
            else respond(result.result)
          }
        )
      })
    }

    // We are now going to wait for the user to sign the Loopring order.
    setIsAwaitingSignature(true)

    return signaturePromise
      .then(signature => {
        setIsAwaitingSignature(false)
        const data = {
          orderType: 'MARKET',
          tokenB: loopringOrder.tokenB,
          tokenS: loopringOrder.tokenS,
          side: orderSide,
          estimatedNumberOfFills: 16,
          constantNetworkFeePremium: 0,
          perMatchNetworkFee: 0
        }
        const dolomiteOrder = toDolomiteOrder(loopringOrder, signature, data)
        console.log('dolomiteOrder ', dolomiteOrder)
        // return exchange.orders.createOrder(dolomiteOrder).then(response => ({ response, dolomiteOrder }))
        return Promise.reject({code: -32603})
      })
      .then(({ response, dolomiteOrder }) => {
        setDolomiteOrderId(response['data']['dolomite_order_id'])
        dolomiteOrder.dolomite_order_uuid = response['data']['dolomite_order_id']
        return { response, dolomiteOrder }
      })
      .then(data => {
        const { response, dolomiteOrder } = data
        return getIpAddress()
          .then(ipAddress => {
            const priceBN = new BigNumber(response['data']['market_order_effective_price'].amount)
            const primaryAmount = new BigNumber(response['data']['primary_amount']?.amount)
            const primaryFactor = new BigNumber(10).pow(response['data']['primary_amount']['currency']?.precision)

            const body = {
              key: 'ORDER_SUBMITTED',
              data: {
                session_id: sessionId,
                ip_address: ipAddress,
                dolomite_order_uuid: dolomiteOrder['dolomite_order_uuid'],
                buyer_address: dolomiteOrder['owner_address'],
                market: dolomiteOrder.market,
                dmg_bought: new BigNumber(dolomiteOrder['primary_padded_amount']).toString(),
                otherSold: primaryAmount.mul(priceBN).div(primaryFactor).toString()
              }
            }
            const options = {
              method: routes.insertEvent.method,
              headers: getDefaultApiKeyHeaders(),
              body: JSON.stringify(body)
            }
            return fetch(routes.insertEvent.url, options)
          })
          .then(() => dolomiteOrder)
      })
      .then(dolomiteOrder => {
        if (params.referrer) {
          const signature = dolomiteOrder['ecdsa_multi_hash_signature']
          const body = {
            dolomite_order_uuid: dolomiteOrder['dolomite_order_uuid'],
            signature: {
              v: Number.parseInt(signature.slice(6, 8), 16),
              r: `0x${signature.slice(8, 72)}`,
              s: `0x${signature.slice(72, 136)}`
            },
            signature_algorithm: Number.parseInt(signature.slice(2, 4), 16),
            buyer_address: dolomiteOrder['owner_address'],
            order_hash: dolomiteOrder['order_hash'],
            referrer_address: params.referrer,
            dmg_bought: new BigNumber(dolomiteOrder['primary_padded_amount']).toString()
          }
          const options = {
            method: routes.insertReferral.method,
            headers: getDefaultApiKeyHeaders(),
            body: JSON.stringify(body)
          }
          return fetch(routes.insertReferral.url, options)
        }
      })
      .then(response => response?.json())
      .catch(error => {
        setIsAwaitingSignature(false)

        let errorMessage
        if (error?.code !== 4001) {
          if (error?.code === -32603) {
            errorMessage = t('unsupportedDeviceForSubmittingOrders')
          } else {
            errorMessage = t('submissionError')
            exchange.addresses.getPortfolio(account).then(response => {
              console.error('Portfolio Data: ', JSON.stringify(response))
            })
          }
        }

        if (errorMessage) {
          setOrderSubmissionError(errorMessage)
          setTimeout(() => {
            setOrderSubmissionError('')
          }, 7500)
        }

        console.error('Could not submit order due to error ', error)
        return Promise.reject(error)
      })
  }

  const [customSlippageError, setCustomSlippageError] = useState('')

  const toggleWalletModal = useWalletModalToggle()

  const newInputDetected =
    effectiveInputCurrency !== 'ETH' &&
    effectiveInputCurrency &&
    !INITIAL_TOKENS_CONTEXT[chainId].hasOwnProperty(effectiveInputCurrency)

  const newOutputDetected =
    outputCurrency !== 'ETH' && outputCurrency && !INITIAL_TOKENS_CONTEXT[chainId].hasOwnProperty(outputCurrency)

  const [showInputWarning, setShowInputWarning] = useState(false)
  const [showOutputWarning, setShowOutputWarning] = useState(false)

  function getButtonText() {
    if (!!dolomiteOrderId) {
      return <CircularProgress/>
    } else if (pendingWrapping) {
      return t('wrapping')
    } else if (isAwaitingSignature) {
      return t('awaitingSignature')
    } else if (brokenTokenWarning) {
      return t('swap')
    } else if (!account) {
      return t('connectToWallet')
    } else if (sending) {
      if (customSlippageError === 'warning') {
        return t('sendAnyway')
      } else {
        return t('send')
      }
    } else if (customSlippageError === 'warning') {
      return t('swapAnyway')
    } else {
      return t('swap')
    }
  }

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
          currency={effectiveInputCurrency}
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
            const valueToSet = effectiveInputCurrency === 'ETH' ? inputBalance.sub(parseEther('.1')) : inputBalance
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
        tokenAddress={effectiveInputCurrency}
        market={market}
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
        disableWrap
        tokenAddress={outputCurrency}
        market={market}
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
                ? `1 ${inputSymbol} = ${amountFormatter(
                  exchangeRate,
                  18,
                  MIN_DECIMALS_EXCHANGE_RATE,
                  false
                )} ${outputSymbol}`
                : ' - '}
            </span>
          ) : (
            <span>
              {exchangeRate
                ? `1 ${outputSymbol} = ${amountFormatter(
                  exchangeRateInverted,
                  18,
                  MIN_DECIMALS_EXCHANGE_RATE,
                  false
                )} ${inputSymbol}`
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
        slippageWarning={false}
        highSlippageWarning={false}
        brokenTokenWarning={brokenTokenWarning}
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
        setCustomSlippageError={setCustomSlippageError}
        wrapWarning={showWrap}
        recipientAddress={recipient.address}
        sending={sending}
      />
      <Flex>
        <Button
          disabled={
            brokenTokenWarning
              ? true
              : !account && !error
              ? false
              : !isValid ||
              customSlippageError === 'invalid' ||
              pendingWrapping ||
              isAwaitingSignature ||
              !!dolomiteOrderId
          }
          onClick={account && !error ? onSwap : toggleWalletModal}
          warning={customSlippageError === 'warning'}
          loggedOut={!account}
        >
          {getButtonText()}
        </Button>
      </Flex>
    </>
  )
}
