import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { parseUnits } from '@ethersproject/units'
import { Fraction, JSBI, Percent, TokenAmount, TradeType, WETH } from '@uniswap/sdk'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { ArrowDown, ChevronDown, ChevronUp, Repeat } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import Card, { BlueCard, GreyCard, YellowCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { ROUTER_ADDRESS } from '../../constants'
import { useTokenAllowance } from '../../data/Allowances'
import { useV1TradeLinkIfBetter } from '../../data/V1'
import { useTokenContract, useWeb3React } from '../../hooks'
import { useTokenByAddressAndAutomaticallyAdd } from '../../hooks/Tokens'
import { useTradeExactIn, useTradeExactOut } from '../../hooks/Trades'
import { useUserAdvanced, useWalletModalToggle } from '../../state/application/hooks'
import { useHasPendingApproval, useTransactionAdder } from '../../state/transactions/hooks'
import { useAllTokenBalancesTreatingWETHasETH } from '../../state/wallet/hooks'
import { Hover, TYPE } from '../../theme'
import { Link } from '../../theme/components'
import {
  basisPointsToPercent,
  calculateGasMargin,
  getEtherscanLink,
  getRouterContract,
  getSigner,
  QueryParams
} from '../../utils'
import Copy from '../AccountDetails/Copy'
import AddressInputPanel from '../AddressInputPanel'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonSecondary } from '../Button'
import ConfirmationModal from '../ConfirmationModal'
import CurrencyInputPanel from '../CurrencyInputPanel'
import QuestionHelper from '../Question'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import SlippageTabs from '../SlippageTabs'
import TokenLogo from '../TokenLogo'
import {
  AdvancedDropwdown,
  ArrowWrapper,
  BottomGrouping,
  Dots,
  ErrorText,
  FixedBottom,
  InputGroup,
  SectionBreak,
  StyledBalanceMaxMini,
  StyledNumerical,
  TruncatedText,
  Wrapper
} from './styleds'
import { Field, SwapAction, useSwapStateReducer } from './swap-store'

enum SwapType {
  EXACT_TOKENS_FOR_TOKENS,
  EXACT_TOKENS_FOR_ETH,
  EXACT_ETH_FOR_TOKENS,
  TOKENS_FOR_EXACT_TOKENS,
  TOKENS_FOR_EXACT_ETH,
  ETH_FOR_EXACT_TOKENS
}

// default allowed slippage, in bips
const INITIAL_ALLOWED_SLIPPAGE = 50

// 15 minutes, denominated in seconds
const DEFAULT_DEADLINE_FROM_NOW = 60 * 20

// used for warning states based on slippage in bips
const ALLOWED_SLIPPAGE_MEDIUM = 100
const ALLOWED_SLIPPAGE_HIGH = 500

// used to ensure the user doesn't send so much ETH so they end up with <.01
const MIN_ETH: JSBI = JSBI.BigInt(`1${'0'.repeat(16)}`) // .01 ETH

interface ExchangePageProps extends RouteComponentProps {
  sendingInput: boolean
  params: QueryParams
}

