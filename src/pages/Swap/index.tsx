import { JSBI, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useContext, useState, useEffect } from 'react'
import { ArrowDown } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import Card, { GreyCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import QuestionHelper from '../../components/QuestionHelper'
import { RowBetween, RowFixed } from '../../components/Row'
import AdvancedSwapDetailsDropdown from '../../components/swap/AdvancedSwapDetailsDropdown'
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
import FormattedPriceImpact from '../../components/swap/FormattedPriceImpact'
import { ArrowWrapper, BottomGrouping, Dots, Wrapper } from '../../components/swap/styleds'
import SwapModalFooter from '../../components/swap/SwapModalFooter'
import SwapModalHeader from '../../components/swap/SwapModalHeader'
import TradePrice from '../../components/swap/TradePrice'
import V1TradeLink from '../../components/swap/V1TradeLink'
import { TokenWarningCards } from '../../components/TokenWarningCard'
import { DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE, MIN_ETH } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useApproveCallbackFromTrade, ApprovalState } from '../../hooks/useApproveCallback'
import { useSwapCallback } from '../../hooks/useSwapCallback'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState
} from '../../state/swap/hooks'
import { CursorPointer, TYPE } from '../../theme'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown, warningSeverity } from '../../utils/prices'
import AppBody from '../AppBody'
import { PriceSlippageWarningCard } from '../../components/swap/PriceSlippageWarningCard'

export default function Swap({ location: { search } }: RouteComponentProps) {
  useDefaultsFromURLSearch(search)

  const { chainId, account } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // swap state
  const { independentField, typedValue } = useSwapState()
  const { bestTrade, tokenBalances, parsedAmounts, tokens, error, v1TradeLinkIfBetter } = useDerivedSwapInfo()
  const { onSwitchTokens, onTokenSelection, onUserInput } = useSwapActionHandlers()
  const isValid = !error
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  // modal and loading
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false) // toggling slippage, deadline, etc. on and off
  const [showConfirm, setShowConfirm] = useState<boolean>(false) // show confirmation modal
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // waiting for user confirmaion/rejection
  const [txHash, setTxHash] = useState<string>('')

  // tx parameters
  const [deadline, setDeadline] = useState<number>(DEFAULT_DEADLINE_FROM_NOW)
  const [allowedSlippage, setAllowedSlippage] = useState<number>(INITIAL_ALLOWED_SLIPPAGE)

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField] ? parsedAmounts[dependentField].toSignificant(6) : ''
  }

  const route = bestTrade?.route
  const userHasSpecifiedInputOutput =
    !!tokens[Field.INPUT] &&
    !!tokens[Field.OUTPUT] &&
    !!parsedAmounts[independentField] &&
    parsedAmounts[independentField].greaterThan(JSBI.BigInt(0))
  const noRoute = !route

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTrade(bestTrade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  const showApproveFlow =
    !error &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

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
    maxAmountInput && parsedAmounts[Field.INPUT] ? maxAmountInput.equalTo(parsedAmounts[Field.INPUT]) : undefined

  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(bestTrade, allowedSlippage)

  // the callback to execute the swap
  const swapCallback = useSwapCallback(bestTrade, allowedSlippage, deadline)

  const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(bestTrade)

  function onSwap() {
    if (priceImpactWithoutFee && !confirmPriceImpactWithoutFee(priceImpactWithoutFee)) {
      return
    }

    setAttemptingTxn(true)
    swapCallback()
      .then(hash => {
        setAttemptingTxn(false)
        setTxHash(hash)

        ReactGA.event({
          category: 'Swap',
          action: 'Swap w/o Send',
          label: [bestTrade.inputAmount.token.symbol, bestTrade.outputAmount.token.symbol].join('/')
        })
      })
      .catch(error => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  // warnings on slippage
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee)

  function modalHeader() {
    return (
      <SwapModalHeader
        tokens={tokens}
        formattedAmounts={formattedAmounts}
        slippageAdjustedAmounts={slippageAdjustedAmounts}
        priceImpactSeverity={priceImpactSeverity}
        independentField={independentField}
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
    <>
      <TokenWarningCards tokens={tokens} />
      <AppBody>
        <Wrapper id="swap-page">
          <ConfirmationModal
            isOpen={showConfirm}
            title="Confirm Swap"
            onDismiss={() => {
              setShowConfirm(false)
              // if there was a tx hash, we want to clear the input
              if (txHash) {
                onUserInput(Field.INPUT, '')
              }
              setTxHash('')
            }}
            attemptingTxn={attemptingTxn}
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
                onTokenSelection={address => {
                  setApprovalSubmitted(false) // reset 2 step UI for approvals
                  onTokenSelection(Field.INPUT, address)
                }}
                otherSelectedTokenAddress={tokens[Field.OUTPUT]?.address}
                id="swap-currency-input"
              />

              <CursorPointer>
                <AutoColumn style={{ padding: '0 1rem' }}>
                  <ArrowWrapper>
                    <ArrowDown
                      size="16"
                      onClick={() => {
                        setApprovalSubmitted(false) // reset 2 step UI for approvals
                        onSwitchTokens()
                      }}
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
              <Card padding={'.25rem .75rem 0 .75rem'} borderRadius={'20px'}>
                <AutoColumn gap="4px">
                  <RowBetween align="center">
                    <Text fontWeight={500} fontSize={14} color={theme.text2}>
                      Price
                    </Text>
                    <TradePrice trade={bestTrade} showInverted={showInverted} setShowInverted={setShowInverted} />
                  </RowBetween>

                  {bestTrade && priceImpactSeverity > 1 && (
                    <RowBetween>
                      <TYPE.main
                        style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}
                        fontSize={14}
                      >
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
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : noRoute && userHasSpecifiedInputOutput ? (
              <GreyCard style={{ textAlign: 'center' }}>
                <TYPE.main mb="4px">Insufficient liquidity for this trade.</TYPE.main>
              </GreyCard>
            ) : showApproveFlow ? (
              <RowBetween>
                <ButtonPrimary
                  onClick={approveCallback}
                  disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                  width="48%"
                  altDisbaledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                >
                  {approval === ApprovalState.PENDING ? (
                    <Dots>Approving</Dots>
                  ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                    'Approved'
                  ) : (
                    'Approve ' + tokens[Field.INPUT]?.symbol
                  )}
                </ButtonPrimary>
                <ButtonError
                  onClick={() => {
                    setShowConfirm(true)
                  }}
                  width="48%"
                  id="swap-button"
                  disabled={!isValid || approval !== ApprovalState.APPROVED}
                  error={isValid && priceImpactSeverity > 2}
                >
                  <Text fontSize={16} fontWeight={500}>
                    {`Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`}
                  </Text>
                </ButtonError>
              </RowBetween>
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
        </Wrapper>
      </AppBody>

      {bestTrade && (
        <AdvancedSwapDetailsDropdown
          trade={bestTrade}
          rawSlippage={allowedSlippage}
          deadline={deadline}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          setDeadline={setDeadline}
          setRawSlippage={setAllowedSlippage}
        />
      )}

      {priceImpactWithoutFee && priceImpactSeverity > 2 && (
        <AutoColumn gap="lg" style={{ marginTop: '1rem' }}>
          <PriceSlippageWarningCard priceSlippage={priceImpactWithoutFee} />
        </AutoColumn>
      )}
    </>
  )
}
