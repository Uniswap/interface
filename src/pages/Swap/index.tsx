import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { JSBI, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useContext, useEffect, useState } from 'react'
import { ArrowDown, ChevronDown, Repeat } from 'react-feather'
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
  FixedBottom,
  StyledBalanceMaxMini,
  TruncatedText,
  Wrapper
} from '../../components/ExchangePage/styleds'
import QuestionHelper from '../../components/Question'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { AdvancedSwapDetails } from '../../components/swap/AdvancedSwapDetails'
import FormattedPriceImpact from '../../components/swap/FormattedPriceImpact'
import PriceBar, { warningServerity } from '../../components/swap/PriceBar'
import { PriceSlippageWarningCard } from '../../components/swap/PriceSlippageWarningCard'
import TokenLogo from '../../components/TokenLogo'
import {
  DEFAULT_DEADLINE_FROM_NOW,
  INITIAL_ALLOWED_SLIPPAGE,
  MIN_ETH,
  ROUTER_ADDRESS,
  V1_TRADE_LINK_THRESHOLD
} from '../../constants'
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
import { CursorPointer, TYPE } from '../../theme'
import { Link } from '../../theme/components'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown } from '../../util/prices'
import { calculateGasMargin, getRouterContract } from '../../utils'

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

  const { independentField, typedValue } = useSwapState()
  const { bestTrade, tokenBalances, parsedAmounts, swapType, tokens } = useDerivedSwapInfo()
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
  const v1TradeLinkIfBetter = useV1TradeLinkIfBetter(bestTrade, V1_TRADE_LINK_THRESHOLD)

  const route = bestTrade?.route
  const userHasSpecifiedInputOutput =
    !!tokens[Field.INPUT] &&
    !!tokens[Field.OUTPUT] &&
    !!parsedAmounts[independentField] &&
    parsedAmounts[independentField].greaterThan(JSBI.BigInt(0))
  const noRoute = !route

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

  const { onSwapTokens, onTokenSelection, onUserInput } = useSwapActionHandlers()

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

  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(bestTrade, allowedSlippage)

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

    switch (swapType) {
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
  const [isValid, setIsValid] = useState<boolean>(false)

  const [showInverted, setShowInverted] = useState<boolean>(false)

  const advanced = useUserAdvanced()

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

    if (!parsedAmounts[Field.INPUT]) {
      setInputError('Enter an amount')
      setIsValid(false)
    }

    if (!parsedAmounts[Field.OUTPUT]) {
      setOutputError('Enter an amount')
      setIsValid(false)
    }

    if (
      tokenBalances[Field.INPUT] &&
      parsedAmounts[Field.INPUT] &&
      tokenBalances[Field.INPUT].lessThan(parsedAmounts[Field.INPUT])
    ) {
      setInputError('Insufficient ' + tokens[Field.INPUT]?.symbol + ' balance')
      setIsValid(false)
    }

    // check for null trade entitiy if not enough balance for trade
    if (
      tokenBalances[Field.INPUT] &&
      !bestTrade &&
      parsedAmounts[independentField] &&
      !parsedAmounts[dependentField] &&
      tokens[dependentField]
    ) {
      setInputError('Insufficient ' + tokens[Field.INPUT]?.symbol + ' balance')
      setIsValid(false)
    }
  }, [dependentField, independentField, parsedAmounts, tokens, route, bestTrade, tokenBalances, account])

  const { priceImpactWithoutFee: priceImpactWithoutFee, realizedLPFee: realizedLPFee } = computeTradePriceBreakdown(
    bestTrade
  )

  // warnings on slippage
  const severity = warningServerity(priceImpactWithoutFee)

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
          <TruncatedText fontSize={24} fontWeight={500} color={severity === 'high' ? theme.red1 : ''}>
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
            <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
          </RowBetween>
          <RowBetween>
            <RowFixed>
              <TYPE.black fontSize={14} fontWeight={400} color={theme.text2}>
                Liquidity Provider Fee
              </TYPE.black>
              <QuestionHelper text="A portion of each trade (0.30%) goes to liquidity providers as a protocol incentive." />
            </RowFixed>
            <TYPE.black fontSize={14}>
              {realizedLPFee ? realizedLPFee?.toSignificant(6) + ' ' + tokens[Field.INPUT]?.symbol : '-'}
            </TYPE.black>
          </RowBetween>
        </AutoColumn>

        <AutoRow>
          <ButtonError
            onClick={onSwap}
            error={severity === 'high'}
            style={{ margin: '10px 0 0 0' }}
            id="exchange-page-confirm-swap-or-send"
          >
            <Text fontSize={20} fontWeight={500}>
              {severity === 'high' ? 'Swap Anyway' : 'Confirm Swap'}
            </Text>
          </ButtonError>
        </AutoRow>
      </>
    )
  }

  // text to show while loading
  const pendingText = ` Swapping ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${
    tokens[Field.INPUT]?.symbol
  } for ${parsedAmounts[Field.OUTPUT]?.toSignificant(6)} ${tokens[Field.OUTPUT]?.symbol}`

  return (
    <Wrapper id="swap-page">
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
            label={independentField === Field.OUTPUT ? 'From (estimated)' : 'From'}
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
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            label={independentField === Field.INPUT ? 'To (estimated)' : 'To'}
            showMaxButton={false}
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
              <PriceBar bestTrade={bestTrade} tokens={tokens} />
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
                      <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
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
            error={severity === 'high'}
          >
            <Text fontSize={20} fontWeight={500}>
              {generalError || inputError || outputError || `Swap${severity === 'high' ? ' Anyway' : ''}`}
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
            <AdvancedSwapDetails
              trade={bestTrade}
              rawSlippage={allowedSlippage}
              deadline={deadline}
              onDismiss={() => setShowAdvanced(false)}
              setDeadline={setDeadline}
              setRawSlippage={setAllowedSlippage}
            />
          )}
          <FixedBottom>
            <AutoColumn gap="lg">
              {severity === 'high' && <PriceSlippageWarningCard priceSlippage={priceImpactWithoutFee} />}
            </AutoColumn>
          </FixedBottom>
        </AdvancedDropwdown>
      )}
    </Wrapper>
  )
}
