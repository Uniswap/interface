import { JSBI, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useContext, useState } from 'react'
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
} from '../../components/swap/styleds'
import QuestionHelper from '../../components/Question'
import { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import { AdvancedSwapDetails } from '../../components/swap/AdvancedSwapDetails'
import FormattedPriceImpact from '../../components/swap/FormattedPriceImpact'
import PriceBar, { warningServerity } from '../../components/swap/PriceBar'
import { PriceSlippageWarningCard } from '../../components/swap/PriceSlippageWarningCard'
import TokenLogo from '../../components/TokenLogo'
import { DEFAULT_DEADLINE_FROM_NOW, INITIAL_ALLOWED_SLIPPAGE, MIN_ETH, V1_TRADE_LINK_THRESHOLD } from '../../constants'
import { useV1TradeLinkIfBetter } from '../../data/V1'
import { useWeb3React } from '../../hooks'
import { useUserAdvanced, useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import {
  useApproveCallback,
  useDefaultsFromURL,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapCallback,
  useSwapState
} from '../../state/swap/hooks'
import { useHasPendingApproval } from '../../state/transactions/hooks'
import { CursorPointer, TYPE } from '../../theme'
import { Link } from '../../theme'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown } from '../../util/prices'

export default function Swap({ history, location: { search } }: RouteComponentProps) {
  useDefaultsFromURL(search)
  // text translation
  // const { t } = useTranslation()
  const { chainId, account } = useWeb3React()
  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  const { independentField, typedValue } = useSwapState()
  const { bestTrade, tokenBalances, parsedAmounts, tokens, error } = useDerivedSwapInfo()
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
  const doApprove = useApproveCallback(bestTrade, allowedSlippage)
  const userHasApprovedRouter = !doApprove
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
        label: 'Swap w/o Send',
        action: [bestTrade.inputAmount.token.symbol, bestTrade.outputAmount.token.symbol].join(';')
      })
    })
  }

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const advanced = useUserAdvanced()

  const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(bestTrade)

  // warnings on slippage
  const priceImpactSeverity = warningServerity(priceImpactWithoutFee)

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
          <TruncatedText fontSize={24} fontWeight={500} color={priceImpactSeverity > 2 ? theme.red1 : ''}>
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
            error={priceImpactSeverity > 2}
            style={{ margin: '10px 0 0 0' }}
            id="confirm-swap"
          >
            <Text fontSize={20} fontWeight={500}>
              {priceImpactSeverity > 2 ? 'Swap Anyway' : 'Confirm Swap'}
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
        ) : !userHasApprovedRouter ? (
          <ButtonLight onClick={doApprove} disabled={pendingApprovalInput}>
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
            error={priceImpactSeverity > 2}
          >
            <Text fontSize={20} fontWeight={500}>
              {error ?? `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`}
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
              <RowBetween onClick={() => setShowAdvanced(true)} padding={'8px 20px'} id="show-advanced">
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
              {priceImpactSeverity > 2 && <PriceSlippageWarningCard priceSlippage={priceImpactWithoutFee} />}
            </AutoColumn>
          </FixedBottom>
        </AdvancedDropwdown>
      )}
    </Wrapper>
  )
}
