import React, { useReducer, useState, useCallback, useEffect, useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { parseUnits, parseEther } from '@ethersproject/units'
import { MaxUint256 } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { WETH, TokenAmount, JSBI, Percent, Route, Token, Price } from '@uniswap/sdk'

import TokenLogo from '../../components/TokenLogo'
import DoubleLogo from '../../components/DoubleLogo'
import SearchModal from '../../components/SearchModal'
import PositionCard from '../../components/PositionCard'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { Text } from 'rebass'
import { TYPE } from '../../theme'
import { Plus } from 'react-feather'
import { BlueCard, GreyCard, LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { ButtonPrimary, ButtonLight } from '../../components/Button'
import Row, { AutoRow, RowBetween, RowFlat, RowFixed } from '../../components/Row'

import { useToken } from '../../contexts/Tokens'
import { useAddressBalance } from '../../contexts/Balances'
import { useTokenAllowance } from '../../data/Allowances'
import { useTotalSupply } from '../../data/TotalSupply'
import { useWeb3React, useTokenContract } from '../../hooks'
import { useTransactionAdder, usePendingApproval } from '../../contexts/Transactions'

import { ROUTER_ADDRESS } from '../../constants'
import { getRouterContract, calculateGasMargin, calculateSlippageAmount } from '../../utils'
import { BigNumber } from '@ethersproject/bignumber'
import { usePair } from '../../data/Reserves'
import { useLocalStorageTokens } from '../../contexts/LocalStorage'
import { useAllTokens } from '../../contexts/Tokens'

// denominated in bips
const ALLOWED_SLIPPAGE = 50

// denominated in seconds
const DEADLINE_FROM_NOW = 60 * 20

const Wrapper = styled.div`
  position: relative;
`

const FixedBottom = styled.div`
  position: absolute;
  margin-top: 2rem;
  width: 100%;
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

interface AddLiquidityProps extends RouteComponentProps<{}> {
  token0: string
  token1: string
}

function AddLiquidity({ token0, token1 }: AddLiquidityProps) {
  const { account, chainId, library } = useWeb3React()
  const theme = useContext(ThemeContext)

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
  const tokenContractInput: Contract = useTokenContract(tokens[Field.INPUT]?.address)
  const tokenContractOutput: Contract = useTokenContract(tokens[Field.OUTPUT]?.address)

  // exchange data
  const pair = usePair(tokens[Field.INPUT], tokens[Field.OUTPUT])
  const route: Route = pair ? new Route([pair], tokens[independentField]) : undefined
  const totalSupply: TokenAmount = useTotalSupply(pair?.liquidityToken)
  const noLiquidity = // used to detect new exchange
    !!pair && JSBI.equal(pair.reserve0.raw, JSBI.BigInt(0)) && JSBI.equal(pair.reserve1.raw, JSBI.BigInt(0))

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
    if (typedValue !== '.' && tokens[independentField] && noLiquidity) {
      const newNonRelationalAmounts = nonrelationalAmounts
      if (typedValue === '') {
        if (independentField === Field.OUTPUT) {
          newNonRelationalAmounts[Field.OUTPUT] = null
        } else {
          newNonRelationalAmounts[Field.INPUT] = null
        }
      } else {
        try {
          const typedValueParsed = parseUnits(typedValue, tokens[independentField].decimals).toString()
          if (independentField === Field.OUTPUT) {
            newNonRelationalAmounts[Field.OUTPUT] = new TokenAmount(tokens[independentField], typedValueParsed)
          } else {
            newNonRelationalAmounts[Field.INPUT] = new TokenAmount(tokens[independentField], typedValueParsed)
          }
        } catch (error) {
          console.log(error)
        }
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
    [dependentField]: parsedAmounts[dependentField] ? parsedAmounts[dependentField]?.toSignificant(6) : ''
  }

  // check whether the user has approved the router on both tokens
  const inputApproval: TokenAmount = useTokenAllowance(tokens[Field.INPUT], account, ROUTER_ADDRESS)
  const outputApproval: TokenAmount = useTokenAllowance(tokens[Field.OUTPUT], account, ROUTER_ADDRESS)
  const inputApproved =
    tokens[Field.INPUT]?.equals(WETH[chainId]) ||
    (!!inputApproval &&
      !!parsedAmounts[Field.INPUT] &&
      JSBI.greaterThanOrEqual(inputApproval.raw, parsedAmounts[Field.INPUT].raw))
  const outputApproved =
    tokens[Field.OUTPUT]?.equals(WETH[chainId]) ||
    (!!outputApproval &&
      !!parsedAmounts[Field.OUTPUT] &&
      JSBI.greaterThanOrEqual(outputApproval.raw, parsedAmounts[Field.OUTPUT].raw))
  // check on pending approvals for token amounts
  const pendingApprovalInput = usePendingApproval(tokens[Field.INPUT]?.address)
  const pendingApprovalOutput = usePendingApproval(tokens[Field.OUTPUT]?.address)

  // used for displaying approximate starting price in UI
  const derivedPrice =
    parsedAmounts[Field.INPUT] &&
    parsedAmounts[Field.OUTPUT] &&
    nonrelationalAmounts[Field.INPUT] &&
    nonrelationalAmounts[Field.OUTPUT] &&
    typedValue !== ''
      ? new Price(
          parsedAmounts[Field.INPUT].token,
          parsedAmounts[Field.OUTPUT].token,
          parsedAmounts[Field.INPUT].raw,
          parsedAmounts[Field.OUTPUT].raw
        )
      : null

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
      JSBI.greaterThan(
        userBalances[Field[field]].raw,
        tokens[Field[field]]?.equals(WETH[chainId]) ? MIN_ETHER.raw : JSBI.BigInt(0)
      )
      ? tokens[Field[field]]?.equals(WETH[chainId])
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

    if (!account) {
      setGeneralError('Connect Wallet')
      setIsValid(false)
    }

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
  }, [noLiquidity, parsedAmounts, tokens, userBalances, account])

  // state for txn
  const addTransaction = useTransactionAdder()
  const [txHash, setTxHash] = useState<string>('')

  async function onAdd() {
    setAttemptingTxn(true)
    const router = getRouterContract(chainId, library, account)

    const minInput = calculateSlippageAmount(parsedAmounts[Field.INPUT], ALLOWED_SLIPPAGE)[0]
    const minOutput = calculateSlippageAmount(parsedAmounts[Field.OUTPUT], ALLOWED_SLIPPAGE)[0]

    const deadline = Math.ceil(Date.now() / 1000) + DEADLINE_FROM_NOW

    let method, estimate, args, value

    // one of the tokens is ETH
    if (tokens[Field.INPUT].equals(WETH[chainId]) || tokens[Field.OUTPUT].equals(WETH[chainId])) {
      method = router.addLiquidityETH
      estimate = router.estimateGas.addLiquidityETH

      const outputIsETH = tokens[Field.OUTPUT].equals(WETH[chainId])

      args = [
        tokens[outputIsETH ? Field.INPUT : Field.OUTPUT].address, // token
        parsedAmounts[outputIsETH ? Field.INPUT : Field.OUTPUT].raw.toString(), // token desired
        outputIsETH ? minInput.toString() : minOutput.toString(), // token min
        outputIsETH ? minOutput.toString() : minInput.toString(), // eth min
        account,
        deadline
      ]
      value = BigNumber.from(parsedAmounts[outputIsETH ? Field.OUTPUT : Field.INPUT].raw.toString())
    } else {
      method = router.addLiquidity
      estimate = router.estimateGas.addLiquidity
      args = [
        tokens[Field.INPUT].address,
        tokens[Field.OUTPUT].address,
        parsedAmounts[Field.INPUT].raw.toString(),
        parsedAmounts[Field.OUTPUT].raw.toString(),
        noLiquidity ? parsedAmounts[Field.INPUT].raw.toString() : minInput.toString(),
        noLiquidity ? parsedAmounts[Field.OUTPUT].raw.toString() : minOutput.toString(),
        account,
        deadline
      ]
      value = null
    }

    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
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
      )
      .catch((e: Error) => {
        console.error(e)
        setPendingConfirmation(true)
        setAttemptingTxn(false)
        setShowConfirm(false)
      })
  }

  async function approveAmount(field) {
    let useUserBalance = false
    const tokenContract = field === Field.INPUT ? tokenContractInput : tokenContractOutput

    const estimatedGas = await tokenContract.estimateGas.approve(ROUTER_ADDRESS, MaxUint256).catch(() => {
      // general fallback for tokens who restrict approval amounts
      useUserBalance = true
      return tokenContract.estimateGas.approve(ROUTER_ADDRESS, userBalances[field])
    })

    tokenContract
      .approve(ROUTER_ADDRESS, useUserBalance ? userBalances[field] : MaxUint256, {
        gasLimit: calculateGasMargin(estimatedGas)
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
            {liquidityMinted?.toSignificant(6)}
          </Text>
          <DoubleLogo a0={tokens[Field.INPUT]?.symbol || ''} a1={tokens[Field.OUTPUT]?.symbol || ''} size={30} />
        </RowFlat>
        <Row>
          <Text fontSize="24px">
            {tokens[Field.INPUT]?.symbol + ':' + tokens[Field.OUTPUT]?.symbol + ' Pool Tokens'}
          </Text>
        </Row>
        <TYPE.italic fontSize={12} textAlign="center" padding={'12px 0 0 0 '}>
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
            <TokenLogo address={tokens[Field.INPUT]?.address} style={{ marginRight: '8px' }} />
            <TYPE.body>{!!parsedAmounts[Field.INPUT] && parsedAmounts[Field.INPUT].toSignificant(6)}</TYPE.body>
          </RowFixed>
        </RowBetween>
        <RowBetween>
          <TYPE.body>{tokens[Field.OUTPUT]?.symbol} Deposited</TYPE.body>
          <RowFixed>
            <TokenLogo address={tokens[Field.OUTPUT]?.address} style={{ marginRight: '8px' }} />
            <TYPE.body>{!!parsedAmounts[Field.OUTPUT] && parsedAmounts[Field.OUTPUT].toSignificant(6)}</TYPE.body>
          </RowFixed>
        </RowBetween>
        {route && !JSBI.equal(route?.midPrice?.raw?.denominator, JSBI.BigInt(0)) && (
          <RowBetween>
            <TYPE.body>Rate</TYPE.body>
            <TYPE.body>
              {`1 ${tokens[Field.INPUT]?.symbol} = ${route?.midPrice &&
                route?.midPrice?.raw?.denominator &&
                route?.midPrice?.adjusted?.toSignificant(4)} ${tokens[Field.OUTPUT]?.symbol}`}
            </TYPE.body>
          </RowBetween>
        )}
        <RowBetween>
          <TYPE.body>Minted Pool Share:</TYPE.body>
          <TYPE.body>{noLiquidity ? '100%' : poolTokenPercentage?.toSignificant(6) + '%'}</TYPE.body>
        </RowBetween>
        <ButtonPrimary style={{ margin: '20px 0' }} onClick={onAdd}>
          <Text fontWeight={500} fontSize={20}>
            {noLiquidity ? 'Supply & Create Pool' : 'Confirm Supply'}
          </Text>
        </ButtonPrimary>
      </>
    )
  }

  const displayPriceInput = noLiquidity
    ? parsedAmounts[0] &&
      parsedAmounts[1] &&
      derivedPrice &&
      JSBI.greaterThan(parsedAmounts[0].raw, JSBI.BigInt(0)) &&
      JSBI.greaterThan(parsedAmounts[1].raw, JSBI.BigInt(0))
      ? derivedPrice?.toSignificant(6)
      : '-'
    : pair && route && tokens[Field.INPUT]
    ? route?.input.equals(tokens[Field.INPUT])
      ? route.midPrice.toSignificant(6)
      : route.midPrice.invert().toSignificant(6)
    : '-'

  const displayPriceOutput = noLiquidity
    ? parsedAmounts[0] &&
      parsedAmounts[1] &&
      derivedPrice &&
      JSBI.greaterThan(parsedAmounts[0].raw, JSBI.BigInt(0)) &&
      JSBI.greaterThan(parsedAmounts[1].raw, JSBI.BigInt(0))
      ? derivedPrice?.invert().toSignificant(6)
      : '-'
    : pair && route && tokens[Field.OUTPUT]
    ? route?.input.equals(tokens[Field.OUTPUT])
      ? route.midPrice.toSignificant(6)
      : route.midPrice.invert().toSignificant(6)
    : '-'

  const PriceBar = () => {
    return (
      <AutoColumn gap="md" justify="space-between">
        <AutoRow justify="space-between">
          <AutoColumn justify="center">
            <TYPE.black>{displayPriceInput}</TYPE.black>
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              {tokens[Field.OUTPUT]?.symbol} per {tokens[Field.INPUT]?.symbol}
            </Text>
          </AutoColumn>
          <AutoColumn justify="center">
            <TYPE.black>{displayPriceOutput}</TYPE.black>
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              {tokens[Field.INPUT]?.symbol} per {tokens[Field.OUTPUT]?.symbol}
            </Text>
          </AutoColumn>
          <AutoColumn justify="center">
            <TYPE.black>
              {noLiquidity && derivedPrice ? '100' : poolTokenPercentage?.toSignificant(4) ?? '0'}
              {'%'}
            </TYPE.black>
            <Text fontWeight={500} fontSize={14} color={theme.text2} pt={1}>
              Pool Share
            </Text>
          </AutoColumn>
        </AutoRow>
      </AutoColumn>
    )
  }

  const pendingText = `Supplying ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${
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
                <TYPE.link fontWeight={600}>You are the first liquidity provider.</TYPE.link>
                <TYPE.link fontWeight={400}>The ratio of tokens you add will set the price of this pool.</TYPE.link>
                <TYPE.link fontWeight={400}>Once you are happy with the rate click supply to review.</TYPE.link>
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
          pair={pair}
          label="Input"
          inputId="addLiquidityInput"
        />
        <ColumnCenter>
          <Plus size="16" color={theme.text2} />
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
          pair={pair}
          inputId="addLiquidityOutput"
        />
        {tokens[Field.OUTPUT] && tokens[Field.INPUT] && (
          <>
            <GreyCard padding="0px" borderRadius={'20px'}>
              <RowBetween padding="1rem">
                <TYPE.subHeader fontWeight={500} fontSize={14}>
                  {noLiquidity ? 'Initial prices' : 'Prices'} and pool share
                </TYPE.subHeader>
              </RowBetween>{' '}
              <LightCard padding="1rem" borderRadius={'20px'}>
                <PriceBar />
              </LightCard>
            </GreyCard>
          </>
        )}
        {isValid ? (
          !inputApproved ? (
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
          ) : !outputApproved ? (
            <ButtonLight
              onClick={() => {
                approveAmount(Field.OUTPUT)
              }}
              disabled={pendingApprovalOutput}
            >
              {pendingApprovalOutput ? (
                <Dots>Approving {tokens[Field.OUTPUT]?.symbol}</Dots>
              ) : (
                'Approve ' + tokens[Field.OUTPUT]?.symbol
              )}
            </ButtonLight>
          ) : (
            <ButtonPrimary
              onClick={() => {
                setShowConfirm(true)
              }}
            >
              <Text fontSize={20} fontWeight={500}>
                Supply
              </Text>
            </ButtonPrimary>
          )
        ) : (
          <ButtonPrimary disabled={true}>
            <Text fontSize={20} fontWeight={500}>
              {generalError ? generalError : inputError ? inputError : outputError ? outputError : 'Supply'}
            </Text>
          </ButtonPrimary>
        )}
      </AutoColumn>

      {!noLiquidity && (
        <FixedBottom>
          <AutoColumn>
            <PositionCard pair={pair} minimal={true} />
          </AutoColumn>
        </FixedBottom>
      )}
    </Wrapper>
  )
}

export default withRouter(AddLiquidity)
