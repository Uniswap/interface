import React, { useReducer, useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { parseUnits, parseEther } from '@ethersproject/units'
import { WETH, TokenAmount, JSBI, Percent, Route } from '@uniswap/sdk'

import DoubleLogo from '../../components/DoubleLogo'
import SearchModal from '../../components/SearchModal'
import PositionCard from '../../components/PositionCard'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { Text } from 'rebass'
import { Plus } from 'react-feather'
import { RowBetween } from '../../components/Row'
import { ChevronDown } from 'react-feather'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { ButtonPrimary, ButtonEmpty } from '../../components/Button'

import { useToken } from '../../contexts/Tokens'
import { useWeb3React } from '../../hooks'
import { useAddressBalance } from '../../contexts/Balances'
import { useAddressAllowance } from '../../contexts/Allowances'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useExchange, useTotalSupply } from '../../contexts/Exchanges'

import { BigNumber } from 'ethers/utils'
import { TRANSACTION_TYPE, ROUTER_ADDRESSES } from '../../constants'
import { getRouterContract, calculateGasMargin } from '../../utils'

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
  bottom: -240px;
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

/**
 * @todo should we ever not have prepopulated tokens?
 *
 */
export default function AddLiquidity({ token0, token1 }) {
  const { account, chainId, library } = useWeb3React()

  const routerAddress: string = ROUTER_ADDRESSES[chainId]

  // modal states
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [pendingConfirmation, setPendingConfirmation] = useState<boolean>(true)

  // input state
  const [state, dispatch] = useReducer(reducer, initializeAddState(token0, token1))
  const { independentField, typedValue, ...fieldData } = state
  const dependentField = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  // get basic SDK entities
  const tokens = {
    [Field.INPUT]: useToken(fieldData[Field.INPUT].address),
    [Field.OUTPUT]: useToken(fieldData[Field.OUTPUT].address)
  }

  // exhchange data
  const exchange = useExchange(tokens[Field.INPUT], tokens[Field.OUTPUT])
  const route = exchange ? new Route([exchange], tokens[independentField]) : undefined
  const totalSupply = useTotalSupply(exchange)
  const [noLiquidity, setNoLiquidity] = useState<boolean>(false)

  // state for amount approvals
  const inputApproval = useAddressAllowance(account, tokens[Field.INPUT], routerAddress)
  const outputApproval = useAddressAllowance(account, tokens[Field.OUTPUT], routerAddress)
  const [showInputUnlock, setShowInputUnlock] = useState<boolean>(false)
  const [showOutputUnlock, setShowOutputUnlock] = useState<boolean>(false)

  // get user-pecific and token-specific lookup data
  const userBalances = {
    [Field.INPUT]: useAddressBalance(account, tokens[Field.INPUT]),
    [Field.OUTPUT]: useAddressBalance(account, tokens[Field.OUTPUT])
  }

  // check if no exchange or no liquidity
  useEffect(() => {
    if (
      exchange &&
      JSBI.equal(exchange.reserve0.raw, JSBI.BigInt(0)) &&
      JSBI.equal(exchange.reserve1.raw, JSBI.BigInt(0))
    ) {
      setNoLiquidity(true)
    }
  }, [exchange])

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
      // should only fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
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
  const liquidityMinted =
    !!exchange && !!parsedAmounts[Field.INPUT] && !!parsedAmounts[Field.OUTPUT] && !!totalSupply
      ? exchange.getLiquidityMinted(totalSupply, parsedAmounts[Field.INPUT], parsedAmounts[Field.OUTPUT])
      : undefined

  const poolTokenPercentage =
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

  const MIN_ETHER = new TokenAmount(WETH[chainId], JSBI.BigInt(parseEther('.01')))

  // get the max amounts user can add
  const [maxAmountInput, maxAmountOutput] = [Field.INPUT, Field.OUTPUT].map(index => {
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

  const [atMaxAmountInput, atMaxAmountOutput] = [Field.INPUT, Field.OUTPUT].map(index => {
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
  const [generalError, setGeneralError] = useState()
  const [inputError, setInputError] = useState()
  const [outputError, setOutputError] = useState()
  const [isValid, setIsValid] = useState(false)

  // update errors live
  useEffect(() => {
    // reset errors
    setGeneralError(null)
    setInputError(null)
    setOutputError(null)
    setIsValid(true)

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
  }, [parsedAmounts, showInputUnlock, showOutputUnlock, userBalances])

  // state for txn
  const addTransaction = useTransactionAdder()
  const [txHash, setTxHash] = useState()

  function hex(value: JSBI) {
    return ethers.utils.bigNumberify(value.toString())
  }

  function calculateSlippageAmount(value: TokenAmount): JSBI[] {
    if (value && value.raw) {
      const offset = JSBI.divide(JSBI.multiply(JSBI.BigInt(ALLOWED_SLIPPAGE), value.raw), JSBI.BigInt(10000))
      return [JSBI.subtract(value.raw, offset), JSBI.add(value.raw, offset)]
    }
    return null
  }

  async function onAdd() {
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
        setShowConfirm(false)
      })
  }

  return (
    <Wrapper>
      <ConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => {
          setShowConfirm(false)
        }}
        liquidityAmount={liquidityMinted}
        amount0={parsedAmounts[Field.INPUT]}
        amount1={parsedAmounts[Field.OUTPUT]}
        poolTokenPercentage={poolTokenPercentage}
        price={route?.midPrice && route?.midPrice?.raw?.denominator}
        transactionType={TRANSACTION_TYPE.ADD}
        contractCall={onAdd}
        pendingConfirmation={pendingConfirmation}
        hash={txHash ? txHash : ''}
      />
      <SearchModal
        isOpen={showSearch}
        onDismiss={() => {
          setShowSearch(false)
        }}
      />
      <AutoColumn gap="20px">
        <ButtonEmpty
          padding={'1rem'}
          onClick={() => {
            setShowSearch(true)
          }}
        >
          <RowBetween>
            <DoubleLogo a0={exchange?.token0?.address || ''} a1={exchange?.token1?.address || ''} size={24} />
            <Text fontSize={20}>
              {exchange?.token0 && exchange?.token1
                ? exchange.token0.symbol + ' / ' + exchange.token1.symbol + ' Pool'
                : ''}
            </Text>
            <ChevronDown size={24} />
          </RowBetween>
        </ButtonEmpty>
        {noLiquidity && (
          <ColumnCenter>
            <Text fontWeight={500} style={{ textAlign: 'center' }}>
              <span role="img" aria-label="Thinking">
                🥇
              </span>{' '}
              You are the first to add liquidity. Make sure you're setting rates correctly.
            </Text>
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
          title={'Deposit'}
          error={inputError}
          exchange={exchange}
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
          title={'Deposit'}
          error={outputError}
          exchange={exchange}
          showUnlock={showOutputUnlock}
          disableTokenSelect
        />
        <RowBetween>
          Rate:
          <div>
            1 {tokens[independentField].symbol} = {route?.midPrice?.toSignificant(6)}
            {tokens[dependentField].symbol}
          </div>
        </RowBetween>
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
        <FixedBottom>
          <PositionCard
            exchangeAddress={exchange?.liquidityToken?.address}
            token0={tokens[Field.INPUT]}
            token1={tokens[Field.OUTPUT]}
            minimal={true}
          />
        </FixedBottom>
      </AutoColumn>
    </Wrapper>
  )
}
