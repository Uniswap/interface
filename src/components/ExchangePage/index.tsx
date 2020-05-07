import React, { useState, useReducer, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { withRouter } from 'react-router-dom'
import { parseUnits, parseEther } from '@ethersproject/units'
import { WETH, TradeType, Pair, Trade, TokenAmount, JSBI, Percent } from '@uniswap/sdk'

import Copy from '../AccountDetails/Copy'
import TokenLogo from '../TokenLogo'
import SlippageTabs from '../SlippageTabs'
import QuestionHelper from '../Question'
import NumericalInput from '../NumericalInput'
import AddressInputPanel from '../AddressInputPanel'
import ConfirmationModal from '../ConfirmationModal'
import CurrencyInputPanel from '../CurrencyInputPanel'
// import BalanceCard from '../BalanceCard'

import { Link } from '../../theme/components'
import { Text } from 'rebass'
import { theme, TYPE, Hover } from '../../theme'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { RowBetween, RowFixed, AutoRow } from '../../components/Row'
import { ArrowDown, ChevronDown, ChevronUp, Repeat } from 'react-feather'
import { ButtonPrimary, ButtonError, ButtonLight } from '../Button'
import Card, { GreyCard, BlueCard, YellowCard } from '../../components/Card'

import { usePair } from '../../contexts/Pairs'
import { useRoute } from '../../contexts/Routes'
import { useAddressAllowance } from '../../contexts/Allowances'
import { useToken, useAllTokens } from '../../contexts/Tokens'
import { useWeb3React, useTokenContract } from '../../hooks'
import { useAddressBalance, useAllBalances } from '../../contexts/Balances'
import { useTransactionAdder, usePendingApproval } from '../../contexts/Transactions'
import { useUserAdvanced } from '../../contexts/Application'
import { ROUTER_ADDRESS } from '../../constants'
import { getRouterContract, calculateGasMargin, getProviderOrSigner, getEtherscanLink, isWETH } from '../../utils'
import { useLocalStorageTokens } from '../../contexts/LocalStorage'

const Wrapper = styled.div`
  position: relative;
`

const ArrowWrapper = styled.div`
  padding: 2px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;

  :hover {
    cursor: pointer;
    opacity: 0.8;
  }
`

const FixedBottom = styled.div`
  position: absolute;
  margin-top: 1.5rem;
  width: 100%;
  margin-bottom: 40px;
`

const AdvancedDropwdown = styled.div`
  position: absolute;
  margin-top: -12px;
  left: -16px;
  width: 355px;
  margin-bottom: 100px;
  padding: 10px 0;
  padding-top: 36px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  color: #565a69;
  background-color: rgba(237, 238, 242, 0.5);
  color: ${({ theme }) => theme.text2};
  z-index: -1;
`

const SectionBreak = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${({ theme }) => theme.bg3};
`

const BottomGrouping = styled.div`
  margin-top: 12px;
  position: relative;
`

const ErrorText = styled(Text)`
  color: ${({ theme, warningLow, warningMedium, warningHigh }) =>
    warningHigh ? theme.red1 : warningMedium ? theme.yellow2 : warningLow ? theme.green1 : theme.text1};
`

const InputGroup = styled(AutoColumn)`
  position: relative;
  padding: 40px 0 20px 0;
`

const StyledNumerical = styled(NumericalInput)`
  text-align: center;
  font-size: 48px;
  font-weight: 500px;
  width: 100%;

  ::placeholder {
    color: #edeef2;
  }
`

const MaxButton = styled.button`
  position: absolute;
  right: 70px;
  padding: 0.5rem 0.5rem;
  background-color: ${({ theme }) => theme.blue5};
  border: 1px solid ${({ theme }) => theme.blue5};
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  cursor: pointer;
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.blue1};
  :hover {
    border: 1px solid ${({ theme }) => theme.blue1};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.blue1};
    outline: none;
  }
`

const StyledBalanceMaxMini = styled.button`
  height: 24px;
  background-color: ${({ theme }) => theme.bg2};
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 400;
  margin-left: 6px;
  cursor: pointer;
  color: ${({ theme }) => theme.text2};
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  float: right;

  :hover {
    background-color: ${({ theme }) => theme.bg3};

    /* border: 1px solid ${({ theme, active }) => (active ? theme.bg2 : theme.blue4)}; */
  }
  :focus {
    background-color: ${({ theme }) => theme.bg3};
    /* border: 1px solid ${({ theme, active }) => (active ? theme.bg2 : theme.blue4)}; */
    outline: none;
  }
`

const TruncatedText = styled(Text)`
  text-overflow: ellipsis;
  width: 220px;
  overflow: hidden;
`

// styles
const Dots = styled.span`
  &::after {
    display: inline-block;
    animation: ellipsis 1.25s infinite;
    content: '.';
    width: 1em;
    text-align: left;
  }
  @keyframes ellipsis {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
  }
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

