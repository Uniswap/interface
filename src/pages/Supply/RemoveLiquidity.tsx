import React, { useReducer, useState, useCallback, useEffect } from 'react'
import { WETH, TokenAmount, JSBI, Route } from '@uniswap/sdk'
import { ethers } from 'ethers'
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
import { useAddressBalance, useAllBalances } from '../../contexts/Balances'
import { useExchange } from '../../contexts/Exchanges'
import { useExchangeContract } from '../../hooks'
import { useTransactionAdder } from '../../contexts/Transactions'

import { TRANSACTION_TYPE } from '../../constants'
import { getRouterContract, calculateGasMargin } from '../../utils'
import { splitSignature } from '@ethersproject/bytes'

const ErrorText = styled(Text)`
  color: ${({ theme, error }) => (error ? theme.salmonRed : theme.chaliceGray)};
`

enum Field {
  POOL,
  INPUT,
  OUTPUT
}

interface RemoveState {
  independentField: Field
  typedValue: string
  [Field.POOL]: {
    address: string | undefined
  }
  [Field.INPUT]: {
    address: string | undefined
  }
  [Field.OUTPUT]: {
    address: string | undefined
  }
}

function initializeRemoveState(inputAddress?: string, outputAddress?: string): RemoveState {
  return {
    independentField: Field.INPUT,
    typedValue: '',
    [Field.POOL]: {
      address: ''
    },
    [Field.INPUT]: {
      address: inputAddress
    },
    [Field.OUTPUT]: {
      address: outputAddress
    }
  }
}

enum RemoveAction {
  SELECT_TOKEN,
  SWITCH_TOKENS,
  TYPE
}

interface Payload {
  [RemoveAction.SELECT_TOKEN]: {
    field: Field
    address: string
  }
  [RemoveAction.SWITCH_TOKENS]: undefined
  [RemoveAction.TYPE]: {
    field: Field
    typedValue: string
  }
}

