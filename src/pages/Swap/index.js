import React, { useState, useReducer, useEffect } from 'react'
import { connect } from 'react-redux'
import classnames from 'classnames'
import ReactGA from 'react-ga'
import { useTranslation } from 'react-i18next'
import { useWeb3Context } from 'web3-react'
import { ethers } from 'ethers'

import { addPendingTx } from '../../ducks/web3connect'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
// import ContextualInfo from '../../components/ContextualInfo'
import OversizedPanel from '../../components/OversizedPanel'
import ArrowDownBlue from '../../assets/images/arrow-down-blue.svg'
import ArrowDownGrey from '../../assets/images/arrow-down-grey.svg'
// import { getBlockDeadline } from '../../helpers/web3-utils'
// import { retry } from '../../helpers/promise-utils'
import { useBalance, useExchangeDetails, useAllowance, useTokenDecimals, useExchangeReserves } from '../../hooks'
import { amountFormatter } from '../../utils'

import './swap.scss'

const INPUT = 0
const OUTPUT = 1

const ETH_TO_TOKEN = 0
const TOKEN_TO_ETH = 1
const TOKEN_TO_TOKEN = 2

// denominated in bips
const ALLOWED_SLIPPAGE = ethers.utils.bigNumberify(200)
const TOKEN_ALLOWED_SLIPPAGE = ethers.utils.bigNumberify(400)

