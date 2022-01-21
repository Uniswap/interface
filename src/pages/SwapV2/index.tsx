import { CurrencyAmount, JSBI, Token } from '@dynamic-amm/sdk'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown, AlertTriangle } from 'react-feather'
import { Text, Flex, Box } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { RouteComponentProps } from 'react-router-dom'
import { t, Trans } from '@lingui/macro'
import { BrowserView } from 'react-device-detect'

import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonConfirmed } from '../../components/Button'
import Card, { GreyCard } from '../../components/Card'
import Column, { AutoColumn } from '../../components/Column'
import ConfirmSwapModal from '../../components/swapv2/ConfirmSwapModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { AutoRow, RowBetween } from '../../components/Row'
import AdvancedSwapDetailsDropdown from '../../components/swapv2/AdvancedSwapDetailsDropdown'
import {
  TabContainer,
  TabWrapper,
  Tab,
  ArrowWrapper,
  BottomGrouping,
  Dots,
  SwapCallbackError,
  SwapFormActions,
  Wrapper,
  KyberTag,
  PriceImpactHigh,
  LiveChartWrapper,
  RoutesWrapper,
  StyledFlex
} from '../../components/swapv2/styleds'
import TokenWarningModal from '../../components/TokenWarningModal'
import ProgressSteps from '../../components/ProgressSteps'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { INITIAL_ALLOWED_SLIPPAGE } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency, useAllTokens } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTradeV2 } from '../../hooks/useApproveCallback'
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback'
import { useWalletModalToggle, useToggleTransactionSettingsMenu } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import { useDefaultsFromURLSearch, useSwapActionHandlers, useSwapState } from '../../state/swap/hooks'
import { useDerivedSwapInfoV2 } from '../../state/swap/useAggregator'
import {
  useExpertModeManager,
  useUserSlippageTolerance,
  useShowLiveChart,
  useShowTradeRoutes
} from '../../state/user/hooks'
import { LinkStyledButton, TYPE } from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'
import { ClickableText } from '../Pool/styleds'
import Loader from '../../components/Loader'
import { Aggregator } from '../../utils/aggregator'
import { useSwapV2Callback } from '../../hooks/useSwapV2Callback'
import Routing from '../../components/swapv2/Routing'
import RefreshButton from '../../components/swapv2/RefreshButton'
import TradeTypeSelection from 'components/swapv2/TradeTypeSelection'
import { PageWrapper, Container } from 'components/swapv2/styleds'
// import useAggregatorVolume from 'hooks/useAggregatorVolume'
import { formattedNum } from 'utils'
import TransactionSettings from 'components/TransactionSettings'
import { Swap as SwapIcon } from 'components/Icons'
import TradePrice from 'components/swapv2/TradePrice'
import InfoHelper from 'components/InfoHelper'
import LiveChart from 'components/LiveChart'
import ShareModal from 'components/ShareModal'
import TokenInfo from 'components/swapv2/TokenInfo'
import MobileLiveChart from 'components/swapv2/MobileLiveChart'
import MobileTradeRoutes from 'components/swapv2/MobileTradeRoutes'

enum ACTIVE_TAB {
  SWAP,
  INFO
}

const AppBodyWrapped = styled(AppBody)`
  box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.04);
  z-index: 1;
  padding: 30px 24px;
  margin-top: 0;
  @media only screen and (min-width: 768px) {
    width: 404px;
  }
`

