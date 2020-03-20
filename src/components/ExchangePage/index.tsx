import React, { useState, useReducer, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { parseUnits, parseEther } from '@ethersproject/units'
import { WETH, TradeType, Route, Exchange, Trade, TokenAmount, JSBI, Percent } from '@uniswap/sdk'

import TokenLogo from '../TokenLogo'
import AddressInputPanel from '../AddressInputPanel'
import QuestionHelper from '../Question'
import NumericalInput from '../NumericalInput'
import AdvancedSettings from '../AdvancedSettings'
import ConfirmationModal from '../ConfirmationModal'
import CurrencyInputPanel from '../CurrencyInputPanel'
import { Link } from '../../theme/components'
import { Text } from 'rebass'
import { TYPE } from '../../theme'
import { ArrowDown, ArrowUp } from 'react-feather'
import { GreyCard, BlueCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { ButtonPrimary, ButtonError } from '../Button'
import { RowBetween, RowFixed, AutoRow } from '../../components/Row'

import { useToken } from '../../contexts/Tokens'
import { usePopups } from '../../contexts/Application'
import { useExchange } from '../../contexts/Exchanges'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useAddressAllowance } from '../../contexts/Allowances'
import { useWeb3React, useTokenContract } from '../../hooks'
import { useAddressBalance, useAllBalances } from '../../contexts/Balances'

import { ROUTER_ADDRESSES } from '../../constants'
import { getRouterContract, calculateGasMargin, getProviderOrSigner } from '../../utils'

const Wrapper = styled.div`
  position: relative;
`

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

const FixedBottom = styled.div`
  position: absolute;
  bottom: -200px;
  width: 100%;
`

const ErrorText = styled(Text)`
  color: ${({ theme, warningMedium, warningHigh }) =>
    warningHigh ? theme.salmonRed : warningMedium ? theme.warningYellow : theme.textColor};
`

const InputGroup = styled(AutoColumn)`
  position: relative;
  padding: 40px 0;
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
  padding: 0.5rem 1rem;
  background-color: ${({ theme }) => theme.zumthorBlue};
  border: 1px solid ${({ theme }) => theme.zumthorBlue};
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.royalBlue};
  :hover {
    border: 1px solid ${({ theme }) => theme.royalBlue};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.royalBlue};
    outline: none;
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

function initializeSwapState(inputAddress?: string, outputAddress?: string): SwapState {
  return {
    independentField: Field.INPUT,
    typedValue: '',
    [Field.INPUT]: {
      address: inputAddress
    },
    [Field.OUTPUT]: {
      address: outputAddress
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
const INITIAL_ALLOWED_SLIPPAGE = 200

// 15 minutes, denominated in seconds
const DEFAULT_DEADLINE_FROM_NOW = 60 * 15

// used for warning states based on slippage in bips
const ALLOWED_SLIPPAGE_MEDIUM = 100
const ALLOWED_SLIPPAGE_HIGH = 500

export default function ExchangePage({ sendingInput = false }) {
  const { chainId, account, library } = useWeb3React()
  const routerAddress: string = ROUTER_ADDRESSES[chainId]

  // adding notifications on txns
  const [, addPopup] = usePopups()
  const addTransaction = useTransactionAdder()

  // sending state
  const [sending] = useState<boolean>(sendingInput)
  const [sendingWithSwap, setSendingWithSwap] = useState<boolean>(false)
  const [recipient, setRecipient] = useState<string>('')

  // trade details
  const [state, dispatch] = useReducer(reducer, WETH[chainId].address, initializeSwapState)
  const { independentField, typedValue, ...fieldData } = state
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT
  const tradeType: TradeType = independentField === Field.INPUT ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT
  const [tradeError, setTradeError] = useState<string>('') // error for things like reserve size or route

  const tokens = {
    [Field.INPUT]: useToken(fieldData[Field.INPUT].address),
    [Field.OUTPUT]: useToken(fieldData[Field.OUTPUT].address)
  }

  const exchange: Exchange = useExchange(tokens[Field.INPUT], tokens[Field.OUTPUT])
  const route: Route = !!exchange ? new Route([exchange], tokens[Field.INPUT]) : undefined
  const emptyReserves: boolean = exchange && JSBI.equal(JSBI.BigInt(0), exchange.reserve0.raw)

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirmed
  const [pendingConfirmation, setPendingConfirmation] = useState<boolean>(true) // waiting for user confirmation

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const [deadline, setDeadline] = useState<number>(DEFAULT_DEADLINE_FROM_NOW)
  const [allowedSlippage, setAllowedSlippage] = useState<number>(INITIAL_ALLOWED_SLIPPAGE)

  // approvals
  const inputApproval: TokenAmount = useAddressAllowance(account, tokens[Field.INPUT], routerAddress)
  const outputApproval: TokenAmount = useAddressAllowance(account, tokens[Field.OUTPUT], routerAddress)

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

  const MIN_ETHER: TokenAmount = chainId && new TokenAmount(WETH[chainId], JSBI.BigInt(parseEther('.01')))
  const maxAmountInput: TokenAmount =
    !!userBalances[Field.INPUT] &&
    JSBI.greaterThan(
      userBalances[Field.INPUT].raw,
      tokens[Field.INPUT].equals(WETH[chainId]) ? MIN_ETHER.raw : JSBI.BigInt(0)
    )
      ? tokens[Field.INPUT].equals(WETH[chainId])
        ? userBalances[Field.INPUT].subtract(MIN_ETHER)
        : userBalances[Field.INPUT]
      : undefined
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

  const showInputUnlock: boolean =
    parsedAmounts[Field.INPUT] && inputApproval && JSBI.greaterThan(parsedAmounts[Field.INPUT].raw, inputApproval.raw)

  const showOutputUnlock: boolean =
    parsedAmounts[Field.OUTPUT] &&
    outputApproval &&
    JSBI.greaterThan(parsedAmounts[Field.OUTPUT].raw, outputApproval.raw)

  const tokenContract: ethers.Contract = useTokenContract(tokens[Field.INPUT]?.address)

  // function for a pure send
  async function onSend() {
    setAttemptingTxn(true)

    const signer = await getProviderOrSigner(library, account)
    // get token contract if needed
    let estimate: Function, method: Function, args, value
    if (tokens[Field.INPUT] === WETH[chainId]) {
      signer
        .sendTransaction({ to: recipient.toString(), value: hex(parsedAmounts[Field.INPUT].raw) })
        .then(response => {
          setTxHash(response.hash)
          addTransaction(response)
          setPendingConfirmation(false)
        })
        .catch(e => {
          addPopup(
            <AutoColumn gap="10px">
              <Text>Transaction Failed: try again.</Text>
            </AutoColumn>
          )
          resetModal()
          setShowConfirm(false)
        })
    } else {
      estimate = tokenContract.estimate.transfer
      method = tokenContract.transfer
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
          addTransaction(response)
          setPendingConfirmation(false)
        })
        .catch(e => {
          addPopup(
            <AutoColumn gap="10px">
              <Text>Transaction Failed: try again.</Text>
            </AutoColumn>
          )
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
        addTransaction(response)
        setPendingConfirmation(false)
      })
      .catch(() => {
        addPopup(
          <AutoColumn gap="10px">
            <Text>Transaction Failed: try again.</Text>
          </AutoColumn>
        )
        resetModal()
        setShowConfirm(false)
      })
  }

  // errors
  const [generalError, setGeneralError] = useState<string>('')
  const [inputError, setInputError] = useState<string>('')
  const [outputError, setOutputError] = useState<string>('')
  const [recipientError, setRecipientError] = useState<string>('')
  const [isValid, setIsValid] = useState<boolean>(false)

  const ignoreOutput: boolean = sending ? !sendingWithSwap : false

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
      setGeneralError('Enter an amount')
      setIsValid(false)
    }

    if (!parsedAmounts[Field.OUTPUT] && !ignoreOutput) {
      setGeneralError('Enter an amount')
      setIsValid(false)
    }

    if (
      parsedAmounts[Field.INPUT] &&
      exchange &&
      JSBI.greaterThan(parsedAmounts[Field.INPUT].raw, exchange.reserveOf(tokens[Field.INPUT]).raw)
    ) {
      setTradeError('Insufficient Liquidity')
      setIsValid(false)
    }

    if (
      !ignoreOutput &&
      parsedAmounts[Field.OUTPUT] &&
      exchange &&
      JSBI.greaterThan(parsedAmounts[Field.OUTPUT].raw, exchange.reserveOf(tokens[Field.OUTPUT]).raw)
    ) {
      setTradeError('Insufficient Liquidity')
      setIsValid(false)
    }

    if (showInputUnlock && !(sending && !sendingWithSwap)) {
      setInputError('Approval Needed')
      setIsValid(false)
    }

    if (showOutputUnlock && !ignoreOutput) {
      setOutputError('Approval Needed')
      setIsValid(false)
    }

    if (
      userBalances[Field.INPUT] &&
      parsedAmounts[Field.INPUT] &&
      JSBI.lessThan(userBalances[Field.INPUT].raw, parsedAmounts[Field.INPUT]?.raw)
    ) {
      setInputError('Insufficient balance.')
      setIsValid(false)
    }
  }, [
    exchange,
    ignoreOutput,
    parsedAmounts,
    recipient,
    recipientError,
    sending,
    sendingWithSwap,
    showInputUnlock,
    showOutputUnlock,
    tokens,
    userBalances
  ])

  // warnings on slippage
  const warningMedium: boolean =
    slippageFromTrade && parseFloat(slippageFromTrade.toFixed(4)) > ALLOWED_SLIPPAGE_MEDIUM / 100
  const warningHigh: boolean =
    slippageFromTrade && parseFloat(slippageFromTrade.toFixed(4)) > ALLOWED_SLIPPAGE_HIGH / 100

  // reset modal state when closed
  function resetModal() {
    setPendingConfirmation(true)
    setAttemptingTxn(false)
    setShowAdvanced(false)
  }

  function modalHeader() {
    if (sending && !sendingWithSwap) {
      return (
        <AutoColumn gap="30px" style={{ marginTop: '40px' }}>
          <RowBetween>
            <Text fontSize={36} fontWeight={500}>
              {parsedAmounts[Field.INPUT]?.toFixed(8)} {tokens[Field.INPUT]?.symbol}
            </Text>
            <TokenLogo address={tokens[Field.INPUT]?.address} size={'30px'} />
          </RowBetween>
          <TYPE.darkGray fontSize={20}>To</TYPE.darkGray>
          <TYPE.blue fontSize={36}>
            {recipient?.slice(0, 6)}...{recipient?.slice(36, 42)}
          </TYPE.blue>
        </AutoColumn>
      )
    }

    if (sending && sendingWithSwap) {
      return (
        <AutoColumn gap="30px" style={{ marginTop: '40px' }}>
          <AutoColumn gap="10px">
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
          <AutoColumn gap="10px">
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
        <AutoColumn gap={'20px'} style={{ marginTop: '40px' }}>
          <RowBetween align="flex-end">
            <Text fontSize={36} fontWeight={500}>
              {!!slippageAdjustedAmounts[Field.INPUT] && slippageAdjustedAmounts[Field.INPUT].toSignificant(6)}
            </Text>
            <RowFixed gap="10px">
              <TokenLogo address={tokens[Field.INPUT]?.address} size={'24px'} />
              <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
                {tokens[Field.INPUT]?.symbol || ''}
              </Text>
            </RowFixed>
          </RowBetween>
          <RowFixed>
            <ArrowDown size="16" color="#888D9B" />
          </RowFixed>
          <RowBetween align="flex-end">
            <Text fontSize={36} fontWeight={500} color={warningHigh ? '#FF6871' : '#2172E5'}>
              {!!slippageAdjustedAmounts[Field.OUTPUT] && slippageAdjustedAmounts[Field.OUTPUT].toSignificant(6)}
            </Text>
            <RowFixed gap="10px">
              <TokenLogo address={tokens[Field.OUTPUT]?.address} size={'24px'} />
              <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
                {tokens[Field.OUTPUT]?.symbol || ''}
              </Text>
            </RowFixed>
          </RowBetween>
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
    if (showAdvanced) {
      return (
        <AdvancedSettings
          setIsOpen={setShowAdvanced}
          setDeadline={setDeadline}
          setAllowedSlippage={setAllowedSlippage}
        />
      )
    }

    if (!sending || (sending && sendingWithSwap)) {
      return (
        <>
          {route && route.midPrice && !emptyReserves && (
            <RowBetween>
              <Text color="#565A69" fontWeight={500} fontSize={16}>
                Price
              </Text>
              <Text fontWeight={500} fontSize={16}>
                {`1 ${tokens[Field.INPUT]?.symbol} = ${route.midPrice.toFixed(6)} ${tokens[Field.OUTPUT]?.symbol}`}
              </Text>
            </RowBetween>
          )}
          <RowBetween>
            <Text color="#565A69" fontWeight={500} fontSize={16}>
              Slippage <Link onClick={() => setShowAdvanced(true)}>(edit limits)</Link>
            </Text>
            <ErrorText warningHigh={warningHigh} fontWeight={500}>
              {slippageFromTrade && slippageFromTrade.toFixed(4)}%
            </ErrorText>
          </RowBetween>
          <ButtonError onClick={onSwap} error={!!warningHigh} style={{ margin: '10px 0' }}>
            <Text fontSize={20} fontWeight={500}>
              {warningHigh ? (sending ? 'Send Anyway' : 'Swap Anyway') : sending ? 'Confirm Send' : 'Confirm Swap'}
            </Text>
          </ButtonError>
          <AutoColumn justify="center" gap="20px">
            <TYPE.italic textAlign="center" style={{ width: '80%' }}>
              {`Output is estimated. You will receive at least ${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(
                6
              )} ${tokens[Field.OUTPUT]?.symbol}  or the transaction will revert.`}
            </TYPE.italic>
            <Link
              onClick={() => {
                setShowAdvanced(true)
              }}
            >
              Advanced
            </Link>
          </AutoColumn>
        </>
      )
    }
  }

  // text to show while loading
  const pendingText: string = sending
    ? sendingWithSwap
      ? `Sending ${parsedAmounts[Field.OUTPUT]?.toSignificant(6)} ${tokens[Field.OUTPUT]?.symbol} to ${recipient}`
      : `Sending ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${tokens[Field.INPUT]?.symbol} to ${recipient}`
    : ` Swapped ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${tokens[Field.INPUT]?.symbol} for ${parsedAmounts[
        Field.OUTPUT
      ]?.toSignificant(6)} ${tokens[Field.OUTPUT]?.symbol}`

  function _onTokenSelect(address: string) {
    const balance = allBalances?.[account]?.[address]
    // if no user balance - switch view to a send with swap
    const hasBalance = balance && JSBI.greaterThan(JSBI.BigInt(0), balance.raw)
    if (!hasBalance && sending) {
      onTokenSelection(Field.OUTPUT, address)
      setSendingWithSwap(true)
    } else {
      onTokenSelection(Field.INPUT, address)
    }
  }

  function _onRecipient(result) {
    if (result.address) {
      setRecipient(result.address)
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
          <InputGroup gap="24px" justify="center">
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
            {!parsedAmounts[Field.INPUT] && <TYPE.gray>Enter an amount.</TYPE.gray>}
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
              title={'Input'}
              error={inputError}
              exchange={exchange}
              showUnlock={showInputUnlock}
              hideBalance={true}
              hideInput={true}
              showSendWithSwap={true}
            />
          </InputGroup>
        </>
      )}

      <AutoColumn gap={'20px'}>
        {(!sending || sendingWithSwap) && (
          <>
            <CurrencyInputPanel
              field={Field.INPUT}
              value={formattedAmounts[Field.INPUT]}
              atMax={atMaxAmountInput}
              token={tokens[Field.INPUT]}
              title={'Input'}
              error={inputError}
              exchange={exchange}
              showUnlock={showInputUnlock}
              onUserInput={onUserInput}
              onMax={() => {
                maxAmountInput && onMaxInput(maxAmountInput.toExact())
              }}
              onTokenSelection={address => onTokenSelection(Field.INPUT, address)}
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
              onTokenSelection={address => onTokenSelection(Field.OUTPUT, address)}
              title={'Output'}
              error={outputError}
              exchange={exchange}
              showUnlock={showOutputUnlock}
            />
            {!emptyReserves && ( // hide price if new exchange
              <RowBetween>
                <Text fontWeight={500} color="#565A69">
                  Price
                </Text>
                <Text fontWeight={500} color="#565A69">
                  {exchange
                    ? `1 ${tokens[Field.INPUT].symbol} = ${route?.midPrice.toSignificant(6)} ${
                        tokens[Field.OUTPUT].symbol
                      }`
                    : '-'}
                </Text>
              </RowBetween>
            )}
            {warningMedium && (
              <RowBetween>
                <Text fontWeight={500} color="#565A69">
                  Slippage
                </Text>
                <ErrorText fontWeight={500} warningMedium={warningMedium} warningHigh={warningHigh}>
                  {slippageFromTrade.toFixed(4)}%
                </ErrorText>
              </RowBetween>
            )}
          </>
        )}

        {sending && (
          <AutoColumn gap="10px">
            <AddressInputPanel
              title={''}
              onChange={_onRecipient}
              onError={error => {
                if (error) {
                  setRecipientError('Inavlid Recipient')
                } else {
                  setRecipientError(null)
                }
              }}
            />
          </AutoColumn>
        )}

        {emptyReserves ? (
          <RowBetween style={{ margin: '10px 0' }}>
            <TYPE.main>No exchange for this pair.</TYPE.main>
            <TYPE.blue> Create one now</TYPE.blue>
          </RowBetween>
        ) : (
          <ButtonError
            onClick={() => {
              setShowConfirm(true)
            }}
            disabled={!isValid}
            error={!!warningHigh}
          >
            <Text fontSize={20} fontWeight={500}>
              {generalError
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
      </AutoColumn>

      {warningHigh && (
        <FixedBottom>
          <GreyCard>
            <AutoColumn gap="12px">
              <RowBetween>
                <Text fontWeight={500}>Slippage Warning</Text>
                <QuestionHelper text="" />
              </RowBetween>
              <Text color="#565A69" lineHeight="145.23%;">
                This trade will move the price by {slippageFromTrade.toFixed(2)}%. This pool probably doesn’t have
                enough liquidity. Are you sure you want to continue this trade?
              </Text>
            </AutoColumn>
          </GreyCard>
        </FixedBottom>
      )}
    </Wrapper>
  )
}
