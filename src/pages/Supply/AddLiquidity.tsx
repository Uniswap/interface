import React, { useReducer, useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { parseUnits, parseEther } from '@ethersproject/units'
import { WETH, TokenAmount, JSBI, Percent, Route, Token, Pair } from '@uniswap/sdk'

import TokenLogo from '../../components/TokenLogo'
import DoubleLogo from '../../components/DoubleLogo'
import SearchModal from '../../components/SearchModal'
import PositionCard from '../../components/PositionCard'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { Text } from 'rebass'
import { Plus } from 'react-feather'
import { ButtonPrimary } from '../../components/Button'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import Row, { RowBetween, RowFlat, RowFixed } from '../../components/Row'

import { useToken } from '../../contexts/Tokens'
import { usePopups } from '../../contexts/Application'
import { useWeb3React } from '../../hooks'
import { useAddressBalance } from '../../contexts/Balances'
import { useAddressAllowance } from '../../contexts/Allowances'
import { useTransactionAdder } from '../../contexts/Transactions'
import { usePair, useTotalSupply } from '../../contexts/Pairs'

import { BigNumber } from 'ethers/utils'
import { ROUTER_ADDRESSES } from '../../constants'
import { getRouterContract, calculateGasMargin } from '../../utils'
import { TYPE } from '../../theme'

// denominated in bips
const ALLOWED_SLIPPAGE = 200

// denominated in seconds
const DEADLINE_FROM_NOW = 60 * 15

const GAS_MARGIN: BigNumber = ethers.utils.bigNumberify(1000)

const Wrapper = styled.div`
  position: relative;
`

const FixedBottom = styled.div`
  position: absolute;
  bottom: -200px;
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

export default function AddLiquidity({ token0, token1 }) {
  const { account, chainId, library } = useWeb3React()
  const [, addPopup] = usePopups()

  const routerAddress: string = ROUTER_ADDRESSES[chainId]

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

  // exhchange data
  const pair: Pair = usePair(tokens[Field.INPUT], tokens[Field.OUTPUT])
  const route: Route = pair ? new Route([pair], tokens[independentField]) : undefined
  const totalSupply: TokenAmount = useTotalSupply(tokens[Field.INPUT], tokens[Field.OUTPUT])
  const [noLiquidity, setNoLiquidity] = useState<boolean>(false) // used to detect new exchange

  // state for amount approvals
  const inputApproval: TokenAmount = useAddressAllowance(account, tokens[Field.INPUT], routerAddress)
  const outputApproval: TokenAmount = useAddressAllowance(account, tokens[Field.OUTPUT], routerAddress)
  const [showInputUnlock, setShowInputUnlock] = useState<boolean>(false)
  const [showOutputUnlock, setShowOutputUnlock] = useState<boolean>(false)

  // get user-pecific and token-specific lookup data
  const userBalances: { [field: number]: TokenAmount } = {
    [Field.INPUT]: useAddressBalance(account, tokens[Field.INPUT]),
    [Field.OUTPUT]: useAddressBalance(account, tokens[Field.OUTPUT])
  }

  // check if no exchange or no liquidity
  useEffect(() => {
    if (pair && JSBI.equal(pair.reserve0.raw, JSBI.BigInt(0)) && JSBI.equal(pair.reserve1.raw, JSBI.BigInt(0))) {
      setNoLiquidity(true)
    }
  }, [pair])

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

  // check for estimated liquidity minted
  const liquidityMinted: TokenAmount =
    !!pair &&
    !!parsedAmounts[Field.INPUT] &&
    !!parsedAmounts[Field.OUTPUT] &&
    !JSBI.equal(parsedAmounts[Field.INPUT].raw, JSBI.BigInt(0)) &&
    !JSBI.equal(parsedAmounts[Field.OUTPUT].raw, JSBI.BigInt(0))
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
      JSBI.greaterThan(
        userBalances[Field[field]].raw,
        tokens[Field[field]].equals(WETH[chainId]) ? MIN_ETHER.raw : JSBI.BigInt(0)
      )
      ? tokens[Field[field]].equals(WETH[chainId])
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

  // monitor parsed amounts and update unlocked buttons
  useEffect(() => {
    setShowInputUnlock(
      parsedAmounts[Field.INPUT] && inputApproval && JSBI.greaterThan(parsedAmounts[Field.INPUT].raw, inputApproval.raw)
    )
    setShowOutputUnlock(
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
    if (showInputUnlock) {
      setInputError('Approve Amount')
      setIsValid(false)
    }
    if (showOutputUnlock) {
      setOutputError('Approve Amount')
      setIsValid(false)
    }
    if (
      parsedAmounts?.[Field.INPUT] &&
      userBalances?.[Field.INPUT] &&
      JSBI.greaterThan(parsedAmounts?.[Field.INPUT]?.raw, userBalances?.[Field.INPUT]?.raw)
    ) {
      setInputError('Insufficient balance.')
      setIsValid(false)
    }
    if (
      parsedAmounts?.[Field.OUTPUT] &&
      userBalances?.[Field.OUTPUT] &&
      JSBI.greaterThan(parsedAmounts?.[Field.OUTPUT]?.raw, userBalances?.[Field.OUTPUT]?.raw)
    ) {
      setOutputError('Insufficient balance.')
      setIsValid(false)
    }
  }, [noLiquidity, parsedAmounts, showInputUnlock, showOutputUnlock, userBalances])

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
        addTransaction(response)
        setPendingConfirmation(false)
      })
      .catch((e: Error) => {
        console.log(e)
        addPopup(
          <AutoColumn gap="10px">
            <Text>Transaction Failed: try again.</Text>
          </AutoColumn>
        )
        setPendingConfirmation(true)
        setAttemptingTxn(false)
        setShowConfirm(false)
      })
  }

  const modalHeader = () => {
    return (
      <AutoColumn gap="20px">
        <RowFlat style={{ marginTop: '60px' }}>
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
            Confirm Supply
          </Text>
        </ButtonPrimary>
        <TYPE.italic fontSize={12} color="#565A69" textAlign="center">
          {`Output is estimated. You will receive at least ${liquidityMinted?.toFixed(6)} UNI ${
            tokens[Field.INPUT]?.symbol
          }/${tokens[Field.OUTPUT]?.symbol} or the transaction will revert.`}
        </TYPE.italic>
      </>
    )
  }

  const pendingText: string = `Supplied ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${
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
        title="You will receive"
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
            <TYPE.main textAlign="center">
              <span role="img" aria-label="Thinking">
                🥇
              </span>{' '}
              You are the first to add liquidity. Make sure you're setting rates correctly.
            </TYPE.main>
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
          onTokenSelection={onTokenSelection}
          error={inputError}
          pair={pair}
          showUnlock={showInputUnlock}
          disableTokenSelect
        />
        <ColumnCenter>
          <Plus size="16" color="#888D9B" />
        </ColumnCenter>
        <CurrencyInputPanel
          field={Field.OUTPUT}
          value={formattedAmounts[Field.OUTPUT]}
          onUserInput={onUserInput}
          onMax={() => {
            onMax(maxAmountOutput?.toExact(), Field.OUTPUT)
          }}
          atMax={atMaxAmountOutput}
          token={tokens[Field.OUTPUT]}
          onTokenSelection={onTokenSelection}
          error={outputError}
          pair={pair}
          showUnlock={showOutputUnlock}
          disableTokenSelect
        />
        {!noLiquidity && (
          <RowBetween>
            Rate:
            <div>
              1 {tokens[independentField]?.symbol} = {route?.midPrice?.toSignificant(6)}
              {tokens[dependentField]?.symbol}
            </div>
          </RowBetween>
        )}
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
        {!noLiquidity && (
          <FixedBottom>
            <PositionCard
              pairAddress={pair?.liquidityToken?.address}
              token0={tokens[Field.INPUT]}
              token1={tokens[Field.OUTPUT]}
              minimal={true}
            />
          </FixedBottom>
        )}
      </AutoColumn>
    </Wrapper>
  )
}
