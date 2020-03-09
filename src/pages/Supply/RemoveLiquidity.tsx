import React, { useReducer, useState, useCallback, useEffect } from 'react'
import styled from 'styled-components'
import { ethers } from 'ethers'
import { parseUnits } from '@ethersproject/units'
import { TokenAmount, JSBI, Route, WETH, Percent } from '@uniswap/sdk'

import Slider from '../../components/Slider'
import TokenLogo from '../../components/TokenLogo'
import PositionCard from '../../components/PositionCard'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { Text } from 'rebass'
import { LightCard } from '../../components/Card'
import { ButtonPrimary } from '../../components/Button'
import { ArrowDown, Plus } from 'react-feather'
import { RowBetween, RowFixed } from '../../components/Row'
import { AutoColumn, ColumnCenter } from '../../components/Column'

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
  LIQUIDITY,
  TOKEN0,
  TOKEN1
}

interface RemoveState {
  independentField: Field
  typedValue: string
  [Field.LIQUIDITY]: {
    address: string | undefined
  }
  [Field.TOKEN0]: {
    address: string | undefined
  }
  [Field.TOKEN1]: {
    address: string | undefined
  }
}

function initializeRemoveState(liquidity, inputAddress?: string, outputAddress?: string): RemoveState {
  return {
    independentField: Field.LIQUIDITY,
    typedValue: liquidity || '',
    [Field.LIQUIDITY]: {
      address: ''
    },
    [Field.TOKEN0]: {
      address: inputAddress
    },
    [Field.TOKEN1]: {
      address: outputAddress
    }
  }
}

enum RemoveAction {
  TYPE
}

