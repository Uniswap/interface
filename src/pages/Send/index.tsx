import { JSBI, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useContext, useEffect, useState } from 'react'
import { ArrowDown } from 'react-feather'
import ReactGA from 'react-ga'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonSecondary } from '../../components/Button'
import Card, { BlueCard, GreyCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import QuestionHelper from '../../components/QuestionHelper'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import AdvancedSwapDetailsDropdown from '../../components/swap/AdvancedSwapDetailsDropdown'
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
import FormattedPriceImpact from '../../components/swap/FormattedPriceImpact'
import SwapModalFooter from '../../components/swap/SwapModalFooter'
import { ArrowWrapper, BottomGrouping, Dots, InputGroup, StyledNumerical, Wrapper } from '../../components/swap/styleds'
import TradePrice from '../../components/swap/TradePrice'
import { TransferModalHeader } from '../../components/swap/TransferModalHeader'
import BetterTradeLink from '../../components/swap/BetterTradeLink'
import TokenLogo from '../../components/TokenLogo'
import { TokenWarningCards } from '../../components/TokenWarningCard'
import {
  DEFAULT_DEADLINE_FROM_NOW,
  INITIAL_ALLOWED_SLIPPAGE,
  MIN_ETH,
  BETTER_TRADE_LINK_THRESHOLD
} from '../../constants'
import { getTradeVersion, isTradeBetter } from '../../data/V1'
import { useActiveWeb3React } from '../../hooks'
import { useApproveCallbackFromTrade, ApprovalState } from '../../hooks/useApproveCallback'
import { useSendCallback } from '../../hooks/useSendCallback'
import { useSwapCallback } from '../../hooks/useSwapCallback'
import useToggledVersion, { Version } from '../../hooks/useToggledVersion'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState
} from '../../state/swap/hooks'
import { useAllTokenBalancesTreatingWETHasETH } from '../../state/wallet/hooks'
import { CursorPointer, TYPE } from '../../theme'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown, warningSeverity } from '../../utils/prices'
import AppBody from '../AppBody'
import { PriceSlippageWarningCard } from '../../components/swap/PriceSlippageWarningCard'