function initializeSwapState({ inputTokenAddress, outputTokenAddress, typedValue, independentField }): SwapState {
  return {
    independentField: independentField,
    typedValue: typedValue,
    [Field.INPUT]: {
      address: inputTokenAddress
    },
    [Field.OUTPUT]: {
      address: outputTokenAddress
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

function hex(value: JSBI) {
  return ethers.utils.bigNumberify(value.toString())
}

const SWAP_TYPE = {
  EXACT_TOKENS_FOR_TOKENS: 'EXACT_TOKENS_FOR_TOKENS',
  EXACT_TOKENS_FOR_ETH: 'EXACT_TOKENS_FOR_ETH',
  EXACT_ETH_FOR_TOKENS: 'EXACT_ETH_FOR_TOKENS',
  TOKENS_FOR_EXACT_TOKENS: 'TOKENS_FOR_EXACT_TOKENS',
  TOKENS_FOR_EXACT_ETH: 'TOKENS_FOR_EXACT_ETH',
  ETH_FOR_EXACT_TOKENS: 'ETH_FOR_EXACT_TOKENS'
}

const GAS_MARGIN = ethers.utils.bigNumberify(1000)

// default allowed slippage, in bips
const INITIAL_ALLOWED_SLIPPAGE = 50

// 15 minutes, denominated in seconds
const DEFAULT_DEADLINE_FROM_NOW = 60 * 20

// used for warning states based on slippage in bips
const ALLOWED_SLIPPAGE_MEDIUM = 100
const ALLOWED_SLIPPAGE_HIGH = 500

function ExchangePage({ sendingInput = false, history, params }) {
  // text translation
  // const { t } = useTranslation()

  const { chainId, account, library } = useWeb3React()

  // adding notifications on txns
  const addTransaction = useTransactionAdder()

  // sending state
  const [sending] = useState<boolean>(sendingInput)
  const [sendingWithSwap, setSendingWithSwap] = useState<boolean>(false)
  const [recipient, setRecipient] = useState<string>('')
  const [ENS, setENS] = useState<string>('')

  // trade details, check query params for initial state
  const [state, dispatch] = useReducer(
    reducer,
    {
      independentField: params.outputTokenAddress && !params.inputTokenAddress ? Field.OUTPUT : Field.INPUT,
      inputTokenAddress: params.inputTokenAddress ? params.inputTokenAddress : WETH[chainId].address,
      outputTokenAddress: params.outputTokenAddress ? params.outputTokenAddress : '',
      typedValue:
        params.inputTokenAddress && !params.outputTokenAddress
          ? params.inputTokenAmount
            ? params.inputTokenAmount
            : ''
          : !params.inputTokenAddress && params.outputTokenAddress
          ? params.outputTokenAmount
            ? params.outputTokenAmount
            : ''
          : params.inputTokenAddress && params.outputTokenAddress
          ? params.inputTokenAmount
            ? params.inputTokenAmount
            : ''
          : ''
          ? ''
          : ''
          ? ''
          : ''
    },
    initializeSwapState
  )

  const { independentField, typedValue, ...fieldData } = state
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT
  const tradeType: TradeType = independentField === Field.INPUT ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT
  const [tradeError, setTradeError] = useState<string>('') // error for things like reserve size or route

  const tokens = {
    [Field.INPUT]: useToken(fieldData[Field.INPUT].address),
    [Field.OUTPUT]: useToken(fieldData[Field.OUTPUT].address)
  }

  // ensure input + output tokens are added to localstorage
  const [, { fetchTokenByAddress, addToken }] = useLocalStorageTokens()
  const allTokens = useAllTokens()
  const inputTokenAddress = fieldData[Field.INPUT].address
  useEffect(() => {
    if (inputTokenAddress && !Object.keys(allTokens).some(tokenAddress => tokenAddress === inputTokenAddress)) {
      fetchTokenByAddress(inputTokenAddress).then(token => {
        if (token !== null) {
          addToken(token)
        }
      })
    }
  }, [inputTokenAddress, allTokens, fetchTokenByAddress, addToken])
  const outputTokenAddress = fieldData[Field.OUTPUT].address
  useEffect(() => {
    if (outputTokenAddress && !Object.keys(allTokens).some(tokenAddress => tokenAddress === outputTokenAddress)) {
      fetchTokenByAddress(outputTokenAddress).then(token => {
        if (token !== null) {
          addToken(token)
        }
      })
    }
  }, [outputTokenAddress, allTokens, fetchTokenByAddress, addToken])

  // token contracts for approvals and direct sends
  const tokenContractInput: ethers.Contract = useTokenContract(tokens[Field.INPUT]?.address)
  const tokenContractOutput: ethers.Contract = useTokenContract(tokens[Field.OUTPUT]?.address)

  // check on pending approvals for token amounts
  const pendingApprovalInput = usePendingApproval(tokens[Field.INPUT]?.address)

  // entities for swap
  const pair: Pair = usePair(tokens[Field.INPUT], tokens[Field.OUTPUT])
  const route = useRoute(tokens[Field.INPUT], tokens[Field.OUTPUT])

  // check for invalid selection
  const noRoute: boolean = !route && !!tokens[Field.INPUT] && !!tokens[Field.OUTPUT]

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirmed
  const [pendingConfirmation, setPendingConfirmation] = useState<boolean>(true) // waiting for user confirmation

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const [deadline, setDeadline] = useState<number>(DEFAULT_DEADLINE_FROM_NOW)
  const [allowedSlippage, setAllowedSlippage] = useState<number>(INITIAL_ALLOWED_SLIPPAGE)

  // input approval
  const inputApproval: TokenAmount = useAddressAllowance(account, tokens[Field.INPUT], ROUTER_ADDRESS)

  // all balances for detecting a swap with send
  const allBalances: TokenAmount[] = useAllBalances()

  // get user- and token-specific lookup data
  const userBalances = {
    [Field.INPUT]: useAddressBalance(account, tokens[Field.INPUT]),
    [Field.OUTPUT]: useAddressBalance(account, tokens[Field.OUTPUT])
  }

  const parsedAmounts: { [field: number]: TokenAmount } = {}
  if (typedValue !== '' && typedValue !== '.' && tokens[independentField]) {
    try {
      const typedValueParsed = parseUnits(typedValue, tokens[independentField].decimals).toString()
      if (typedValueParsed !== '0')
        parsedAmounts[independentField] = new TokenAmount(tokens[independentField], typedValueParsed)
    } catch (error) {
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
  } catch (error) {}

  const slippageFromTrade: Percent = trade && trade.slippage

  if (trade)
    parsedAmounts[dependentField] = tradeType === TradeType.EXACT_INPUT ? trade.outputAmount : trade.inputAmount

  const feeAsPercent = new Percent(JSBI.BigInt(3), JSBI.BigInt(1000))
  const feeTimesInputRaw =
    parsedAmounts[Field.INPUT] && feeAsPercent.multiply(JSBI.BigInt(parsedAmounts[Field.INPUT].raw))
  const feeTimesInputFormatted = feeTimesInputRaw && new TokenAmount(tokens[Field.INPUT], feeTimesInputRaw?.quotient)

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField] ? parsedAmounts[dependentField].toSignificant(8) : ''
  }

  const priceSlippage =
    slippageFromTrade &&
    new Percent(
      JSBI.subtract(
        JSBI.multiply(slippageFromTrade.numerator, JSBI.BigInt('1000')),
        JSBI.multiply(JSBI.BigInt('3'), slippageFromTrade.denominator)
      ),
      JSBI.multiply(slippageFromTrade.denominator, JSBI.BigInt('1000'))
    )

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

  // reset field if sending with with swap is cancled
  useEffect(() => {
    if (sending && !sendingWithSwap) {
      onTokenSelection(Field.OUTPUT, null)
    }
  }, [onTokenSelection, sending, sendingWithSwap])

  const MIN_ETHER: TokenAmount = chainId && new TokenAmount(WETH[chainId], JSBI.BigInt(parseEther('.01')))

  let maxAmountInput: TokenAmount

  try {
    maxAmountInput =
      !!userBalances[Field.INPUT] &&
      !!tokens[Field.INPUT] &&
      WETH[chainId] &&
      JSBI.greaterThan(userBalances[Field.INPUT].raw, isWETH(tokens[Field.INPUT]) ? MIN_ETHER.raw : JSBI.BigInt(0))
        ? isWETH(tokens[Field.INPUT])
          ? userBalances[Field.INPUT].subtract(MIN_ETHER)
          : userBalances[Field.INPUT]
        : undefined
  } catch {}

  const atMaxAmountInput: boolean =
    !!maxAmountInput && !!parsedAmounts[Field.INPUT]
      ? JSBI.equal(maxAmountInput.raw, parsedAmounts[Field.INPUT].raw)
      : undefined

  const maxAmountOutput: TokenAmount =
    !!userBalances[Field.OUTPUT] && JSBI.greaterThan(userBalances[Field.OUTPUT].raw, JSBI.BigInt(0))
      ? userBalances[Field.OUTPUT]
      : undefined

  const atMaxAmountOutput: boolean =
    !!maxAmountOutput && !!parsedAmounts[Field.OUTPUT]
      ? JSBI.equal(maxAmountOutput.raw, parsedAmounts[Field.OUTPUT].raw)
      : undefined

  function getSwapType(): string {
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

  function calculateSlippageAmount(value: TokenAmount): JSBI[] {
    if (value && value.raw) {
      const offset = JSBI.divide(JSBI.multiply(JSBI.BigInt(allowedSlippage), value.raw), JSBI.BigInt(10000))
      return [JSBI.subtract(value.raw, offset), JSBI.add(value.raw, offset)]
    }
    return null
  }

  const slippageAdjustedAmounts: { [field: number]: TokenAmount } = {
    [Field.INPUT]:
      Field.INPUT === independentField
        ? parsedAmounts[Field.INPUT]
        : calculateSlippageAmount(parsedAmounts[Field.INPUT])?.[0] &&
          new TokenAmount(tokens[Field.INPUT], calculateSlippageAmount(parsedAmounts[Field.INPUT])?.[1]),
    [Field.OUTPUT]:
      Field.OUTPUT === independentField
        ? parsedAmounts[Field.OUTPUT]
        : calculateSlippageAmount(parsedAmounts[Field.OUTPUT])?.[0] &&
          new TokenAmount(tokens[Field.INPUT], calculateSlippageAmount(parsedAmounts[Field.OUTPUT])?.[0])
  }

  const showInputApprove: boolean =
    parsedAmounts[Field.INPUT] && inputApproval && JSBI.greaterThan(parsedAmounts[Field.INPUT].raw, inputApproval.raw)

  // function for a pure send
  async function onSend() {
    setAttemptingTxn(true)

    const signer = await getProviderOrSigner(library, account)
    // get token contract if needed
    let estimate: Function, method: Function, args, value
    if (tokens[Field.INPUT] === WETH[chainId]) {
      (signer as any)
        .sendTransaction({ to: recipient.toString(), value: hex(parsedAmounts[Field.INPUT].raw) })
        .then(response => {
          setTxHash(response.hash)
          addTransaction(
            response,
            'Send ' +
              parsedAmounts[Field.INPUT]?.toSignificant(3) +
              ' ' +
              tokens[Field.INPUT]?.symbol +
              ' to ' +
              recipient
          )
          setPendingConfirmation(false)
        })
        .catch(() => {
          resetModal()
          setShowConfirm(false)
        })
    } else {
      estimate = tokenContractInput.estimate.transfer
      method = tokenContractInput.transfer
      args = [recipient, parsedAmounts[Field.INPUT].raw.toString()]
      value = ethers.constants.Zero
      const estimatedGasLimit = await estimate(...args, { value }).catch(e => {
        console.log('error getting gas limit')
      })
      method(...args, {
        value,
        gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
      })
        .then(response => {
          setTxHash(response.hash)
          addTransaction(
            response,
            'Send ' +
              parsedAmounts[Field.INPUT]?.toSignificant(3) +
              ' ' +
              tokens[Field.INPUT]?.symbol +
              ' to ' +
              recipient
          )
          setPendingConfirmation(false)
        })
        .catch(() => {
          resetModal()
          setShowConfirm(false)
        })
    }
  }

  // covers swap or swap with send
  async function onSwap() {
    const routerContract: ethers.Contract = getRouterContract(chainId, library, account)

    setAttemptingTxn(true) // mark that user is attempting transaction

    const path = Object.keys(route.path).map(key => {
      return route.path[key].address
    })
    let estimate: Function, method: Function, args: any[], value: ethers.utils.BigNumber
    const deadlineFromNow: number = Math.ceil(Date.now() / 1000) + deadline

    const swapType = getSwapType()
    switch (swapType) {
      case SWAP_TYPE.EXACT_TOKENS_FOR_TOKENS:
        estimate = routerContract.estimate.swapExactTokensForTokens
        method = routerContract.swapExactTokensForTokens
        args = [
          slippageAdjustedAmounts[Field.INPUT].raw.toString(),
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          path,
          sending ? recipient : account,
          deadlineFromNow
        ]
        value = ethers.constants.Zero
        break
      case SWAP_TYPE.TOKENS_FOR_EXACT_TOKENS:
        estimate = routerContract.estimate.swapTokensForExactTokens
        method = routerContract.swapTokensForExactTokens
        args = [
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          slippageAdjustedAmounts[Field.INPUT].raw.toString(),
          path,
          sending ? recipient : account,
          deadlineFromNow
        ]
        value = ethers.constants.Zero
        break
      case SWAP_TYPE.EXACT_ETH_FOR_TOKENS:
        estimate = routerContract.estimate.swapExactETHForTokens
        method = routerContract.swapExactETHForTokens
        args = [
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          path,
          sending ? recipient : account,
          deadlineFromNow
        ]
        value = hex(slippageAdjustedAmounts[Field.INPUT].raw)
        break
      case SWAP_TYPE.TOKENS_FOR_EXACT_ETH:
        estimate = routerContract.estimate.swapTokensForExactETH
        method = routerContract.swapTokensForExactETH
        args = [
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          slippageAdjustedAmounts[Field.INPUT].raw.toString(),
          path,
          sending ? recipient : account,
          deadlineFromNow
        ]
        value = ethers.constants.Zero
        break
      case SWAP_TYPE.EXACT_TOKENS_FOR_ETH:
        estimate = routerContract.estimate.swapExactTokensForETH
        method = routerContract.swapExactTokensForETH
        args = [
          slippageAdjustedAmounts[Field.INPUT].raw.toString(),
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          path,
          sending ? recipient : account,
          deadlineFromNow
        ]
        value = ethers.constants.Zero
        break
      case SWAP_TYPE.ETH_FOR_EXACT_TOKENS:
        estimate = routerContract.estimate.swapETHForExactTokens
        method = routerContract.swapETHForExactTokens
        args = [
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          path,
          sending ? recipient : account,
          deadlineFromNow
        ]
        value = hex(slippageAdjustedAmounts[Field.INPUT].raw)
        break
    }

    const estimatedGasLimit = await estimate(...args, { value }).catch(e => {
      console.log(e)
    })

    method(...args, {
      value,
      gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
    })
      .then(response => {
        setTxHash(response.hash)
        addTransaction(
          response,
          'Swap ' +
            slippageAdjustedAmounts?.[Field.INPUT]?.toSignificant(3) +
            ' ' +
            tokens[Field.INPUT]?.symbol +
            ' for ' +
            slippageAdjustedAmounts?.[Field.OUTPUT]?.toSignificant(3) +
            ' ' +
            tokens[Field.OUTPUT]?.symbol
        )
        setPendingConfirmation(false)
      })
      .catch(() => {
        resetModal()
        setShowConfirm(false)
      })
  }

  async function approveAmount(field: Field) {
    let estimatedGas
    let useUserBalance = false
    const tokenContract = field === Field.INPUT ? tokenContractInput : tokenContractOutput

    estimatedGas = await tokenContract.estimate.approve(ROUTER_ADDRESS, ethers.constants.MaxUint256).catch(e => {
      console.log('Error setting max token approval.')
    })
    if (!estimatedGas) {
      // general fallback for tokens who restrict approval amounts
      estimatedGas = await tokenContract.estimate.approve(ROUTER_ADDRESS, userBalances[field])
      useUserBalance = true
    }
    tokenContract
      .approve(ROUTER_ADDRESS, useUserBalance ? userBalances[field] : ethers.constants.MaxUint256, {
        gasLimit: calculateGasMargin(estimatedGas, GAS_MARGIN)
      })
      .then(response => {
        addTransaction(response, 'Approve ' + tokens[field]?.symbol, { approval: tokens[field]?.address })
      })
  }

  // errors
  const [generalError, setGeneralError] = useState<string>('')
  const [inputError, setInputError] = useState<string>('')
  const [outputError, setOutputError] = useState<string>('')
  const [recipientError, setRecipientError] = useState<string>('')
  const [isValid, setIsValid] = useState<boolean>(false)

  const ignoreOutput: boolean = sending ? !sendingWithSwap : false
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const advanced = useUserAdvanced()

  useEffect(() => {
    // reset errors
    setGeneralError(null)
    setInputError(null)
    setOutputError(null)
    setTradeError(null)
    setIsValid(true)

    if (recipientError) {
      setIsValid(false)
    }

    if (!parsedAmounts[Field.INPUT]) {
      setInputError('Enter an amount')
      setIsValid(false)
    }

    if (!parsedAmounts[Field.OUTPUT] && !ignoreOutput) {
      setOutputError('Enter an amount')
      setIsValid(false)
    }

    if (
      parsedAmounts[Field.INPUT] &&
      pair &&
      route &&
      JSBI.greaterThan(parsedAmounts[Field.INPUT].raw, route.pairs[0].reserveOf(tokens[Field.INPUT]).raw)
    ) {
      setTradeError('Insufficient Liquidity')
      setIsValid(false)
    }

    if (
      !ignoreOutput &&
      parsedAmounts[Field.OUTPUT] &&
      pair &&
      route &&
      JSBI.greaterThan(
        parsedAmounts[Field.OUTPUT].raw,
        route.pairs[route.pairs.length - 1].reserveOf(tokens[Field.OUTPUT]).raw
      )
    ) {
      setTradeError('Insufficient Liquidity')
      setIsValid(false)
    }

    if (
      userBalances[Field.INPUT] &&
      parsedAmounts[Field.INPUT] &&
      JSBI.lessThan(userBalances[Field.INPUT].raw, parsedAmounts[Field.INPUT]?.raw)
    ) {
      setInputError('Insufficient ' + tokens[Field.INPUT]?.symbol + ' balance')
      setIsValid(false)
    }

    // check for null trade entitiy if not enough balance for trade
    if (
      (!sending || sendingWithSwap) &&
      userBalances[Field.INPUT] &&
      !trade &&
      parsedAmounts[independentField] &&
      !parsedAmounts[dependentField] &&
      tokens[dependentField]
    ) {
      setInputError('Insufficient ' + tokens[Field.INPUT]?.symbol + ' balance')
      setIsValid(false)
    }
  }, [
    sending,
    sendingWithSwap,
    dependentField,
    ignoreOutput,
    independentField,
    pair,
    parsedAmounts,
    recipientError,
    route,
    tokens,
    trade,
    userBalances
  ])

  // warnings on slippage
  const warningLow: boolean =
    slippageFromTrade &&
    parseFloat(slippageFromTrade.toFixed(4)) < ALLOWED_SLIPPAGE_MEDIUM / 100 &&
    parseFloat(slippageFromTrade.toFixed(4)) > 0
  const warningMedium: boolean =
    slippageFromTrade && parseFloat(slippageFromTrade.toFixed(4)) > ALLOWED_SLIPPAGE_MEDIUM / 100
  const warningHigh: boolean =
    slippageFromTrade && parseFloat(slippageFromTrade.toFixed(4)) > ALLOWED_SLIPPAGE_HIGH / 100

  // reset modal state when closed
  function resetModal() {
    // clear input if txn submitted
    if (!pendingConfirmation) {
      onUserInput(Field.INPUT, '')
    }
    setPendingConfirmation(true)
    setAttemptingTxn(false)
    setShowAdvanced(false)
  }

  function modalHeader() {
    if (sending && !sendingWithSwap) {
      return (
        <AutoColumn gap="lg" style={{ marginTop: '40px' }}>
          <RowBetween>
            <Text fontSize={36} fontWeight={500}>
              {parsedAmounts[Field.INPUT]?.toSignificant(6)} {tokens[Field.INPUT]?.symbol}
            </Text>
            <TokenLogo address={tokens[Field.INPUT]?.address} size={'30px'} />
          </RowBetween>
          <TYPE.darkGray fontSize={20}>To</TYPE.darkGray>
          {ENS ? (
            <AutoColumn gap="lg">
              <TYPE.blue fontSize={36}>{ENS}</TYPE.blue>
              <AutoRow gap="10px">
                <Link href={getEtherscanLink(chainId, ENS, 'address')}>
                  <TYPE.blue fontSize={18}>
                    {recipient?.slice(0, 8)}...{recipient?.slice(34, 42)}↗
                  </TYPE.blue>
                </Link>
                <Copy toCopy={recipient} />
              </AutoRow>
            </AutoColumn>
          ) : (
            <AutoRow gap="10px">
              <Link href={getEtherscanLink(chainId, ENS, 'address')}>
                <TYPE.blue fontSize={36}>
                  {recipient?.slice(0, 6)}...{recipient?.slice(36, 42)}↗
                </TYPE.blue>
              </Link>
              <Copy toCopy={recipient} />
            </AutoRow>
          )}
        </AutoColumn>
      )
    }

    if (sending && sendingWithSwap) {
      return (
        <AutoColumn gap="lg" style={{ marginTop: '40px' }}>
          <AutoColumn gap="sm">
            <AutoRow gap="10px">
              <TokenLogo address={tokens[Field.OUTPUT]?.address} size={'30px'} />
              <Text fontSize={36} fontWeight={500}>
                {slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4)} {tokens[Field.OUTPUT]?.symbol}
              </Text>
            </AutoRow>
            <BlueCard>
              Via {parsedAmounts[Field.INPUT]?.toSignificant(4)} {tokens[Field.INPUT]?.symbol} swap
            </BlueCard>
          </AutoColumn>
          <AutoColumn gap="sm">
            <TYPE.darkGray fontSize={20}>To</TYPE.darkGray>
            <TYPE.blue fontSize={36}>
              {recipient?.slice(0, 6)}...{recipient?.slice(36, 42)}
            </TYPE.blue>
          </AutoColumn>
        </AutoColumn>
      )
    }

    if (!sending) {
      return (
        <AutoColumn gap={'sm'} style={{ marginTop: '20px' }}>
          <RowBetween align="flex-end">
            <TruncatedText fontSize={24} fontWeight={500}>
              {!!formattedAmounts[Field.INPUT] && formattedAmounts[Field.INPUT]}
              {/* {!!slippageAdjustedAmounts[Field.INPUT] && slippageAdjustedAmounts[Field.INPUT].toSignificant(6)} */}
            </TruncatedText>
            <RowFixed gap="4px">
              <TokenLogo address={tokens[Field.INPUT]?.address} size={'24px'} />
              <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
                {tokens[Field.INPUT]?.symbol || ''}
              </Text>
            </RowFixed>
          </RowBetween>
          <RowFixed>
            <ArrowDown size="16" color={'#888D9B'} />
          </RowFixed>
          <RowBetween align="flex-end">
            <TruncatedText fontSize={24} fontWeight={500} color={warningHigh ? '#FF6871' : ''}>
              {!!formattedAmounts[Field.OUTPUT] && formattedAmounts[Field.OUTPUT]}

              {/* {!!slippageAdjustedAmounts[Field.OUTPUT] && slippageAdjustedAmounts[Field.OUTPUT].toSignificant(6)} */}
            </TruncatedText>
            <RowFixed gap="4px">
              <TokenLogo address={tokens[Field.OUTPUT]?.address} size={'24px'} />
              <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
                {tokens[Field.OUTPUT]?.symbol || ''}
              </Text>
            </RowFixed>
          </RowBetween>
          <AutoColumn justify="flex-start" gap="sm" padding={'20px 0 0 0px'}>
            {independentField === Field.INPUT ? (
              <TYPE.italic textAlign="left" style={{ width: '100%', paddingTop: '.5rem' }}>
                {`Output is estimated. You will receive at least `}
                <b>
                  {slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(6)} {tokens[Field.OUTPUT]?.symbol}{' '}
                </b>{' '}
                {` or the transaction will revert.`}
              </TYPE.italic>
            ) : (
              <TYPE.italic textAlign="left" style={{ width: '100%', paddingTop: '.5rem' }}>
                {`Input is estimated. You will sell at most `}{' '}
                <b>
                  {slippageAdjustedAmounts[Field.INPUT]?.toSignificant(6)} {tokens[Field.INPUT]?.symbol}
                </b>
                {` or the transaction will revert.`}
              </TYPE.italic>
            )}
          </AutoColumn>
        </AutoColumn>
      )
    }
  }

  function modalBottom() {
    if (sending && !sendingWithSwap) {
      return (
        <AutoColumn>
          <ButtonPrimary onClick={onSend}>
            <Text color="white" fontSize={20}>
              Confirm send
            </Text>
          </ButtonPrimary>
        </AutoColumn>
      )
    }

    if (!sending || (sending && sendingWithSwap)) {
      return (
        <>
          <AutoColumn gap="0px">
            {!noRoute && tokens[Field.OUTPUT] && tokens[Field.INPUT] && (
              <RowBetween align="center" justify="center">
                <Text fontWeight={400} fontSize={14} color={theme().text1}>
                  Price
                </Text>
                <Text
                  fontWeight={500}
                  fontSize={14}
                  color={theme().text1}
                  style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
                >
                  {pair && showInverted
                    ? route.midPrice.invert().toSignificant(6) +
                      ' ' +
                      tokens[Field.INPUT]?.symbol +
                      ' / ' +
                      tokens[Field.OUTPUT]?.symbol
                    : route.midPrice.toSignificant(6) +
                      ' ' +
                      tokens[Field.OUTPUT]?.symbol +
                      ' / ' +
                      tokens[Field.INPUT]?.symbol}
                  <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
                    <Repeat size={14} />
                  </StyledBalanceMaxMini>
                </Text>
              </RowBetween>
            )}
            <RowBetween>
              <RowFixed>
                <TYPE.black fontSize={14} fontWeight={400}>
                  {independentField === Field.INPUT ? (sending ? 'Min sent' : 'Minimum received') : 'Maximum sold'}
                </TYPE.black>
                <QuestionHelper text="A boundary is set so you are protected from large price movements after you submit your trade." />
              </RowFixed>
              <RowFixed>
                <TYPE.black fontSize={14}>
                  {independentField === Field.INPUT
                    ? slippageAdjustedAmounts[Field.OUTPUT]
                      ? slippageAdjustedAmounts[Field.OUTPUT]?.toFixed(5) === '0.00000'
                        ? '<0.00001'
                        : slippageAdjustedAmounts[Field.OUTPUT]?.toFixed(5)
                      : '-'
                    : slippageAdjustedAmounts[Field.INPUT]
                    ? slippageAdjustedAmounts[Field.INPUT]?.toFixed(5) === '0.00000'
                      ? '<0.00001'
                      : slippageAdjustedAmounts[Field.INPUT]?.toFixed(5)
                    : '-'}
                </TYPE.black>
                {parsedAmounts[Field.OUTPUT] && parsedAmounts[Field.INPUT] && (
                  <TYPE.black fontSize={14} marginLeft={'4px'}>
                    {independentField === Field.INPUT
                      ? parsedAmounts[Field.OUTPUT] && tokens[Field.OUTPUT]?.symbol
                      : parsedAmounts[Field.INPUT] && tokens[Field.INPUT]?.symbol}
                  </TYPE.black>
                )}
              </RowFixed>
            </RowBetween>
            <RowBetween>
              <RowFixed>
                <TYPE.black fontSize={14} fontWeight={400}>
                  Price impact
                </TYPE.black>
                <QuestionHelper text="The difference between the market price and your price due to trade size." />
              </RowFixed>
              <ErrorText
                fontWeight={500}
                fontSize={14}
                warningLow={warningLow}
                warningMedium={warningMedium}
                warningHigh={warningHigh}
              >
                {priceSlippage
                  ? priceSlippage.toFixed(4) === '0.0000'
                    ? '<0.0001%'
                    : priceSlippage.toFixed(4) + '%'
                  : '-'}
              </ErrorText>
            </RowBetween>
            <RowBetween>
              <RowFixed>
                <TYPE.black fontSize={14} fontWeight={400}>
                  Liquidity Provider Fee
                </TYPE.black>
                <QuestionHelper text="A portion of each trade (0.3%) goes to liquidity providers to incentivize liquidity on the protocol." />
              </RowFixed>
              <TYPE.black fontSize={14}>
                {feeTimesInputFormatted
                  ? feeTimesInputFormatted?.toSignificant(6) + ' ' + tokens[Field.INPUT]?.symbol
                  : '-'}
              </TYPE.black>
            </RowBetween>
          </AutoColumn>

          <AutoRow>
            <ButtonError onClick={onSwap} error={!!warningHigh} style={{ margin: '10px 0 0 0' }}>
              <Text fontSize={20} fontWeight={500}>
                {warningHigh ? (sending ? 'Send Anyway' : 'Swap Anyway') : sending ? 'Confirm Send' : 'Confirm Swap'}
              </Text>
            </ButtonError>
          </AutoRow>
        </>
      )
    }
  }

  const PriceBar = function() {
    return (
      <AutoRow justify="space-between">
        <AutoColumn justify="center">
          <Text fontWeight={500} fontSize={16} color={theme().text2}>
            {pair ? `${route.midPrice.toSignificant(6)} ` : '-'}
          </Text>
          <Text fontWeight={500} fontSize={16} color={theme().text3} pt={1}>
            {tokens[Field.OUTPUT]?.symbol} / {tokens[Field.INPUT]?.symbol}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <Text fontWeight={500} fontSize={16} color={theme().text2}>
            {pair ? `${route.midPrice.invert().toSignificant(6)} ` : '-'}
          </Text>
          <Text fontWeight={500} fontSize={16} color={theme().text3} pt={1}>
            {tokens[Field.INPUT]?.symbol} / {tokens[Field.OUTPUT]?.symbol}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <ErrorText
            fontWeight={500}
            fontSize={16}
            warningLow={warningLow}
            warningMedium={warningMedium}
            warningHigh={warningHigh}
          >
            {priceSlippage
              ? priceSlippage.toFixed(4) === '0.0000'
                ? '<0.0001%'
                : priceSlippage.toFixed(4) + '%'
              : '-'}
          </ErrorText>
          <Text fontWeight={500} fontSize={16} color={theme().text3} pt={1}>
            Price Impact
          </Text>
        </AutoColumn>
      </AutoRow>
    )
  }

  // text to show while loading
  const pendingText: string = sending
    ? sendingWithSwap
      ? `Sending ${parsedAmounts[Field.OUTPUT]?.toSignificant(6)} ${tokens[Field.OUTPUT]?.symbol} to ${recipient}`
      : `Sending ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${tokens[Field.INPUT]?.symbol} to ${recipient}`
    : ` Swapping ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${tokens[Field.INPUT]?.symbol} for ${parsedAmounts[
        Field.OUTPUT
      ]?.toSignificant(6)} ${tokens[Field.OUTPUT]?.symbol}`

  function _onTokenSelect(address: string) {
    const balance = allBalances?.[account]?.[address]
    // if no user balance - switch view to a send with swap
    const hasBalance = balance && JSBI.greaterThan(balance.raw, JSBI.BigInt(0))
    if (!hasBalance && sending) {
      onTokenSelection(Field.INPUT, null)
      onTokenSelection(Field.OUTPUT, address)
      setSendingWithSwap(true)
    } else {
      onTokenSelection(Field.INPUT, address)
    }
  }

  function _onRecipient(result) {
    if (result.address) {
      setRecipient(result.address)
    } else {
      setRecipient('')
    }
    if (result.name) {
      setENS(result.name)
    }
  }

  return (
    <Wrapper>
      <ConfirmationModal
        isOpen={showConfirm}
        title={sendingWithSwap ? 'Confirm swap and send' : sending ? 'Confirm Send' : 'Confirm Swap'}
        onDismiss={() => {
          resetModal()
          setShowConfirm(false)
        }}
        attemptingTxn={attemptingTxn}
        pendingConfirmation={pendingConfirmation}
        hash={txHash}
        topContent={modalHeader}
        bottomContent={modalBottom}
        pendingText={pendingText}
      />
      {sending && !sendingWithSwap && (
        <>
          <InputGroup gap="lg" justify="center">
            {!atMaxAmountInput && (
              <MaxButton
                onClick={() => {
                  maxAmountInput && onMaxInput(maxAmountInput.toExact())
                }}
              >
                Max
              </MaxButton>
            )}
            <StyledNumerical value={formattedAmounts[Field.INPUT]} onUserInput={val => onUserInput(Field.INPUT, val)} />
            <CurrencyInputPanel
              field={Field.INPUT}
              value={formattedAmounts[Field.INPUT]}
              onUserInput={val => onUserInput(Field.INPUT, val)}
              onMax={() => {
                maxAmountInput && onMaxInput(maxAmountInput.toExact())
              }}
              atMax={atMaxAmountInput}
              token={tokens[Field.INPUT]}
              onTokenSelection={address => _onTokenSelect(address)}
              error={inputError}
              pair={pair}
              hideBalance={true}
              hideInput={true}
              showSendWithSwap={true}
              advanced={advanced}
              label={''}
              otherSelectedTokenAddress={tokens[Field.OUTPUT]?.address}
            />
          </InputGroup>
        </>
      )}
      <AutoColumn gap={'md'}>
        {(!sending || sendingWithSwap) && (
          <>
            <CurrencyInputPanel
              field={Field.INPUT}
              label={'From'}
              value={formattedAmounts[Field.INPUT]}
              atMax={atMaxAmountInput}
              token={tokens[Field.INPUT]}
              error={inputError}
              pair={pair}
              advanced={advanced}
              onUserInput={onUserInput}
              onMax={() => {
                maxAmountInput && onMaxInput(maxAmountInput.toExact())
              }}
              onTokenSelection={address => onTokenSelection(Field.INPUT, address)}
              otherSelectedTokenAddress={tokens[Field.OUTPUT]?.address}
            />
            {sendingWithSwap ? (
              <ColumnCenter>
                <RowBetween padding="0 12px">
                  <ArrowWrapper onClick={onSwapTokens}>
                    <ArrowDown size="16" color="#ff007a" onClick={onSwapTokens} />
                  </ArrowWrapper>
                  <StyledBalanceMaxMini onClick={() => setSendingWithSwap(false)} style={{ marginRight: '0px' }}>
                    <TYPE.blue>Remove Swap</TYPE.blue>
                  </StyledBalanceMaxMini>
                </RowBetween>
              </ColumnCenter>
            ) : (
              <Hover>
                <ColumnCenter padding="0 1rem">
                  <ArrowWrapper>
                    <ArrowDown
                      size="16"
                      onClick={onSwapTokens}
                      color={tokens[Field.INPUT] && tokens[Field.OUTPUT] ? '#ff007a' : '#888D9B'}
                    />
                  </ArrowWrapper>
                </ColumnCenter>
              </Hover>
            )}
            <CurrencyInputPanel
              field={Field.OUTPUT}
              value={formattedAmounts[Field.OUTPUT]}
              onUserInput={onUserInput}
              onMax={() => {
                maxAmountOutput && onMaxOutput(maxAmountOutput.toExact())
              }}
              label={'To'}
              atMax={atMaxAmountOutput}
              token={tokens[Field.OUTPUT]}
              onTokenSelection={address => onTokenSelection(Field.OUTPUT, address)}
              error={outputError}
              pair={pair}
              advanced={advanced}
              otherSelectedTokenAddress={tokens[Field.INPUT]?.address}
            />
            {sendingWithSwap && (
              <RowBetween padding="0 12px">
                <ArrowDown size="16" />
              </RowBetween>
            )}
          </>
        )}

        {sending && (
          <AutoColumn gap="lg">
            {!sendingWithSwap && (
              <Hover onClick={() => setSendingWithSwap(true)}>
                <TYPE.blue textAlign="center">Add a swap +</TYPE.blue>
              </Hover>
            )}
            <AddressInputPanel
              onChange={_onRecipient}
              onError={(error: boolean, input) => {
                if (error && input !== '') {
                  setRecipientError('Invalid Recipient')
                } else if (error && input === '') {
                  setRecipientError('Enter a Recipient')
                } else {
                  setRecipientError(null)
                }
              }}
            />
          </AutoColumn>
        )}
        {!noRoute && tokens[Field.OUTPUT] && tokens[Field.INPUT] && (
          <Card padding={advanced ? '.25rem 1.25rem 0 .75rem' : '.25rem .7rem .25rem 1.25rem'} borderRadius={'20px'}>
            {advanced ? (
              <PriceBar />
            ) : (
              <AutoColumn gap="4px">
                {' '}
                <RowBetween align="center" justify="center">
                  <Text fontWeight={500} fontSize={14} color={theme().text2}>
                    Price
                  </Text>
                  <Text
                    fontWeight={500}
                    fontSize={14}
                    color={theme().text2}
                    style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
                  >
                    {pair && showInverted
                      ? route.midPrice.invert().toSignificant(6) +
                        ' ' +
                        tokens[Field.INPUT]?.symbol +
                        ' per ' +
                        tokens[Field.OUTPUT]?.symbol
                      : route.midPrice.toSignificant(6) +
                        ' ' +
                        tokens[Field.OUTPUT]?.symbol +
                        ' per ' +
                        tokens[Field.INPUT]?.symbol}
                    <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
                      <Repeat size={14} />
                    </StyledBalanceMaxMini>
                  </Text>
                </RowBetween>
                {pair && (warningHigh || warningMedium) && (
                  <RowBetween>
                    <TYPE.main
                      style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
                      fontSize={14}
                    >
                      Price Impact
                    </TYPE.main>
                    <RowFixed>
                      <ErrorText fontWeight={500} fontSize={14} warningMedium={warningMedium} warningHigh={warningHigh}>
                        {priceSlippage
                          ? priceSlippage.toFixed(4) === '0.0000'
                            ? '<0.0001%'
                            : priceSlippage.toFixed(4) + '%'
                          : '-'}{' '}
                      </ErrorText>
                      <QuestionHelper text="The difference between the market price and your quoted price due to trade size." />
                    </RowFixed>
                  </RowBetween>
                )}
              </AutoColumn>
            )}
          </Card>
        )}
      </AutoColumn>
      <BottomGrouping>
        {noRoute ? (
          <GreyCard style={{ textAlign: 'center' }}>
            <TYPE.main>No path found.</TYPE.main>

            <Link
              onClick={() => {
                history.push('/add/' + tokens[Field.INPUT]?.address + '-' + tokens[Field.OUTPUT]?.address)
              }}
            >
              {' '}
              Create one now
            </Link>
          </GreyCard>
        ) : showInputApprove && !inputError ? (
          <ButtonLight
            onClick={() => {
              approveAmount(Field.INPUT)
            }}
            disabled={pendingApprovalInput}
          >
            {pendingApprovalInput ? (
              <Dots>Approving {tokens[Field.INPUT]?.symbol}</Dots>
            ) : (
              'Approve ' + tokens[Field.INPUT]?.symbol
            )}
          </ButtonLight>
        ) : (
          <ButtonError
            onClick={() => {
              setShowConfirm(true)
            }}
            disabled={!isValid}
            error={!!warningHigh}
          >
            <Text fontSize={20} fontWeight={500}>
              {!account
                ? 'Connect Wallet'
                : generalError
                ? generalError
                : inputError
                ? inputError
                : outputError
                ? outputError
                : recipientError
                ? recipientError
                : tradeError
                ? tradeError
                : warningHigh
                ? sendingWithSwap
                  ? 'Send Anyway'
                  : 'Swap Anyway'
                : sending
                ? 'Send'
                : 'Swap'}
            </Text>
          </ButtonError>
        )}
      </BottomGrouping>
      {tokens[Field.INPUT] && tokens[Field.OUTPUT] && !noRoute && (
        <AdvancedDropwdown>
          {!showAdvanced && (
            <Hover>
              <RowBetween onClick={() => setShowAdvanced(true)} padding={'8px 20px'}>
                <Text fontSize={16} fontWeight={500} style={{ userSelect: 'none' }}>
                  Show Advanced
                </Text>
                <ChevronDown color={'#565A69'} />
              </RowBetween>
            </Hover>
          )}
          {showAdvanced && (
            <AutoColumn gap="md">
              <Hover>
                <RowBetween onClick={() => setShowAdvanced(false)} padding={'8px 20px'}>
                  <Text fontSize={16} color="#565A69" fontWeight={500} style={{ userSelect: 'none' }}>
                    Hide Advanced
                  </Text>
                  <ChevronUp color="#565A69" />
                </RowBetween>
              </Hover>
              <SectionBreak />
              <AutoColumn style={{ padding: '0 20px' }}>
                <RowBetween>
                  <RowFixed>
                    <TYPE.black fontSize={14} fontWeight={400}>
                      {independentField === Field.INPUT
                        ? sending
                          ? 'Minimum sent'
                          : 'Minimum received'
                        : 'Maximum sold'}
                    </TYPE.black>
                    <QuestionHelper
                      text={
                        independentField === Field.INPUT
                          ? sending
                            ? 'Price can change between when a transaction is submitted and when it is executed. This is the minimum amount you will send. A worse rate will cause your transaction to revert.'
                            : 'Price can change between when a transaction is submitted and when it is executed. This is the minimum amount you will receive. A worse rate will cause your transaction to revert.'
                          : 'Price can change between when a transaction is submitted and when it is executed. This is the maximum amount you will pay. A worse rate will cause your transaction to revert.'
                      }
                    />
                  </RowFixed>
                  <RowFixed>
                    <TYPE.black fontSize={14}>
                      {independentField === Field.INPUT
                        ? slippageAdjustedAmounts[Field.OUTPUT]
                          ? slippageAdjustedAmounts[Field.OUTPUT]?.toFixed(5) === '0.00000'
                            ? '<0.00001'
                            : slippageAdjustedAmounts[Field.OUTPUT]?.toFixed(5)
                          : '-'
                        : slippageAdjustedAmounts[Field.INPUT]
                        ? slippageAdjustedAmounts[Field.INPUT]?.toFixed(5) === '0.00000'
                          ? '<0.00001'
                          : slippageAdjustedAmounts[Field.INPUT]?.toFixed(5)
                        : '-'}
                    </TYPE.black>
                    {parsedAmounts[Field.OUTPUT] && parsedAmounts[Field.INPUT] && (
                      <TYPE.black fontSize={14} marginLeft={'4px'}>
                        {independentField === Field.INPUT
                          ? parsedAmounts[Field.OUTPUT] && tokens[Field.OUTPUT]?.symbol
                          : parsedAmounts[Field.INPUT] && tokens[Field.INPUT]?.symbol}
                      </TYPE.black>
                    )}
                  </RowFixed>
                </RowBetween>
                <RowBetween>
                  <RowFixed>
                    <TYPE.black fontSize={14} fontWeight={400}>
                      Price Impact
                    </TYPE.black>
                    <QuestionHelper text="The difference between the market price and trade price due to trade size and available liquidity." />
                  </RowFixed>
                  <ErrorText
                    fontWeight={500}
                    fontSize={14}
                    warningLow={warningLow}
                    warningMedium={warningMedium}
                    warningHigh={warningHigh}
                  >
                    {priceSlippage
                      ? priceSlippage.toFixed(4) === '0.0000'
                        ? '<0.0001%'
                        : priceSlippage.toFixed(4) + '%'
                      : '-'}
                  </ErrorText>
                </RowBetween>
                <RowBetween>
                  <RowFixed>
                    <TYPE.black fontSize={14} fontWeight={400}>
                      Liquidity Provider Fee
                    </TYPE.black>
                    <QuestionHelper text="A small fee on every trade provides an incentive for liquidity providers to participate in the Uniswap protocol." />
                  </RowFixed>
                  <TYPE.black fontSize={14}>
                    {feeTimesInputFormatted
                      ? feeTimesInputFormatted?.toSignificant(6) + ' ' + tokens[Field.INPUT]?.symbol
                      : '-'}
                  </TYPE.black>
                </RowBetween>
              </AutoColumn>
              <SectionBreak />
              <RowFixed padding={'0 20px'}>
                <TYPE.black fontWeight={400} fontSize={14}>
                  Set front running resistance
                </TYPE.black>
                <QuestionHelper text="Your transaction will revert if the price changes more than this amount after you submit a trade." />
              </RowFixed>
              <SlippageTabs
                rawSlippage={allowedSlippage}
                setRawSlippage={setAllowedSlippage}
                deadline={deadline}
                setDeadline={setDeadline}
              />
            </AutoColumn>
          )}
          <FixedBottom>
            <AutoColumn gap="lg">
              {warningHigh && (
                <YellowCard style={{ padding: '20px', paddingTop: '10px' }}>
                  <AutoColumn gap="md" mt={2}>
                    <RowBetween>
                      <RowFixed style={{ paddingTop: '8px' }}>
                        <span role="img" aria-label="warning">
                          ⚠️
                        </span>{' '}
                        <Text fontWeight={500} marginLeft="4px">
                          Price Warning
                        </Text>
                      </RowFixed>
                    </RowBetween>
                    <Text lineHeight="145.23%;" fontSize={16} fontWeight={400}>
                      This trade will move the price by {slippageFromTrade.toFixed(2)}%. This pool probably doesn’t have
                      enough liquidity to support this trade.
                    </Text>
                  </AutoColumn>
                </YellowCard>
              )}
              {/* <BalanceCard
                token0={tokens[Field.INPUT]}
                token1={tokens[Field.OUTPUT]}
                import0={importedTokenInput}
                balance0={userBalances[Field.INPUT]}
                balance1={userBalances[Field.OUTPUT]}
                import1={importedTokenOutput}
              /> */}
            </AutoColumn>
          </FixedBottom>
        </AdvancedDropwdown>
      )}{' '}
    </Wrapper>
  )
}

export default withRouter(ExchangePage)
