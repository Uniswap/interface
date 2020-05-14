import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { parseEther, parseUnits } from '@ethersproject/units'
import { Fraction, JSBI, Percent, TokenAmount, TradeType, WETH } from '@uniswap/sdk'
import React, { useContext, useEffect, useState } from 'react'
import { ArrowDown, ChevronDown, ChevronUp, Repeat } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonError, ButtonLight } from '../../components/Button'
import Card, { GreyCard, YellowCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import {
  AdvancedDropwdown,
  ArrowWrapper,
  BottomGrouping,
  Dots,
  ErrorText,
  FixedBottom,
  SectionBreak,
  StyledBalanceMaxMini,
  TruncatedText,
  Wrapper
} from '../../components/ExchangePage/styleds'
import QuestionHelper from '../../components/Question'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import SlippageTabs from '../../components/SlippageTabs'
import TokenLogo from '../../components/TokenLogo'
import { useTokenAllowance } from '../../data/Allowances'
import { useV1TradeLinkIfBetter } from '../../data/V1'
import { useTokenContract, useWeb3React } from '../../hooks'
import { useTokenByAddressAndAutomaticallyAdd } from '../../hooks/Tokens'
import { useTradeExactIn, useTradeExactOut } from '../../hooks/Trades'
import { useUserAdvanced, useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import { SwapType, useDefaultsFromURL, useSwapActionHandlers, useSwapState } from '../../state/swap/hooks'
import { useHasPendingApproval, useTransactionAdder } from '../../state/transactions/hooks'
import { useAllTokenBalancesTreatingWETHasETH } from '../../state/wallet/hooks'
import { CursorPointer, TYPE } from '../../theme'
import { Link } from '../../theme/components'
import { basisPointsToPercent, calculateGasMargin, getRouterContract } from '../../utils'
import {
  ALLOWED_SLIPPAGE_HIGH,
  ALLOWED_SLIPPAGE_MEDIUM,
  DEFAULT_DEADLINE_FROM_NOW,
  INITIAL_ALLOWED_SLIPPAGE,
  ROUTER_ADDRESS
} from '../../constants'

export default function Swap({ history, location: { search } }: RouteComponentProps) {
  useDefaultsFromURL(search)
  // text translation
  // const { t } = useTranslation()
  const { chainId, account, library } = useWeb3React()
  const theme = useContext(ThemeContext)

  // adding notifications on txns
  const addTransaction = useTransactionAdder()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // trade details, check query params for initial state
  const state = useSwapState()

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
    [Field.INPUT]: allBalances?.[tokens[Field.INPUT]?.address]?.raw,
    [Field.OUTPUT]: allBalances?.[tokens[Field.OUTPUT]?.address]?.raw
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

  const { onMaxInput, onMaxOutput, onSwapTokens, onTokenSelection, onUserInput } = useSwapActionHandlers()

  const MIN_ETHER: TokenAmount = chainId && new TokenAmount(WETH[chainId], JSBI.BigInt(parseEther('.01')))

  let maxAmountInput: TokenAmount

  try {
    maxAmountInput =
      !!userBalances[Field.INPUT] &&
      !!tokens[Field.INPUT] &&
      WETH[chainId] &&
      JSBI.greaterThan(
        userBalances[Field.INPUT].raw,
        tokens[Field.INPUT].equals(WETH[chainId]) ? MIN_ETHER.raw : JSBI.BigInt(0)
      )
        ? tokens[Field.INPUT].equals(WETH[chainId])
          ? userBalances[Field.INPUT].subtract(MIN_ETHER)
          : userBalances[Field.INPUT]
        : undefined
  } catch {}

  const atMaxAmountInput: boolean =
    !!maxAmountInput && !!parsedAmounts[Field.INPUT]
      ? JSBI.equal(maxAmountInput.raw, parsedAmounts[Field.INPUT].raw)
      : undefined

  const maxAmountOutput: TokenAmount =
    !!userBalances[Field.OUTPUT] && JSBI.greaterThan(userBalances[Field.OUTPUT].raw, JSBI.BigInt(0))
      ? userBalances[Field.OUTPUT]
      : undefined

  const atMaxAmountOutput: boolean =
    !!maxAmountOutput && !!parsedAmounts[Field.OUTPUT]
      ? JSBI.equal(maxAmountOutput.raw, parsedAmounts[Field.OUTPUT].raw)
      : undefined

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

  // covers swap
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
          account,
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
          account,
          deadlineFromNow
        ]
        value = null
        break
      case SwapType.EXACT_ETH_FOR_TOKENS:
        estimate = routerContract.estimateGas.swapExactETHForTokens
        method = routerContract.swapExactETHForTokens
        args = [slippageAdjustedAmounts[Field.OUTPUT].raw.toString(), path, account, deadlineFromNow]
        value = BigNumber.from(slippageAdjustedAmounts[Field.INPUT].raw.toString())
        break
      case SwapType.TOKENS_FOR_EXACT_ETH:
        estimate = routerContract.estimateGas.swapTokensForExactETH
        method = routerContract.swapTokensForExactETH
        args = [
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          slippageAdjustedAmounts[Field.INPUT].raw.toString(),
          path,
          account,
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
          account,
          deadlineFromNow
        ]
        value = null
        break
      case SwapType.ETH_FOR_EXACT_TOKENS:
        estimate = routerContract.estimateGas.swapETHForExactTokens
        method = routerContract.swapETHForExactTokens
        args = [slippageAdjustedAmounts[Field.OUTPUT].raw.toString(), path, account, deadlineFromNow]
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
            label: 'Swap',
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
      return tokenContract.estimateGas.approve(ROUTER_ADDRESS, userBalances[field])
    })

    tokenContract
      .approve(ROUTER_ADDRESS, useUserBalance ? userBalances[field] : MaxUint256, {
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
  const [isValid, setIsValid] = useState<boolean>(false)

  const [showInverted, setShowInverted] = useState<boolean>(false)

  const advanced = useUserAdvanced()

  useEffect(() => {
    // reset errors
    setGeneralError(null)
    setInputError(null)
    setOutputError(null)
    setTradeError(null)
    setIsValid(true)

    if (!account) {
      setGeneralError('Connect Wallet')
      setIsValid(false)
    }

    if (!parsedAmounts[Field.INPUT]) {
      setInputError('Enter an amount')
      setIsValid(false)
    }

    if (!parsedAmounts[Field.OUTPUT]) {
      setOutputError('Enter an amount')
      setIsValid(false)
    }

    if (
      userBalances[Field.INPUT] &&
      parsedAmounts[Field.INPUT] &&
      JSBI.lessThan(userBalances[Field.INPUT].raw, parsedAmounts[Field.INPUT]?.raw)
    ) {
      setInputError('Insufficient ' + tokens[Field.INPUT]?.symbol + ' balance')
      setIsValid(false)
    }

    // check for null trade entitiy if not enough balance for trade
    if (
      userBalances[Field.INPUT] &&
      !trade &&
      parsedAmounts[independentField] &&
      !parsedAmounts[dependentField] &&
      tokens[dependentField]
    ) {
      setInputError('Insufficient ' + tokens[Field.INPUT]?.symbol + ' balance')
      setIsValid(false)
    }
  }, [dependentField, independentField, parsedAmounts, tokens, route, trade, userBalances, account])

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

  function modalBottom() {
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
                {independentField === Field.INPUT ? 'Minimum received' : 'Maximum sold'}
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
              {warningHigh ? 'Swap Anyway' : 'Confirm Swap'}
            </Text>
          </ButtonError>
        </AutoRow>
      </>
    )
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
  const pendingText = ` Swapping ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${
    tokens[Field.INPUT]?.symbol
  } for ${parsedAmounts[Field.OUTPUT]?.toSignificant(6)} ${tokens[Field.OUTPUT]?.symbol}`

  return (
    <Wrapper id="exchange-page">
      <ConfirmationModal
        isOpen={showConfirm}
        title="Confirm Swap"
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

      <AutoColumn gap={'md'}>
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

          <CursorPointer>
            <AutoColumn style={{ padding: '0 1rem' }}>
              <ArrowWrapper>
                <ArrowDown
                  size="16"
                  onClick={onSwapTokens}
                  color={tokens[Field.INPUT] && tokens[Field.OUTPUT] ? theme.primary1 : theme.text2}
                />
              </ArrowWrapper>
            </AutoColumn>
          </CursorPointer>

          <CurrencyInputPanel
            field={Field.OUTPUT}
            value={formattedAmounts[Field.OUTPUT]}
            onUserInput={onUserInput}
            onMax={() => {
              maxAmountOutput && onMaxOutput(maxAmountOutput.toExact())
            }}
            label={independentField === Field.INPUT && parsedAmounts[Field.OUTPUT] ? 'To (estimated)' : 'To'}
            atMax={atMaxAmountOutput}
            token={tokens[Field.OUTPUT]}
            onTokenSelection={address => onTokenSelection(Field.OUTPUT, address)}
            advanced={advanced}
            otherSelectedTokenAddress={tokens[Field.INPUT]?.address}
            id="swap-currency-output"
          />
        </>

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
                    style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
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
              {generalError || inputError || outputError || tradeError || `Swap${warningHigh ? ' Anyway' : ''}`}
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
            <CursorPointer>
              <RowBetween onClick={() => setShowAdvanced(true)} padding={'8px 20px'} id="exchange-show-advanced">
                <Text fontSize={16} fontWeight={500} style={{ userSelect: 'none' }}>
                  Show Advanced
                </Text>
                <ChevronDown color={theme.text2} />
              </RowBetween>
            </CursorPointer>
          )}
          {showAdvanced && (
            <AutoColumn gap="md">
              <CursorPointer>
                <RowBetween onClick={() => setShowAdvanced(false)} padding={'8px 20px'}>
                  <Text fontSize={16} color={theme.text2} fontWeight={500} style={{ userSelect: 'none' }}>
                    Hide Advanced
                  </Text>
                  <ChevronUp color={theme.text2} />
                </RowBetween>
              </CursorPointer>
              <SectionBreak />
              <AutoColumn style={{ padding: '0 20px' }}>
                <RowBetween>
                  <RowFixed>
                    <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                      {independentField === Field.INPUT ? 'Minimum received' : 'Maximum sold'}
                    </TYPE.black>
                    <QuestionHelper
                      text={
                        independentField === Field.INPUT
                          ? 'Price can change between when a transaction is submitted and when it is executed. This is the minimum amount you will receive. A worse rate will cause your transaction to revert.'
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
                    <QuestionHelper text="A portion of each trade (0.03%) goes to liquidity providers to incentivize liquidity on the protocol." />
                  </RowFixed>
                  <TYPE.black fontSize={14} color={theme.text1}>
                    {realizedLPFeeAmount
                      ? realizedLPFeeAmount?.toSignificant(6) + ' ' + tokens[Field.INPUT]?.symbol
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