export default function Send() {
  useDefaultsFromURLSearch()

  // text translation
  // const { t } = useTranslation()
  const { chainId, account } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // sending state
  const [sendingWithSwap, setSendingWithSwap] = useState<boolean>(false)
  const [recipient, setRecipient] = useState<string>('')
  const [ENS, setENS] = useState<string>('')
  const [recipientError, setRecipientError] = useState<string | null>('Enter a Recipient')

  // trade details, check query params for initial state
  const { independentField, typedValue } = useSwapState()
  const {
    parsedAmount,
    bestTrade: bestTradeV2,
    tokenBalances,
    tokens,
    error: swapError,
    v1Trade
  } = useDerivedSwapInfo()

  const toggledVersion = useToggledVersion()
  const bestTrade = {
    [Version.v1]: v1Trade,
    [Version.v2]: bestTradeV2
  }[toggledVersion]

  const betterTradeLinkVersion: Version | undefined =
    toggledVersion === Version.v2 && isTradeBetter(bestTradeV2, v1Trade, BETTER_TRADE_LINK_THRESHOLD)
      ? Version.v1
      : toggledVersion === Version.v1 && isTradeBetter(v1Trade, bestTradeV2)
      ? Version.v2
      : undefined

  const parsedAmounts = {
    [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : bestTrade?.inputAmount,
    [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : bestTrade?.outputAmount
  }

  const isSwapValid = !swapError && !recipientError && bestTrade
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  // modal and loading
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false) // toggling slippage, deadline, etc. on and off
  const [showConfirm, setShowConfirm] = useState<boolean>(false) // show confirmation modal
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // waiting for user confirmaion/rejection
  const [txHash, setTxHash] = useState<string>('')

  // tx parameters
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
  const [approval, approveCallback] = useApproveCallbackFromTrade(bestTrade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField] ? parsedAmounts[dependentField].toSignificant(6) : ''
  }

  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(bestTrade, allowedSlippage)

  const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(bestTrade)

  const { onSwitchTokens, onTokenSelection, onUserInput } = useSwapActionHandlers()

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

  const swapCallback = useSwapCallback(bestTrade, allowedSlippage, deadline, recipient)

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
          category: 'Send',
          action: recipient === account ? 'Swap w/o Send' : 'Swap w/ Send',
          label: [
            bestTrade.inputAmount.token.symbol,
            bestTrade.outputAmount.token.symbol,
            getTradeVersion(bestTrade)
          ].join('/')
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

  const sendCallback = useSendCallback(parsedAmounts?.[Field.INPUT], recipient)
  const isSendValid = sendCallback !== null && (sendingWithSwap === false || approval === ApprovalState.APPROVED)

  async function onSend() {
    setAttemptingTxn(true)
    sendCallback()
      .then(hash => {
        setAttemptingTxn(false)
        setTxHash(hash)

        ReactGA.event({ category: 'Send', action: 'Send', label: tokens[Field.INPUT]?.symbol })
      })
      .catch(error => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  const [showInverted, setShowInverted] = useState<boolean>(false)

  // warnings on slippage
  const severity = !sendingWithSwap ? 0 : warningSeverity(priceImpactWithoutFee)

  // show approval buttons when: no errors on input, not approved or pending, or has been approved in this session
  const showApproveFlow =
    ((sendingWithSwap && isSwapValid) || (!sendingWithSwap && isSendValid)) &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  function modalHeader() {
    if (!sendingWithSwap) {
      return <TransferModalHeader amount={parsedAmounts?.[Field.INPUT]} ENSName={ENS} recipient={recipient} />
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
        <SwapModalFooter
          trade={bestTrade}
          onSwap={onSwap}
          setShowInverted={setShowInverted}
          severity={severity}
          showInverted={showInverted}
          slippageAdjustedAmounts={slippageAdjustedAmounts}
          priceImpactWithoutFee={priceImpactWithoutFee}
          parsedAmounts={parsedAmounts}
          realizedLPFee={realizedLPFee}
          confirmText={severity > 2 ? 'Send Anyway' : 'Confirm Send'}
        />
      )
    }
  }

  // text to show while loading
  const pendingText: string = sendingWithSwap
    ? `Sending ${parsedAmounts[Field.OUTPUT]?.toSignificant(6)} ${tokens[Field.OUTPUT]?.symbol} to ${recipient}`
    : `Sending ${parsedAmounts[Field.INPUT]?.toSignificant(6)} ${tokens[Field.INPUT]?.symbol} to ${recipient}`

  const allBalances = useAllTokenBalancesTreatingWETHasETH() // only for 0 balance token selection behavior
  const swapState = useSwapState()
  function _onTokenSelect(address: string) {
    // if no user balance - switch view to a send with swap
    const hasBalance = allBalances?.[address]?.greaterThan('0') ?? false
    if (!hasBalance) {
      onTokenSelection(
        Field.INPUT,
        swapState[Field.INPUT]?.address === address ? null : swapState[Field.INPUT]?.address
      )
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

  const sendAmountError =
    !sendingWithSwap && JSBI.equal(parsedAmounts?.[Field.INPUT]?.raw ?? JSBI.BigInt(0), JSBI.BigInt(0))
      ? 'Enter an amount'
      : null

  return (
    <>
      {sendingWithSwap ? <TokenWarningCards tokens={tokens} /> : null}
      <AppBody>
        <Wrapper id="send-page">
          <ConfirmationModal
            isOpen={showConfirm}
            title={sendingWithSwap ? 'Confirm swap and send' : 'Confirm Send'}
            onDismiss={() => {
              setShowConfirm(false)
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
                  onUserInput={onUserInput}
                  onMax={() => {
                    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
                  }}
                  onTokenSelection={address => {
                    setApprovalSubmitted(false)
                    onTokenSelection(Field.INPUT, address)
                  }}
                  otherSelectedTokenAddress={tokens[Field.OUTPUT]?.address}
                  id="swap-currency-input"
                />
                {sendingWithSwap ? (
                  <ColumnCenter>
                    <RowBetween padding="0 1rem 0 12px">
                      <ArrowWrapper onClick={onSwitchTokens}>
                        <ArrowDown size="16" color={theme.text2} onClick={onSwitchTokens} />
                      </ArrowWrapper>
                      <ButtonSecondary
                        onClick={() => setSendingWithSwap(false)}
                        style={{ marginRight: '0px', width: 'auto', fontSize: '14px' }}
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
                          onClick={onSwitchTokens}
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
                  label={independentField === Field.INPUT && parsedAmounts[Field.OUTPUT] ? 'To (estimated)' : 'To'}
                  showMaxButton={false}
                  token={tokens[Field.OUTPUT]}
                  onTokenSelection={address => onTokenSelection(Field.OUTPUT, address)}
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
              <Card padding={'.25rem .75rem 0 .75rem'} borderRadius={'20px'}>
                <AutoColumn gap="4px">
                  <RowBetween align="center">
                    <Text fontWeight={500} fontSize={14} color={theme.text2}>
                      Price
                    </Text>
                    <TradePrice showInverted={showInverted} setShowInverted={setShowInverted} trade={bestTrade} />
                  </RowBetween>

                  {bestTrade && severity > 1 && (
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
                  id="send-button"
                  disabled={approval !== ApprovalState.APPROVED}
                  error={sendingWithSwap && isSwapValid && severity > 2}
                >
                  <Text fontSize={16} fontWeight={500}>
                    {`Send${severity > 2 ? ' Anyway' : ''}`}
                  </Text>
                </ButtonError>
              </RowBetween>
            ) : (
              <ButtonError
                onClick={() => {
                  setShowConfirm(true)
                }}
                id="send-button"
                disabled={(sendingWithSwap && !isSwapValid) || (!sendingWithSwap && !isSendValid)}
                error={sendingWithSwap && isSwapValid && severity > 2}
              >
                <Text fontSize={20} fontWeight={500}>
                  {(sendingWithSwap ? swapError : null) ||
                    sendAmountError ||
                    recipientError ||
                    `Send${severity > 2 ? ' Anyway' : ''}`}
                </Text>
              </ButtonError>
            )}
            {betterTradeLinkVersion && <BetterTradeLink version={betterTradeLinkVersion} />}
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

      {priceImpactWithoutFee && severity > 2 && (
        <AutoColumn gap="lg" style={{ marginTop: '1rem' }}>
          <PriceSlippageWarningCard priceSlippage={priceImpactWithoutFee} />
        </AutoColumn>
      )}
    </>
  )
}
