import { JSBI, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useContext, useState, useEffect, useCallback } from 'react'
import { ArrowDown } from 'react-feather'
import ReactGA from 'react-ga'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import Card, { GreyCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import { AutoRow, RowBetween } from '../../components/Row'
import AdvancedSwapDetailsDropdown from '../../components/swap/AdvancedSwapDetailsDropdown'
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
import { ArrowWrapper, BottomGrouping, Dots, Wrapper } from '../../components/swap/styleds'
import SwapModalFooter from '../../components/swap/SwapModalFooter'
import SwapModalHeader from '../../components/swap/SwapModalHeader'
import TradePrice from '../../components/swap/TradePrice'
import BetterTradeLink from '../../components/swap/BetterTradeLink'
import { TokenWarningCards } from '../../components/TokenWarningCard'
import { useActiveWeb3React } from '../../hooks'
import { useApproveCallbackFromTrade, ApprovalState } from '../../hooks/useApproveCallback'
import useENSAddress from '../../hooks/useENSAddress'
import { useSwapCallback } from '../../hooks/useSwapCallback'
import { useWalletModalToggle, useToggleSettingsMenu } from '../../state/application/hooks'
import { useExpertModeManager, useUserSlippageTolerance, useUserDeadline } from '../../state/user/hooks'

import { INITIAL_ALLOWED_SLIPPAGE, MIN_ETH, BETTER_TRADE_LINK_THRESHOLD } from '../../constants'
import { getTradeVersion, isTradeBetter } from '../../data/V1'
import useToggledVersion, { Version } from '../../hooks/useToggledVersion'
import { Field } from '../../state/swap/actions'
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState
} from '../../state/swap/hooks'
import { CursorPointer, LinkStyledButton, TYPE } from '../../theme'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown, warningSeverity } from '../../utils/prices'
import AppBody from '../AppBody'
import { ClickableText } from '../Pool/styleds'

