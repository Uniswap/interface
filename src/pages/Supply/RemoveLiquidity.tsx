import React, { useReducer, useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { parseUnits } from '@ethersproject/units'
import { TokenAmount, JSBI, Route, WETH, Percent } from '@uniswap/sdk'

import Slider from '../../components/Slider'
import DoubleLogo from '../../components/DoubleLogo'
import SearchModal from '../../components/SearchModal'
import PositionCard from '../../components/PositionCard'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { Text } from 'rebass'
import { LightCard } from '../../components/Card'
import { ChevronDown } from 'react-feather'
import { ArrowDown, Plus } from 'react-feather'
import { RowBetween, RowFixed } from '../../components/Row'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { ButtonPrimary, ButtonEmpty } from '../../components/Button'

import { useToken } from '../../contexts/Tokens'
import { useWeb3React } from '../../hooks'
import { useAllBalances } from '../../contexts/Balances'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useExchangeContract } from '../../hooks'
import { useExchange, useTotalSupply } from '../../contexts/Exchanges'

import { BigNumber } from 'ethers/utils'
import { splitSignature } from '@ethersproject/bytes'
import { TRANSACTION_TYPE } from '../../constants'
import { ROUTER_ADDRESSES } from '../../constants'
import { getRouterContract, calculateGasMargin } from '../../utils'
import TokenLogo from '../../components/TokenLogo'

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

const ClickableText = styled(Text)`
  :hover {
    cursor: pointer;
  }
`