interface Payload {
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

// todo
// add exchange address to initial state

// remove stateful slider in advanced mode, just show a sig fig value based on pool tokens burned

// try to fully derive percentageAmount from state
// at the very least, move that state into the reducer

export default function RemoveLiquidity({ token0, token1 }) {
  const { account, chainId, library } = useWeb3React()
  const routerAddress = ROUTER_ADDRESSES[chainId]

  const [showConfirm, setShowConfirm] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const inputToken = useToken(token0)
  const outputToken = useToken(token1)

  // get basic SDK entities
  const tokens = {
    [Field.TOKEN0]: inputToken,
    [Field.TOKEN1]: outputToken
  }

  const exchange = useExchange(inputToken, outputToken)
  const exchangeContract = useExchangeContract(exchange?.liquidityToken.address)

  // pool token data
  const totalPoolTokens = useTotalSupply(exchange)

  const allBalances = useAllBalances()
  const userLiquidity = allBalances?.[account]?.[exchange?.liquidityToken?.address]

  // input state
  const [state, dispatch] = useReducer(reducer, initializeRemoveState(userLiquidity?.toExact(), token0, token1))
  const { independentField, typedValue } = state

  const TokensDeposited = {
    [Field.TOKEN0]:
      exchange &&
      totalPoolTokens &&
      userLiquidity &&
      exchange.getLiquidityValue(tokens[Field.TOKEN0], totalPoolTokens, userLiquidity, false),
    [Field.TOKEN1]:
      exchange &&
      totalPoolTokens &&
      userLiquidity &&
      exchange.getLiquidityValue(tokens[Field.TOKEN1], totalPoolTokens, userLiquidity, false)
  }

  const route = exchange
    ? new Route([exchange], independentField !== Field.LIQUIDITY ? tokens[independentField] : tokens[Field.TOKEN1])
    : undefined

  // update input value when user types
  const onUserInput = useCallback((field: Field, typedValue: string) => {
    dispatch({ type: RemoveAction.TYPE, payload: { field, typedValue } })
  }, [])

  const handleSliderChange = (event, newPercent) => {
    onUserInput(
      Field.LIQUIDITY,
      new TokenAmount(
        exchange?.liquidityToken,
        JSBI.divide(JSBI.multiply(userLiquidity.raw, JSBI.BigInt(newPercent)), JSBI.BigInt(100))
      ).toExact()
    )
  }

  const parsedAmounts: { [field: number]: TokenAmount } = {}
  let poolTokenAmount
  try {
    if (typedValue !== '' && typedValue !== '.' && tokens[Field.TOKEN0] && tokens[Field.TOKEN1] && userLiquidity) {
      if (independentField === Field.TOKEN0) {
        const typedValueParsed = parseUnits(typedValue, tokens[Field.TOKEN0].decimals).toString()
        if (typedValueParsed !== '0') {
          const tokenAmount = new TokenAmount(tokens[Field.TOKEN0], typedValueParsed)
          poolTokenAmount = JSBI.divide(
            JSBI.multiply(tokenAmount.raw, userLiquidity.raw),
            TokensDeposited[Field.TOKEN0].raw
          )
        }
      }
      if (independentField === Field.TOKEN1) {
        const typedValueParsed = parseUnits(typedValue, tokens[Field.TOKEN1].decimals).toString()
        if (typedValueParsed !== '0') {
          const tokenAmount = new TokenAmount(tokens[Field.TOKEN1], typedValueParsed)
          poolTokenAmount = JSBI.divide(
            JSBI.multiply(tokenAmount.raw, userLiquidity.raw),
            TokensDeposited[Field.TOKEN1].raw
          )
        }
      }
      if (independentField === Field.LIQUIDITY) {
        const typedValueParsed = parseUnits(typedValue, exchange?.liquidityToken.decimals).toString()
        const formattedAmount = new TokenAmount(exchange?.liquidityToken, typedValueParsed)
        if (typedValueParsed !== '0') {
          if (JSBI.greaterThan(formattedAmount.raw, userLiquidity?.raw)) {
            /**
             * error state for incorrect liquidity valye
             *
             */
          } else {
            poolTokenAmount = typedValueParsed
          }
        }
      }
    }
  } catch (error) {
    // should only fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.error(error)
  }

  // set parsed amounts based on live amount of liquidity
  parsedAmounts[Field.LIQUIDITY] =
    exchange && poolTokenAmount && new TokenAmount(exchange.liquidityToken, poolTokenAmount)
  parsedAmounts[Field.TOKEN0] =
    totalPoolTokens &&
    exchange &&
    parsedAmounts[Field.LIQUIDITY] &&
    exchange.getLiquidityValue(tokens[Field.TOKEN0], totalPoolTokens, parsedAmounts[Field.LIQUIDITY], false)
  parsedAmounts[Field.TOKEN1] =
    totalPoolTokens &&
    exchange &&
    parsedAmounts[Field.LIQUIDITY] &&
    exchange.getLiquidityValue(tokens[Field.TOKEN1], totalPoolTokens, parsedAmounts[Field.LIQUIDITY], false)

  // derived percent for advanced mode
  const derivedPerecent =
    userLiquidity &&
    parsedAmounts[Field.LIQUIDITY] &&
    new Percent(parsedAmounts[Field.LIQUIDITY]?.raw, userLiquidity.raw).toFixed(0)

  // get formatted amounts
  const formattedAmounts = {
    [Field.LIQUIDITY]:
      independentField === Field.LIQUIDITY
        ? typedValue
        : parsedAmounts[Field.LIQUIDITY]
        ? parsedAmounts[Field.LIQUIDITY].toSignificant(8)
        : '',
    [Field.TOKEN0]:
      independentField === Field.TOKEN0
        ? typedValue
        : parsedAmounts[Field.TOKEN0]
        ? parsedAmounts[Field.TOKEN0].toSignificant(8)
        : '',
    [Field.TOKEN1]:
      independentField === Field.TOKEN1
        ? typedValue
        : parsedAmounts[Field.TOKEN1]
        ? parsedAmounts[Field.TOKEN1].toSignificant(8)
        : ''
  }

  const onMax = () => {
    onUserInput(Field.LIQUIDITY, userLiquidity.toExact())
  }

  const atMaxAmount =
    !!userLiquidity && !!parsedAmounts[Field.LIQUIDITY]
      ? JSBI.equal(userLiquidity.raw, parsedAmounts[Field.LIQUIDITY].raw)
      : false

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

    if (!parsedAmounts[Field.TOKEN0]) {
      setGeneralError('Enter an amount to continue')
      setIsValid(false)
    }
    if (!parsedAmounts[Field.TOKEN1]) {
      setGeneralError('Enter an amount to continue')
      setIsValid(false)
    }
    if (
      totalPoolTokens &&
      userLiquidity &&
      parsedAmounts[Field.LIQUIDITY] &&
      (!JSBI.lessThanOrEqual(parsedAmounts[Field.LIQUIDITY].raw, totalPoolTokens.raw) ||
        !JSBI.lessThanOrEqual(parsedAmounts[Field.LIQUIDITY].raw, userLiquidity.raw))
    ) {
      setPoolTokenError('Input a liquidity amount less than or equal to your balance.')
      setIsError(true)
      setIsValid(false)
    }
    // if (
    //   parsedAmounts?.[Field.TOKEN0] &&
    //   userBalances?.[Field.TOKEN0] &&
    //   JSBI.greaterThan(parsedAmounts?.[Field.TOKEN0]?.raw, userBalances?.[Field.TOKEN0]?.raw)
    // ) {
    //   setInputError('Insufficient balance.')
    //   setIsError(true)
    //   setIsValid(false)
    // }
    // if (
    //   parsedAmounts?.[Field.TOKEN1] &&
    //   userBalances?.[Field.TOKEN1] &&
    //   parseFloat(parsedAmounts?.[Field.TOKEN1]?.toExact()) > parseFloat(userBalances?.[Field.TOKEN1]?.toExact())
    // ) {
    //   setOutputError('Insufficient balance.')
    //   setIsError(true)
    //   setIsValid(false)
    // }
  }, [parsedAmounts, totalPoolTokens, userLiquidity])

  // state for txn
  const addTransaction = useTransactionAdder()
  const [txHash, setTxHash] = useState()
  const [sigInputs, setSigInputs] = useState([])
  const [deadline, setDeadline] = useState()
  const [signed, setSigned] = useState(false) // waiting for signature sign
  const [attemptedRemoval, setAttemptedRemoval] = useState(false) // clicke confirm
  const [pendingConfirmation, setPendingConfirmation] = useState(true) // waiting for

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
      value: parsedAmounts[Field.LIQUIDITY].raw.toString(),
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
    if (tokens[Field.TOKEN0] === WETH[chainId] || tokens[Field.TOKEN1] === WETH[chainId]) {
      method = router.removeLiquidityETHWithPermit
      estimate = router.estimate.removeLiquidityETHWithPermit
      args = [
        tokens[Field.TOKEN1] === WETH[chainId] ? tokens[Field.TOKEN0].address : tokens[Field.TOKEN1].address,
        parsedAmounts[Field.LIQUIDITY].raw.toString(),
        tokens[Field.TOKEN1] === WETH[chainId]
          ? parsedAmounts[Field.TOKEN0].raw.toString()
          : parsedAmounts[Field.TOKEN1].raw.toString(),
        tokens[Field.TOKEN1] === WETH[chainId]
          ? parsedAmounts[Field.TOKEN1].raw.toString()
          : parsedAmounts[Field.TOKEN0].raw.toString(),
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
        tokens[Field.TOKEN0].address,
        tokens[Field.TOKEN1].address,
        parsedAmounts[Field.LIQUIDITY].raw.toString(),
        parsedAmounts[Field.TOKEN0].raw.toString(),
        parsedAmounts[Field.TOKEN1].raw.toString(),
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

  /**
   * @todo
   * if the input values stay the same,
   * we should probably not reset the signature values,
   * move to an effect
   */
  function resetModalState() {
    setSigned(false)
    setSigInputs(null)
    setAttemptedRemoval(false)
    setPendingConfirmation(true)
  }

  return (
    <Wrapper>
      <ConfirmationModal
        isOpen={showConfirm}
        onDismiss={() => {
          resetModalState()
          setShowConfirm(false)
        }}
        amount0={parsedAmounts[Field.TOKEN0]}
        amount1={parsedAmounts[Field.TOKEN1]}
        price={route?.midPrice}
        liquidityAmount={parsedAmounts[Field.LIQUIDITY]}
        transactionType={TRANSACTION_TYPE.REMOVE}
        contractCall={onRemove}
        extraCall={onSign}
        signed={signed}
        attemptedRemoval={attemptedRemoval}
        pendingConfirmation={pendingConfirmation}
        hash={txHash ? txHash : ''}
      />
      <AutoColumn gap="20px">
        <LightCard>
          <AutoColumn gap="20px">
            <RowBetween>
              <Text fontWeight={500}>Amount</Text>
              <ClickableText
                fontWeight={500}
                onClick={() => {
                  setShowAdvanced(!showAdvanced)
                }}
                color="#2172E5"
              >
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
              </ClickableText>
            </RowBetween>
            <RowBetween style={{ alignItems: 'flex-end' }}>
              <Text fontSize={72} fontWeight={500}>
                {derivedPerecent ? derivedPerecent : '0'}%
              </Text>
              {!showAdvanced && <MaxButton onClick={e => handleSliderChange(e, 100)}>Max</MaxButton>}
            </RowBetween>
            {!showAdvanced && <Slider value={parseFloat(derivedPerecent)} onChange={handleSliderChange} />}
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
                    {formattedAmounts[Field.TOKEN0] ? formattedAmounts[Field.TOKEN0] : '-'}
                  </Text>
                  <RowFixed>
                    <TokenLogo address={tokens[Field.TOKEN0]?.address || ''} style={{ marginRight: '12px' }} />
                    <Text fontSize={24} fontWeight={500}>
                      {tokens[Field.TOKEN0]?.symbol}
                    </Text>
                  </RowFixed>
                </RowBetween>
                <RowBetween>
                  <Text fontSize={24} fontWeight={500}>
                    {formattedAmounts[Field.TOKEN1] ? formattedAmounts[Field.TOKEN1] : '-'}
                  </Text>
                  <RowFixed>
                    <TokenLogo address={tokens[Field.TOKEN1]?.address || ''} style={{ marginRight: '12px' }} />
                    <Text fontSize={24} fontWeight={500}>
                      {tokens[Field.TOKEN1]?.symbol}
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
              field={Field.LIQUIDITY}
              value={formattedAmounts[Field.LIQUIDITY]}
              onUserInput={onUserInput}
              onMax={onMax}
              atMax={atMaxAmount}
              title={'Burn'}
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
              field={Field.TOKEN0}
              value={formattedAmounts[Field.TOKEN0]}
              onUserInput={onUserInput}
              onMax={onMax}
              atMax={atMaxAmount}
              token={tokens[Field.TOKEN0]}
              title={'Withdraw'}
              error={inputError}
              disableTokenSelect
              customBalance={TokensDeposited[Field.TOKEN0]}
            />
            <ColumnCenter>
              <Plus size="16" color="#888D9B" />
            </ColumnCenter>
            <CurrencyInputPanel
              field={Field.TOKEN1}
              value={formattedAmounts[Field.TOKEN1]}
              onUserInput={onUserInput}
              onMax={onMax}
              atMax={atMaxAmount}
              token={tokens[Field.TOKEN1]}
              title={'Withdraw'}
              error={outputError}
              disableTokenSelect
              customBalance={TokensDeposited[Field.TOKEN1]}
            />
          </>
        )}
        <RowBetween>
          Rate:
          <div>
            1 {exchange?.token0.symbol} ={' '}
            {independentField === Field.TOKEN0 || independentField === Field.LIQUIDITY
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
            exchangeAddress={exchange?.liquidityToken.address}
            token0={exchange?.token0}
            token1={exchange?.token1}
            minimal={true}
          />
        </FixedBottom>
      </AutoColumn>
    </Wrapper>
  )
}
