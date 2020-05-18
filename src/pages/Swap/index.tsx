import { JSBI, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useContext, useState } from 'react'
import { ArrowDown, Repeat } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonError, ButtonLight } from '../../components/Button'
import Card, { GreyCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import QuestionHelper from '../../components/Question'
import { RowBetween, RowFixed } from '../../components/Row'
import AdvancedSwapDetailsDropdown from '../../components/swap/AdvancedSwapDetailsDropdown'
import FormattedPriceImpact from '../../components/swap/FormattedPriceImpact'
import { ArrowWrapper, BottomGrouping, Dots, StyledBalanceMaxMini, Wrapper } from '../../components/swap/styleds'
import SwapModalFooter from '../../components/swap/SwapModalFooter'
import V1TradeLink from '../../components/swap/V1TradeLink'
import { DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE, MIN_ETH } from '../../constants'
import { useWeb3React } from '../../hooks'
import { useApproveCallback } from '../../hooks/useApproveCallback'
import { useSwapCallback } from '../../hooks/useSwapCallback'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import { useDefaultsFromURL, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '../../state/swap/hooks'
import { useHasPendingApproval } from '../../state/transactions/hooks'
import { CursorPointer, TYPE } from '../../theme'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown, warningServerity } from '../../utils/prices'
import SwapModalHeader from '../../components/swap/SwapModalHeader'

export default function Swap({ location: { search } }: RouteComponentProps) {
  useDefaultsFromURL(search)
  // text translation
  // const { t } = useTranslation()
  const { chainId, account } = useWeb3React()
  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  const { independentField, typedValue } = useSwapState()
  const { bestTrade, tokenBalances, parsedAmounts, tokens, error, v1TradeLinkIfBetter } = useDerivedSwapInfo()
  const isValid = !error
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirmed
  const [pendingConfirmation, setPendingConfirmation] = useState<boolean>(true) // waiting for user confirmation

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const [deadline, setDeadline] = useState<number>(DEFAULT_DEADLINE_FROM_NOW)
  const [allowedSlippage, setAllowedSlippage] = useState<number>(INITIAL_ALLOWED_SLIPPAGE)

  const route = bestTrade?.route
  const userHasSpecifiedInputOutput =
    !!tokens[Field.INPUT] &&
    !!tokens[Field.OUTPUT] &&
    !!parsedAmounts[independentField] &&
    parsedAmounts[independentField].greaterThan(JSBI.BigInt(0))
  const noRoute = !route

  // check whether the user has approved the router on the input token
  const [mustApprove, approveCallback] = useApproveCallback(bestTrade, allowedSlippage)
  const pendingApprovalInput = useHasPendingApproval(tokens[Field.INPUT]?.address)

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField] ? parsedAmounts[dependentField].toSignificant(6) : ''
  }

  const { onSwitchTokens, onTokenSelection, onUserInput } = useSwapActionHandlers()

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

  // the callback to execute the swap
  const swapCallback = useSwapCallback(bestTrade, allowedSlippage, deadline)

  function onSwap() {
    setAttemptingTxn(true)
    swapCallback().then(hash => {
      setTxHash(hash)
      setPendingConfirmation(false)

      ReactGA.event({
        category: 'Swap',
        action: 'Swap w/o Send',
        label: [bestTrade.inputAmount.token.symbol, bestTrade.outputAmount.token.symbol].join('/')
      })
    })
  }

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(bestTrade)

  // warnings on slippage
  const priceImpactSeverity = warningServerity(priceImpactWithoutFee)

  function modalHeader() {
    return (
      <SwapModalHeader
        independentField={independentField}
        priceImpactSeverity={priceImpactSeverity}
        tokens={tokens}
        formattedAmounts={formattedAmounts}
        slippageAdjustedAmounts={slippageAdjustedAmounts}
      />
    )
  }

  function modalBottom() {
    return (
      <SwapModalFooter
        confirmText={priceImpactSeverity > 2 ? 'Swap Anyway' : 'Confirm Swap'}
        showInverted={showInverted}
        severity={priceImpactSeverity}
        setShowInverted={setShowInverted}
        onSwap={onSwap}
        realizedLPFee={realizedLPFee}
        parsedAmounts={parsedAmounts}
        priceImpactWithoutFee={priceImpactWithoutFee}
        slippageAdjustedAmounts={slippageAdjustedAmounts}
        trade={bestTrade}
      />
    )
  }

  // text to show while loading
  const pendingText = `Swapping ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${
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
                  onClick={onSwitchTokens}
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
            otherSelectedTokenAddress={tokens[Field.INPUT]?.address}
            id="swap-currency-output"
          />
        </>

        {!noRoute && tokens[Field.OUTPUT] && tokens[Field.INPUT] && (
          <Card padding={'.25rem 1.25rem 0 .75rem'} borderRadius={'20px'}>
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

              {bestTrade && priceImpactSeverity > 1 && (
                <RowBetween>
                  <TYPE.main style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }} fontSize={14}>
                    Price Impact
                  </TYPE.main>
                  <RowFixed>
                    <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
                    <QuestionHelper text="The difference between the market price and estimated price due to trade size." />
                  </RowFixed>
                </RowBetween>
              )}
            </AutoColumn>
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
          </GreyCard>
        ) : mustApprove === true ? (
          <ButtonLight onClick={approveCallback} disabled={pendingApprovalInput}>
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
            id="swap-button"
            disabled={!isValid}
            error={isValid && priceImpactSeverity > 2}
          >
            <Text fontSize={20} fontWeight={500}>
              {error ?? `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`}
            </Text>
          </ButtonError>
        )}
        <V1TradeLink v1TradeLinkIfBetter={v1TradeLinkIfBetter} />
      </BottomGrouping>
      {bestTrade && (
        <AdvancedSwapDetailsDropdown
          trade={bestTrade}
          rawSlippage={allowedSlippage}
          deadline={deadline}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          priceImpactWithoutFee={priceImpactWithoutFee}
          setDeadline={setDeadline}
          setRawSlippage={setAllowedSlippage}
        />
      )}
    </Wrapper>
  )
}