export default function Swap() {
  useDefaultsFromURLSearch()

  const { chainId, account } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // for expert mode
  const toggleSettings = useToggleSettingsMenu()
  const [expertMode] = useExpertModeManager()

  // get custom setting values for user
  const [deadline] = useUserDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const { v1Trade, v2Trade, tokenBalances, parsedAmount, tokens, error } = useDerivedSwapInfo()
  const { address: recipientAddress } = useENSAddress(recipient)
  const toggledVersion = useToggledVersion()
  const trade =
    {
      [Version.v1]: v1Trade,
      [Version.v2]: v2Trade
    }[toggledVersion] ?? undefined

  const betterTradeLinkVersion: Version | undefined =
    toggledVersion === Version.v2 && isTradeBetter(v2Trade, v1Trade, BETTER_TRADE_LINK_THRESHOLD)
      ? Version.v1
      : toggledVersion === Version.v1 && isTradeBetter(v1Trade, v2Trade)
      ? Version.v2
      : undefined

  const parsedAmounts = {
    [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
    [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount
  }

  const { onSwitchTokens, onTokenSelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const isValid = !error
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (field, value) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (field, value) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false) // show confirmation modal
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // waiting for user confirmaion/rejection
  const [txHash, setTxHash] = useState<string>('')

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? ''
  }

  const route = trade?.route
  const userHasSpecifiedInputOutput = Boolean(
    tokens[Field.INPUT] && tokens[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )
  const noRoute = !route

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  let maxAmountInput: TokenAmount | undefined
  {
    const inputToken = tokens[Field.INPUT]
    maxAmountInput =
      inputToken &&
      chainId &&
      WETH[chainId] &&
      tokenBalances[Field.INPUT]?.greaterThan(
        new TokenAmount(inputToken, inputToken.equals(WETH[chainId]) ? MIN_ETH : '0')
      )
        ? inputToken.equals(WETH[chainId])
          ? tokenBalances[Field.INPUT]?.subtract(new TokenAmount(WETH[chainId], MIN_ETH))
          : tokenBalances[Field.INPUT]
        : undefined
  }
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput))

  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)

  // the callback to execute the swap
  const swapCallback = useSwapCallback(trade, allowedSlippage, deadline, recipient)

  const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(trade)

  function onSwap() {
    if (priceImpactWithoutFee && !confirmPriceImpactWithoutFee(priceImpactWithoutFee)) {
      return
    }
    if (!swapCallback) {
      return
    }
    setAttemptingTxn(true)
    swapCallback()
      .then(hash => {
        setAttemptingTxn(false)
        setTxHash(hash)

        ReactGA.event({
          category: 'Swap',
          action:
            recipient === null
              ? 'Swap w/o Send'
              : (recipientAddress ?? recipient) === account
              ? 'Swap w/o Send + recipient'
              : 'Swap w/ Send',
          label: [trade?.inputAmount?.token?.symbol, trade?.outputAmount?.token?.symbol, getTradeVersion(trade)].join(
            '/'
          )
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

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !error &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !expertMode)

  function modalHeader() {
    return (
      <SwapModalHeader
        tokens={tokens}
        formattedAmounts={formattedAmounts}
        slippageAdjustedAmounts={slippageAdjustedAmounts}
        priceImpactSeverity={priceImpactSeverity}
        independentField={independentField}
        recipient={recipient}
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
        trade={trade}
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
        <SwapPoolTabs active={'swap'} />
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
            <CurrencyInputPanel
              field={Field.INPUT}
              label={independentField === Field.OUTPUT ? 'From (estimated)' : 'From'}
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={!atMaxAmountInput}
              token={tokens[Field.INPUT]}
              onUserInput={handleTypeInput}
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
              <AutoColumn justify="space-between">
                <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable>
                    <ArrowDown
                      size="16"
                      onClick={() => {
                        setApprovalSubmitted(false) // reset 2 step UI for approvals
                        onSwitchTokens()
                      }}
                      color={tokens[Field.INPUT] && tokens[Field.OUTPUT] ? theme.primary1 : theme.text2}
                    />
                  </ArrowWrapper>
                  {recipient === null ? (
                    <LinkStyledButton id="add-recipient-button" onClick={() => onChangeRecipient('')}>
                      + add recipient (optional)
                    </LinkStyledButton>
                  ) : null}
                </AutoRow>
              </AutoColumn>
            </CursorPointer>
            <CurrencyInputPanel
              field={Field.OUTPUT}
              value={formattedAmounts[Field.OUTPUT]}
              onUserInput={handleTypeOutput}
              label={independentField === Field.INPUT ? 'To (estimated)' : 'To'}
              showMaxButton={false}
              token={tokens[Field.OUTPUT]}
              onTokenSelection={address => onTokenSelection(Field.OUTPUT, address)}
              otherSelectedTokenAddress={tokens[Field.INPUT]?.address}
              id="swap-currency-output"
            />

            {recipient !== null ? (
              <>
                <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable={false}>
                    <ArrowDown size="16" color={theme.text2} />
                  </ArrowWrapper>
                  <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                    - remove recipient
                  </LinkStyledButton>
                </AutoRow>
                <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
              </>
            ) : null}

            <Card padding={'.25rem .75rem 0 .75rem'} borderRadius={'20px'}>
              <AutoColumn gap="4px">
                <RowBetween align="center">
                  <Text fontWeight={500} fontSize={14} color={theme.text2}>
                    Price
                  </Text>
                  <TradePrice
                    inputToken={tokens[Field.INPUT]}
                    outputToken={tokens[Field.OUTPUT]}
                    price={trade?.executionPrice}
                    showInverted={showInverted}
                    setShowInverted={setShowInverted}
                  />
                </RowBetween>

                {allowedSlippage !== INITIAL_ALLOWED_SLIPPAGE && (
                  <RowBetween align="center">
                    <ClickableText fontWeight={500} fontSize={14} color={theme.text2} onClick={toggleSettings}>
                      Slippage Tolerance
                    </ClickableText>
                    <ClickableText fontWeight={500} fontSize={14} color={theme.text2} onClick={toggleSettings}>
                      {allowedSlippage ? allowedSlippage / 100 : '-'}%
                    </ClickableText>
                  </RowBetween>
                )}
              </AutoColumn>
            </Card>
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
                    expertMode ? onSwap() : setShowConfirm(true)
                  }}
                  width="48%"
                  id="swap-button"
                  disabled={!isValid || approval !== ApprovalState.APPROVED || (priceImpactSeverity > 3 && !expertMode)}
                  error={isValid && priceImpactSeverity > 2}
                >
                  <Text fontSize={16} fontWeight={500}>
                    {priceImpactSeverity > 3 && !expertMode
                      ? `Price Impact High`
                      : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`}
                  </Text>
                </ButtonError>
              </RowBetween>
            ) : (
              <ButtonError
                onClick={() => {
                  expertMode ? onSwap() : setShowConfirm(true)
                }}
                id="swap-button"
                disabled={!isValid || (priceImpactSeverity > 3 && !expertMode)}
                error={isValid && priceImpactSeverity > 2}
              >
                <Text fontSize={20} fontWeight={500}>
                  {error
                    ? error
                    : priceImpactSeverity > 3 && !expertMode
                    ? `Price Impact Too High`
                    : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`}
                </Text>
              </ButtonError>
            )}
            {betterTradeLinkVersion && <BetterTradeLink version={betterTradeLinkVersion} />}
          </BottomGrouping>
        </Wrapper>
      </AppBody>

      <AdvancedSwapDetailsDropdown trade={trade} />
    </>
  )
}
