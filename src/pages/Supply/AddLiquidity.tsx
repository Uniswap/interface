import React, { useReducer, useState, useCallback, useEffect } from 'react'
import { WETH, TokenAmount, JSBI, Percent, Route } from '@uniswap/sdk'
import { parseUnits, parseEther } from '@ethersproject/units'
import styled from 'styled-components'

import { Text } from 'rebass'
import { ChevronDown } from 'react-feather'
import { ButtonPrimary, ButtonEmpty } from '../../components/Button'
import ConfirmationModal from '../../components/ConfirmationModal'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { RowBetween } from '../../components/Row'
import DoubleLogo from '../../components/DoubleLogo'
import { ArrowDown, Plus } from 'react-feather'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { LightCard } from '../../components/Card'
import SearchModal from '../../components/SearchModal'

import { useWeb3React } from '../../hooks'
import { useToken } from '../../contexts/Tokens'
import { useAddressBalance } from '../../contexts/Balances'
import { useExchange } from '../../contexts/Exchanges'
import { useExchangeContract } from '../../hooks'

const ErrorText = styled(Text)`
  color: ${({ theme, error }) => (error ? theme.salmonRed : theme.chaliceGray)};
`

const ALLOWED_SLIPPAGE = JSBI.BigInt(200)

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

export default function AddLiquidity() {
  // mock to set initial values either from URL or route from supply page
  const token1 = '0xc7AD46e0b8a400Bb3C915120d284AafbA8fc4735'
  const token0 = '0xc778417E063141139Fce010982780140Aa0cD5Ab'

  const { account, chainId, library } = useWeb3React()

  // modal state
  const [showSearch, toggleSearch] = useState(false)

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

  // get the price data and update dependent field
  if (
    route &&
    parsedAmounts[independentField] &&
    JSBI.greaterThan(parsedAmounts[independentField].raw, JSBI.BigInt(0))
  ) {
    parsedAmounts[dependentField] = route.midPrice.quote(parsedAmounts[independentField])
  }

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField] ? parsedAmounts[dependentField].toSignificant(8) : ''
  }

  // pool token data
  const poolToken = useToken(exchange?.address)
  const [totalPoolTokens, setTotalPoolTokens] = useState<TokenAmount>()

  const exchangeContract = useExchangeContract(exchange?.address)
  const fetchPoolTokens = useCallback(() => {
    if (exchangeContract) {
      exchangeContract.totalSupply().then(totalSupply => {
        if (totalSupply !== undefined && poolToken?.decimals) {
          const supplyFormatted = JSBI.BigInt(totalSupply)
          const tokenSupplyFormatted = new TokenAmount(poolToken, supplyFormatted)
          setTotalPoolTokens(tokenSupplyFormatted)
        }
      })
    }
  }, [exchangeContract, poolToken])
  useEffect(() => {
    fetchPoolTokens()
    library.on('block', fetchPoolTokens)

    return () => {
      library.removeListener('block', fetchPoolTokens)
    }
  }, [fetchPoolTokens, library])

  function minTokenAmount(x: JSBI, y: JSBI): JSBI {
    return JSBI.lessThan(x, y) ? x : y
  }

  // check for estimated liquidity minted
  const liquidityMinted =
    !!poolToken && !!parsedAmounts[Field.INPUT] && !!parsedAmounts[Field.OUTPUT] && !!totalPoolTokens && exchange
      ? new TokenAmount(
          poolToken,
          minTokenAmount(
            JSBI.divide(
              JSBI.multiply(parsedAmounts[Field.INPUT].raw, totalPoolTokens.raw),
              exchange.reserveOf(tokens[Field.INPUT]).raw
            ),
            JSBI.divide(
              JSBI.multiply(parsedAmounts[Field.OUTPUT].raw, totalPoolTokens.raw),
              exchange.reserveOf(tokens[Field.OUTPUT]).raw
            )
          )
        )
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

  // state for confirmation popup
  const [showConfirm, toggleConfirm] = useState(false)

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
    if (parseFloat(parsedAmounts?.[Field.INPUT]?.toExact()) > parseFloat(userBalances?.[Field.INPUT]?.toExact())) {
      setInputError('Insufficient balance.')
      setIsError(true)
    }
    if (parseFloat(parsedAmounts?.[Field.OUTPUT]?.toExact()) > parseFloat(userBalances?.[Field.OUTPUT]?.toExact())) {
      setOutputError('Insufficient balance.')
      setIsError(true)
    }
  }, [parsedAmounts, userBalances])

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
          toggleConfirm(false)
        }}
        liquidityMinted={liquidityMinted}
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
        price={route?.midPrice}
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
        <CurrencyInputPanel
          field={Field.INPUT}
          value={formattedAmounts[Field.INPUT]}
          onUserInput={onUserInput}
          onMax={() => {
            onMaxInput(maxAmountInput.toExact())
          }}
          atMax={atMaxAmountInput}
          selectedTokenAddress={tokens[Field.INPUT]?.address}
          onTokenSelection={onTokenSelection}
          title={'Deposit'}
          error={inputError}
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
          selectedTokenAddress={tokens[Field.OUTPUT]?.address}
          onTokenSelection={onTokenSelection}
          title={'Deposit'}
          error={outputError}
        />
        <ColumnCenter>
          <ArrowDown size="16" color="#888D9B" />
        </ColumnCenter>
        <LightCard>
          <AutoColumn gap="10px">
            <RowBetween>
              Minted pool tokens:
              <div>{liquidityMinted ? liquidityMinted.toFixed(6) : '-'}</div>
            </RowBetween>
            <RowBetween>
              Minted pool share:
              <div>{poolTokenPercentage ? +poolTokenPercentage.toFixed(4) + '%' : '-'}</div>
            </RowBetween>
            <RowBetween>
              Rate:
              <div>
                1 {exchange?.token0.symbol} = {route?.midPrice.toSignificant(6)} {exchange?.token1.symbol}
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
