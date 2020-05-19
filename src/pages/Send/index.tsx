import { JSBI, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useContext, useEffect, useState } from 'react'
import { ArrowDown } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonSecondary } from '../../components/Button'
import Card, { BlueCard, GreyCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import ConfirmationModal from '../../components/ConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import QuestionHelper from '../../components/Question'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import AdvancedSwapDetailsDropdown from '../../components/swap/AdvancedSwapDetailsDropdown'
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
import FormattedPriceImpact from '../../components/swap/FormattedPriceImpact'
import SwapModalFooter from '../../components/swap/SwapModalFooter'
import { ArrowWrapper, BottomGrouping, Dots, InputGroup, StyledNumerical, Wrapper } from '../../components/swap/styleds'
import TradePrice from '../../components/swap/TradePrice'
import { TransferModalHeader } from '../../components/swap/TransferModalHeader'
import V1TradeLink from '../../components/swap/V1TradeLink'
import TokenLogo from '../../components/TokenLogo'
import { TokenWarningCards } from '../../components/TokenWarningCard'
import { DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE, MIN_ETH } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useApproveCallbackFromTrade, Approval } from '../../hooks/useApproveCallback'
import { useSendCallback } from '../../hooks/useSendCallback'
import { useSwapCallback } from '../../hooks/useSwapCallback'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import { useDefaultsFromURL, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '../../state/swap/hooks'
import { useAllTokenBalancesTreatingWETHasETH } from '../../state/wallet/hooks'
import { CursorPointer, TYPE } from '../../theme'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown, warningServerity } from '../../utils/prices'

export default function Send({ location: { search } }: RouteComponentProps) {
  useDefaultsFromURL(search)

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
    parsedAmounts,
    bestTrade,
    tokenBalances,
    tokens,
    error: swapError,
    v1TradeLinkIfBetter
  } = useDerivedSwapInfo()
  const isSwapValid = !swapError && !recipientError && bestTrade

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
  const [approval, approveCallback] = useApproveCallbackFromTrade(bestTrade, allowedSlippage)

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

  const swapCallback = useSwapCallback(bestTrade, allowedSlippage, deadline, recipient)

  function onSwap() {
    if (priceImpactWithoutFee && !confirmPriceImpactWithoutFee(priceImpactWithoutFee)) {
      return
    }

    setAttemptingTxn(true)
    swapCallback().then(hash => {
      setTxHash(hash)
      setPendingConfirmation(false)

      ReactGA.event({
        category: 'Send',
        action: recipient === account ? 'Swap w/o Send' : 'Swap w/ Send',
        label: [bestTrade.inputAmount.token.symbol, bestTrade.outputAmount.token.symbol].join(';')
      })
    })
  }

  const sendCallback = useSendCallback(parsedAmounts?.[Field.INPUT], recipient)
  const isSendValid = sendCallback !== null && (sendingWithSwap === false || approval === Approval.APPROVED)

  async function onSend() {
    setAttemptingTxn(true)

    sendCallback()
      .then(hash => {
        setTxHash(hash)
        ReactGA.event({ category: 'Send', action: 'Send', label: tokens[Field.INPUT]?.symbol })
        setPendingConfirmation(false)
      })
      .catch(() => {
        resetModal()
        setShowConfirm(false)
      })
  }

  const [showInverted, setShowInverted] = useState<boolean>(false)

  // warnings on slippage
  const severity = !sendingWithSwap ? 0 : warningServerity(priceImpactWithoutFee)

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
    const hasBalance = allBalances?.[account]?.[address]?.greaterThan('0') ?? false
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
    <Wrapper id="send-page">
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
              onTokenSelection={address => onTokenSelection(Field.INPUT, address)}
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
              // eslint-disable-next-line @typescript-eslint/no-empty-function
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
          <Card padding={'.25rem 1.25rem 0 .75rem'} borderRadius={'20px'}>
            <AutoColumn gap="4px">
              <RowBetween align="center">
                <Text fontWeight={500} fontSize={14} color={theme.text2}>
                  Price
                </Text>
                <TradePrice showInverted={showInverted} setShowInverted={setShowInverted} trade={bestTrade} />
              </RowBetween>

              {bestTrade && severity > 1 && (
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
        ) : approval === Approval.NOT_APPROVED || approval === Approval.PENDING ? (
          <ButtonLight onClick={approveCallback} disabled={approval === Approval.PENDING}>
            {approval === Approval.PENDING ? (
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

      {sendingWithSwap ? <TokenWarningCards tokens={tokens} /> : null}
    </Wrapper>
  )
}
