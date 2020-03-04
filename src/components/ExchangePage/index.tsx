import React, { useState, useReducer, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import styled from 'styled-components'
import { parseUnits, parseEther } from '@ethersproject/units'
import { WETH, TradeType, Route, Trade, TokenAmount, JSBI } from '@uniswap/sdk'

import { useWeb3React } from '../../hooks'
import { useToken } from '../../contexts/Tokens'
import { useExchange } from '../../contexts/Exchanges'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useAddressBalance } from '../../contexts/Balances'
import { useAddressAllowance } from '../../contexts/Allowances'

import { Text } from 'rebass'
import { ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { RowBetween } from '../../components/Row'
import { ArrowDown, ArrowUp } from 'react-feather'
import CurrencyInputPanel from '../CurrencyInputPanel'
import ConfirmationModal from '../ConfirmationModal'

import { getRouterContract, calculateGasMargin } from '../../utils'
import { TRANSACTION_TYPE } from '../../constants'

const ArrowWrapper = styled.div`
  padding: 4px;
  border: 1px solid ${({ theme }) => theme.malibuBlue};
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;

  :hover {
    cursor: pointer;
    opacity: 0.8;
  }
`

const ErrorText = styled(Text)`
  color: ${({ theme, error }) => (error ? theme.salmonRed : theme.chaliceGray)};
`

enum Field {
  INPUT,
  OUTPUT
}

interface SwapState {
  independentField: Field
  typedValue: string
  [Field.INPUT]: {
    address: string | undefined
  }
  [Field.OUTPUT]: {
    address: string | undefined
  }
}

function initializeSwapState(inputAddress?: string, outputAddress?: string): SwapState {
  return {
    independentField: Field.INPUT,
    typedValue: '',
    [Field.INPUT]: {
      address: inputAddress
    },
    [Field.OUTPUT]: {
      address: '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735'
    }
  }
}

enum SwapAction {
  SELECT_TOKEN,
  SWITCH_TOKENS,
  TYPE
}

interface Payload {
  [SwapAction.SELECT_TOKEN]: {
    field: Field
    address: string
  }
  [SwapAction.SWITCH_TOKENS]: undefined
  [SwapAction.TYPE]: {
    field: Field
    typedValue: string
  }
}

function reducer(
  state: SwapState,
  action: {
    type: SwapAction
    payload: Payload[SwapAction]
  }
): SwapState {
  switch (action.type) {
    case SwapAction.SELECT_TOKEN: {
      const { field, address } = action.payload as Payload[SwapAction.SELECT_TOKEN]
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
      if (address === state[otherField].address) {
        // the case where we have to swap the order
        return {
          ...state,
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: { address },
          [otherField]: { address: state[field].address }
        }
      } else {
        // the normal case
        return {
          ...state,
          [field]: { address }
        }
      }
    }
    case SwapAction.SWITCH_TOKENS: {
      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { address: state[Field.OUTPUT].address },
        [Field.OUTPUT]: { address: state[Field.INPUT].address }
      }
    }
    case SwapAction.TYPE: {
      const { field, typedValue } = action.payload as Payload[SwapAction.TYPE]
      return {
        ...state,
        independentField: field,
        typedValue
      }
    }
    default: {
      throw Error
    }
  }
}