export default function Swap({ history }: RouteComponentProps) {
  const [rotate, setRotate] = useState(false)
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const isShowLiveChart = useShowLiveChart()
  const isShowTradeRoutes = useShowTradeRoutes()
  const [activeTab, setActiveTab] = useState<ACTIVE_TAB>(ACTIVE_TAB.SWAP)

  const loadedUrlParams = useDefaultsFromURLSearch()
  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId)
  ]

  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens()
  const importTokensNotInDefault =
    urlLoadedTokens &&
    urlLoadedTokens.filter((token: Token) => {
      return !Boolean(token.address in defaultTokens)
    })

  const { account } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // for expert mode
  const toggleSettings = useToggleTransactionSettingsMenu()
  const [isExpertMode] = useExpertModeManager()

  // get custom setting values for user
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()

  const {
    v2Trade,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    tradeComparer,
    onRefresh,
    loading: loadingAPI
  } = useDerivedSwapInfoV2()

  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(
    currencies[Field.INPUT],
    currencies[Field.OUTPUT],
    typedValue
  )
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = showWrap ? undefined : v2Trade

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount
      }

  const { onSwitchTokensV2, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()

  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback((): void => {
    // ...
  }, [])

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
    history.push('/swapv2/')
  }, [history])

  const handleRotateClick = useCallback(() => {
    setApprovalSubmitted(false) // reset 2 step UI for approvals
    setRotate(prev => !prev)
    onSwitchTokensV2()
  }, [])

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Aggregator | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined
  })

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? ''
  }

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )
  const noRoute = !trade?.swaps?.length

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTradeV2(trade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapV2Callback(trade, allowedSlippage, recipient)

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
    swapCallback()
      .then(hash => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
      })
      .catch(error => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined
        })
      })
  }, [tradeToConfirm, showConfirm, swapCallback])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED))

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

  const handleInputSelect = useCallback(
    inputCurrency => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleMaxInput = useCallback(() => {
    maxAmountInput && onUserInput(Field.INPUT, maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  const handleOutputSelect = useCallback(
    outputCurrency => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection]
  )

  const isLoading =
    loadingAPI ||
    ((!currencyBalances[Field.INPUT] || !currencyBalances[Field.OUTPUT]) && userHasSpecifiedInputOutput && !v2Trade)

  // const aggregatorVolume = useAggregatorVolume()

  return (
    <>
      <TokenWarningModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
        onDismiss={handleDismissTokenWarning}
      />
      <PageWrapper>
        <Container>
          <StyledFlex justifyContent={'center'} alignItems={'flex-start'}>
            <AppBodyWrapped>
              <RowBetween mb={'16px'}>
                <TabContainer>
                  <TabWrapper>
                    <Tab onClick={() => setActiveTab(ACTIVE_TAB.SWAP)} isActive={activeTab === ACTIVE_TAB.SWAP}>
                      <TYPE.black fontSize={18} fontWeight={500}>{t`Swap`}</TYPE.black>
                    </Tab>
                    <Tab onClick={() => setActiveTab(ACTIVE_TAB.INFO)} isActive={activeTab === ACTIVE_TAB.INFO}>
                      <TYPE.black fontSize={18} fontWeight={500}>{t`Info`}</TYPE.black>
                    </Tab>
                  </TabWrapper>
                </TabContainer>

                <SwapFormActions>
                  <RefreshButton isConfirming={showConfirm} trade={trade} onRefresh={onRefresh} />
                  <TransactionSettings tradeValid={!!trade} isShowDisplaySettings />
                  <ShareModal currencies={currencies} />
                </SwapFormActions>
              </RowBetween>

              {activeTab === ACTIVE_TAB.SWAP ? (
                <>
                  <Wrapper id="swap-page">
                    <ConfirmSwapModal
                      isOpen={showConfirm}
                      trade={trade}
                      originalTrade={tradeToConfirm}
                      onAcceptChanges={handleAcceptChanges}
                      attemptingTxn={attemptingTxn}
                      txHash={txHash}
                      recipient={recipient}
                      allowedSlippage={allowedSlippage}
                      onConfirm={handleSwap}
                      swapErrorMessage={swapErrorMessage}
                      onDismiss={handleConfirmDismiss}
                      tokenAddtoMetaMask={currencies[Field.OUTPUT]}
                    />

                    <Flex flexDirection="column" sx={{ gap: '0.675rem' }}>
                      <CurrencyInputPanel
                        label={independentField === Field.OUTPUT && !showWrap && trade ? t`From (estimated)` : t`From`}
                        value={formattedAmounts[Field.INPUT]}
                        positionMax="top"
                        showMaxButton
                        currency={currencies[Field.INPUT]}
                        onUserInput={handleTypeInput}
                        onMax={handleMaxInput}
                        onCurrencySelect={handleInputSelect}
                        otherCurrency={currencies[Field.OUTPUT]}
                        id="swap-currency-input"
                        showCommonBases={true}
                        estimatedUsd={trade?.amountInUsd ? `${formattedNum(trade.amountInUsd, true)}` : undefined}
                      />
                      <AutoColumn justify="space-between">
                        <AutoRow justify={isExpertMode ? 'space-between' : 'center'} style={{ padding: '0 1rem' }}>
                          <ArrowWrapper
                            clickable
                            rotated={rotate}
                            onClick={() => {
                              setApprovalSubmitted(false) // reset 2 step UI for approvals
                              setRotate(prev => !prev)
                              onSwitchTokensV2()
                            }}
                          >
                            <SwapIcon size={22} />
                          </ArrowWrapper>
                          {recipient === null && !showWrap && isExpertMode ? (
                            <LinkStyledButton id="add-recipient-button" onClick={() => onChangeRecipient('')}>
                              <Trans>+ Add Recipient (optional)</Trans>
                            </LinkStyledButton>
                          ) : null}
                        </AutoRow>
                      </AutoColumn>
                      <Box sx={{ position: 'relative' }}>
                        {tradeComparer?.tradeSaved?.usd && (
                          <KyberTag>
                            <Trans>You Save</Trans>{' '}
                            {formattedNum(tradeComparer.tradeSaved.usd, true) +
                              ` (${tradeComparer?.tradeSaved?.percent &&
                                (tradeComparer.tradeSaved.percent < 0.01
                                  ? '<0.01'
                                  : tradeComparer.tradeSaved.percent.toFixed(2))}%)`}
                            <InfoHelper
                              text={
                                <Text>
                                  <Trans>
                                    The amount you save compared to{' '}
                                    <Text as="span" color={theme.warning}>
                                      {tradeComparer.comparedDex.name}
                                    </Text>
                                    .
                                  </Trans>{' '}
                                  <Trans>
                                    <Text color={theme.primary} fontWeight={500} as="span">
                                      KyberSwap
                                    </Text>{' '}
                                    gets you the best token rates
                                  </Trans>
                                </Text>
                              }
                              size={14}
                              color={theme.primary}
                            />
                          </KyberTag>
                        )}

                        <CurrencyInputPanel
                          disabledInput
                          value={formattedAmounts[Field.OUTPUT]}
                          onUserInput={handleTypeOutput}
                          label={independentField === Field.INPUT && !showWrap && trade ? t`To (estimated)` : t`To`}
                          showMaxButton={false}
                          currency={currencies[Field.OUTPUT]}
                          onCurrencySelect={handleOutputSelect}
                          otherCurrency={currencies[Field.INPUT]}
                          id="swap-currency-output"
                          showCommonBases={true}
                          estimatedUsd={trade?.amountOutUsd ? `${formattedNum(trade.amountOutUsd, true)}` : undefined}
                        />
                      </Box>

                      {recipient !== null && !showWrap ? (
                        <>
                          <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                            <ArrowWrapper clickable={false}>
                              <ArrowDown size="16" color={theme.text} />
                            </ArrowWrapper>
                            <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                              <Trans>- Remove Recipient</Trans>
                            </LinkStyledButton>
                          </AutoRow>
                          <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                        </>
                      ) : null}

                      {showWrap ? null : (
                        <Card padding={'0 .75rem 0 .25rem'} borderRadius={'20px'}>
                          <AutoColumn gap="4px">
                            <TradePrice
                              price={trade?.executionPrice}
                              showInverted={showInverted}
                              setShowInverted={setShowInverted}
                            />

                            {allowedSlippage !== INITIAL_ALLOWED_SLIPPAGE && (
                              <Flex
                                alignItems="center"
                                fontSize={12}
                                color={theme.subText}
                                onClick={toggleSettings}
                                width="fit-content"
                              >
                                <ClickableText color={theme.subText} fontWeight={500}>
                                  <Trans>Max Slippage:</Trans>&nbsp;
                                  {allowedSlippage / 100}%
                                </ClickableText>
                              </Flex>
                            )}
                          </AutoColumn>
                        </Card>
                      )}
                    </Flex>

                    <TradeTypeSelection />

                    {trade?.priceImpact && trade.priceImpact > 5 && (
                      <PriceImpactHigh veryHigh={trade?.priceImpact > 15}>
                        <AlertTriangle
                          color={trade?.priceImpact > 15 ? theme.red : theme.warning}
                          size={16}
                          style={{ marginRight: '10px' }}
                        />
                        {trade?.priceImpact > 15 ? (
                          <>
                            <Trans>Price Impact is Very High</Trans>
                            <InfoHelper text="Turn on Advanced Mode for high slippage trades" color={theme.text} />
                          </>
                        ) : (
                          <Trans>Price Impact is High</Trans>
                        )}
                      </PriceImpactHigh>
                    )}

                    <BottomGrouping>
                      {!account ? (
                        <ButtonLight onClick={toggleWalletModal}>
                          <Trans>Connect Wallet</Trans>
                        </ButtonLight>
                      ) : isLoading ? (
                        <GreyCard style={{ textAlign: 'center', borderRadius: '5.5px' }}>
                          <TYPE.main mb="4px">
                            <Dots>
                              <Trans>Calculating best route</Trans>
                            </Dots>
                          </TYPE.main>
                        </GreyCard>
                      ) : showWrap ? (
                        <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
                          {wrapInputError ??
                            (wrapType === WrapType.WRAP ? 'Wrap' : wrapType === WrapType.UNWRAP ? 'Unwrap' : null)}
                        </ButtonPrimary>
                      ) : noRoute && userHasSpecifiedInputOutput ? (
                        <GreyCard style={{ textAlign: 'center', borderRadius: '5.5px' }}>
                          <TYPE.main>
                            <Trans>Insufficient liquidity for this trade.</Trans>
                          </TYPE.main>
                        </GreyCard>
                      ) : showApproveFlow ? (
                        <RowBetween>
                          <ButtonConfirmed
                            onClick={approveCallback}
                            disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                            width="48%"
                            altDisabledStyle={approval === ApprovalState.PENDING} // show solid button while waiting
                            confirmed={approval === ApprovalState.APPROVED}
                          >
                            {approval === ApprovalState.PENDING ? (
                              <AutoRow gap="6px" justify="center">
                                <Trans>Approving</Trans> <Loader stroke="white" />
                              </AutoRow>
                            ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                              t`Approved`
                            ) : (
                              t`Approve ${currencies[Field.INPUT]?.symbol}`
                            )}
                          </ButtonConfirmed>
                          <ButtonError
                            onClick={() => {
                              if (isExpertMode) {
                                handleSwap()
                              } else {
                                setSwapState({
                                  tradeToConfirm: trade,
                                  attemptingTxn: false,
                                  swapErrorMessage: undefined,
                                  showConfirm: true,
                                  txHash: undefined
                                })
                              }
                            }}
                            width="48%"
                            id="swap-button"
                            disabled={!isValid || approval !== ApprovalState.APPROVED}
                          >
                            <Text fontSize={16} fontWeight={500}>
                              {trade && trade.priceImpact > 5 ? t`Swap Anyway` : t`Swap`}
                            </Text>
                          </ButtonError>
                        </RowBetween>
                      ) : (
                        <ButtonError
                          onClick={() => {
                            if (isExpertMode) {
                              handleSwap()
                            } else {
                              setSwapState({
                                tradeToConfirm: trade,
                                attemptingTxn: false,
                                swapErrorMessage: undefined,
                                showConfirm: true,
                                txHash: undefined
                              })
                            }
                          }}
                          id="swap-button"
                          disabled={
                            !isValid ||
                            !!swapCallbackError ||
                            approval !== ApprovalState.APPROVED ||
                            (!isExpertMode && trade && trade.priceImpact > 15)
                          }
                          style={{
                            border: 'none',
                            ...(!(
                              !isValid ||
                              !!swapCallbackError ||
                              approval !== ApprovalState.APPROVED ||
                              (!isExpertMode && trade && trade.priceImpact > 15)
                            ) &&
                            trade &&
                            trade.priceImpact > 5
                              ? { background: theme.red, color: theme.white }
                              : {})
                          }}
                        >
                          <Text fontWeight={500}>
                            {swapInputError
                              ? swapInputError
                              : approval !== ApprovalState.APPROVED
                              ? t`Checking allowance...`
                              : trade && trade.priceImpact > 5
                              ? t`Swap Anyway`
                              : t`Swap`}
                          </Text>
                        </ButtonError>
                      )}
                      {showApproveFlow && (
                        <Column style={{ marginTop: '1rem' }}>
                          <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />
                        </Column>
                      )}
                      {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
                    </BottomGrouping>
                  </Wrapper>
                  <AdvancedSwapDetailsDropdown trade={trade} />
                </>
              ) : (
                <TokenInfo currencies={currencies} />
              )}
            </AppBodyWrapped>
            {(isShowLiveChart || isShowTradeRoutes) && (
              <BrowserView style={{ paddingTop: '30px' }}>
                {isShowLiveChart && (
                  <LiveChartWrapper>
                    <LiveChart onRotateClick={handleRotateClick} currencies={currencies} />
                  </LiveChartWrapper>
                )}
                {isShowTradeRoutes && (
                  <RoutesWrapper isOpenChart={isShowLiveChart}>
                    <Flex flexDirection="column" width="100%">
                      <RowBetween>
                        <Text fontSize={18} fontWeight={500} color={theme.subText}>
                          <Trans>Your trade route</Trans>
                        </Text>
                      </RowBetween>
                      <Routing
                        trade={trade}
                        currencies={currencies}
                        parsedAmounts={parsedAmounts}
                        maxHeight={!isShowLiveChart ? '700px' : '332px'}
                        backgroundColor={theme.buttonBlack}
                      />
                    </Flex>
                  </RoutesWrapper>
                )}
              </BrowserView>
            )}
          </StyledFlex>
          <SwitchLocaleLink />
        </Container>
      </PageWrapper>
      <MobileLiveChart handleRotateClick={handleRotateClick} currencies={currencies} />
      <MobileTradeRoutes trade={trade} parsedAmounts={parsedAmounts} currencies={currencies} />
    </>
  )
}