function reducer(
  state: RemoveState,
  action: {
    type: RemoveAction
    payload: Payload[RemoveAction]
  }
): RemoveState {
  switch (action.type) {
    case RemoveAction.TYPE: {
      const { field, typedValue } = action.payload as Payload[RemoveAction.TYPE]
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

export default function RemoveLiquidity({ token0, token1 }) {
  // console.log('DEBUG: Rendering')

  const { account, chainId, library, connector } = useWeb3React()

  // modal state
  const [showSearch, toggleSearch] = useState(false)

  const [pendingConfirmation, toggelPendingConfirmation] = useState(false)

  // input state
  const [state, dispatch] = useReducer(reducer, initializeRemoveState(token0, token1))
  const { independentField, typedValue, ...fieldData } = state

  const inputToken = useToken(fieldData[Field.INPUT].address)
  const outputToken = useToken(fieldData[Field.OUTPUT].address)

  // get basic SDK entities
  const tokens = {
    [Field.INPUT]: inputToken,
    [Field.OUTPUT]: outputToken
  }

  const exchange = useExchange(inputToken, outputToken)
  const exchangeContract = useExchangeContract(exchange?.liquidityToken.address)

  // pool token data
  const [totalPoolTokens, setTotalPoolTokens] = useState<TokenAmount>()

  // get user- and token-specific lookup data
  const userBalances = {
    [Field.INPUT]: useAddressBalance(account, tokens[Field.INPUT]),
    [Field.OUTPUT]: useAddressBalance(account, tokens[Field.OUTPUT])
  }

  const allBalances = useAllBalances()
  const userLiquidity = allBalances?.[account]?.[exchange.liquidityToken.address]

  // state for confirmation popup
  const [showConfirm, toggleConfirm] = useState(false)

  // errors
  const [inputError, setInputError] = useState()
  const [outputError, setOutputError] = useState()
  const [poolTokenError, setPoolTokenError] = useState()
  const [errorText, setErrorText] = useState(' ')
  const [isError, setIsError] = useState(false)

  const fetchPoolTokens = useCallback(() => {
    if (exchangeContract && exchange && exchange.liquidityToken) {
      exchangeContract.totalSupply().then(totalSupply => {
        if (totalSupply !== undefined) {
          const supplyFormatted = JSBI.BigInt(totalSupply)
          const tokenSupplyFormatted = new TokenAmount(exchange.liquidityToken, supplyFormatted)
          setTotalPoolTokens(tokenSupplyFormatted)
        }
      })
    }
    /**
     * @todo
     *
     * when exchange is used here enter infinite loop
     *
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchangeContract])
  useEffect(() => {
    fetchPoolTokens()
    library.on('block', fetchPoolTokens)

    return () => {
      library.removeListener('block', fetchPoolTokens)
    }
  }, [fetchPoolTokens, library])

  const TokensDeposited = {
    [Field.INPUT]:
      exchange &&
      totalPoolTokens &&
      userLiquidity &&
      exchange.getLiquidityValue(tokens[Field.INPUT], totalPoolTokens, userLiquidity, false),
    [Field.OUTPUT]:
      exchange &&
      totalPoolTokens &&
      userLiquidity &&
      exchange.getLiquidityValue(tokens[Field.OUTPUT], totalPoolTokens, userLiquidity, false)
  }

  const route = exchange
    ? new Route([exchange], independentField === Field.POOL ? tokens[Field.INPUT] : tokens[independentField])
    : undefined

  // parse the amounts based on input
  const parsedAmounts: { [field: number]: TokenAmount } = {}
  // try to parse typed value
  if (independentField === Field.INPUT) {
    if (typedValue !== '' && typedValue !== '.' && tokens[Field.INPUT] && exchange && userLiquidity) {
      try {
        const typedValueParsed = parseUnits(typedValue, tokens[Field.INPUT].decimals).toString()
        if (typedValueParsed !== '0') {
          parsedAmounts[Field.INPUT] = new TokenAmount(tokens[Field.INPUT], typedValueParsed)
          parsedAmounts[Field.OUTPUT] = route.midPrice.quote(parsedAmounts[Field.INPUT])
          parsedAmounts[Field.POOL] = exchange.getLiquidityMinted(
            totalPoolTokens,
            parsedAmounts[Field.INPUT],
            parsedAmounts[Field.OUTPUT]
          )
        }
      } catch (error) {
        // should only fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
        console.error(error)
      }
    }
  } else if (independentField === Field.OUTPUT) {
    if (typedValue !== '' && typedValue !== '.' && tokens[Field.OUTPUT]) {
      try {
        const typedValueParsed = parseUnits(typedValue, tokens[Field.OUTPUT].decimals).toString()
        if (typedValueParsed !== '0') {
          parsedAmounts[Field.OUTPUT] = new TokenAmount(tokens[Field.OUTPUT], typedValueParsed)
          parsedAmounts[Field.INPUT] = route.midPrice.quote(parsedAmounts[Field.OUTPUT])
          parsedAmounts[Field.POOL] = exchange.getLiquidityMinted(
            totalPoolTokens,
            parsedAmounts[Field.INPUT],
            parsedAmounts[Field.OUTPUT]
          )
        }
      } catch (error) {
        // should only fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
        console.error(error)
      }
    }
  } else {
    if (typedValue !== '' && typedValue !== '.' && exchange) {
      try {
        const typedValueParsed = parseUnits(typedValue, exchange?.liquidityToken.decimals).toString()
        if (typedValueParsed !== '0') {
          parsedAmounts[Field.POOL] = new TokenAmount(exchange?.liquidityToken, typedValueParsed)
          if (
            !JSBI.lessThanOrEqual(parsedAmounts[Field.POOL].raw, totalPoolTokens.raw) ||
            !JSBI.lessThanOrEqual(parsedAmounts[Field.POOL].raw, userLiquidity.raw)
          ) {
          } else {
            parsedAmounts[Field.INPUT] = exchange.getLiquidityValue(
              tokens[Field.INPUT],
              totalPoolTokens,
              parsedAmounts[Field.POOL],
              false
            )
            parsedAmounts[Field.OUTPUT] = exchange.getLiquidityValue(
              tokens[Field.OUTPUT],
              totalPoolTokens,
              parsedAmounts[Field.POOL],
              false
            )
          }
        }
      } catch (error) {
        // should only fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
        console.error(error)
      }
    }
  }

  // get formatted amounts
  const formattedAmounts = {
    [Field.POOL]:
      independentField === Field.POOL
        ? typedValue
        : parsedAmounts[Field.POOL]
        ? parsedAmounts[Field.POOL].toSignificant(8)
        : '',
    [Field.INPUT]:
      independentField === Field.INPUT
        ? typedValue
        : parsedAmounts[Field.INPUT]
        ? parsedAmounts[Field.INPUT].toSignificant(8)
        : '',
    [Field.OUTPUT]:
      independentField === Field.OUTPUT
        ? typedValue
        : parsedAmounts[Field.OUTPUT]
        ? parsedAmounts[Field.OUTPUT].toSignificant(8)
        : ''
  }

  const onTokenSelection = useCallback((field: Field, address: string) => {
    dispatch({
      type: RemoveAction.SELECT_TOKEN,
      payload: { field, address }
    })
  }, [])

  // update input value when user types
  const onUserInput = useCallback((field: Field, typedValue: string) => {
    dispatch({ type: RemoveAction.TYPE, payload: { field, typedValue } })
  }, [])

  const onMaxInput = useCallback((typedValue: string) => {
    dispatch({
      type: RemoveAction.TYPE,
      payload: {
        field: Field.INPUT,
        typedValue
      }
    })
  }, [])

  const onMaxOutput = useCallback((typedValue: string) => {
    dispatch({
      type: RemoveAction.TYPE,
      payload: {
        field: Field.OUTPUT,
        typedValue
      }
    })
  }, [])

  const onMaxPool = useCallback((typedValue: string) => {
    dispatch({
      type: RemoveAction.TYPE,
      payload: {
        field: Field.POOL,
        typedValue
      }
    })
  }, [])

  const MIN_ETHER = new TokenAmount(WETH[chainId], JSBI.BigInt(parseEther('.01')))
  const maxAmountInput =
    TokensDeposited[Field.INPUT] &&
    JSBI.greaterThan(
      TokensDeposited[Field.INPUT].raw,
      tokens[Field.INPUT].equals(WETH[chainId]) ? MIN_ETHER.raw : JSBI.BigInt(0)
    )
      ? tokens[Field.INPUT].equals(WETH[chainId])
        ? TokensDeposited[Field.INPUT].subtract(MIN_ETHER)
        : TokensDeposited[Field.INPUT]
      : undefined

  const atMaxAmountInput =
    !!maxAmountInput && !!parsedAmounts[Field.INPUT]
      ? JSBI.equal(maxAmountInput.raw, parsedAmounts[Field.INPUT].raw)
      : undefined

  const maxAmountOutput =
    !!userBalances[Field.OUTPUT] &&
    TokensDeposited[Field.OUTPUT] &&
    JSBI.greaterThan(
      TokensDeposited[Field.OUTPUT]?.raw,
      tokens[Field.OUTPUT].equals(WETH[chainId]) ? MIN_ETHER.raw : JSBI.BigInt(0)
    )
      ? tokens[Field.OUTPUT].equals(WETH[chainId])
        ? TokensDeposited[Field.OUTPUT].subtract(MIN_ETHER)
        : TokensDeposited[Field.OUTPUT]
      : undefined

  const atMaxAmountOutput =
    !!maxAmountOutput && !!parsedAmounts[Field.OUTPUT]
      ? JSBI.equal(maxAmountOutput.raw, parsedAmounts[Field.OUTPUT].raw)
      : undefined

  const maxAmountPoolToken = userLiquidity

  const atMaxAmountPoolToken =
    !!maxAmountOutput && !!parsedAmounts[Field.POOL]
      ? JSBI.equal(maxAmountPoolToken.raw, parsedAmounts[Field.POOL].raw)
      : undefined

  // update errors live
  useEffect(() => {
    // reset errors
    setInputError(null)
    setOutputError(null)
    setPoolTokenError(null)
    setIsError(false)

    if (
      totalPoolTokens &&
      userLiquidity &&
      parsedAmounts[Field.POOL] &&
      (!JSBI.lessThanOrEqual(parsedAmounts[Field.POOL].raw, totalPoolTokens.raw) ||
        !JSBI.lessThanOrEqual(parsedAmounts[Field.POOL].raw, userLiquidity.raw))
    ) {
      setPoolTokenError('Input a liquidity amount less than or equal to your balance.')
      setIsError(true)
    }

    if (parseFloat(parsedAmounts?.[Field.INPUT]?.toExact()) > parseFloat(userBalances?.[Field.INPUT]?.toExact())) {
      setInputError('Insufficient balance.')
      setIsError(true)
    }
    if (parseFloat(parsedAmounts?.[Field.OUTPUT]?.toExact()) > parseFloat(userBalances?.[Field.OUTPUT]?.toExact())) {
      setOutputError('Insufficient balance.')
      setIsError(true)
    }
  }, [parsedAmounts, totalPoolTokens, userBalances, userLiquidity])

  // set error text based on all errors
  useEffect(() => {
    setErrorText(null)
    if (poolTokenError) {
      setErrorText(poolTokenError)
    } else if (!parsedAmounts[Field.INPUT]) {
      setErrorText('Enter an amount to continue')
    } else if (outputError) {
      setErrorText(outputError)
    } else if (inputError) {
      setErrorText(inputError)
      return
    }
  }, [inputError, outputError, parsedAmounts, poolTokenError])

  // error state for button
  const isValid = !errorText

  // state for txn
  const addTransaction = useTransactionAdder()
  const [txHash, setTxHash] = useState()

  // mock to set initial values either from URL or route from supply page
  const routerAddress = '0xd9210Ff5A0780E083BB40e30d005d93a2DcFA4EF'

  const router = getRouterContract(chainId, library, account)

  const [sigInputs, setSigInputs] = useState([])

  async function onSign() {
    const nonce = await exchangeContract.nonces(account)
    const deadline = 1739591241

    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ]

    const domain = {
      name: 'Uniswap V2',
      version: '1',
      chainId: chainId,
      verifyingContract: exchange.liquidityToken.address
    }

    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
    const message = {
      owner: account,
      spender: routerAddress,
      value: parsedAmounts[Field.POOL].raw.toString(),
      nonce: nonce.toHexString(),
      deadline: deadline
    }
    const data = JSON.stringify({
      types: {
        EIP712Domain,
        Permit
      },
      domain,
      primaryType: 'Permit',
      message
    })

    library.send('eth_signTypedData_v4', [account, data]).then(_signature => {
      const signature = splitSignature(_signature)
      setSigInputs([signature.v, signature.r, signature.s])
    })
  }

  async function onRemove() {
    // now can structure txn
    const args = [
      tokens[Field.INPUT].address,
      tokens[Field.OUTPUT].address,
      parsedAmounts[Field.POOL].raw.toString(),
      parsedAmounts[Field.INPUT].raw.toString(),
      parsedAmounts[Field.OUTPUT].raw.toString(),
      account,
      1739591241,
      sigInputs[0],
      sigInputs[1],
      sigInputs[2]
    ]

    const estimatedGasLimit = await router.estimate.removeLiquidityWithPermit(...args, {
      value: ethers.constants.Zero
    })

    const GAS_MARGIN = ethers.utils.bigNumberify(1000)
    router
      .removeLiquidityWithPermit(...args, {
        gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
      })
      .then(response => {
        console.log('success')
        setTxHash(response.hash)
        addTransaction(response.hash)
      })
      .catch(e => {
        console.log('error trying txn')
      })
  }

  return (
    <>
      <ConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => {
          toggleConfirm(false)
        }}
        amount0={parsedAmounts[Field.INPUT]}
        amount1={parsedAmounts[Field.OUTPUT]}
        price={route?.midPrice}
        liquidityAmount={parsedAmounts[Field.POOL]}
        transactionType={TRANSACTION_TYPE.REMOVE}
        contractCall={() => {}}
        pendingConfirmation={pendingConfirmation}
        hash={''}
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
          field={Field.POOL}
          value={formattedAmounts[Field.POOL]}
          onUserInput={onUserInput}
          onMax={() => {
            maxAmountPoolToken && onMaxPool(maxAmountPoolToken.toExact())
          }}
          atMax={atMaxAmountPoolToken}
          onTokenSelection={onTokenSelection}
          title={'Deposit'}
          error={poolTokenError}
          disableTokenSelect
          token={exchange?.liquidityToken}
          isExchange={true}
          exchange={exchange}
        />
        <ColumnCenter>
          <ArrowDown size="16" color="#888D9B" />
        </ColumnCenter>
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
          disableTokenSelect
          customBalance={TokensDeposited[Field.INPUT]}
        />
        <ColumnCenter>
          <Plus size="16" color="#888D9B" />
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
          title={'Deposit'}
          error={outputError}
          disableTokenSelect
          customBalance={TokensDeposited[Field.OUTPUT]}
        />
        <ColumnCenter>
          <ArrowDown size="16" color="#888D9B" />
        </ColumnCenter>
        <LightCard>
          <AutoColumn gap="10px">
            <RowBetween>
              Pool Tokens Burned:
              <div>{formattedAmounts[Field.POOL] ? formattedAmounts[Field.POOL] : '-'}</div>
            </RowBetween>
            <RowBetween>
              {exchange?.token0.symbol} Removed:
              <div>{formattedAmounts[Field.INPUT] ? formattedAmounts[Field.INPUT] : '-'}</div>
            </RowBetween>
            <RowBetween>
              {exchange?.token1.symbol} Removed:
              <div>{formattedAmounts[Field.OUTPUT] ? formattedAmounts[Field.OUTPUT] : '-'}</div>
            </RowBetween>
            <RowBetween>
              Rate:
              <div>
                1 {exchange?.token0.symbol} ={' '}
                {independentField === Field.INPUT || independentField === Field.POOL
                  ? route?.midPrice.toSignificant(6)
                  : route?.midPrice.invert().toSignificant(6)}{' '}
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
        <RowBetween>
          <ButtonPrimary
            onClick={() => {
              // toggleConfirm(true)
              onSign()
            }}
            width="48%"
            disabled={!isValid}
          >
            <Text fontSize={20} fontWeight={500}>
              Sign
            </Text>
          </ButtonPrimary>
          <ButtonPrimary
            onClick={() => {
              // toggleConfirm(true)
              onRemove()
            }}
            width="48%"
            disabled={!isValid}
          >
            <Text fontSize={20} fontWeight={500}>
              Remove
            </Text>
          </ButtonPrimary>
        </RowBetween>
      </AutoColumn>
    </>
  )
}