function calculateSlippageBounds(value, token = false) {
  if (value) {
    const offset = value.mul(token ? TOKEN_ALLOWED_SLIPPAGE : ALLOWED_SLIPPAGE).div(ethers.utils.bigNumberify(10000))
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

// this mocks the getInputPrice function, and calculates the required output
function calculateEtherTokenOutputFromInput(inputAmount, inputReserve, outputReserve) {
  const inputAmountWithFee = inputAmount.mul(ethers.utils.bigNumberify(997))
  const numerator = inputAmountWithFee.mul(outputReserve)
  const denominator = inputReserve.mul(ethers.utils.bigNumberify(1000)).add(inputAmountWithFee)
  return numerator.div(denominator)
}

// this mocks the getOutputPrice function, and calculates the required input
function calculateEtherTokenInputFromOutput(outputAmount, inputReserve, outputReserve) {
  const numerator = inputReserve.mul(outputAmount).mul(ethers.utils.bigNumberify(1000))
  const denominator = outputReserve.sub(outputAmount).mul(ethers.utils.bigNumberify(997))
  return numerator.div(denominator).add(ethers.constants.One)
}

const initialSwapState = {
  independentValue: '', // this is a user input
  dependentValue: '', // this is a calculated number
  independentField: INPUT,
  inputCurrency: 'ETH',
  outputCurrency: ''
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
      return {
        ...state,
        independentValue: value,
        dependentValue: '',
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
      return initialSwapState
    }
  }
}

export function Swap({ addPendingTx }) {
  const { t } = useTranslation()
  const context = useWeb3Context()

  // analytics
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }, [])

  // core swap state
  const [swapState, dispatchSwapState] = useReducer(swapStateReducer, initialSwapState)
  const { independentValue, dependentValue, independentField, inputCurrency, outputCurrency } = swapState

  // get swap type from the currency types
  const swapType = getSwapType(inputCurrency, outputCurrency)
  // get exchange address for each of the currency types
  const inputExchangeAddress = useExchangeDetails(inputCurrency)
  const outputExchangeAddress = useExchangeDetails(outputCurrency)
  // get input allowance
  const inputAllowance = useAllowance(inputCurrency, inputExchangeAddress)
  // fetch reserves for each of the currency types
  const { reserveETH: inputReserveETH, reserveToken: inputReserveToken } = useExchangeReserves(
    inputExchangeAddress,
    inputCurrency
  )
  const { reserveETH: outputReserveETH, reserveToken: outputReserveToken } = useExchangeReserves(
    outputExchangeAddress,
    outputCurrency
  )
  // get decimals for each of the currency types
  const inputDecimals = useTokenDecimals(inputCurrency)
  const outputDecimals = useTokenDecimals(outputCurrency)
  const independentDecimals = independentField === INPUT ? inputDecimals : outputDecimals
  const dependentDecimals = independentField === OUTPUT ? inputDecimals : outputDecimals
  // get balances for each of the currency types
  const inputBalance = useBalance(inputCurrency)
  const outputBalance = useBalance(outputCurrency)
  const inputBalanceFormatted = !!(inputBalance && inputDecimals) ? amountFormatter(inputBalance, inputDecimals, 4) : ''
  const outputBalanceFormatted = !!(outputBalance && outputDecimals)
    ? amountFormatter(outputBalance, outputDecimals, 4)
    : ''

  // declare/get parsed and formatted versions of input/output values
  const [independentValueParsed, setIndependentValueParsed] = useState()
  const dependentValueFormatted = !!(dependentValue && dependentDecimals)
    ? amountFormatter(dependentValue, dependentDecimals, 4)
    : ''
  const inputValueParsed = independentField === INPUT ? independentValueParsed : dependentValue
  const inputValueFormatted = independentField === INPUT ? independentValue : dependentValueFormatted
  const outputValueParsed = independentField === OUTPUT ? independentValueParsed : dependentValue
  const outputValueFormatted = independentField === OUTPUT ? independentValue : dependentValueFormatted

  // calculate slippage
  const { maximum: dependentValueMaximum } = calculateSlippageBounds(dependentValue, swapType === TOKEN_TO_TOKEN)

  // validate input allowance + balance
  const [inputError, setInputError] = useState()
  useEffect(() => {
    const inputValueCalculation = independentField === INPUT ? independentValueParsed : dependentValueMaximum

    if (inputBalance && inputAllowance && inputValueCalculation) {
      if (inputBalance.lt(inputValueCalculation)) {
        setInputError(t('insufficientBalance'))
      } else if (inputAllowance.lt(inputValueCalculation)) {
        setInputError(t('unlockTokenCont'))
      } else {
        setInputError(null)
      }

      return () => {
        setInputError()
      }
    }
  }, [independentField, independentValueParsed, dependentValueMaximum, inputBalance, inputAllowance])

  // validated + parse independent value
  const [independentError, setIndependentError] = useState()
  useEffect(() => {
    if (independentValue && independentDecimals) {
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
  }, [independentValue, independentDecimals])

  // calculate dependent value
  useEffect(() => {
    const amount = independentValueParsed

    if (swapType === ETH_TO_TOKEN) {
      const reserveETH = outputReserveETH
      const reserveToken = outputReserveToken

      if (amount && reserveETH && reserveToken) {
        const calculatedDependentValue =
          independentField === INPUT
            ? calculateEtherTokenOutputFromInput(amount, reserveETH, reserveToken)
            : calculateEtherTokenInputFromOutput(amount, reserveETH, reserveToken)

        dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: calculatedDependentValue })
      }

      return () => {
        dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: '' })
      }
    } else if (swapType === TOKEN_TO_ETH) {
      const reserveETH = inputReserveETH
      const reserveToken = inputReserveToken

      if (amount && reserveETH && reserveToken) {
        const calculatedDependentValue =
          independentField === INPUT
            ? calculateEtherTokenOutputFromInput(amount, reserveToken, reserveETH)
            : calculateEtherTokenInputFromOutput(amount, reserveToken, reserveETH)

        dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: calculatedDependentValue })

        return () => {
          dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: '' })
        }
      }
    } else if (swapType === TOKEN_TO_TOKEN) {
      console.log(':p')
    }
  }, [
    independentValueParsed,
    swapType,
    outputReserveETH,
    outputReserveToken,
    inputReserveETH,
    inputReserveToken,
    independentField
  ])

  // function recalcTokenTokenForm() {
  //   const {
  //     exchangeAddresses: { fromToken },
  //     selectors
  //   } = this.props

  //   const {
  //     inputValue: oldInputValue,
  //     outputValue: oldOutputValue,
  //     inputCurrency,
  //     outputCurrency,
  //     lastEditedField,
  //     exchangeRate: oldExchangeRate,
  //     inputAmountB: oldInputAmountB
  //   } = this.state

  //   const exchangeAddressA = fromToken[inputCurrency]
  //   const exchangeAddressB = fromToken[outputCurrency]

  //   const { value: inputReserveA, decimals: inputDecimalsA } = selectors().getBalance(exchangeAddressA, inputCurrency)
  //   const { value: outputReserveA } = selectors().getBalance(exchangeAddressA, 'ETH')
  //   const { value: inputReserveB } = selectors().getBalance(exchangeAddressB, 'ETH')
  //   const { value: outputReserveB, decimals: outputDecimalsB } = selectors().getBalance(
  //     exchangeAddressB,
  //     outputCurrency
  //   )

  //   if (lastEditedField === INPUT) {
  //     if (!oldInputValue) {
  //       return this.setState({
  //         outputValue: '',
  //         exchangeRate: BN(0)
  //       })
  //     }

  //     const inputAmountA = BN(oldInputValue).multipliedBy(10 ** inputDecimalsA)
  //     const outputAmountA = calculateEtherTokenOutputFromInput({
  //       inputAmount: inputAmountA,
  //       inputReserve: inputReserveA,
  //       outputReserve: outputReserveA
  //     })
  //     // Redundant Variable for readability of the formala
  //     // OutputAmount from the first swap becomes InputAmount of the second swap
  //     const inputAmountB = outputAmountA
  //     const outputAmountB = calculateEtherTokenOutputFromInput({
  //       inputAmount: inputAmountB,
  //       inputReserve: inputReserveB,
  //       outputReserve: outputReserveB
  //     })

  //     const outputValue = outputAmountB.dividedBy(BN(10 ** outputDecimalsB)).toFixed(7)
  //     const exchangeRate = BN(outputValue).dividedBy(BN(oldInputValue))

  //     const appendState = {}

  //     if (!exchangeRate.isEqualTo(BN(oldExchangeRate))) {
  //       appendState.exchangeRate = exchangeRate
  //     }

  //     if (outputValue !== oldOutputValue) {
  //       appendState.outputValue = outputValue
  //     }

  //     this.setState(appendState)
  //   }

  //   if (lastEditedField === OUTPUT) {
  //     if (!oldOutputValue) {
  //       return this.setState({
  //         inputValue: '',
  //         exchangeRate: BN(0)
  //       })
  //     }

  //     const outputAmountB = BN(oldOutputValue).multipliedBy(10 ** outputDecimalsB)
  //     const inputAmountB = calculateEtherTokenInputFromOutput({
  //       outputAmount: outputAmountB,
  //       inputReserve: inputReserveB,
  //       outputReserve: outputReserveB
  //     })

  //     // Redundant Variable for readability of the formala
  //     // InputAmount from the first swap becomes OutputAmount of the second swap
  //     const outputAmountA = inputAmountB
  //     const inputAmountA = calculateEtherTokenInputFromOutput({
  //       outputAmount: outputAmountA,
  //       inputReserve: inputReserveA,
  //       outputReserve: outputReserveA
  //     })

  //     const inputValue = inputAmountA.isNegative() ? 'N/A' : inputAmountA.dividedBy(BN(10 ** inputDecimalsA)).toFixed(7)
  //     const exchangeRate = BN(oldOutputValue).dividedBy(BN(inputValue))

  //     const appendState = {}

  //     if (!exchangeRate.isEqualTo(BN(oldExchangeRate))) {
  //       appendState.exchangeRate = exchangeRate
  //     }

  //     if (inputValue !== oldInputValue) {
  //       appendState.inputValue = inputValue
  //     }

  //     if (!inputAmountB.isEqualTo(BN(oldInputAmountB))) {
  //       appendState.inputAmountB = inputAmountB
  //     }

  //     this.setState(appendState)
  //   }
  // }

  function onSwap() {
    console.log('swap!')
  }

  const exchangeRate = !!(outputValueParsed && inputValueParsed) ? outputValueParsed.div(inputValueParsed) : undefined

  const isActive = context.active && context.account
  const isValid = exchangeRate && inputError === null && independentError === null

  const estimatedText = `(${t('estimated')})`
  function formatBalance(value) {
    return `Balance: ${value}`
  }
  return (
    <>
      <CurrencyInputPanel
        title={t('input')}
        description={inputValueFormatted && independentField === OUTPUT ? estimatedText : ''}
        extraText={inputBalanceFormatted && formatBalance(inputBalanceFormatted)}
        onCurrencySelected={inputCurrency => {
          dispatchSwapState({ type: 'SELECT_CURRENCY', payload: { currency: inputCurrency, field: INPUT } })
        }}
        onValueChange={inputValue => {
          dispatchSwapState({ type: 'UPDATE_INDEPENDENT', payload: { value: inputValue, field: INPUT } })
        }}
        selectedTokens={[inputCurrency, outputCurrency]}
        selectedTokenAddress={inputCurrency}
        value={inputValueFormatted}
        errorMessage={inputError ? inputError : independentField === INPUT ? independentError : ''}
      />
      <OversizedPanel>
        <div className="swap__down-arrow-background">
          <img
            onClick={() => {
              dispatchSwapState({ type: 'FLIP_INDEPENDENT' })
            }}
            className="swap__down-arrow swap__down-arrow--clickable"
            alt="swap"
            src={isValid ? ArrowDownBlue : ArrowDownGrey}
          />
        </div>
      </OversizedPanel>
      <CurrencyInputPanel
        title={t('output')}
        description={outputValueFormatted && independentField === INPUT ? estimatedText : ''}
        extraText={outputBalanceFormatted && formatBalance(outputBalanceFormatted)}
        onCurrencySelected={outputCurrency => {
          dispatchSwapState({ type: 'SELECT_CURRENCY', payload: { currency: outputCurrency, field: OUTPUT } })
        }}
        onValueChange={outputValue => {
          dispatchSwapState({ type: 'UPDATE_INDEPENDENT', payload: { value: outputValue, field: OUTPUT } })
        }}
        selectedTokens={[inputCurrency, outputCurrency]}
        selectedTokenAddress={outputCurrency}
        value={outputValueFormatted}
        errorMessage={independentField === OUTPUT ? independentError : ''}
        disableUnlock
      />
      {/* {this.renderExchangeRate()}
      {this.renderSummary(inputError, outputError)} */}
      <div className="swap__cta-container">
        <button
          className={classnames('swap__cta-btn', { 'swap--inactive': !isActive })}
          disabled={!isValid}
          onClick={onSwap}
        >
          {t('swap')}
        </button>
      </div>
    </>
  )
}