function ExchangePage({ sendingInput = false, history, params }: ExchangePageProps) {
  // text translation
  // const { t } = useTranslation()
  const { chainId, account, library } = useWeb3React()
  const theme = useContext(ThemeContext)

  // adding notifications on txns
  const addTransaction = useTransactionAdder()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // sending state
  const [sending] = useState<boolean>(sendingInput)
  const [sendingWithSwap, setSendingWithSwap] = useState<boolean>(false)
  const [recipient, setRecipient] = useState<string>('')
  const [ENS, setENS] = useState<string>('')

  // trade details, check query params for initial state
  const [state, dispatch] = useSwapStateReducer(params)

  const { independentField, typedValue, ...fieldData } = state
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT
  const tradeType: TradeType = independentField === Field.INPUT ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT
  const [tradeError, setTradeError] = useState<string>('') // error for things like reserve size or route

  const tokens = {
    [Field.INPUT]: useTokenByAddressAndAutomaticallyAdd(fieldData[Field.INPUT].address),
    [Field.OUTPUT]: useTokenByAddressAndAutomaticallyAdd(fieldData[Field.OUTPUT].address)
  }

  // token contracts for approvals and direct sends
  const tokenContractInput: Contract = useTokenContract(tokens[Field.INPUT]?.address)
  const tokenContractOutput: Contract = useTokenContract(tokens[Field.OUTPUT]?.address)

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirmed
  const [pendingConfirmation, setPendingConfirmation] = useState<boolean>(true) // waiting for user confirmation

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const [deadline, setDeadline] = useState<number>(DEFAULT_DEADLINE_FROM_NOW)
  const [allowedSlippage, setAllowedSlippage] = useState<number>(INITIAL_ALLOWED_SLIPPAGE)

  // all balances for detecting a swap with send
  const allBalances = useAllTokenBalancesTreatingWETHasETH()

  // get user- and token-specific lookup data
  const userBalances = {
    [Field.INPUT]: allBalances?.[account]?.[tokens[Field.INPUT]?.address],
    [Field.OUTPUT]: allBalances?.[account]?.[tokens[Field.OUTPUT]?.address]
  }

  // parse the amount that the user typed
  const parsedAmounts: { [field: number]: TokenAmount } = {}
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

  const bestTradeExactIn = useTradeExactIn(
    tradeType === TradeType.EXACT_INPUT ? parsedAmounts[independentField] : null,
    tokens[Field.OUTPUT]
  )
  const bestTradeExactOut = useTradeExactOut(
    tokens[Field.INPUT],
    tradeType === TradeType.EXACT_OUTPUT ? parsedAmounts[independentField] : null
  )

  const trade = tradeType === TradeType.EXACT_INPUT ? bestTradeExactIn : bestTradeExactOut

  // return link to the appropriate v1 pair if the slippage on v1 is lower
  const v1TradeLinkIfBetter = useV1TradeLinkIfBetter(trade, new Percent('50', '10000'))

  const route = trade?.route
  const userHasSpecifiedInputOutput =
    !!tokens[Field.INPUT] &&
    !!tokens[Field.OUTPUT] &&
    !!parsedAmounts[independentField] &&
    parsedAmounts[independentField].greaterThan(JSBI.BigInt(0))
  const noRoute = !route

  const slippageFromTrade: Percent = trade && trade.slippage

  if (trade)
    parsedAmounts[dependentField] = tradeType === TradeType.EXACT_INPUT ? trade.outputAmount : trade.inputAmount

  // check whether the user has approved the router on the input token
  const inputApproval: TokenAmount = useTokenAllowance(tokens[Field.INPUT], account, ROUTER_ADDRESS)
  const userHasApprovedRouter =
    tokens[Field.INPUT]?.equals(WETH[chainId]) ||
    (!!inputApproval &&
      !!parsedAmounts[Field.INPUT] &&
      JSBI.greaterThanOrEqual(inputApproval.raw, parsedAmounts[Field.INPUT].raw))
  const pendingApprovalInput = useHasPendingApproval(tokens[Field.INPUT]?.address)

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField] ? parsedAmounts[dependentField].toSignificant(6) : ''
  }

  // for each hop in our trade, take away the x*y=k price impact from 0.3% fees
  // e.g. for 3 tokens/2 hops: 1 - ((1 - .03) * (1-.03))
  const baseFee = basisPointsToPercent(10000 - 30)
  const realizedLPFee = !trade
    ? undefined
    : basisPointsToPercent(10000).subtract(
        trade.route.path.length === 2
          ? baseFee
          : new Array(trade.route.path.length - 2)
              .fill(0)
              .reduce<Fraction>((currentFee: Percent | Fraction): Fraction => currentFee.multiply(baseFee), baseFee)
      )
  // the x*y=k impact
  const priceSlippage =
    slippageFromTrade && realizedLPFee
      ? new Percent(
          slippageFromTrade.subtract(realizedLPFee).numerator,
          slippageFromTrade.subtract(realizedLPFee).denominator
        )
      : undefined

  // the amount of the input that accrues to LPs
  const realizedLPFeeAmount =
    realizedLPFee &&
    new TokenAmount(tokens[Field.INPUT], realizedLPFee.multiply(parsedAmounts[Field.INPUT].raw).quotient)

  const onTokenSelection = useCallback(
    (field: Field, address: string) => {
      dispatch({
        type: SwapAction.SELECT_TOKEN,
        payload: { field, address }
      })
    },
    [dispatch]
  )

  const onSwapTokens = useCallback(() => {
    dispatch({
      type: SwapAction.SWITCH_TOKENS,
      payload: undefined
    })
  }, [dispatch])

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch({ type: SwapAction.TYPE, payload: { field, typedValue } })
    },
    [dispatch]
  )

  const onMaxInput = useCallback(
    (typedValue: string) => {
      dispatch({
        type: SwapAction.TYPE,
        payload: {
          field: Field.INPUT,
          typedValue
        }
      })
    },
    [dispatch]
  )

  // reset field if sending with with swap is cancled
  useEffect(() => {
    if (sending && !sendingWithSwap) {
      onTokenSelection(Field.OUTPUT, null)
    }
  }, [onTokenSelection, sending, sendingWithSwap])

  const maxAmountInput: TokenAmount =
    !!userBalances[Field.INPUT] &&
    !!tokens[Field.INPUT] &&
    !!WETH[chainId] &&
    userBalances[Field.INPUT].greaterThan(
      new TokenAmount(tokens[Field.INPUT], tokens[Field.INPUT].equals(WETH[chainId]) ? MIN_ETH : '0')
    )
      ? tokens[Field.INPUT].equals(WETH[chainId])
        ? userBalances[Field.INPUT].subtract(new TokenAmount(WETH[chainId], MIN_ETH))
        : userBalances[Field.INPUT]
      : undefined
  const atMaxAmountInput: boolean =
    !!maxAmountInput && !!parsedAmounts[Field.INPUT] ? maxAmountInput.equalTo(parsedAmounts[Field.INPUT]) : undefined

  function getSwapType(): SwapType {
    if (tradeType === TradeType.EXACT_INPUT) {
      if (tokens[Field.INPUT].equals(WETH[chainId])) {
        return SwapType.EXACT_ETH_FOR_TOKENS
      } else if (tokens[Field.OUTPUT].equals(WETH[chainId])) {
        return SwapType.EXACT_TOKENS_FOR_ETH
      } else {
        return SwapType.EXACT_TOKENS_FOR_TOKENS
      }
    } else if (tradeType === TradeType.EXACT_OUTPUT) {
      if (tokens[Field.INPUT].equals(WETH[chainId])) {
        return SwapType.ETH_FOR_EXACT_TOKENS
      } else if (tokens[Field.OUTPUT].equals(WETH[chainId])) {
        return SwapType.TOKENS_FOR_EXACT_ETH
      } else {
        return SwapType.TOKENS_FOR_EXACT_TOKENS
      }
    }
  }

  const slippageAdjustedAmounts: { [field: number]: TokenAmount } = {
    [independentField]: parsedAmounts[independentField],
    [dependentField]:
      parsedAmounts[dependentField] && trade
        ? tradeType === TradeType.EXACT_INPUT
          ? trade.minimumAmountOut(basisPointsToPercent(allowedSlippage))
          : trade.maximumAmountIn(basisPointsToPercent(allowedSlippage))
        : undefined
  }

  // reset modal state when closed
  function resetModal() {
    // clear input if txn submitted
    if (!pendingConfirmation) {
      onUserInput(Field.INPUT, '')
    }
    setPendingConfirmation(true)
    setAttemptingTxn(false)
    setShowAdvanced(false)
  }

  // function for a pure send
  async function onSend() {
    setAttemptingTxn(true)

    const signer = getSigner(library, account)
    // get token contract if needed
    let estimate: Function, method: Function, args
    if (tokens[Field.INPUT].equals(WETH[chainId])) {
      signer
        .sendTransaction({ to: recipient.toString(), value: BigNumber.from(parsedAmounts[Field.INPUT].raw.toString()) })
        .then(response => {
          setTxHash(response.hash)
          ReactGA.event({ category: 'ExchangePage', action: 'Send', label: tokens[Field.INPUT]?.symbol })
          addTransaction(response, {
            summary:
              'Send ' +
              parsedAmounts[Field.INPUT]?.toSignificant(3) +
              ' ' +
              tokens[Field.INPUT]?.symbol +
              ' to ' +
              recipient
          })
          setPendingConfirmation(false)
        })
        .catch(() => {
          resetModal()
          setShowConfirm(false)
        })
    } else {
      estimate = tokenContractInput.estimateGas.transfer
      method = tokenContractInput.transfer
      args = [recipient, parsedAmounts[Field.INPUT].raw.toString()]
      await estimate(...args)
        .then(estimatedGasLimit =>
          method(...args, {
            gasLimit: calculateGasMargin(estimatedGasLimit)
          }).then(response => {
            setTxHash(response.hash)
            addTransaction(response, {
              summary:
                'Send ' +
                parsedAmounts[Field.INPUT]?.toSignificant(3) +
                ' ' +
                tokens[Field.INPUT]?.symbol +
                ' to ' +
                recipient
            })
            setPendingConfirmation(false)
          })
        )
        .catch(() => {
          resetModal()
          setShowConfirm(false)
        })
    }
  }

  // covers swap or swap with send
  async function onSwap() {
    const routerContract: Contract = getRouterContract(chainId, library, account)

    setAttemptingTxn(true) // mark that user is attempting transaction

    const path = Object.keys(route.path).map(key => {
      return route.path[key].address
    })
    let estimate: Function, method: Function, args: any[], value: BigNumber
    const deadlineFromNow: number = Math.ceil(Date.now() / 1000) + deadline

    switch (getSwapType()) {
      case SwapType.EXACT_TOKENS_FOR_TOKENS:
        estimate = routerContract.estimateGas.swapExactTokensForTokens
        method = routerContract.swapExactTokensForTokens
        args = [
          slippageAdjustedAmounts[Field.INPUT].raw.toString(),
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          path,
          sending ? recipient : account,
          deadlineFromNow
        ]
        value = null
        break
      case SwapType.TOKENS_FOR_EXACT_TOKENS:
        estimate = routerContract.estimateGas.swapTokensForExactTokens
        method = routerContract.swapTokensForExactTokens
        args = [
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          slippageAdjustedAmounts[Field.INPUT].raw.toString(),
          path,
          sending ? recipient : account,
          deadlineFromNow
        ]
        value = null
        break
      case SwapType.EXACT_ETH_FOR_TOKENS:
        estimate = routerContract.estimateGas.swapExactETHForTokens
        method = routerContract.swapExactETHForTokens
        args = [
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          path,
          sending ? recipient : account,
          deadlineFromNow
        ]
        value = BigNumber.from(slippageAdjustedAmounts[Field.INPUT].raw.toString())
        break
      case SwapType.TOKENS_FOR_EXACT_ETH:
        estimate = routerContract.estimateGas.swapTokensForExactETH
        method = routerContract.swapTokensForExactETH
        args = [
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          slippageAdjustedAmounts[Field.INPUT].raw.toString(),
          path,
          sending ? recipient : account,
          deadlineFromNow
        ]
        value = null
        break
      case SwapType.EXACT_TOKENS_FOR_ETH:
        estimate = routerContract.estimateGas.swapExactTokensForETH
        method = routerContract.swapExactTokensForETH
        args = [
          slippageAdjustedAmounts[Field.INPUT].raw.toString(),
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          path,
          sending ? recipient : account,
          deadlineFromNow
        ]
        value = null
        break
      case SwapType.ETH_FOR_EXACT_TOKENS:
        estimate = routerContract.estimateGas.swapETHForExactTokens
        method = routerContract.swapETHForExactTokens
        args = [
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          path,
          sending ? recipient : account,
          deadlineFromNow
        ]
        value = BigNumber.from(slippageAdjustedAmounts[Field.INPUT].raw.toString())
        break
    }

    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setTxHash(response.hash)
          ReactGA.event({
            category: 'ExchangePage',
            label: sending && recipient !== account ? 'Swap w/ Send' : 'Swap',
            action: [tokens[Field.INPUT]?.symbol, tokens[Field.OUTPUT]?.symbol].join(';')
          })
          addTransaction(response, {
            summary:
              'Swap ' +
              slippageAdjustedAmounts?.[Field.INPUT]?.toSignificant(3) +
              ' ' +
              tokens[Field.INPUT]?.symbol +
              ' for ' +
              slippageAdjustedAmounts?.[Field.OUTPUT]?.toSignificant(3) +
              ' ' +
              tokens[Field.OUTPUT]?.symbol
          })
          setPendingConfirmation(false)
        })
      )
      .catch(e => {
        console.error(e)
        resetModal()
        setShowConfirm(false)
      })
  }

  async function approveAmount(field: Field) {
    let useUserBalance = false
    const tokenContract = field === Field.INPUT ? tokenContractInput : tokenContractOutput

    const estimatedGas = await tokenContract.estimateGas.approve(ROUTER_ADDRESS, MaxUint256).catch(() => {
      // general fallback for tokens who restrict approval amounts
      useUserBalance = true
      return tokenContract.estimateGas.approve(ROUTER_ADDRESS, userBalances[field].raw.toString())
    })

    tokenContract
      .approve(ROUTER_ADDRESS, useUserBalance ? userBalances[field].raw.toString() : MaxUint256, {
        gasLimit: calculateGasMargin(estimatedGas)
      })
      .then(response => {
        addTransaction(response, {
          summary: 'Approve ' + tokens[field]?.symbol,
          approvalOfToken: tokens[field].address
        })
      })
  }

  // errors
  const [generalError, setGeneralError] = useState<string>('')
  const [inputError, setInputError] = useState<string>('')
  const [outputError, setOutputError] = useState<string>('')
  const [recipientError, setRecipientError] = useState<string>('')
  const [isValid, setIsValid] = useState<boolean>(false)

  const ignoreOutput: boolean = sending ? !sendingWithSwap : false
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const advanced = useUserAdvanced()

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

    if (!account) {
      setGeneralError('Connect Wallet')
      setIsValid(false)
    }

    if (!parsedAmounts[Field.INPUT]) {
      setInputError('Enter an amount')
      setIsValid(false)
    }

    if (!parsedAmounts[Field.OUTPUT] && !ignoreOutput) {
      setOutputError('Enter an amount')
      setIsValid(false)
    }

    if (
      userBalances[Field.INPUT] &&
      parsedAmounts[Field.INPUT] &&
      userBalances[Field.INPUT].lessThan(parsedAmounts[Field.INPUT])
    ) {
      setInputError('Insufficient ' + tokens[Field.INPUT]?.symbol + ' balance')
      setIsValid(false)
    }

    // check for null trade entitiy if not enough balance for trade
    if (
      (!sending || sendingWithSwap) &&
      userBalances[Field.INPUT] &&
      !trade &&
      parsedAmounts[independentField] &&
      !parsedAmounts[dependentField] &&
      tokens[dependentField]
    ) {
      setInputError('Insufficient ' + tokens[Field.INPUT]?.symbol + ' balance')
      setIsValid(false)
    }
  }, [
    sending,
    sendingWithSwap,
    dependentField,
    ignoreOutput,
    independentField,
    parsedAmounts,
    recipientError,
    tokens,
    route,
    trade,
    userBalances,
    account
  ])

  // warnings on slippage
  const warningLow: boolean = slippageFromTrade?.lessThan(new Percent(ALLOWED_SLIPPAGE_MEDIUM.toString(), '10000'))
  // TODO greaterThanOrEqualTo in SDK
  const warningMedium: boolean =
    slippageFromTrade?.equalTo(new Percent(ALLOWED_SLIPPAGE_MEDIUM.toString(), '10000')) ||
    slippageFromTrade?.greaterThan(new Percent(ALLOWED_SLIPPAGE_MEDIUM.toString(), '10000'))
  // TODO greaterThanOrEqualTo in SDK
  const warningHigh: boolean =
    slippageFromTrade?.equalTo(new Percent(ALLOWED_SLIPPAGE_HIGH.toString(), '10000')) ||
    slippageFromTrade?.greaterThan(new Percent(ALLOWED_SLIPPAGE_HIGH.toString(), '10000'))

  function modalHeader() {
    if (sending && !sendingWithSwap) {
      return (
        <AutoColumn gap="lg" style={{ marginTop: '40px' }}>
          <RowBetween>
            <Text fontSize={36} fontWeight={500}>
              {parsedAmounts[Field.INPUT]?.toSignificant(6)} {tokens[Field.INPUT]?.symbol}
            </Text>
            <TokenLogo address={tokens[Field.INPUT]?.address} size={'30px'} />
          </RowBetween>
          <TYPE.darkGray fontSize={20}>To</TYPE.darkGray>
          {ENS ? (
            <AutoColumn gap="lg">
              <TYPE.blue fontSize={36}>{ENS}</TYPE.blue>
              <AutoRow gap="10px">
                <Link href={getEtherscanLink(chainId, ENS, 'address')}>
                  <TYPE.blue fontSize={18}>
                    {recipient?.slice(0, 8)}...{recipient?.slice(34, 42)}↗
                  </TYPE.blue>
                </Link>
                <Copy toCopy={recipient} />
              </AutoRow>
            </AutoColumn>
          ) : (
            <AutoRow gap="10px">
              <Link href={getEtherscanLink(chainId, ENS, 'address')}>
                <TYPE.blue fontSize={36}>
                  {recipient?.slice(0, 6)}...{recipient?.slice(36, 42)}↗
                </TYPE.blue>
              </Link>
              <Copy toCopy={recipient} />
            </AutoRow>
          )}
        </AutoColumn>
      )
    }

    if (sending && sendingWithSwap) {
      return (
        <AutoColumn gap="lg" style={{ marginTop: '40px' }}>
          <AutoColumn gap="sm">
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
          <AutoColumn gap="sm">
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
        <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
          <RowBetween align="flex-end">
            <TruncatedText fontSize={24} fontWeight={500}>
              {!!formattedAmounts[Field.INPUT] && formattedAmounts[Field.INPUT]}
            </TruncatedText>
            <RowFixed gap="4px">
              <TokenLogo address={tokens[Field.INPUT]?.address} size={'24px'} />
              <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
                {tokens[Field.INPUT]?.symbol || ''}
              </Text>
            </RowFixed>
          </RowBetween>
          <RowFixed>
            <ArrowDown size="16" color={theme.text2} />
          </RowFixed>
          <RowBetween align="flex-end">
            <TruncatedText fontSize={24} fontWeight={500} color={warningHigh ? theme.red1 : ''}>
              {!!formattedAmounts[Field.OUTPUT] && formattedAmounts[Field.OUTPUT]}
            </TruncatedText>
            <RowFixed gap="4px">
              <TokenLogo address={tokens[Field.OUTPUT]?.address} size={'24px'} />
              <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
                {tokens[Field.OUTPUT]?.symbol || ''}
              </Text>
            </RowFixed>
          </RowBetween>
          <AutoColumn justify="flex-start" gap="sm" style={{ padding: '12px 0 0 0px' }}>
            {independentField === Field.INPUT ? (
              <TYPE.italic textAlign="left" style={{ width: '100%' }}>
                {`Output is estimated. You will receive at least `}
                <b>
                  {slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(6)} {tokens[Field.OUTPUT]?.symbol}{' '}
                </b>
                {' or the transaction will revert.'}
              </TYPE.italic>
            ) : (
              <TYPE.italic textAlign="left" style={{ width: '100%' }}>
                {`Input is estimated. You will sell at most `}{' '}
                <b>
                  {slippageAdjustedAmounts[Field.INPUT]?.toSignificant(6)} {tokens[Field.INPUT]?.symbol}
                </b>
                {' or the transaction will revert.'}
              </TYPE.italic>
            )}
          </AutoColumn>
        </AutoColumn>
      )
    }
  }

  function modalBottom() {
    if (sending && !sendingWithSwap) {
      return (
        <AutoColumn>
          <ButtonPrimary onClick={onSend} id="exchange-page-confirm-send">
            <Text color="white" fontSize={20}>
              Confirm send
            </Text>
          </ButtonPrimary>
        </AutoColumn>
      )
    }

    if (!sending || (sending && sendingWithSwap)) {
      return (
        <>
          <AutoColumn gap="0px">
            {!noRoute && tokens[Field.OUTPUT] && tokens[Field.INPUT] && (
              <RowBetween align="center">
                <Text fontWeight={400} fontSize={14} color={theme.text2}>
                  Price
                </Text>
                <Text
                  fontWeight={500}
                  fontSize={14}
                  color={theme.text1}
                  style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
                >
                  {trade && showInverted
                    ? (trade?.executionPrice?.invert()?.toSignificant(6) ?? '') +
                      ' ' +
                      tokens[Field.INPUT]?.symbol +
                      ' / ' +
                      tokens[Field.OUTPUT]?.symbol
                    : (trade?.executionPrice?.toSignificant(6) ?? '') +
                      ' ' +
                      tokens[Field.OUTPUT]?.symbol +
                      ' / ' +
                      tokens[Field.INPUT]?.symbol}
                  <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
                    <Repeat size={14} />
                  </StyledBalanceMaxMini>
                </Text>
              </RowBetween>
            )}

            <RowBetween>
              <RowFixed>
                <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                  {independentField === Field.INPUT ? (sending ? 'Min sent' : 'Minimum received') : 'Maximum sold'}
                </TYPE.black>
                <QuestionHelper text="A boundary is set so you are protected from large price movements after you submit your trade." />
              </RowFixed>
              <RowFixed>
                <TYPE.black fontSize={14}>
                  {independentField === Field.INPUT
                    ? slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4) ?? '-'
                    : slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4) ?? '-'}
                </TYPE.black>
                {parsedAmounts[Field.OUTPUT] && parsedAmounts[Field.INPUT] && (
                  <TYPE.black fontSize={14} marginLeft={'4px'}>
                    {independentField === Field.INPUT
                      ? parsedAmounts[Field.OUTPUT] && tokens[Field.OUTPUT]?.symbol
                      : parsedAmounts[Field.INPUT] && tokens[Field.INPUT]?.symbol}
                  </TYPE.black>
                )}
              </RowFixed>
            </RowBetween>
            <RowBetween>
              <RowFixed>
                <TYPE.black color={theme.text2} fontSize={14} fontWeight={400}>
                  Price Impact
                </TYPE.black>
                <QuestionHelper text="The difference between the market price and your price due to trade size." />
              </RowFixed>
              <ErrorText
                fontWeight={500}
                fontSize={14}
                warningLow={warningLow}
                warningMedium={warningMedium}
                warningHigh={warningHigh}
              >
                {priceSlippage?.lessThan(new Percent('1', '10000')) ? '<0.01%' : `${priceSlippage?.toFixed(2)}%` ?? '-'}
              </ErrorText>
            </RowBetween>
            <RowBetween>
              <RowFixed>
                <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                  Liquidity Provider Fee
                </TYPE.black>
                <QuestionHelper text="A portion of each trade (0.3%) goes to liquidity providers to incentivize liquidity on the protocol." />
              </RowFixed>
              <TYPE.black fontSize={14}>
                {realizedLPFeeAmount ? realizedLPFeeAmount?.toSignificant(6) + ' ' + tokens[Field.INPUT]?.symbol : '-'}
              </TYPE.black>
            </RowBetween>
          </AutoColumn>

          <AutoRow>
            <ButtonError
              onClick={onSwap}
              error={!!warningHigh}
              style={{ margin: '10px 0 0 0' }}
              id="exchange-page-confirm-swap-or-send"
            >
              <Text fontSize={20} fontWeight={500}>
                {warningHigh ? (sending ? 'Send Anyway' : 'Swap Anyway') : sending ? 'Confirm Send' : 'Confirm Swap'}
              </Text>
            </ButtonError>
          </AutoRow>
        </>
      )
    }
  }

  const PriceBar = function() {
    return (
      <AutoRow justify="space-between">
        <RowFixed>Rate info</RowFixed>
        <AutoColumn justify="center">
          <Text fontWeight={500} fontSize={16} color={theme.text2}>
            {trade ? `${trade.executionPrice.toSignificant(6)} ` : '-'}
          </Text>
          <Text fontWeight={500} fontSize={16} color={theme.text3} pt={1}>
            {tokens[Field.OUTPUT]?.symbol} / {tokens[Field.INPUT]?.symbol}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <Text fontWeight={500} fontSize={16} color={theme.text2}>
            {trade ? `${trade.executionPrice.invert().toSignificant(6)} ` : '-'}
          </Text>
          <Text fontWeight={500} fontSize={16} color={theme.text3} pt={1}>
            {tokens[Field.INPUT]?.symbol} / {tokens[Field.OUTPUT]?.symbol}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <ErrorText
            fontWeight={500}
            fontSize={16}
            warningLow={warningLow}
            warningMedium={warningMedium}
            warningHigh={warningHigh}
          >
            {priceSlippage?.lessThan(new Percent('1', '10000')) ? '<0.01%' : `${priceSlippage?.toFixed(2)}%` ?? '-'}
          </ErrorText>
          <Text fontWeight={500} fontSize={16} color={theme.text3} pt={1}>
            Price Impact
          </Text>
        </AutoColumn>
      </AutoRow>
    )
  }

  // text to show while loading
  const pendingText: string = sending
    ? sendingWithSwap
      ? `Sending ${parsedAmounts[Field.OUTPUT]?.toSignificant(6)} ${tokens[Field.OUTPUT]?.symbol} to ${recipient}`
      : `Sending ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${tokens[Field.INPUT]?.symbol} to ${recipient}`
    : ` Swapping ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${tokens[Field.INPUT]?.symbol} for ${parsedAmounts[
        Field.OUTPUT
      ]?.toSignificant(6)} ${tokens[Field.OUTPUT]?.symbol}`

  function _onTokenSelect(address: string) {
    // if no user balance - switch view to a send with swap
    const hasBalance = allBalances?.[account]?.[address]?.greaterThan('0')
    if (!hasBalance && sending) {
      onTokenSelection(Field.INPUT, null)
      onTokenSelection(Field.OUTPUT, address)
      setSendingWithSwap(true)
    } else {
      onTokenSelection(Field.INPUT, address)
    }
  }

  function _onRecipient(result) {
    if (result.address) {
      setRecipient(result.address)
    } else {
      setRecipient('')
    }
    if (result.name) {
      setENS(result.name)
    }
  }

  return (
    <Wrapper id="exchange-page">
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
        <AutoColumn justify="center" style={{ marginBottom: '1rem' }}>
          <InputGroup gap="lg" justify="center">
            <StyledNumerical
              id="sending-no-swap-input"
              value={formattedAmounts[Field.INPUT]}
              onUserInput={val => onUserInput(Field.INPUT, val)}
            />
            <CurrencyInputPanel
              field={Field.INPUT}
              value={formattedAmounts[Field.INPUT]}
              onUserInput={(field, val) => onUserInput(Field.INPUT, val)}
              onMax={() => {
                maxAmountInput && onMaxInput(maxAmountInput.toExact())
              }}
              atMax={atMaxAmountInput}
              token={tokens[Field.INPUT]}
              onTokenSelection={address => _onTokenSelect(address)}
              hideBalance={true}
              hideInput={true}
              showSendWithSwap={true}
              advanced={advanced}
              label={''}
              id="swap-currency-input"
              otherSelectedTokenAddress={tokens[Field.OUTPUT]?.address}
            />
          </InputGroup>
          <RowBetween style={{ width: 'fit-content' }}>
            <ButtonSecondary
              width="fit-content"
              style={{ fontSize: '14px' }}
              padding={'4px 8px'}
              onClick={() => setSendingWithSwap(true)}
            >
              + Add a swap
            </ButtonSecondary>
            {account && (
              <ButtonSecondary
                style={{ fontSize: '14px', marginLeft: '8px' }}
                padding={'4px 8px'}
                width="fit-content"
                disabled={atMaxAmountInput}
                onClick={() => {
                  maxAmountInput && onMaxInput(maxAmountInput.toExact())
                }}
              >
                Input Max
              </ButtonSecondary>
            )}
          </RowBetween>
        </AutoColumn>
      )}
      <AutoColumn gap={'md'}>
        {(!sending || sendingWithSwap) && (
          <>
            <CurrencyInputPanel
              field={Field.INPUT}
              label={independentField === Field.OUTPUT && parsedAmounts[Field.INPUT] ? 'From (estimated)' : 'From'}
              value={formattedAmounts[Field.INPUT]}
              atMax={atMaxAmountInput}
              token={tokens[Field.INPUT]}
              advanced={advanced}
              onUserInput={onUserInput}
              onMax={() => {
                maxAmountInput && onMaxInput(maxAmountInput.toExact())
              }}
              onTokenSelection={address => onTokenSelection(Field.INPUT, address)}
              otherSelectedTokenAddress={tokens[Field.OUTPUT]?.address}
              id="swap-currency-input"
            />

            {sendingWithSwap ? (
              <ColumnCenter>
                <RowBetween padding="0 1rem 0 12px">
                  <ArrowWrapper onClick={onSwapTokens}>
                    <ArrowDown size="16" color={theme.text2} onClick={onSwapTokens} />
                  </ArrowWrapper>
                  <ButtonSecondary
                    onClick={() => setSendingWithSwap(false)}
                    style={{ marginRight: '0px', width: 'fit-content', fontSize: '14px' }}
                    padding={'4px 6px'}
                  >
                    Remove Swap
                  </ButtonSecondary>
                </RowBetween>
              </ColumnCenter>
            ) : (
              <Hover>
                <AutoColumn style={{ padding: '0 1rem' }}>
                  <ArrowWrapper>
                    <ArrowDown
                      size="16"
                      onClick={onSwapTokens}
                      color={tokens[Field.INPUT] && tokens[Field.OUTPUT] ? theme.primary1 : theme.text2}
                    />
                  </ArrowWrapper>
                </AutoColumn>
              </Hover>
            )}
            <CurrencyInputPanel
              field={Field.OUTPUT}
              value={formattedAmounts[Field.OUTPUT]}
              onUserInput={onUserInput}
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              onMax={() => {}}
              atMax={true}
              label={independentField === Field.INPUT && parsedAmounts[Field.OUTPUT] ? 'To (estimated)' : 'To'}
              token={tokens[Field.OUTPUT]}
              onTokenSelection={address => onTokenSelection(Field.OUTPUT, address)}
              advanced={advanced}
              otherSelectedTokenAddress={tokens[Field.INPUT]?.address}
              id="swap-currency-output"
            />
            {sendingWithSwap && (
              <RowBetween padding="0 1rem 0 12px">
                <ArrowDown size="16" color={theme.text2} />
              </RowBetween>
            )}
          </>
        )}

        {sending && (
          <AutoColumn gap="lg" justify="center">
            <AddressInputPanel
              onChange={_onRecipient}
              onError={(error: boolean, input) => {
                if (error && input !== '') {
                  setRecipientError('Invalid Recipient')
                } else if (error && input === '') {
                  setRecipientError('Enter a Recipient')
                } else {
                  setRecipientError(null)
                }
              }}
            />
          </AutoColumn>
        )}
        {!noRoute && tokens[Field.OUTPUT] && tokens[Field.INPUT] && (
          <Card padding={advanced ? '.25rem 1.25rem 0 .75rem' : '.25rem .7rem .25rem 1.25rem'} borderRadius={'20px'}>
            {advanced ? (
              <PriceBar />
            ) : (
              <AutoColumn gap="4px">
                <RowBetween align="center">
                  <Text fontWeight={500} fontSize={14} color={theme.text2}>
                    Price
                  </Text>
                  <Text
                    fontWeight={500}
                    fontSize={14}
                    color={theme.text2}
                    style={{
                      justifyContent: 'center',
                      alignItems: 'center',
                      display: 'flex',
                      textAlign: 'right',
                      paddingLeft: '10px'
                    }}
                  >
                    {trade && showInverted
                      ? (trade?.executionPrice?.invert()?.toSignificant(6) ?? '') +
                        ' ' +
                        tokens[Field.INPUT]?.symbol +
                        ' per ' +
                        tokens[Field.OUTPUT]?.symbol
                      : (trade?.executionPrice?.toSignificant(6) ?? '') +
                        ' ' +
                        tokens[Field.OUTPUT]?.symbol +
                        ' per ' +
                        tokens[Field.INPUT]?.symbol}
                    <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
                      <Repeat size={14} />
                    </StyledBalanceMaxMini>
                  </Text>
                </RowBetween>

                {trade && (warningHigh || warningMedium) && (
                  <RowBetween>
                    <TYPE.main
                      style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
                      fontSize={14}
                    >
                      Price Impact
                    </TYPE.main>
                    <RowFixed>
                      <ErrorText fontWeight={500} fontSize={14} warningMedium={warningMedium} warningHigh={warningHigh}>
                        {priceSlippage?.lessThan(new Percent('1', '10000'))
                          ? '<0.01%'
                          : `${priceSlippage?.toFixed(2)}%` ?? '-'}
                      </ErrorText>
                      <QuestionHelper text="The difference between the market price and your quoted price due to trade size." />
                    </RowFixed>
                  </RowBetween>
                )}
              </AutoColumn>
            )}
          </Card>
        )}
      </AutoColumn>
      <BottomGrouping>
        {!account ? (
          <ButtonLight
            onClick={() => {
              toggleWalletModal()
            }}
          >
            Connect Wallet
          </ButtonLight>
        ) : noRoute && userHasSpecifiedInputOutput ? (
          <GreyCard style={{ textAlign: 'center' }}>
            <TYPE.main mb="4px">Insufficient liquidity for this trade.</TYPE.main>
            <Link
              onClick={() => {
                history.push('/add/' + tokens[Field.INPUT]?.address + '-' + tokens[Field.OUTPUT]?.address)
              }}
            >
              {' '}
              Add liquidity now.
            </Link>
          </GreyCard>
        ) : !userHasApprovedRouter && !inputError ? (
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
        ) : (
          <ButtonError
            onClick={() => {
              setShowConfirm(true)
            }}
            id="exchange-swap-button"
            disabled={!isValid}
            error={!!warningHigh}
          >
            <Text fontSize={20} fontWeight={500}>
              {generalError ||
                inputError ||
                outputError ||
                recipientError ||
                tradeError ||
                `${sending ? 'Send' : 'Swap'}${warningHigh ? ' Anyway' : ''}`}
            </Text>
          </ButtonError>
        )}
        {v1TradeLinkIfBetter && (
          <YellowCard style={{ marginTop: '12px', padding: '8px 4px' }}>
            <AutoColumn gap="sm" justify="center" style={{ alignItems: 'center', textAlign: 'center' }}>
              <Text lineHeight="145.23%;" fontSize={14} fontWeight={400} color={theme.text1}>
                There is a better price for this trade on
                <Link href={v1TradeLinkIfBetter}>
                  <b> Uniswap V1 ↗</b>
                </Link>
              </Text>
            </AutoColumn>
          </YellowCard>
        )}
      </BottomGrouping>
      {tokens[Field.INPUT] && tokens[Field.OUTPUT] && !noRoute && (
        <AdvancedDropwdown>
          {!showAdvanced && (
            <Hover>
              <RowBetween onClick={() => setShowAdvanced(true)} padding={'8px 20px'} id="exchange-show-advanced">
                <Text fontSize={16} fontWeight={500} style={{ userSelect: 'none' }}>
                  Show Advanced
                </Text>
                <ChevronDown color={theme.text2} />
              </RowBetween>
            </Hover>
          )}
          {showAdvanced && (
            <AutoColumn gap="md">
              <Hover>
                <RowBetween onClick={() => setShowAdvanced(false)} padding={'8px 20px'}>
                  <Text fontSize={16} color={theme.text2} fontWeight={500} style={{ userSelect: 'none' }}>
                    Hide Advanced
                  </Text>
                  <ChevronUp color={theme.text2} />
                </RowBetween>
              </Hover>
              <SectionBreak />
              <AutoColumn style={{ padding: '0 20px' }}>
                <RowBetween>
                  <RowFixed>
                    <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                      {independentField === Field.INPUT
                        ? sending
                          ? 'Minimum sent'
                          : 'Minimum received'
                        : 'Maximum sold'}
                    </TYPE.black>
                    <QuestionHelper
                      text={
                        independentField === Field.INPUT
                          ? sending
                            ? 'Price can change between when a transaction is submitted and when it is executed. This is the minimum amount you will send. A worse rate will cause your transaction to revert.'
                            : 'Price can change between when a transaction is submitted and when it is executed. This is the minimum amount you will receive. A worse rate will cause your transaction to revert.'
                          : 'Price can change between when a transaction is submitted and when it is executed. This is the maximum amount you will pay. A worse rate will cause your transaction to revert.'
                      }
                    />
                  </RowFixed>
                  <RowFixed>
                    <TYPE.black color={theme.text1} fontSize={14}>
                      {independentField === Field.INPUT
                        ? slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4) ?? '-'
                        : slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4) ?? '-'}
                    </TYPE.black>
                    {parsedAmounts[Field.OUTPUT] && parsedAmounts[Field.INPUT] && (
                      <TYPE.black fontSize={14} marginLeft={'4px'} color={theme.text1}>
                        {independentField === Field.INPUT
                          ? parsedAmounts[Field.OUTPUT] && tokens[Field.OUTPUT]?.symbol
                          : parsedAmounts[Field.INPUT] && tokens[Field.INPUT]?.symbol}
                      </TYPE.black>
                    )}
                  </RowFixed>
                </RowBetween>
                <RowBetween>
                  <RowFixed>
                    <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                      Price Impact
                    </TYPE.black>
                    <QuestionHelper text="The difference between the market price and your quoted price due to trade size." />
                  </RowFixed>
                  <ErrorText
                    fontWeight={500}
                    fontSize={14}
                    warningLow={warningLow}
                    warningMedium={warningMedium}
                    warningHigh={warningHigh}
                  >
                    {priceSlippage?.lessThan(new Percent('1', '10000'))
                      ? '<0.01%'
                      : `${priceSlippage?.toFixed(2)}%` ?? '-'}
                  </ErrorText>
                </RowBetween>
                <RowBetween>
                  <RowFixed>
                    <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                      Liquidity Provider Fee
                    </TYPE.black>
                    <QuestionHelper text="A portion of each trade (0.30%) goes to liquidity providers as a protocol incentive." />
                  </RowFixed>
                  <TYPE.black fontSize={14} color={theme.text1}>
                    {realizedLPFeeAmount
                      ? realizedLPFeeAmount?.toSignificant(4) + ' ' + tokens[Field.INPUT]?.symbol
                      : '-'}
                  </TYPE.black>
                </RowBetween>
              </AutoColumn>
              <SectionBreak />
              <RowFixed padding={'0 20px'}>
                <TYPE.black fontWeight={400} fontSize={14} color={theme.text2}>
                  Set slippage tolerance
                </TYPE.black>
                <QuestionHelper text="Your transaction will revert if the execution price changes by more than this amount after you submit your trade." />
              </RowFixed>
              <SlippageTabs
                rawSlippage={allowedSlippage}
                setRawSlippage={setAllowedSlippage}
                deadline={deadline}
                setDeadline={setDeadline}
              />
            </AutoColumn>
          )}
          <FixedBottom>
            <AutoColumn gap="lg">
              {warningHigh && (
                <YellowCard style={{ padding: '20px', paddingTop: '10px' }}>
                  <AutoColumn gap="md">
                    <RowBetween>
                      <RowFixed style={{ paddingTop: '8px' }}>
                        <span role="img" aria-label="warning">
                          ⚠️
                        </span>{' '}
                        <Text fontWeight={500} marginLeft="4px" color={theme.text1}>
                          Price Warning
                        </Text>
                      </RowFixed>
                    </RowBetween>
                    <Text lineHeight="145.23%;" fontSize={16} fontWeight={400} color={theme.text1}>
                      This trade will move the price by ~{priceSlippage.toFixed(2)}%. This pool probably doesn’t have
                      enough liquidity to support this trade.
                    </Text>
                  </AutoColumn>
                </YellowCard>
              )}
            </AutoColumn>
          </FixedBottom>
        </AdvancedDropwdown>
      )}
    </Wrapper>
  )
}

export default withRouter(ExchangePage)
