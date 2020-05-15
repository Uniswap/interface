import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { Fraction, JSBI, Percent, TokenAmount, TradeType, WETH } from '@uniswap/sdk'
import React, { useContext, useEffect, useState } from 'react'
import { ArrowDown, ChevronDown, ChevronUp, Repeat } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import Copy from '../../components/AccountDetails/Copy'
import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonSecondary } from '../../components/Button'
import Card, { BlueCard, GreyCard, YellowCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import {
  AdvancedDropwdown,
  ArrowWrapper,
  BottomGrouping,
  Dots,
  FixedBottom,
  InputGroup,
  SectionBreak,
  StyledBalanceMaxMini,
  StyledNumerical,
  Wrapper
} from '../../components/ExchangePage/styleds'
import QuestionHelper from '../../components/Question'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import SlippageTabs from '../../components/SlippageTabs'
import FormattedPriceImpact from '../../components/swap/FormattedPriceImpact'
import PriceBar, { warningServerity } from '../../components/swap/PriceBar'
import { PriceSlippageWarningCard } from '../../components/swap/PriceSlippageWarningCard'
import TokenLogo from '../../components/TokenLogo'
import { DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE, MIN_ETH, ROUTER_ADDRESS } from '../../constants'
import { useTokenAllowance } from '../../data/Allowances'
import { useV1TradeLinkIfBetter } from '../../data/V1'
import { useTokenContract, useWeb3React } from '../../hooks'
import { useUserAdvanced, useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import {
  SwapType,
  useDefaultsFromURL,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState
} from '../../state/swap/hooks'
import { useHasPendingApproval, useTransactionAdder } from '../../state/transactions/hooks'
import { useAllTokenBalancesTreatingWETHasETH } from '../../state/wallet/hooks'
import { CursorPointer, TYPE } from '../../theme'
import { Link } from '../../theme/components'
import { basisPointsToPercent, calculateGasMargin, getEtherscanLink, getRouterContract, getSigner } from '../../utils'

export default function Send({ history, location: { search } }: RouteComponentProps) {
  useDefaultsFromURL(search)

  // text translation
  // const { t } = useTranslation()
  const { chainId, account, library } = useWeb3React()
  const theme = useContext(ThemeContext)

  // adding notifications on txns
  const addTransaction = useTransactionAdder()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // sending state
  const [sendingWithSwap, setSendingWithSwap] = useState<boolean>(false)
  const [recipient, setRecipient] = useState<string>('')
  const [ENS, setENS] = useState<string>('')

  // trade details, check query params for initial state
  const { independentField, typedValue } = useSwapState()
  const { swapType, parsedAmounts, bestTrade, tokenBalances, tokens } = useDerivedSwapInfo()

  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

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

  // return link to the appropriate v1 pair if the slippage on v1 is lower
  const v1TradeLinkIfBetter = useV1TradeLinkIfBetter(bestTrade, new Percent('50', '10000'))

  const route = bestTrade?.route
  const userHasSpecifiedInputOutput =
    !!tokens[Field.INPUT] &&
    !!tokens[Field.OUTPUT] &&
    !!parsedAmounts[independentField] &&
    parsedAmounts[independentField].greaterThan(JSBI.BigInt(0))
  const noRoute = !route

  const slippageFromTrade: Percent = bestTrade && bestTrade.slippage

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
  const realizedLPFee = !bestTrade
    ? undefined
    : basisPointsToPercent(10000).subtract(
        bestTrade.route.path.length === 2
          ? baseFee
          : new Array(bestTrade.route.path.length - 2)
              .fill(0)
              .reduce<Fraction>((currentFee: Percent | Fraction): Fraction => currentFee.multiply(baseFee), baseFee)
      )
  // the x*y=k impact
  const priceImpact =
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

  const { onSwapTokens, onTokenSelection, onUserInput } = useSwapActionHandlers()

  // reset field if sending with with swap is cancled
  useEffect(() => {
    if (!sendingWithSwap) {
      onTokenSelection(Field.OUTPUT, null)
    }
  }, [onTokenSelection, sendingWithSwap])

  const maxAmountInput: TokenAmount =
    !!tokenBalances[Field.INPUT] &&
    !!tokens[Field.INPUT] &&
    !!WETH[chainId] &&
    tokenBalances[Field.INPUT].greaterThan(
      new TokenAmount(tokens[Field.INPUT], tokens[Field.INPUT].equals(WETH[chainId]) ? MIN_ETH : '0')
    )
      ? tokens[Field.INPUT].equals(WETH[chainId])
        ? tokenBalances[Field.INPUT].subtract(new TokenAmount(WETH[chainId], MIN_ETH))
        : tokenBalances[Field.INPUT]
      : undefined
  const atMaxAmountInput: boolean =
    !!maxAmountInput && !!parsedAmounts[Field.INPUT] ? maxAmountInput.equalTo(parsedAmounts[Field.INPUT]) : undefined

  const slippageAdjustedAmounts: { [field: number]: TokenAmount } = {
    [independentField]: parsedAmounts[independentField],
    [dependentField]:
      parsedAmounts[dependentField] && bestTrade
        ? bestTrade.tradeType === TradeType.EXACT_INPUT
          ? bestTrade.minimumAmountOut(basisPointsToPercent(allowedSlippage))
          : bestTrade.maximumAmountIn(basisPointsToPercent(allowedSlippage))
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

    switch (swapType) {
      case SwapType.EXACT_TOKENS_FOR_TOKENS:
        estimate = routerContract.estimateGas.swapExactTokensForTokens
        method = routerContract.swapExactTokensForTokens
        args = [
          slippageAdjustedAmounts[Field.INPUT].raw.toString(),
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          path,
          recipient,
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
          recipient,
          deadlineFromNow
        ]
        value = null
        break
      case SwapType.EXACT_ETH_FOR_TOKENS:
        estimate = routerContract.estimateGas.swapExactETHForTokens
        method = routerContract.swapExactETHForTokens
        args = [slippageAdjustedAmounts[Field.OUTPUT].raw.toString(), path, recipient, deadlineFromNow]
        value = BigNumber.from(slippageAdjustedAmounts[Field.INPUT].raw.toString())
        break
      case SwapType.TOKENS_FOR_EXACT_ETH:
        estimate = routerContract.estimateGas.swapTokensForExactETH
        method = routerContract.swapTokensForExactETH
        args = [
          slippageAdjustedAmounts[Field.OUTPUT].raw.toString(),
          slippageAdjustedAmounts[Field.INPUT].raw.toString(),
          path,
          recipient,
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
          recipient,
          deadlineFromNow
        ]
        value = null
        break
      case SwapType.ETH_FOR_EXACT_TOKENS:
        estimate = routerContract.estimateGas.swapETHForExactTokens
        method = routerContract.swapETHForExactTokens
        args = [slippageAdjustedAmounts[Field.OUTPUT].raw.toString(), path, recipient, deadlineFromNow]
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
            label: recipient !== account ? 'Swap w/ Send' : 'Swap',
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
      return tokenContract.estimateGas.approve(ROUTER_ADDRESS, tokenBalances[field].raw.toString())
    })

    tokenContract
      .approve(ROUTER_ADDRESS, useUserBalance ? tokenBalances[field].raw.toString() : MaxUint256, {
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

  const ignoreOutput = !sendingWithSwap
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const advanced = useUserAdvanced()

  useEffect(() => {
    // reset errors
    setGeneralError(null)
    setInputError(null)
    setOutputError(null)
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
      tokenBalances[Field.INPUT] &&
      parsedAmounts[Field.INPUT] &&
      JSBI.lessThan(tokenBalances[Field.INPUT].raw, parsedAmounts[Field.INPUT]?.raw)
    ) {
      setInputError('Insufficient ' + tokens[Field.INPUT]?.symbol + ' balance')
      setIsValid(false)
    }

    // check for null trade entitiy if not enough balance for trade
    if (
      sendingWithSwap &&
      tokenBalances[Field.INPUT] &&
      !bestTrade &&
      parsedAmounts[independentField] &&
      !parsedAmounts[dependentField] &&
      tokens[dependentField]
    ) {
      setInputError('Insufficient ' + tokens[Field.INPUT]?.symbol + ' balance')
      setIsValid(false)
    }
  }, [
    sendingWithSwap,
    dependentField,
    ignoreOutput,
    independentField,
    parsedAmounts,
    recipientError,
    tokens,
    route,
    bestTrade,
    tokenBalances,
    account
  ])

  // warnings on slippage
  const severity = warningServerity(priceImpact)

  function modalHeader() {
    if (!sendingWithSwap) {
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

    if (sendingWithSwap) {
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
  }

  function modalBottom() {
    if (!sendingWithSwap) {
      return (
        <AutoColumn>
          <ButtonPrimary onClick={onSend} id="confirm-send">
            <Text color="white" fontSize={20}>
              Confirm send
            </Text>
          </ButtonPrimary>
        </AutoColumn>
      )
    }

    if (sendingWithSwap) {
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
                  {bestTrade && showInverted
                    ? (bestTrade?.executionPrice?.invert()?.toSignificant(6) ?? '') +
                      ' ' +
                      tokens[Field.INPUT]?.symbol +
                      ' / ' +
                      tokens[Field.OUTPUT]?.symbol
                    : (bestTrade?.executionPrice?.toSignificant(6) ?? '') +
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
                  {independentField === Field.INPUT ? 'Min sent' : 'Maximum sold'}
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
              <FormattedPriceImpact priceImpact={priceImpact} />
            </RowBetween>
            <RowBetween>
              <RowFixed>
                <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                  Liquidity Provider Fee
                </TYPE.black>
                <QuestionHelper text="A portion of each trade (0.30%) goes to liquidity providers as a protocol incentive." />
              </RowFixed>
              <TYPE.black fontSize={14}>
                {realizedLPFeeAmount ? realizedLPFeeAmount?.toSignificant(6) + ' ' + tokens[Field.INPUT]?.symbol : '-'}
              </TYPE.black>
            </RowBetween>
          </AutoColumn>

          <AutoRow>
            <ButtonError
              onClick={onSwap}
              error={severity !== 'high'}
              style={{ margin: '10px 0 0 0' }}
              id="exchange-page-confirm-swap-or-send"
            >
              <Text fontSize={20} fontWeight={500}>
                {severity === 'high' ? 'Send Anyway' : 'Confirm Send'}
              </Text>
            </ButtonError>
          </AutoRow>
        </>
      )
    }
  }

  // text to show while loading
  const pendingText: string = sendingWithSwap
    ? `Sending ${parsedAmounts[Field.OUTPUT]?.toSignificant(6)} ${tokens[Field.OUTPUT]?.symbol} to ${recipient}`
    : `Sending ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${tokens[Field.INPUT]?.symbol} to ${recipient}`

  const allBalances = useAllTokenBalancesTreatingWETHasETH() // only for 0 balance token selection behavior
  function _onTokenSelect(address: string) {
    // if no user balance - switch view to a send with swap
    const hasBalance = allBalances?.[account]?.[address]?.greaterThan('0') ?? false
    if (!hasBalance) {
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
    <Wrapper id="swap-page">
      <ConfirmationModal
        isOpen={showConfirm}
        title={sendingWithSwap ? 'Confirm swap and send' : 'Confirm Send'}
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
      {!sendingWithSwap && (
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
                maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
              }}
              showMaxButton={!atMaxAmountInput}
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
                  maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
                }}
              >
                Input Max
              </ButtonSecondary>
            )}
          </RowBetween>
        </AutoColumn>
      )}
      <AutoColumn gap={'md'}>
        {sendingWithSwap && (
          <>
            <CurrencyInputPanel
              field={Field.INPUT}
              label={independentField === Field.OUTPUT && parsedAmounts[Field.INPUT] ? 'From (estimated)' : 'From'}
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={!atMaxAmountInput}
              token={tokens[Field.INPUT]}
              advanced={advanced}
              onUserInput={onUserInput}
              onMax={() => {
                maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
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
            )}
            <CurrencyInputPanel
              field={Field.OUTPUT}
              value={formattedAmounts[Field.OUTPUT]}
              onUserInput={onUserInput}
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              label={independentField === Field.INPUT && parsedAmounts[Field.OUTPUT] ? 'To (estimated)' : 'To'}
              showMaxButton={false}
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
        {!noRoute && tokens[Field.OUTPUT] && tokens[Field.INPUT] && (
          <Card padding={advanced ? '.25rem 1.25rem 0 .75rem' : '.25rem .7rem .25rem 1.25rem'} borderRadius={'20px'}>
            {advanced ? (
              <PriceBar tokens={tokens} bestTrade={bestTrade} />
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
                    {bestTrade && showInverted
                      ? (bestTrade?.executionPrice?.invert()?.toSignificant(6) ?? '') +
                        ' ' +
                        tokens[Field.INPUT]?.symbol +
                        ' per ' +
                        tokens[Field.OUTPUT]?.symbol
                      : (bestTrade?.executionPrice?.toSignificant(6) ?? '') +
                        ' ' +
                        tokens[Field.OUTPUT]?.symbol +
                        ' per ' +
                        tokens[Field.INPUT]?.symbol}
                    <StyledBalanceMaxMini onClick={() => setShowInverted(!showInverted)}>
                      <Repeat size={14} />
                    </StyledBalanceMaxMini>
                  </Text>
                </RowBetween>

                {bestTrade && (severity === 'high' || severity === 'medium') && (
                  <RowBetween>
                    <TYPE.main
                      style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
                      fontSize={14}
                    >
                      Price Impact
                    </TYPE.main>
                    <RowFixed>
                      <FormattedPriceImpact priceImpact={priceImpact} />
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
            id="send-button"
            disabled={!isValid}
            error={severity !== 'high'}
          >
            <Text fontSize={20} fontWeight={500}>
              {generalError ||
                inputError ||
                outputError ||
                recipientError ||
                `Send${severity === 'high' ? ' Anyway' : ''}`}
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
                      {independentField === Field.INPUT ? 'Minimum sent' : 'Maximum sold'}
                    </TYPE.black>
                    <QuestionHelper
                      text={
                        independentField === Field.INPUT
                          ? 'Price can change between when a transaction is submitted and when it is executed. This is the minimum amount you will send. A worse rate will cause your transaction to revert.'
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
                  <FormattedPriceImpact priceImpact={priceImpact} />
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
              {severity === 'high' && <PriceSlippageWarningCard priceSlippage={priceImpact} />}
            </AutoColumn>
          </FixedBottom>
        </AdvancedDropwdown>
      )}
    </Wrapper>
  )
}