// onSwap = async () => {
//   const {
//     exchangeAddresses: { fromToken },
//     account,
//     web3,
//     selectors,
//     addPendingTx
//   } = this.props
//   const { inputValue, outputValue, inputCurrency, outputCurrency, inputAmountB, lastEditedField } = this.state
//   const ALLOWED_SLIPPAGE = 0.025
//   const TOKEN_ALLOWED_SLIPPAGE = 0.04

//   const type = getSwapType(inputCurrency, outputCurrency)
//   const { decimals: inputDecimals } = selectors().getBalance(account, inputCurrency)
//   const { decimals: outputDecimals } = selectors().getBalance(account, outputCurrency)
//   let deadline
//   try {
//     deadline = await retry(() => getBlockDeadline(web3, 600))
//   } catch (e) {
//     // TODO: Handle error.
//     return
//   }

//   if (lastEditedField === INPUT) {
//     // swap input
//     ReactGA.event({
//       category: type,
//       action: 'SwapInput'
//     })
//     switch (type) {
//       case 'ETH_TO_TOKEN':
//         // let exchange = new web3.eth.Contract(EXCHANGE_ABI, fromToken[outputCurrency]);
//         new web3.eth.Contract(EXCHANGE_ABI, fromToken[outputCurrency]).methods
//           .ethToTokenSwapInput(
//             BN(outputValue)
//               .multipliedBy(10 ** outputDecimals)
//               .multipliedBy(1 - ALLOWED_SLIPPAGE)
//               .toFixed(0),
//             deadline
//           )
//           .send(
//             {
//               from: account,
//               value: BN(inputValue)
//                 .multipliedBy(10 ** 18)
//                 .toFixed(0)
//             },
//             (err, data) => {
//               if (!err) {
//                 addPendingTx(data)
//                 this.reset()
//               }
//             }
//           )
//         break
//       case 'TOKEN_TO_ETH':
//         new web3.eth.Contract(EXCHANGE_ABI, fromToken[inputCurrency]).methods
//           .tokenToEthSwapInput(
//             BN(inputValue)
//               .multipliedBy(10 ** inputDecimals)
//               .toFixed(0),
//             BN(outputValue)
//               .multipliedBy(10 ** outputDecimals)
//               .multipliedBy(1 - ALLOWED_SLIPPAGE)
//               .toFixed(0),
//             deadline
//           )
//           .send({ from: account }, (err, data) => {
//             if (!err) {
//               addPendingTx(data)
//               this.reset()
//             }
//           })
//         break
//       case 'TOKEN_TO_TOKEN':
//         new web3.eth.Contract(EXCHANGE_ABI, fromToken[inputCurrency]).methods
//           .tokenToTokenSwapInput(
//             BN(inputValue)
//               .multipliedBy(10 ** inputDecimals)
//               .toFixed(0),
//             BN(outputValue)
//               .multipliedBy(10 ** outputDecimals)
//               .multipliedBy(1 - TOKEN_ALLOWED_SLIPPAGE)
//               .toFixed(0),
//             '1',
//             deadline,
//             outputCurrency
//           )
//           .send({ from: account }, (err, data) => {
//             if (!err) {
//               addPendingTx(data)
//               this.reset()
//             }
//           })
//         break
//       default:
//         break
//     }
//   }