export default function ExchangePage() {
  const { chainId, account, library } = useWeb3React()

  const [state, dispatch] = useReducer(reducer, WETH[chainId].address, initializeSwapState)
  const { independentField, typedValue, ...fieldData } = state

  // get derived state
  const dependentField = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT
  const tradeType = independentField === Field.INPUT ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT

  // get basic SDK entities
  const tokens = {
    [Field.INPUT]: useToken(fieldData[Field.INPUT].address),
    [Field.OUTPUT]: useToken(fieldData[Field.OUTPUT].address)
  }

  const exchange = useExchange(tokens[Field.INPUT], tokens[Field.OUTPUT])
  const route = !!exchange ? new Route([exchange], tokens[Field.INPUT]) : undefined // no useRoute hook

  // get user- and token-specific lookup data
  const userBalances = {
    [Field.INPUT]: useAddressBalance(account, tokens[Field.INPUT]),
    [Field.OUTPUT]: useAddressBalance(account, tokens[Field.OUTPUT])
  }

  const parsedAmounts: { [field: number]: TokenAmount } = {}
  // try to parse typed value
  if (typedValue !== '' && typedValue !== '.' && tokens[independentField]) {
    try {
      const typedValueParsed = parseUnits(typedValue, tokens[independentField].decimals).toString()
      if (typedValueParsed !== '0')
        parsedAmounts[independentField] = new TokenAmount(tokens[independentField], typedValueParsed)
    } catch (error) {
      // should only fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
      console.error(error)
    }
  }

  // get trade
  let trade: Trade
  try {
    trade =
      !!route && !!parsedAmounts[independentField]
        ? new Trade(route, parsedAmounts[independentField], tradeType)
        : undefined
  } catch (error) {
    console.error(error)
  }

  if (trade)
    parsedAmounts[dependentField] = tradeType === TradeType.EXACT_INPUT ? trade.outputAmount : trade.inputAmount

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField] ? parsedAmounts[dependentField].toSignificant(8) : ''
  }

  const onTokenSelection = useCallback((field: Field, address: string) => {
    dispatch({
      type: SwapAction.SELECT_TOKEN,
      payload: { field, address }
    })
  }, [])

  const onSwapTokens = useCallback(() => {
    dispatch({
      type: SwapAction.SWITCH_TOKENS,
      payload: undefined
    })
  }, [])

  const onUserInput = useCallback((field: Field, typedValue: string) => {
    dispatch({ type: SwapAction.TYPE, payload: { field, typedValue } })
  }, [])

  const onMaxInput = useCallback((typedValue: string) => {
    dispatch({
      type: SwapAction.TYPE,
      payload: {
        field: Field.INPUT,
        typedValue
      }
    })
  }, [])

  const onMaxOutput = useCallback((typedValue: string) => {
    dispatch({
      type: SwapAction.TYPE,
      payload: {
        field: Field.OUTPUT,
        typedValue
      }
    })
  }, [])

  const MIN_ETHER = new TokenAmount(WETH[chainId], JSBI.BigInt(parseEther('.01')))
  const maxAmountInput =
    !!userBalances[Field.INPUT] &&
    JSBI.greaterThan(
      userBalances[Field.INPUT].raw,
      tokens[Field.INPUT].equals(WETH[chainId]) ? MIN_ETHER.raw : JSBI.BigInt(0)
    )
      ? tokens[Field.INPUT].equals(WETH[chainId])
        ? userBalances[Field.INPUT].subtract(MIN_ETHER)
        : userBalances[Field.INPUT]
      : undefined
  const atMaxAmountInput =
    !!maxAmountInput && !!parsedAmounts[Field.INPUT]
      ? JSBI.equal(maxAmountInput.raw, parsedAmounts[Field.INPUT].raw)
      : undefined

  const maxAmountOutput =
    !!userBalances[Field.OUTPUT] &&
    JSBI.greaterThan(
      userBalances[Field.OUTPUT].raw,
      tokens[Field.OUTPUT].equals(WETH[chainId]) ? MIN_ETHER.raw : JSBI.BigInt(0)
    )
      ? tokens[Field.OUTPUT].equals(WETH[chainId])
        ? userBalances[Field.OUTPUT].subtract(MIN_ETHER)
        : userBalances[Field.OUTPUT]
      : undefined

  const atMaxAmountOutput =
    !!maxAmountOutput && !!parsedAmounts[Field.OUTPUT]
      ? JSBI.equal(maxAmountOutput.raw, parsedAmounts[Field.OUTPUT].raw)
      : undefined

  const [showConfirm, setShowConfirm] = useState(false)

  const [pendingConfirmation, toggelPendingConfirmation] = useState(true)

  // state for txn
  const addTransaction = useTransactionAdder()
  const [txHash, setTxHash] = useState()

  const SWAP_TYPE = {
    EXACT_TOKENS_FOR_TOKENS: 'EXACT_TOKENS_FOR_TOKENS',
    EXACT_TOKENS_FOR_ETH: 'EXACT_TOKENS_FOR_ETH',
    EXACT_ETH_FOR_TOKENS: 'EXACT_ETH_FOR_TOKENS',
    TOKENS_FOR_EXACT_TOKENS: 'TOKENS_FOR_EXACT_TOKENS',
    TOKENS_FOR_EXACT_ETH: 'TOKENS_FOR_EXACT_ETH',
    ETH_FOR_EXACT_TOKENS: 'ETH_FOR_EXACT_TOKENS'
  }

  function getSwapType() {
    if (tradeType === TradeType.EXACT_INPUT) {
      if (tokens[Field.INPUT] === WETH[chainId]) {
        return SWAP_TYPE.EXACT_ETH_FOR_TOKENS
      } else if (tokens[Field.OUTPUT] === WETH[chainId]) {
        return SWAP_TYPE.EXACT_TOKENS_FOR_ETH
      } else {
        return SWAP_TYPE.EXACT_TOKENS_FOR_TOKENS
      }
    } else if (tradeType === TradeType.EXACT_OUTPUT) {
      if (tokens[Field.INPUT] === WETH[chainId]) {
        return SWAP_TYPE.ETH_FOR_EXACT_TOKENS
      } else if (tokens[Field.OUTPUT] === WETH[chainId]) {
        return SWAP_TYPE.TOKENS_FOR_EXACT_ETH
      } else {
        return SWAP_TYPE.TOKENS_FOR_EXACT_TOKENS
      }
    }
  }

  const ALLOWED_SLIPPAGE = 100

  function calculateSlippageAmount(value: TokenAmount): JSBI[] {
    if (value && value.raw) {
      const offset = JSBI.divide(JSBI.multiply(JSBI.BigInt(ALLOWED_SLIPPAGE), value.raw), JSBI.BigInt(10000))
      return [JSBI.subtract(value.raw, offset), JSBI.add(value.raw, offset)]
    }
    return null
  }

  function hex(value: JSBI) {
    return ethers.utils.bigNumberify(value.toString())
  }

  const slippageAdjustedAmountsRaw = {
    [Field.INPUT]:
      Field.INPUT === independentField
        ? parsedAmounts[Field.INPUT]?.raw
        : calculateSlippageAmount(parsedAmounts[Field.INPUT])?.[1],
    [Field.OUTPUT]:
      Field.OUTPUT === independentField
        ? parsedAmounts[Field.OUTPUT]?.raw
        : calculateSlippageAmount(parsedAmounts[Field.OUTPUT])?.[0]
  }

  const routerAddress = '0xd9210Ff5A0780E083BB40e30d005d93a2DcFA4EF'

  const inputApproval = useAddressAllowance(account, tokens[Field.INPUT], routerAddress)
  const outputApproval = useAddressAllowance(account, tokens[Field.OUTPUT], routerAddress)

  const [showInputUnlock, setShowInputUnlock] = useState(false)

  // monitor parsed amounts and update unlocked buttons
  useEffect(() => {
    if (
      parsedAmounts[Field.INPUT] &&
      inputApproval &&
      JSBI.greaterThan(parsedAmounts[Field.INPUT].raw, inputApproval.raw)
    ) {
      setShowInputUnlock(true)
    } else {
      setShowInputUnlock(false)
    }
  }, [inputApproval, outputApproval, parsedAmounts])

  async function onSwap() {
    const routerContract = getRouterContract(chainId, library, account)

    const path = Object.keys(route.path).map(key => {
      return route.path[key].address
    })

    let estimate: Function, method: Function, args, value

    const deadline = 1739591241

    const swapType = getSwapType()
    switch (swapType) {
      case SWAP_TYPE.EXACT_TOKENS_FOR_TOKENS:
        estimate = routerContract.estimate.swapExactTokensForTokens
        method = routerContract.swapExactTokensForTokens
        args = [
          slippageAdjustedAmountsRaw[Field.INPUT].toString(),
          slippageAdjustedAmountsRaw[Field.OUTPUT].toString(),
          path,
          account,
          deadline
        ]
        value = ethers.constants.Zero
        break
      case SWAP_TYPE.TOKENS_FOR_EXACT_TOKENS:
        estimate = routerContract.estimate.swapTokensForExactTokens
        method = routerContract.swapTokensForExactTokens
        args = [
          slippageAdjustedAmountsRaw[Field.OUTPUT].toString(),
          slippageAdjustedAmountsRaw[Field.INPUT].toString(),
          path,
          account,
          deadline
        ]
        value = ethers.constants.Zero
        break
      case SWAP_TYPE.EXACT_ETH_FOR_TOKENS:
        estimate = routerContract.estimate.swapExactETHForTokens
        method = routerContract.swapExactETHForTokens
        args = [slippageAdjustedAmountsRaw[Field.OUTPUT].toString(), path, account, deadline]
        value = hex(slippageAdjustedAmountsRaw[Field.INPUT])
        break
      case SWAP_TYPE.TOKENS_FOR_EXACT_ETH:
        estimate = routerContract.estimate.swapTokensForExactETH
        method = routerContract.swapTokensForExactETH
        args = [
          slippageAdjustedAmountsRaw[Field.OUTPUT].toString(),
          slippageAdjustedAmountsRaw[Field.INPUT].toString(),
          path,
          account,
          deadline
        ]
        value = ethers.constants.Zero
        break
      case SWAP_TYPE.EXACT_TOKENS_FOR_ETH:
        estimate = routerContract.estimate.swapExactTokensForETH
        method = routerContract.swapExactTokensForETH
        args = [
          slippageAdjustedAmountsRaw[Field.INPUT].toString(),
          slippageAdjustedAmountsRaw[Field.OUTPUT].toString(),
          path,
          account,
          deadline
        ]
        value = ethers.constants.Zero
        break
      case SWAP_TYPE.ETH_FOR_EXACT_TOKENS:
        estimate = routerContract.estimate.swapETHForExactTokens
        method = routerContract.swapETHForExactTokens
        args = [slippageAdjustedAmountsRaw[Field.OUTPUT].toString(), path, account, deadline]
        value = hex(slippageAdjustedAmountsRaw[Field.INPUT])
        break
    }

    const GAS_MARGIN = ethers.utils.bigNumberify(1000)

    const estimatedGasLimit = await estimate(...args, { value }).catch(e => {
      console.log('error getting gas limit')
    })

    method(...args, {
      value,
      gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
    })
      .then(response => {
        setTxHash(response)
        addTransaction(response)
        toggelPendingConfirmation(false)
      })
      .catch(e => {
        console.log('error when trying transaction')
        console.log(e)
        setShowConfirm(false)
      })
  }

  // errors
  const [inputError, setInputError] = useState()
  const [outputError, setOutputError] = useState()
  const [errorText, setErrorText] = useState(' ')
  const [isError, setIsError] = useState(false)

  // update errors live
  useEffect(() => {
    // reset errors
    setInputError(null)
    setOutputError(null)
    setIsError(false)
    if (showInputUnlock) {
      setInputError('Need to approve amount on input.')
    }
    if (
      userBalances[Field.INPUT] &&
      parsedAmounts[Field.INPUT] &&
      JSBI.lessThan(userBalances[Field.INPUT].raw, parsedAmounts[Field.INPUT]?.raw)
    ) {
      setInputError('Insufficient balance.')
      setIsError(true)
    }
  }, [parsedAmounts, showInputUnlock, userBalances])

  // set error text based on all errors
  useEffect(() => {
    setErrorText(null)
    if (!parsedAmounts[Field.INPUT]) {
      setErrorText('Enter an amount to continue')
    } else if (outputError) {
      setErrorText(outputError)
    } else if (inputError) {
      setErrorText(inputError)
      return
    }
  }, [inputError, outputError, parsedAmounts])

  // error state for button
  const isValid = !errorText

  return (
    <>
      <ConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => {
          setTxHash(null)
          setShowConfirm(false)
        }}
        amount0={parsedAmounts[Field.INPUT]}
        amount1={parsedAmounts[Field.OUTPUT]}
        price={route?.midPrice}
        transactionType={TRANSACTION_TYPE.SWAP}
        contractCall={onSwap}
        pendingConfirmation={pendingConfirmation}
        hash={txHash ? txHash.hash : ''}
      />
      <AutoColumn gap={'20px'}>
        <CurrencyInputPanel
          field={Field.INPUT}
          value={formattedAmounts[Field.INPUT]}
          onUserInput={onUserInput}
          onMax={() => {
            maxAmountInput && onMaxInput(maxAmountInput.toExact())
          }}
          atMax={atMaxAmountInput}
          token={tokens[Field.INPUT]}
          onTokenSelection={onTokenSelection}
          title={'Input'}
          error={inputError}
          exchange={exchange}
          showUnlock={showInputUnlock}
        />
        <ColumnCenter>
          <ArrowWrapper onClick={onSwapTokens}>
            <ArrowDown size="16" color="#2F80ED" />
            <ArrowUp size="16" color="#2F80ED" />
          </ArrowWrapper>
        </ColumnCenter>
        <CurrencyInputPanel
          field={Field.OUTPUT}
          value={formattedAmounts[Field.OUTPUT]}
          onUserInput={onUserInput}
          onMax={() => {
            maxAmountOutput && onMaxOutput(maxAmountOutput.toExact())
          }}
          atMax={atMaxAmountOutput}
          token={tokens[Field.OUTPUT]}
          onTokenSelection={onTokenSelection}
          title={'Output'}
          error={outputError}
          exchange={exchange}
          disableUnlock
        />
        <RowBetween>
          Rate:
          <div>
            {exchange
              ? `1 ${tokens[Field.INPUT].symbol} = ${route?.midPrice.toSignificant(6)} ${tokens[Field.OUTPUT].symbol}`
              : '-'}
          </div>
        </RowBetween>
        <ColumnCenter style={{ height: '20px' }}>
          <ErrorText fontSize={12} error={isError}>
            {errorText && errorText}
          </ErrorText>
        </ColumnCenter>
        <ButtonPrimary
          onClick={() => {
            setShowConfirm(true)
          }}
          disabled={!isValid}
        >
          <Text fontSize={20} fontWeight={500}>
            Swap
          </Text>
        </ButtonPrimary>
      </AutoColumn>
    </>
  )
}