const MaxButton = styled.button`
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
  PERCENTAGE,
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
    independentField: Field.PERCENTAGE,
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

  const { account, chainId, library } = useWeb3React()
  const routerAddress = ROUTER_ADDRESSES[chainId]

  // modal state
  const [showSearch, toggleSearch] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] = useState(true)

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
  const totalPoolTokens = useTotalSupply(exchange)

  const allBalances = useAllBalances()
  const userLiquidity = allBalances?.[account]?.[exchange?.liquidityToken?.address]

  // state for confirmation popup
  const [showConfirm, setShowConfirm] = useState(false)

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
    ? new Route(
        [exchange],
        independentField === Field.POOL || independentField === Field.PERCENTAGE
          ? tokens[Field.OUTPUT]
          : tokens[independentField]
      )
    : undefined

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

  // used for percentage based amount setting
  const [percentageAmount, setPercentageAmount] = useState(100)
  const handleSliderChange = (event, newValue) => {
    setPercentageAmount(newValue)
    onUserInput(Field.PERCENTAGE, undefined)
  }

  // parse the amounts based on input
  const parsedAmounts: { [field: number]: TokenAmount } = {}
  if (
    independentField === Field.PERCENTAGE &&
    userLiquidity &&
    exchange &&
    totalPoolTokens &&
    tokens[Field.INPUT] &&
    tokens[Field.OUTPUT]
  ) {
    const formattedPercentage = JSBI.BigInt(percentageAmount)
    const liquidityAmount = JSBI.divide(JSBI.multiply(userLiquidity.raw, formattedPercentage), JSBI.BigInt(100))
    parsedAmounts[Field.POOL] = new TokenAmount(exchange?.liquidityToken, liquidityAmount)
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
  } else if (independentField === Field.INPUT) {
    if (typedValue !== '' && typedValue !== '.' && tokens[Field.INPUT] && exchange && userLiquidity) {
      try {
        const typedValueParsed = parseUnits(typedValue, tokens[Field.INPUT].decimals).toString()
        if (typedValueParsed !== '0') {
          // first get the exact percentage of tokens deposited
          const inputTokenAmount = new TokenAmount(tokens[Field.INPUT], typedValueParsed)
          const ratio = new Percent(inputTokenAmount.raw, TokensDeposited[Field.INPUT].raw)
          const partialLiquidity = ratio.multiply(userLiquidity)
          const liquidityTokenAmount = new TokenAmount(exchange.liquidityToken, partialLiquidity)
          parsedAmounts[Field.POOL] = liquidityTokenAmount
          parsedAmounts[Field.OUTPUT] = exchange.getLiquidityValue(
            tokens[Field.OUTPUT],
            totalPoolTokens,
            parsedAmounts[Field.POOL],
            false
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
          const inputTokenAmount = new TokenAmount(tokens[Field.OUTPUT], typedValueParsed)
          const ratio = JSBI.divide(inputTokenAmount.raw, TokensDeposited[Field.OUTPUT].raw)
          const partialLiquidity = JSBI.multiply(userLiquidity.raw, ratio)
          const liquidityTokenAmount = new TokenAmount(exchange.liquidityToken, partialLiquidity)
          parsedAmounts[Field.POOL] = liquidityTokenAmount
          parsedAmounts[Field.INPUT] = exchange.getLiquidityValue(
            tokens[Field.INPUT],
            totalPoolTokens,
            parsedAmounts[Field.POOL],
            false
          )
        }
      } catch (error) {
        // should only fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
        console.error(error)
      }
    }
  } else if (independentField === Field.POOL) {
    if (typedValue !== '' && typedValue !== '.' && exchange) {
      try {
        const typedValueParsed = parseUnits(typedValue, exchange?.liquidityToken.decimals).toString()
        if (typedValueParsed !== '0') {
          parsedAmounts[Field.POOL] = new TokenAmount(exchange?.liquidityToken, typedValueParsed)
          if (
            (parsedAmounts[Field.POOL] &&
              totalPoolTokens &&
              !JSBI.lessThanOrEqual(parsedAmounts[Field.POOL].raw, totalPoolTokens.raw)) ||
            !JSBI.lessThanOrEqual(parsedAmounts[Field.POOL].raw, userLiquidity.raw)
          ) {
            /**
             * do some error catching on amount?
             */
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

  const onMax = useCallback((typedValue: string, field) => {
    dispatch({
      type: RemoveAction.TYPE,
      payload: {
        field: field,
        typedValue
      }
    })
  }, [])

  // get the max amounts user can add
  const maxAmountPoolToken = userLiquidity
  const [maxAmountInput, maxAmountOutput] = [Field.INPUT, Field.OUTPUT].map(index => {
    const field = Field[index]
    return !!TokensDeposited[Field[field]] && JSBI.greaterThan(TokensDeposited[Field[field]].raw, JSBI.BigInt(0))
      ? TokensDeposited[Field[field]]
      : undefined
  })

  const [atMaxAmountInput, atMaxAmountOutput] = [Field.INPUT, Field.OUTPUT].map(index => {
    const field = Field[index]
    const maxAmount = index === Field.INPUT ? maxAmountInput : maxAmountOutput
    return !!maxAmount && !!parsedAmounts[Field[field]]
      ? JSBI.lessThanOrEqual(maxAmount.raw, parsedAmounts[Field[field]].raw)
      : undefined
  })

  const atMaxAmountPoolToken =
    !!maxAmountOutput && !!parsedAmounts[Field.POOL]
      ? JSBI.lessThanOrEqual(maxAmountPoolToken.raw, parsedAmounts[Field.POOL].raw)
      : undefined

  // errors
  const [generalError, setGeneralError] = useState()
  const [inputError, setInputError] = useState()
  const [outputError, setOutputError] = useState()
  const [poolTokenError, setPoolTokenError] = useState()
  const [isError, setIsError] = useState(false)
  const [isValid, setIsValid] = useState(false)

  // update errors live
  useEffect(() => {
    // reset errors
    setGeneralError(false)
    setInputError(null)
    setOutputError(null)
    setPoolTokenError(null)
    setIsError(false)
    setIsValid(true)

    if (!parsedAmounts[Field.INPUT]) {
      setGeneralError('Enter an amount to continue')
      setIsValid(false)
    }
    if (!parsedAmounts[Field.OUTPUT]) {
      setGeneralError('Enter an amount to continue')
      setIsValid(false)
    }
    if (
      totalPoolTokens &&
      userLiquidity &&
      parsedAmounts[Field.POOL] &&
      (!JSBI.lessThanOrEqual(parsedAmounts[Field.POOL].raw, totalPoolTokens.raw) ||
        !JSBI.lessThanOrEqual(parsedAmounts[Field.POOL].raw, userLiquidity.raw))
    ) {
      setPoolTokenError('Input a liquidity amount less than or equal to your balance.')
      setIsError(true)
      setIsValid(false)
    }

    // if (
    //   parsedAmounts?.[Field.INPUT] &&
    //   userBalances?.[Field.INPUT] &&
    //   JSBI.greaterThan(parsedAmounts?.[Field.INPUT]?.raw, userBalances?.[Field.INPUT]?.raw)
    // ) {
    //   setInputError('Insufficient balance.')
    //   setIsError(true)
    //   setIsValid(false)
    // }
    // if (
    //   parsedAmounts?.[Field.OUTPUT] &&
    //   userBalances?.[Field.OUTPUT] &&
    //   parseFloat(parsedAmounts?.[Field.OUTPUT]?.toExact()) > parseFloat(userBalances?.[Field.OUTPUT]?.toExact())
    // ) {
    //   setOutputError('Insufficient balance.')
    //   setIsError(true)
    //   setIsValid(false)
    // }
  }, [parsedAmounts, totalPoolTokens, userLiquidity])

  // error state for button

  // state for txn
  const addTransaction = useTransactionAdder()
  const [txHash, setTxHash] = useState()
  const [sigInputs, setSigInputs] = useState([])
  const [signed, setSigned] = useState(false)
  const [attemptedRemoval, setAttemptedRemoval] = useState(false)
  const [deadline, setDeadline] = useState()

  async function onSign() {
    const nonce = await exchangeContract.nonces(account)

    const newDeadline = Math.ceil(Date.now() / 1000) + DEADLINE_FROM_NOW
    setDeadline(newDeadline)

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
      deadline: newDeadline
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
      setSigned(true)
    })
  }

  async function onRemove() {
    setAttemptedRemoval(true)
    const router = getRouterContract(chainId, library, account)
    let method, args, estimate

    // removal with ETH
    if (tokens[Field.INPUT] === WETH[chainId] || tokens[Field.OUTPUT] === WETH[chainId]) {
      method = router.removeLiquidityETHWithPermit
      estimate = router.estimate.removeLiquidityETHWithPermit
      args = [
        tokens[Field.OUTPUT] === WETH[chainId] ? tokens[Field.INPUT].address : tokens[Field.OUTPUT].address,
        parsedAmounts[Field.POOL].raw.toString(),
        tokens[Field.OUTPUT] === WETH[chainId]
          ? parsedAmounts[Field.INPUT].raw.toString()
          : parsedAmounts[Field.OUTPUT].raw.toString(),
        tokens[Field.OUTPUT] === WETH[chainId]
          ? parsedAmounts[Field.OUTPUT].raw.toString()
          : parsedAmounts[Field.INPUT].raw.toString(),
        account,
        deadline,
        sigInputs[0],
        sigInputs[1],
        sigInputs[2]
      ]
    }
    //removal without ETH
    else {
      method = router.removeLiquidityWithPermit
      estimate = router.estimate.removeLiquidityWithPermit
      args = [
        tokens[Field.INPUT].address,
        tokens[Field.OUTPUT].address,
        parsedAmounts[Field.POOL].raw.toString(),
        parsedAmounts[Field.INPUT].raw.toString(),
        parsedAmounts[Field.OUTPUT].raw.toString(),
        account,
        deadline,
        sigInputs[0],
        sigInputs[1],
        sigInputs[2]
      ]
    }

    const estimatedGasLimit = await estimate(...args, {
      value: ethers.constants.Zero
    }).catch(() => {
      resetModalState()
      setShowConfirm(false)
    })

    method(...args, {
      gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN)
    })
      .then(response => {
        setPendingConfirmation(false)
        setTxHash(response.hash)
        addTransaction(response)
      })
      .catch(() => {
        resetModalState()
        setShowConfirm(false)
      })
  }

  function resetModalState() {
    setSigned(false)
    setSigInputs(null)
    setAttemptedRemoval(false)
    setPendingConfirmation(true)
  }

  // show advanced mode or not
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <Wrapper>
      <ConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => {
          resetModalState()
          setShowConfirm(false)
        }}
        amount0={parsedAmounts[Field.INPUT]}
        amount1={parsedAmounts[Field.OUTPUT]}
        price={route?.midPrice}
        liquidityAmount={parsedAmounts[Field.POOL]}
        transactionType={TRANSACTION_TYPE.REMOVE}
        contractCall={onRemove}
        extraCall={onSign}
        signed={signed}
        attemptedRemoval={attemptedRemoval}
        pendingConfirmation={pendingConfirmation}
        hash={txHash ? txHash : ''}
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

        <LightCard>
          <AutoColumn gap="20px">
            <RowBetween>
              <Text fontWeight={500}>Amount To Remove</Text>
              <ClickableText
                fontWeight={500}
                onClick={() => {
                  setShowAdvanced(!showAdvanced)
                }}
                color="#2172E5"
              >
                {showAdvanced ? 'Minimal' : 'Advanced'}
              </ClickableText>
            </RowBetween>

            <RowBetween style={{ alignItems: 'flex-end' }}>
              <Text fontSize={72} fontWeight={500}>
                {percentageAmount}%
              </Text>
              <MaxButton
                onClick={() => {
                  setPercentageAmount(100)
                }}
              >
                Max
              </MaxButton>
            </RowBetween>
            <Slider value={percentageAmount} onChange={handleSliderChange} />
          </AutoColumn>
        </LightCard>
        {!showAdvanced && (
          <>
            <ColumnCenter>
              <ArrowDown size="16" color="#888D9B" />
            </ColumnCenter>{' '}
            <LightCard>
              <AutoColumn gap="10px">
                <RowBetween>
                  <Text fontSize={24} fontWeight={500}>
                    {formattedAmounts[Field.INPUT]}
                  </Text>
                  <RowFixed>
                    <TokenLogo address={tokens[Field.INPUT]?.address || ''} style={{ marginRight: '12px' }} />
                    <Text fontSize={24} fontWeight={500}>
                      {tokens[Field.INPUT]?.symbol}
                    </Text>
                  </RowFixed>
                </RowBetween>
                <RowBetween>
                  <Text fontSize={24} fontWeight={500}>
                    {formattedAmounts[Field.OUTPUT]}
                  </Text>
                  <RowFixed>
                    <TokenLogo address={tokens[Field.OUTPUT]?.address || ''} style={{ marginRight: '12px' }} />
                    <Text fontSize={24} fontWeight={500}>
                      {tokens[Field.OUTPUT]?.symbol}
                    </Text>
                  </RowFixed>
                </RowBetween>
              </AutoColumn>
            </LightCard>
          </>
        )}

        {showAdvanced && (
          <>
            <CurrencyInputPanel
              field={Field.POOL}
              value={formattedAmounts[Field.POOL]}
              onUserInput={onUserInput}
              onMax={() => {
                maxAmountPoolToken && onMax(maxAmountPoolToken.toExact(), Field.POOL)
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
                maxAmountInput && onMax(maxAmountInput.toExact(), Field.INPUT)
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
                maxAmountOutput && onMax(maxAmountOutput.toExact(), Field.OUTPUT)
              }}
              atMax={atMaxAmountOutput}
              token={tokens[Field.OUTPUT]}
              onTokenSelection={onTokenSelection}
              title={'Deposit'}
              error={outputError}
              disableTokenSelect
              customBalance={TokensDeposited[Field.OUTPUT]}
            />
          </>
        )}
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
        <ButtonPrimary
          onClick={() => {
            setShowConfirm(true)
          }}
          disabled={!isValid}
        >
          <Text fontSize={20} fontWeight={500}>
            Remove
          </Text>
        </ButtonPrimary>
        <FixedBottom>
          <PositionCard
            exchangeAddress={exchange.liquidityToken.address}
            token0={exchange.token0}
            token1={exchange.token1}
            minimal={true}
          />
        </FixedBottom>
      </AutoColumn>
    </Wrapper>
  )
}