//   if (lastEditedField === OUTPUT) {
//     // swap output
//     ReactGA.event({
//       category: type,
//       action: 'SwapOutput'
//     })
//     switch (type) {
//       case 'ETH_TO_TOKEN':
//         new web3.eth.Contract(EXCHANGE_ABI, fromToken[outputCurrency]).methods
//           .ethToTokenSwapOutput(
//             BN(outputValue)
//               .multipliedBy(10 ** outputDecimals)
//               .toFixed(0),
//             deadline
//           )
//           .send(
//             {
//               from: account,
//               value: BN(inputValue)
//                 .multipliedBy(10 ** inputDecimals)
//                 .multipliedBy(1 + ALLOWED_SLIPPAGE)
//                 .toFixed(0)
//             },
//             (err, data) => {
//               if (!err) {
//                 addPendingTx(data)
//                 this.reset()
//               }
//             }
//           )
//         break
//       case 'TOKEN_TO_ETH':
//         new web3.eth.Contract(EXCHANGE_ABI, fromToken[inputCurrency]).methods
//           .tokenToEthSwapOutput(
//             BN(outputValue)
//               .multipliedBy(10 ** outputDecimals)
//               .toFixed(0),
//             BN(inputValue)
//               .multipliedBy(10 ** inputDecimals)
//               .multipliedBy(1 + ALLOWED_SLIPPAGE)
//               .toFixed(0),
//             deadline
//           )
//           .send({ from: account }, (err, data) => {
//             if (!err) {
//               addPendingTx(data)
//               this.reset()
//             }
//           })
//         break
//       case 'TOKEN_TO_TOKEN':
//         if (!inputAmountB) {
//           return
//         }

