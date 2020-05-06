import React, { useReducer, useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { withRouter } from 'react-router-dom'
import { parseUnits, parseEther } from '@ethersproject/units'
import { WETH, TokenAmount, JSBI, Percent, Route, Token, Pair, Price } from '@uniswap/sdk'

import TokenLogo from '../../components/TokenLogo'
import DoubleLogo from '../../components/DoubleLogo'
import SearchModal from '../../components/SearchModal'
import PositionCard from '../../components/PositionCard'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { Text } from 'rebass'
import { TYPE } from '../../theme'
import { Plus } from 'react-feather'
import { BlueCard, LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { ButtonPrimary, ButtonLight } from '../../components/Button'
import Row, { AutoRow, RowBetween, RowFlat, RowFixed } from '../../components/Row'

import { useToken } from '../../contexts/Tokens'
import { useAddressBalance } from '../../contexts/Balances'
import { useAddressAllowance } from '../../contexts/Allowances'
import { usePair, useTotalSupply } from '../../contexts/Pairs'
import { useWeb3React, useTokenContract } from '../../hooks'
import { useTransactionAdder, usePendingApproval } from '../../contexts/Transactions'

import { BigNumber } from 'ethers/utils'
import { ROUTER_ADDRESS } from '../../constants'
import { getRouterContract, calculateGasMargin, isWETH } from '../../utils'

// denominated in bips
const ALLOWED_SLIPPAGE = 50

// denominated in seconds
const DEADLINE_FROM_NOW = 60 * 20

const GAS_MARGIN: BigNumber = ethers.utils.bigNumberify(1000)

const Wrapper = styled.div`
  position: relative;
`

const FixedBottom = styled.div`
  position: absolute;
  margin-top: 2rem;
  width: 100%;
`

enum Field {
  INPUT,
  OUTPUT
}

interface AddState {
  independentField: Field
  typedValue: string
  [Field.INPUT]: {
    address: string | undefined
  }
  [Field.OUTPUT]: {
    address: string | undefined
  }
}

function initializeAddState(inputAddress?: string, outputAddress?: string): AddState {
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

enum AddAction {
  SELECT_TOKEN,
  SWITCH_TOKENS,
  TYPE
}

interface Payload {
  [AddAction.SELECT_TOKEN]: {
    field: Field
    address: string
  }
  [AddAction.SWITCH_TOKENS]: undefined
  [AddAction.TYPE]: {
    field: Field
    typedValue: string
  }
}

function reducer(
  state: AddState,
  action: {
    type: AddAction
    payload: Payload[AddAction]
  }
): AddState {
  switch (action.type) {
    case AddAction.SELECT_TOKEN: {
      const { field, address } = action.payload as Payload[AddAction.SELECT_TOKEN]
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
    case AddAction.TYPE: {
      const { field, typedValue } = action.payload as Payload[AddAction.TYPE]
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

function AddLiquidity({ token0, token1, step = false }) {
  const { account, chainId, library } = useWeb3React()

  // modal states
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicke confirm
  const [pendingConfirmation, setPendingConfirmation] = useState<boolean>(true)

  // input state
  const [state, dispatch] = useReducer(reducer, initializeAddState(token0, token1))
  const { independentField, typedValue, ...fieldData } = state
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  // get basic SDK entities
  const tokens: { [field: number]: Token } = {
    [Field.INPUT]: useToken(fieldData[Field.INPUT].address),
    [Field.OUTPUT]: useToken(fieldData[Field.OUTPUT].address)
  }

  // token contracts for approvals and direct sends
  const tokenContractInput: ethers.Contract = useTokenContract(tokens[Field.INPUT]?.address)
  const tokenContractOutput: ethers.Contract = useTokenContract(tokens[Field.OUTPUT]?.address)

  // check on pending approvals for token amounts
  const pendingApprovalInput = usePendingApproval(tokens[Field.INPUT]?.address)
  const pendingApprovalOutput = usePendingApproval(tokens[Field.OUTPUT]?.address)

  // exhchange data
  const pair: Pair = usePair(tokens[Field.INPUT], tokens[Field.OUTPUT])
  const route: Route = pair ? new Route([pair], tokens[independentField]) : undefined
  const totalSupply: TokenAmount = useTotalSupply(tokens[Field.INPUT], tokens[Field.OUTPUT])
  const noLiquidity = // used to detect new exchange
    pair && JSBI.equal(pair.reserve0.raw, JSBI.BigInt(0)) && JSBI.equal(pair.reserve1.raw, JSBI.BigInt(0))

  // state for amount approvals
  const inputApproval: TokenAmount = useAddressAllowance(account, tokens[Field.INPUT], ROUTER_ADDRESS)
  const outputApproval: TokenAmount = useAddressAllowance(account, tokens[Field.OUTPUT], ROUTER_ADDRESS)
  const [showInputApprove, setShowInputApprove] = useState<boolean>(false)
  const [showOutputApprove, setShowOutputApprove] = useState<boolean>(false)

  // get user-pecific and token-specific lookup data
  const userBalances: { [field: number]: TokenAmount } = {
    [Field.INPUT]: useAddressBalance(account, tokens[Field.INPUT]),
    [Field.OUTPUT]: useAddressBalance(account, tokens[Field.OUTPUT])
  }

  // track non relational amounts if first person to add liquidity
  const [nonrelationalAmounts, setNonrelationalAmounts] = useState({
    [Field.INPUT]: null,
    [Field.OUTPUT]: null
  })
  useEffect(() => {
    if (typedValue !== '' && typedValue !== '.' && tokens[independentField] && noLiquidity) {
      const newNonRelationalAmounts = nonrelationalAmounts
      const typedValueParsed = parseUnits(typedValue, tokens[independentField].decimals).toString()
      if (independentField === Field.OUTPUT) {
        newNonRelationalAmounts[Field.OUTPUT] = new TokenAmount(tokens[independentField], typedValueParsed)
      } else {
        newNonRelationalAmounts[Field.INPUT] = new TokenAmount(tokens[independentField], typedValueParsed)
      }
      setNonrelationalAmounts(newNonRelationalAmounts)
    }
  }, [independentField, nonrelationalAmounts, tokens, typedValue, noLiquidity])

  // caclulate the token amounts based on the input
  const parsedAmounts: { [field: number]: TokenAmount } = {}
  if (noLiquidity) {
    parsedAmounts[independentField] = nonrelationalAmounts[independentField]
    parsedAmounts[dependentField] = nonrelationalAmounts[dependentField]
  }
  if (typedValue !== '' && typedValue !== '.' && tokens[independentField]) {
    try {
      const typedValueParsed = parseUnits(typedValue, tokens[independentField].decimals).toString()
      if (typedValueParsed !== '0')
        parsedAmounts[independentField] = new TokenAmount(tokens[independentField], typedValueParsed)
    } catch (error) {
      console.error(error)
    }
  }

  if (
    route &&
    !noLiquidity &&
    parsedAmounts[independentField] &&
    JSBI.greaterThan(parsedAmounts[independentField].raw, JSBI.BigInt(0))
  ) {
    parsedAmounts[dependentField] = route.midPrice.quote(parsedAmounts[independentField])
  }

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField] ? parsedAmounts[dependentField]?.toSignificant(8) : ''
  }

  // used for displaying approximate starting price in UI
  const derivedPrice =
    parsedAmounts[Field.INPUT] &&
    parsedAmounts[Field.OUTPUT] &&
    new Price(
      parsedAmounts[Field.INPUT].token,
      parsedAmounts[Field.OUTPUT].token,
      parsedAmounts[Field.INPUT].raw,
      parsedAmounts[Field.OUTPUT].raw
    )

  // check for estimated liquidity minted
  const liquidityMinted: TokenAmount =
    !!pair &&
    !!parsedAmounts[Field.INPUT] &&
    !!parsedAmounts[Field.OUTPUT] &&
    !JSBI.equal(parsedAmounts[Field.INPUT].raw, JSBI.BigInt(0)) &&
    !JSBI.equal(parsedAmounts[Field.OUTPUT].raw, JSBI.BigInt(0)) &&
    totalSupply &&
    totalSupply.token.equals(pair.liquidityToken) // if stale value for pair
      ? pair.getLiquidityMinted(
          totalSupply ? totalSupply : new TokenAmount(pair?.liquidityToken, JSBI.BigInt(0)),
          parsedAmounts[Field.INPUT],
          parsedAmounts[Field.OUTPUT]
        )
      : undefined

  const poolTokenPercentage: Percent =
    !!liquidityMinted && !!totalSupply
      ? new Percent(liquidityMinted.raw, totalSupply.add(liquidityMinted).raw)
      : undefined

  const onTokenSelection = useCallback((field: Field, address: string) => {
    dispatch({
      type: AddAction.SELECT_TOKEN,
      payload: { field, address }
    })
  }, [])

  const onUserInput = useCallback((field: Field, typedValue: string) => {
    dispatch({ type: AddAction.TYPE, payload: { field, typedValue } })
  }, [])

  const onMax = useCallback((typedValue: string, field) => {
    dispatch({
      type: AddAction.TYPE,
      payload: {
        field: field,
        typedValue
      }
    })
  }, [])

  const MIN_ETHER: TokenAmount = new TokenAmount(WETH[chainId], JSBI.BigInt(parseEther('.01')))

  // get the max amounts user can add
  const [maxAmountInput, maxAmountOutput]: TokenAmount[] = [Field.INPUT, Field.OUTPUT].map(index => {
    const field = Field[index]
    return !!userBalances[Field[field]] &&
      JSBI.greaterThan(userBalances[Field[field]].raw, isWETH(tokens[Field[field]]) ? MIN_ETHER.raw : JSBI.BigInt(0))
      ? isWETH(tokens[Field[field]])
        ? userBalances[Field[field]].subtract(MIN_ETHER)
        : userBalances[Field[field]]
      : undefined
  })

  const [atMaxAmountInput, atMaxAmountOutput]: boolean[] = [Field.INPUT, Field.OUTPUT].map(index => {
    const field = Field[index]
    const maxAmount = index === Field.INPUT ? maxAmountInput : maxAmountOutput
    return !!maxAmount && !!parsedAmounts[Field[field]]
      ? JSBI.equal(maxAmount.raw, parsedAmounts[Field[field]].raw)
      : undefined
  })

  // monitor parsed amounts and update approve buttons
  useEffect(() => {
    setShowInputApprove(
      parsedAmounts[Field.INPUT] && inputApproval && JSBI.greaterThan(parsedAmounts[Field.INPUT].raw, inputApproval.raw)
    )
    setShowOutputApprove(
      parsedAmounts[Field.OUTPUT] &&
        outputApproval &&
        JSBI.greaterThan(parsedAmounts[Field.OUTPUT].raw, outputApproval.raw)
    )
  }, [inputApproval, outputApproval, parsedAmounts])

  // errors
  const [generalError, setGeneralError] = useState('')
  const [inputError, setInputError] = useState('')
  const [outputError, setOutputError] = useState('')
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    // reset errors
    setGeneralError(null)
    setInputError(null)
    setOutputError(null)
    setIsValid(true)

    if (noLiquidity && parsedAmounts[Field.INPUT] && JSBI.equal(parsedAmounts[Field.INPUT].raw, JSBI.BigInt(0))) {
      setGeneralError('Enter an amount')
      setIsValid(false)
    }

    if (noLiquidity && parsedAmounts[Field.OUTPUT] && JSBI.equal(parsedAmounts[Field.OUTPUT].raw, JSBI.BigInt(0))) {
      setGeneralError('Enter an amount')
      setIsValid(false)
    }

    if (!parsedAmounts[Field.INPUT]) {
      setGeneralError('Enter an amount')
      setIsValid(false)
    }
    if (!parsedAmounts[Field.OUTPUT]) {
      setGeneralError('Enter an amount')
      setIsValid(false)
    }
    if (
      parsedAmounts?.[Field.INPUT] &&
      userBalances?.[Field.INPUT] &&
      JSBI.greaterThan(parsedAmounts?.[Field.INPUT]?.raw, userBalances?.[Field.INPUT]?.raw)
    ) {
      setInputError('Insufficient ' + tokens[Field.INPUT]?.symbol + ' balance')
      setIsValid(false)
    }
    if (
      parsedAmounts?.[Field.OUTPUT] &&
      userBalances?.[Field.OUTPUT] &&
      JSBI.greaterThan(parsedAmounts?.[Field.OUTPUT]?.raw, userBalances?.[Field.OUTPUT]?.raw)
    ) {
      setOutputError('Insufficient ' + tokens[Field.OUTPUT]?.symbol + ' balance')
      setIsValid(false)
    }
  }, [noLiquidity, parsedAmounts, showInputApprove, showOutputApprove, tokens, userBalances])

  // state for txn
  const addTransaction = useTransactionAdder()
  const [txHash, setTxHash] = useState<string>('')

  // format ETH value for transaction
  function hex(value: JSBI) {
    return ethers.utils.bigNumberify(value.toString())
  }

  // calculate slippage bounds based on current reserves
  function calculateSlippageAmount(value: TokenAmount): JSBI[] {
    if (value && value.raw) {
      const offset = JSBI.divide(JSBI.multiply(JSBI.BigInt(ALLOWED_SLIPPAGE), value.raw), JSBI.BigInt(10000))
      return [JSBI.subtract(value.raw, offset), JSBI.add(value.raw, offset)]
    } else {
      return null
    }
  }

  async function onAdd() {
    setAttemptingTxn(true)
    const router = getRouterContract(chainId, library, account)

    const minTokenInput = calculateSlippageAmount(parsedAmounts[Field.INPUT])[0]
    const minTokenOutput = calculateSlippageAmount(parsedAmounts[Field.OUTPUT])[0]

    const deadline = Math.ceil(Date.now() / 1000) + DEADLINE_FROM_NOW

    let method, estimate, args, value

    if (tokens[Field.INPUT] === WETH[chainId] || tokens[Field.OUTPUT] === WETH[chainId]) {
      method = router.addLiquidityETH
      estimate = router.estimate.addLiquidityETH

      args = [
        tokens[Field.OUTPUT] === WETH[chainId] ? tokens[Field.INPUT].address : tokens[Field.OUTPUT].address, // token
        tokens[Field.OUTPUT] === WETH[chainId] // token desired
          ? parsedAmounts[Field.INPUT].raw.toString()
          : parsedAmounts[Field.OUTPUT].raw.toString(),
        tokens[Field.OUTPUT] === WETH[chainId] ? minTokenInput.toString() : minTokenOutput.toString(), // token min
        tokens[Field.OUTPUT] === WETH[chainId] ? minTokenOutput.toString() : minTokenInput.toString(), // eth min
        account,
        deadline
      ]
      value = hex(
        tokens[Field.OUTPUT] === WETH[chainId] // eth desired
          ? parsedAmounts[Field.OUTPUT].raw
          : parsedAmounts[Field.INPUT].raw
      )
    } else {
      method = router.addLiquidity
      estimate = router.estimate.addLiquidity
      args = [
        tokens[Field.INPUT].address,
        tokens[Field.OUTPUT].address,
        parsedAmounts[Field.INPUT].raw.toString(),
        parsedAmounts[Field.OUTPUT].raw.toString(),
        noLiquidity ? parsedAmounts[Field.INPUT].raw.toString() : minTokenInput.toString(),
        noLiquidity ? parsedAmounts[Field.OUTPUT].raw.toString() : minTokenOutput.toString(),
        account,
        deadline
      ]
      value = ethers.constants.Zero
    }

    const estimatedGasLimit = await estimate(...args, {
      value: value
    })

    method(...args, {
      gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
      value: value
    })
      .then(response => {
        setTxHash(response.hash)
        addTransaction(
          response,
          'Add ' +
            parsedAmounts[Field.INPUT]?.toSignificant(3) +
            ' ' +
            tokens[Field.INPUT]?.symbol +
            ' and ' +
            parsedAmounts[Field.OUTPUT]?.toSignificant(3) +
            ' ' +
            tokens[Field.OUTPUT]?.symbol
        )
        setPendingConfirmation(false)
      })
      .catch((e: Error) => {
        console.log(e)
        setPendingConfirmation(true)
        setAttemptingTxn(false)
        setShowConfirm(false)
      })
  }

  async function approveAmount(field) {
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

  const modalHeader = () => {
    return noLiquidity ? (
      <AutoColumn gap="12px">
        <LightCard margin={'30px 0'} borderRadius="20px">
          <ColumnCenter>
            <RowFixed>
              <Text fontSize={36} fontWeight={500} marginRight={20}>
                {tokens[Field.INPUT]?.symbol + '-' + tokens[Field.OUTPUT]?.symbol}
              </Text>{' '}
              <DoubleLogo a0={tokens[Field.INPUT]?.address} a1={tokens[Field.OUTPUT]?.address} size={36} />
            </RowFixed>
          </ColumnCenter>
        </LightCard>
        <TYPE.body>Starting pool prices</TYPE.body>
        <LightCard borderRadius="20px">
          <TYPE.mediumHeader>
            {parsedAmounts[0] &&
              parsedAmounts[1] &&
              JSBI.greaterThan(parsedAmounts[0].raw, JSBI.BigInt(0)) &&
              JSBI.greaterThan(parsedAmounts[1].raw, JSBI.BigInt(0)) &&
              derivedPrice?.invert().toSignificant(6)}{' '}
            {tokens[Field.INPUT]?.symbol + '/' + tokens[Field.OUTPUT]?.symbol}
          </TYPE.mediumHeader>
        </LightCard>
        <LightCard borderRadius="20px">
          <TYPE.mediumHeader>
            {parsedAmounts[0] &&
              parsedAmounts[1] &&
              JSBI.greaterThan(parsedAmounts[0].raw, JSBI.BigInt(0)) &&
              JSBI.greaterThan(parsedAmounts[1].raw, JSBI.BigInt(0)) &&
              derivedPrice?.toSignificant(6)}{' '}
            {tokens[Field.OUTPUT]?.symbol + '/' + tokens[Field.INPUT]?.symbol}
          </TYPE.mediumHeader>
        </LightCard>
      </AutoColumn>
    ) : (
      <AutoColumn gap="20px">
        <RowFlat style={{ marginTop: '20px' }}>
          <Text fontSize="48px" fontWeight={500} lineHeight="32px" marginRight={10}>
            {liquidityMinted?.toFixed(6)}
          </Text>
          <DoubleLogo a0={tokens[Field.INPUT]?.symbol || ''} a1={tokens[Field.OUTPUT]?.symbol || ''} size={30} />
        </RowFlat>
        <Row>
          <Text fontSize="24px">
            {tokens[Field.INPUT]?.symbol + ':' + tokens[Field.OUTPUT]?.symbol + ' Pool Tokens'}
          </Text>
        </Row>
        <TYPE.italic fontSize={12} color="#565A69" textAlign="center" padding={'12px 0 0 0 '}>
          {`Output is estimated. You will receive at least ${liquidityMinted?.toSignificant(6)} UNI ${
            tokens[Field.INPUT]?.symbol
          }/${tokens[Field.OUTPUT]?.symbol} or the transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  const modalBottom = () => {
    return (
      <>
        <RowBetween>
          <TYPE.body>{tokens[Field.INPUT]?.symbol} Deposited</TYPE.body>
          <RowFixed>
            <TokenLogo address={tokens[Field.INPUT]?.address || ''} style={{ marginRight: '8px' }} />
            <TYPE.body>{!!parsedAmounts[Field.INPUT] && parsedAmounts[Field.INPUT].toSignificant(6)}</TYPE.body>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <TYPE.body>{tokens[Field.OUTPUT]?.symbol} Deposited</TYPE.body>
          <RowFixed>
            <TokenLogo address={tokens[Field.OUTPUT]?.address || ''} style={{ marginRight: '8px' }} />
            <TYPE.body>{!!parsedAmounts[Field.OUTPUT] && parsedAmounts[Field.OUTPUT].toSignificant(6)}</TYPE.body>
          </RowFixed>
        </RowBetween>
        {route && !JSBI.equal(route?.midPrice?.raw?.denominator, JSBI.BigInt(0)) && (
          <RowBetween>
            <TYPE.body>Rate</TYPE.body>
            <TYPE.body>
              {`1 ${tokens[Field.INPUT]?.symbol} = ${route?.midPrice &&
                route?.midPrice?.raw?.denominator &&
                route?.midPrice?.adjusted?.toFixed(8)} ${tokens[Field.OUTPUT]?.symbol}`}
            </TYPE.body>
          </RowBetween>
        )}
        <RowBetween>
          <TYPE.body>Minted Pool Share:</TYPE.body>
          <TYPE.body>{noLiquidity ? '100%' : poolTokenPercentage?.toFixed(6) + '%'}</TYPE.body>
        </RowBetween>
        <ButtonPrimary style={{ margin: '20px 0' }} onClick={onAdd}>
          <Text fontWeight={500} fontSize={20}>
            {noLiquidity ? 'Supply & Create Pool' : 'Confirm Supply'}
          </Text>
        </ButtonPrimary>
      </>
    )
  }
  const PriceBar = () => {
    return (
      <AutoRow justify="space-between">
        <AutoColumn justify="center">
          <Text fontWeight={500} fontSize={16} color="#000000">
            {pair ? `${route.midPrice.toSignificant(6)} ` : '-'}
          </Text>
          <Text fontWeight={500} fontSize={14} color="#888D9B" pt={1}>
            {tokens[Field.OUTPUT]?.symbol} / {tokens[Field.INPUT]?.symbol}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <Text fontWeight={500} fontSize={16} color="#000000">
            {pair ? `${route.midPrice.invert().toSignificant(6)} ` : '-'}
          </Text>
          <Text fontWeight={500} fontSize={14} color="#888D9B" pt={1}>
            {tokens[Field.INPUT]?.symbol} / {tokens[Field.OUTPUT]?.symbol}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <Text fontWeight={500} fontSize={16} color="#000000">
            {poolTokenPercentage ? poolTokenPercentage?.toFixed(2) : '0.0'}
            {'%'}
          </Text>
          <Text fontWeight={500} fontSize={14} color="#888D9B" pt={1}>
            Pool Share
          </Text>
        </AutoColumn>
      </AutoRow>
    )
  }

  const pendingText: string = `Supplying ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${
    tokens[Field.INPUT]?.symbol
  } ${'and'} ${parsedAmounts[Field.OUTPUT]?.toSignificant(6)} ${tokens[Field.OUTPUT]?.symbol}`

  return (
    <Wrapper>
      <ConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => {
          setPendingConfirmation(true)
          setAttemptingTxn(false)
          setShowConfirm(false)
        }}
        attemptingTxn={attemptingTxn}
        pendingConfirmation={pendingConfirmation}
        hash={txHash ? txHash : ''}
        topContent={() => modalHeader()}
        bottomContent={modalBottom}
        pendingText={pendingText}
        title={noLiquidity ? 'You are creating a pool' : 'You will receive'}
      />
      <SearchModal
        isOpen={showSearch}
        onDismiss={() => {
          setShowSearch(false)
        }}
      />
      <AutoColumn gap="20px">
        {noLiquidity && (
          <ColumnCenter>
            <BlueCard>
              <AutoColumn gap="10px">
                {/* {step && <TYPE.blue fontWeight={400}>Step 2.</TYPE.blue>} */}
                <TYPE.blue fontWeight={400}>
                  <b>You are the first liquidity provider.</b> The ratio of tokens you add will set the price of this
                  pool.
                </TYPE.blue>
                <TYPE.blue fontWeight={400}>Once you are happy with the rate click supply to review.</TYPE.blue>
              </AutoColumn>
            </BlueCard>
          </ColumnCenter>
        )}
        <CurrencyInputPanel
          field={Field.INPUT}
          value={formattedAmounts[Field.INPUT]}
          onUserInput={onUserInput}
          onMax={() => {
            maxAmountInput && onMax(maxAmountInput.toExact(), Field.INPUT)
          }}
          atMax={atMaxAmountInput}
          token={tokens[Field.INPUT]}
          onTokenSelection={address => onTokenSelection(Field.INPUT, address)}
          error={inputError}
          pair={pair}
          label="Input"
        />
        <ColumnCenter>
          <Plus size="16" color="#888D9B" />
        </ColumnCenter>
        <CurrencyInputPanel
          field={Field.OUTPUT}
          value={formattedAmounts[Field.OUTPUT]}
          onUserInput={onUserInput}
          onMax={() => {
            maxAmountOutput && onMax(maxAmountOutput?.toExact(), Field.OUTPUT)
          }}
          atMax={atMaxAmountOutput}
          token={tokens[Field.OUTPUT]}
          onTokenSelection={address => onTokenSelection(Field.OUTPUT, address)}
          error={outputError}
          pair={pair}
        />
        {tokens[Field.OUTPUT] && tokens[Field.INPUT] && (
          <LightCard padding="1rem" borderRadius={'20px'}>
            <PriceBar />
          </LightCard>
        )}
        {showOutputApprove ? (
          <ButtonLight
            onClick={() => {
              approveAmount(Field.OUTPUT)
            }}
          >
            {pendingApprovalOutput ? 'Waiting for approve' : 'Approve ' + tokens[Field.OUTPUT]?.symbol}
          </ButtonLight>
        ) : showInputApprove ? (
          <ButtonLight
            onClick={() => {
              approveAmount(Field.INPUT)
            }}
          >
            {pendingApprovalInput ? 'Waiting for approve' : 'Approve ' + tokens[Field.INPUT]?.symbol}
          </ButtonLight>
        ) : (
          <ButtonPrimary
            onClick={() => {
              setShowConfirm(true)
            }}
            disabled={!isValid}
          >
            <Text fontSize={20} fontWeight={500}>
              {generalError ? generalError : inputError ? inputError : outputError ? outputError : 'Supply'}
            </Text>
          </ButtonPrimary>
        )}
      </AutoColumn>

      {!noLiquidity && (
        <FixedBottom>
          <AutoColumn>
            <PositionCard
              pairAddress={pair?.liquidityToken?.address}
              token0={tokens[Field.INPUT]}
              token1={tokens[Field.OUTPUT]}
              minimal={true}
            />
          </AutoColumn>
        </FixedBottom>
      )}
    </Wrapper>
  )
}

export default withRouter(AddLiquidity)
