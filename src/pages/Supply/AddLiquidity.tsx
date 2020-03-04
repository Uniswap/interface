import React, { useReducer, useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { parseUnits, parseEther } from '@ethersproject/units'
import { WETH, TokenAmount, JSBI, Percent, Route } from '@uniswap/sdk'

import SearchModal from '../../components/SearchModal'
import DoubleLogo from '../../components/DoubleLogo'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import ConfirmationModal from '../../components/ConfirmationModal'

import { Text } from 'rebass'
import { ChevronDown } from 'react-feather'
import { RowBetween } from '../../components/Row'
import { LightCard } from '../../components/Card'
import { ArrowDown, Plus } from 'react-feather'
import { ButtonPrimary, ButtonEmpty } from '../../components/Button'
import { AutoColumn, ColumnCenter } from '../../components/Column'

import { useToken } from '../../contexts/Tokens'
import { useExchange } from '../../contexts/Exchanges'
import { useWeb3React } from '../../hooks'
import { useAddressBalance } from '../../contexts/Balances'
import { useExchangeContract } from '../../hooks'
import { useAddressAllowance } from '../../contexts/Allowances'
import { useTransactionAdder } from '../../contexts/Transactions'

import { TRANSACTION_TYPE, ROUTER_ADDRESSES } from '../../constants'
import { getRouterContract, calculateGasMargin } from '../../utils'

const ErrorText = styled(Text)`
  color: ${({ theme, error }) => (error ? theme.salmonRed : theme.chaliceGray)};
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

  const routerAddress = ROUTER_ADDRESSES[chainId]

  // modal state
  const [showSearch, toggleSearch] = useState(false)
  // state for confirmation popup
  const [showConfirm, toggleConfirm] = useState(false)
  const [pendingConfirmation, toggelPendingConfirmation] = useState(true)

  // input state
  const [state, dispatch] = useReducer(reducer, initializeAddState(token0, token1))
  const { independentField, typedValue, ...fieldData } = state

  // get derived state
  const dependentField = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  // get basic SDK entities
  const tokens = {
    [Field.INPUT]: useToken(fieldData[Field.INPUT].address),
    [Field.OUTPUT]: useToken(fieldData[Field.OUTPUT].address)
  }
  const exchange = useExchange(tokens[Field.INPUT], tokens[Field.OUTPUT])
  const route = exchange ? new Route([exchange], tokens[independentField]) : undefined

  // get user- and token-specific lookup data
  const userBalances = {
    [Field.INPUT]: useAddressBalance(account, tokens[Field.INPUT]),
    [Field.OUTPUT]: useAddressBalance(account, tokens[Field.OUTPUT])
  }

  // check if no exchange or no liquidity
  const [noLiquidity, setNoLiquidity] = useState(false)
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

  const parsedAmounts: { [field: number]: TokenAmount } = {}
  //if no liquidity set parsed to non relational, else get dependent calculated amounts
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

  // get the price data and update dependent field
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

  // pool token data
  const [totalPoolTokens, setTotalPoolTokens] = useState<TokenAmount>()

  // move this to a hook
  const exchangeContract = useExchangeContract(exchange?.liquidityToken.address)
  const fetchPoolTokens = useCallback(async () => {
    exchangeContract
      .deployed()
      .then(() => {
        if (exchangeContract) {
          exchangeContract.totalSupply().then(totalSupply => {
            if (totalSupply !== undefined && exchange?.liquidityToken?.decimals) {
              const supplyFormatted = JSBI.BigInt(totalSupply)
              const tokenSupplyFormatted = new TokenAmount(exchange?.liquidityToken, supplyFormatted)
              setTotalPoolTokens(tokenSupplyFormatted)
            }
          })
        }
      })
      .catch(e => {
        console.log('error')
      })
  }, [exchangeContract])
  useEffect(() => {
    fetchPoolTokens()
    library.on('block', fetchPoolTokens)

    return () => {
      library.removeListener('block', fetchPoolTokens)
    }
  }, [fetchPoolTokens, library])

  // check for estimated liquidity minted
  const liquidityMinted =
    !!exchange && !!parsedAmounts[Field.INPUT] && !!parsedAmounts[Field.OUTPUT] && !!totalPoolTokens && exchange
      ? exchange.getLiquidityMinted(totalPoolTokens, parsedAmounts[Field.INPUT], parsedAmounts[Field.OUTPUT])
      : undefined

  const poolTokenPercentage =
    !!liquidityMinted && !!totalPoolTokens
      ? new Percent(liquidityMinted.raw, totalPoolTokens.add(liquidityMinted).raw)
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

  const onMaxInput = useCallback((typedValue: string) => {
    dispatch({
      type: AddAction.TYPE,
      payload: {
        field: Field.INPUT,
        typedValue
      }
    })
  }, [])

  const onMaxOutput = useCallback((typedValue: string) => {
    dispatch({
      type: AddAction.TYPE,
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

  const inputApproval = useAddressAllowance(account, tokens[Field.INPUT], routerAddress)
  const outputApproval = useAddressAllowance(account, tokens[Field.OUTPUT], routerAddress)

  const [showInputUnlock, setShowInputUnlock] = useState(false)
  const [showOutputUnlock, setShowOutputUnlock] = useState(false)

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
    if (
      parsedAmounts[Field.OUTPUT] &&
      outputApproval &&
      JSBI.greaterThan(parsedAmounts[Field.OUTPUT]?.raw, outputApproval?.raw)
    ) {
      setShowOutputUnlock(true)
    } else {
      setShowOutputUnlock(false)
    }
  }, [inputApproval, outputApproval, parsedAmounts])

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
    if (showOutputUnlock) {
      setOutputError('Need to approve amount on output.')
    }
    if (parseFloat(parsedAmounts?.[Field.INPUT]?.toExact()) > parseFloat(userBalances?.[Field.INPUT]?.toExact())) {
      setInputError('Insufficient balance.')
      setIsError(true)
    }
    if (parseFloat(parsedAmounts?.[Field.OUTPUT]?.toExact()) > parseFloat(userBalances?.[Field.OUTPUT]?.toExact())) {
      setOutputError('Insufficient balance.')
      setIsError(true)
    }
  }, [parsedAmounts, showInputUnlock, showOutputUnlock, userBalances])

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

  // state for txn
  const addTransaction = useTransactionAdder()
  const [txHash, setTxHash] = useState()

  async function onAdd() {
    const router = getRouterContract(chainId, library, account)
    const minTokenInput = JSBI.divide(JSBI.multiply(JSBI.BigInt(99), parsedAmounts[Field.INPUT].raw), JSBI.BigInt(100))
    const minTokenOutput = JSBI.divide(
      JSBI.multiply(JSBI.BigInt(99), parsedAmounts[Field.OUTPUT].raw),
      JSBI.BigInt(100)
    )

    const args = [
      tokens[Field.INPUT].address,
      tokens[Field.OUTPUT].address,
      parsedAmounts[Field.INPUT].raw.toString(),
      parsedAmounts[Field.OUTPUT].raw.toString(),
      noLiquidity ? parsedAmounts[Field.INPUT].raw.toString() : minTokenInput.toString(),
      noLiquidity ? parsedAmounts[Field.OUTPUT].raw.toString() : minTokenOutput.toString(),
      account.toString(),
      1739591241
    ]

    const estimatedGasLimit = await router.estimate.addLiquidity(...args, {
      value: ethers.constants.Zero
    })

    const GAS_MARGIN = ethers.utils.bigNumberify(1000)
    router
      .addLiquidity(...args, {
        gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
      })
      .then(response => {
        setTxHash(response)
        addTransaction(response)
        toggelPendingConfirmation(false)
      })
      .catch(e => {
        toggleConfirm(false)
      })
  }

  return (
    <>
      <ConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => {
          toggleConfirm(false)
        }}
        liquidityAmount={liquidityMinted}
        amount0={
          parsedAmounts[independentField]?.token.equals(exchange?.token0)
            ? parsedAmounts[independentField]
            : parsedAmounts[dependentField]
        }
        amount1={
          parsedAmounts[independentField]?.token.equals(exchange?.token0)
            ? parsedAmounts[dependentField]
            : parsedAmounts[independentField]
        }
        poolTokenPercentage={poolTokenPercentage}
        price={route?.midPrice && route?.midPrice?.raw?.denominator}
        transactionType={TRANSACTION_TYPE.ADD}
        contractCall={onAdd}
        pendingConfirmation={pendingConfirmation}
        hash={txHash ? txHash.hash : ''}
      />
      <SearchModal
        isOpen={showSearch}
        onDismiss={() => {
          toggleSearch(false)
        }}
      />
      <AutoColumn gap="20px">
        <ButtonEmpty
          padding={'1rem'}
          onClick={() => {
            toggleSearch(true)
          }}
        >
          <RowBetween>
            <DoubleLogo a0={exchange?.token0?.address || ''} a1={exchange?.token1?.address || ''} size={24} />
            <Text fontSize={20}>
              {exchange?.token0?.symbol && exchange?.token1?.symbol
                ? exchange?.token0?.symbol + ' / ' + exchange?.token1?.symbol + ' Pool'
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
            maxAmountInput && onMaxInput(maxAmountInput.toExact())
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
            onMaxOutput(maxAmountOutput.toExact())
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
        <ColumnCenter>
          <ArrowDown size="16" color="#888D9B" />
        </ColumnCenter>
        <LightCard>
          <AutoColumn gap="10px">
            <RowBetween>
              Minted pool tokens:
              <div>{liquidityMinted ? liquidityMinted.toExact() : '-'}</div>
            </RowBetween>
            <RowBetween>
              Minted pool share:
              <div>{poolTokenPercentage ? +poolTokenPercentage.toFixed(4) + '%' : '-'}</div>
            </RowBetween>
            <RowBetween>
              Rate:
              <div>
                1 {exchange?.token0.symbol} ={' '}
                {independentField === Field.OUTPUT
                  ? route?.midPrice.invert().toSignificant(6)
                  : route?.midPrice.toSignificant(6)}{' '}
                {exchange?.token1.symbol}
              </div>
            </RowBetween>
          </AutoColumn>
        </LightCard>
        <ColumnCenter style={{ height: '20px' }}>
          <ErrorText fontSize={12} error={isError}>
            {errorText && errorText}
          </ErrorText>
        </ColumnCenter>
        <ButtonPrimary
          onClick={() => {
            toggleConfirm(true)
          }}
          disabled={!isValid}
        >
          <Text fontSize={20} fontWeight={500}>
            Supply
          </Text>
        </ButtonPrimary>
      </AutoColumn>
    </>
  )
}