//         new web3.eth.Contract(EXCHANGE_ABI, fromToken[inputCurrency]).methods
//           .tokenToTokenSwapOutput(
//             BN(outputValue)
//               .multipliedBy(10 ** outputDecimals)
//               .toFixed(0),
//             BN(inputValue)
//               .multipliedBy(10 ** inputDecimals)
//               .multipliedBy(1 + TOKEN_ALLOWED_SLIPPAGE)
//               .toFixed(0),
//             inputAmountB.multipliedBy(1.2).toFixed(0),
//             deadline,
//             outputCurrency
//           )
//           .send({ from: account }, (err, data) => {
//             if (!err) {
//               addPendingTx(data)
//               this.reset()
//             }
//           })
//         break
//       default:
//         break
//     }
//   }
// }

// renderSummary(inputError, outputError) {
//   const { inputValue, inputCurrency, outputValue, outputCurrency } = this.state
//   const { t, account } = this.props

//   const inputIsZero = BN(inputValue).isZero()
//   const outputIsZero = BN(outputValue).isZero()
//   let contextualInfo = ''
//   let isError = false

//   if (!inputCurrency || !outputCurrency) {
//     contextualInfo = t('selectTokenCont')
//   }

//   if (!inputValue || !outputValue) {
//     contextualInfo = t('enterValueCont')
//   }

//   if (inputError || outputError) {
//     contextualInfo = inputError || outputError
//     isError = true
//   }

//   if (inputIsZero || outputIsZero) {
//     contextualInfo = t('noLiquidity')
//   }

//   if (this.isUnapproved()) {
//     contextualInfo = t('unlockTokenCont')
//   }

//   if (!account) {
//     contextualInfo = t('noWallet')
//     isError = true
//   }

//   return (
//     <ContextualInfo
//       openDetailsText={t('transactionDetails')}
//       closeDetailsText={t('hideDetails')}
//       contextualInfo={contextualInfo}
//       isError={isError}
//       renderTransactionDetails={this.renderTransactionDetails}
//     />
//   )
// }

// renderTransactionDetails = () => {
//   const { inputValue, inputCurrency, outputValue, outputCurrency, lastEditedField } = this.state
//   const { t, selectors, account } = this.props

//   ReactGA.event({
//     category: 'TransactionDetail',
//     action: 'Open'
//   })

//   const ALLOWED_SLIPPAGE = 0.025
//   const TOKEN_ALLOWED_SLIPPAGE = 0.04

//   const type = getSwapType(inputCurrency, outputCurrency)
//   const { label: inputLabel } = selectors().getBalance(account, inputCurrency)
//   const { label: outputLabel } = selectors().getBalance(account, outputCurrency)

//   // const label = lastEditedField === INPUT ? outputLabel : inputLabel;
//   let minOutput
//   let maxInput

//   if (lastEditedField === INPUT) {
//     switch (type) {
//       case 'ETH_TO_TOKEN':
//         minOutput = BN(outputValue)
//           .multipliedBy(1 - ALLOWED_SLIPPAGE)
//           .toFixed(7)
//           .trim()
//         break
//       case 'TOKEN_TO_ETH':
//         minOutput = BN(outputValue)
//           .multipliedBy(1 - ALLOWED_SLIPPAGE)
//           .toFixed(7)
//         break
//       case 'TOKEN_TO_TOKEN':
//         minOutput = BN(outputValue)
//           .multipliedBy(1 - TOKEN_ALLOWED_SLIPPAGE)
//           .toFixed(7)
//         break
//       default:
//         break
//     }
//   }

//   if (lastEditedField === OUTPUT) {
//     switch (type) {
//       case 'ETH_TO_TOKEN':
//         maxInput = BN(inputValue)
//           .multipliedBy(1 + ALLOWED_SLIPPAGE)
//           .toFixed(7)
//           .trim()
//         break
//       case 'TOKEN_TO_ETH':
//         maxInput = BN(inputValue)
//           .multipliedBy(1 + ALLOWED_SLIPPAGE)
//           .toFixed(7)
//         break
//       case 'TOKEN_TO_TOKEN':
//         maxInput = BN(inputValue)
//           .multipliedBy(1 + TOKEN_ALLOWED_SLIPPAGE)
//           .toFixed(7)
//         break
//       default:
//         break
//     }
//   }

//   if (lastEditedField === INPUT) {
//     return (
//       <div>
//         <div>
//           {t('youAreSelling')} {b(`${+inputValue} ${inputLabel}`)} {t('orTransFail')}
//         </div>
//         <div className="send__last-summary-text">
//           {t('youWillReceive')} {b(`${+minOutput} ${outputLabel}`)} {t('orTransFail')}
//         </div>
//       </div>
//     )
//   } else {
//     return (
//       <div>
//         <div>
//           {t('youAreBuying')} {b(`${+outputValue} ${outputLabel}`)}.
//         </div>
//         <div className="send__last-summary-text">
//           {t('itWillCost')} {b(`${+maxInput} ${inputLabel}`)} {t('orTransFail')}
//         </div>
//       </div>
//     )
//   }
// }

// renderExchangeRate() {
//   const { t, account, selectors } = this.props
//   const { exchangeRate, inputCurrency, outputCurrency } = this.state
//   const { label: inputLabel } = selectors().getBalance(account, inputCurrency)
//   const { label: outputLabel } = selectors().getBalance(account, outputCurrency)

//   if (!exchangeRate || exchangeRate.isNaN() || !inputCurrency || !outputCurrency) {
//     return (
//       <OversizedPanel hideBottom>
//         <div className="swap__exchange-rate-wrapper">
//           <span className="swap__exchange-rate">{t('exchangeRate')}</span>
//           <span> - </span>
//         </div>
//       </OversizedPanel>
//     )
//   }

//   return (
//     <OversizedPanel hideBottom>
//       <div className="swap__exchange-rate-wrapper">
//         <span className="swap__exchange-rate">{t('exchangeRate')}</span>
//         <span>{`1 ${inputLabel} = ${exchangeRate.toFixed(7)} ${outputLabel}`}</span>
//       </div>
//     </OversizedPanel>
//   )
// }

export default connect(
  undefined,
  dispatch => ({
    addPendingTx: id => dispatch(addPendingTx(id))
  })
)(Swap)
