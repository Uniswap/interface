import { Switch } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Trade as V3Trade } from '@uniswap/v3-sdk'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import PositionList from 'components/PositionList'
import { AdvancedSwapDetails } from 'components/swap/AdvancedSwapDetails'
import { AutoRouterLogo } from 'components/swap/RouterLabel'
import SwapRoute from 'components/swap/SwapRoute'
import TradePrice from 'components/swap/TradePrice'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { MouseoverTooltip, MouseoverTooltipContent } from 'components/Tooltip'
import { KROM } from 'constants/tokens'
import { useV3Positions } from 'hooks/useV3Positions'
import JSBI from 'jsbi'
import { constantToCode } from 'multicodec/src/maps'
import { LoadingRows } from 'pages/Pool/styleds'
import React from 'react'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown, CheckCircle, HelpCircle, Inbox, Info, X } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { isTransactionRecent, useAllTransactions } from 'state/transactions/hooks'
import { TransactionDetails } from 'state/transactions/reducer'
import { useDarkModeManager, useUserHideClosedPositions } from 'state/user/hooks'
import { V3TradeState } from 'state/validator/types'
import styled, { ThemeContext } from 'styled-components/macro'
import { PositionDetails } from 'types/position'
import { IUniswapV3Factory } from 'types/v3'
import computeSurroundingTicks from 'utils/computeSurroundingTicks'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { GreyCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import CurrencyLogo from '../../components/CurrencyLogo'
import Loader from '../../components/Loader'
import { Input as NumericalInput } from '../../components/NumericalInput'
import Row, { AutoRow, RowFixed } from '../../components/Row'
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal'
import {
  ArrowWrapper,
  Dots,
  ResponsiveTooltipContainer,
  SwapCallbackError,
  Wrapper,
} from '../../components/swap/styleds'
import SwapHeader from '../../components/swap/SwapHeader'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import TokenWarningModal from '../../components/TokenWarningModal'
import { useAllTokens, useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback'
import useENSAddress from '../../hooks/useENSAddress'
import { useERC20PermitFromTrade, UseERC20PermitState } from '../../hooks/useERC20Permit'
import useIsArgentWallet from '../../hooks/useIsArgentWallet'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import { useSwapCallback } from '../../hooks/useSwapCallback'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback'
import { useActiveWeb3React } from '../../hooks/web3'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  usePoolAddress,
  useSwapActionHandlers,
  useSwapState,
} from '../../state/swap/hooks'
import { useExpertModeManager } from '../../state/user/hooks'
import { useNetworkGasPrice } from '../../state/user/hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { LinkStyledButton, TYPE } from '../../theme'
import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
import { getTradeVersion } from '../../utils/getTradeVersion'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'
import AppBodyNoPro from '../AppBodyNoPro'
import { CandleSticks, MemoizedCandleSticks } from './CandleSticks'

const NoLiquidity = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  max-width: 300px;
  min-height: 25vh;
`

const StyledSwap = styled.div`
  flex-grow: 1;
  max-width: 100%;
  width: 100%;

  @media screen and (max-width: 1592px) {
    flex: 0 0 480px;
  }
`

const StyledSwapNoPro = styled.div`
  flex-grow: 1;
  max-width: 480px;
  width: 100%;

  @media screen and (max-width: 1592px) {
    width: 50%;
  }
  flex-direction: row-reverse;

  @media screen and (max-width: 900px) {
    width: 95%;
  }
`

const DivWrapper = styled.div`
  margin-top: 25px;
  max-height: 100%;
`

const DivWrapperNoPro = styled.div`
  max-height: 100%;
  margin-top: 160px;
  width: 75%;
  gap: 1.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-direction: row;

  @media screen and (max-width: 1000px) {
    width: 100%;
    justify-content: flex-start;
    align-items: center;
    jusify-content: flex-start;
    flex-direction: column-reverse;
  }

  @media screen and (max-width: 1440px) {
    width: 90%;
  }

  @media screen and (max-width: 1000px) {
    margin-top: 30px;
  }
`

const MainContentWrapper = styled.main`
  background-color: ${({ theme }) => theme.bg0};
  padding: 8px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  width: 100%;
  margin-top: 0.5rem;
  overflow: auto;
  height: 100%;
  max-height: 100%;
  flex-grow: 0;
  overflow-x: hidden;

  @media screen and (max-width: 1592px) {
    gap: 0rem;
    height: 530px;
    margin-top: 0rem;
    flex: 1;
  }

  @media screen and (max-width: 900px) {
    margin-bottom: 80px;
  }

  /* width */
  ::-webkit-scrollbar {
    width: 10px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 5px grey;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: grey;
    border-radius: 10px;
  }
`

const MainContentWrapperNoPro = styled.div`
  width: 100%;
  max-width: 800px;
  overflow: auto;
  max-height: 532px;
  overflow-x: hidden;
  padding: 15px;

  background-color: ${({ theme }) => theme.bg0};
  border-radius: 20px;

  @media screen and (max-width: 1000px) {
    width: 100%;
    max-width: 100%;
  }

  /* width */
  ::-webkit-scrollbar {
    width: 10px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 5px grey;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: grey;
    border-radius: 10px;
  }
`

const ButtonStyle = styled.div`
  margin-top: 0px;
`

const StyledNoProDiv = styled.div`
  overflow-y: auto;
  @media screen and (max-width: 1000px) {
    width: 100%;
  }
`

const StyledInfo = styled(Info)`
  height: 16px;
  width: 16px;
  margin-left: 4px;
  color: ${({ theme }) => theme.text3};
  :hover {
    color: ${({ theme }) => theme.text1};
  }
`

export const StyledInput = styled(NumericalInput)`
  background-color: ${({ theme }) => theme.bg0};
  text-align: left;
  font-size: 18px;
  width: 100%;
`

export const FlexContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  align-content: stretch;
  margin-top: 20px;
  gap: 0.2rem;
  width: 100%;
  min-height: 94vh;
  border: none;

  @media screen and (max-width: 1600px) {
    flex-direction: column;
    width: 95%;
  }
`

export const FlexItemLeft = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  flex: 1;

  @media screen and (max-width: 1592px) {
    flex-direction: row;
    gap: 1rem;
  }

  @media screen and (max-width: 900px) {
    width: 95%;
    margin-left: 10px;
  }
`

export const FlexItemRight = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 500px; //todo

  @media screen and (max-width: 1592px) {
    flex-direction: row-reverse;
    gap: 0.5rem;
    width: 100%;
  }

  @media screen and (max-width: 900px) {
    flex-direction: column;
    width: 95%;
    margin-left: 10px;
  }
`

const LimitOrderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 50%;

  @media screen and (max-width: 1000px) {
    width: 100%;
    max-width: 100%;
  }

  /* width */
  ::-webkit-scrollbar {
    width: 10px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 5px grey;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: grey;
    border-radius: 10px;
  }
`

// we want the latest one to come first, so return negative if a is after b
function newTransactionsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

export default function LimitOrder({ history }: RouteComponentProps) {
  const { account, chainId } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const [expertMode, toggleExpertMode] = useExpertModeManager()

  const theme = useContext(ThemeContext)
  const [userHideClosedPositions, setUserHideClosedPositions] = useUserHideClosedPositions()

  const { positions, loading: positionsLoading, fundingBalance, minBalance, gasPrice } = useV3Positions(account)

  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.processed ? 1 : 0].push(p)
      return acc
    },
    [[], []]
  ) ?? [[], []]

  const filteredPositions = [...openPositions, ...(userHideClosedPositions ? [] : closedPositions)]
  const showConnectAWallet = Boolean(!account)

  const loadedUrlParams = useDefaultsFromURLSearch()

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ]
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c?.isToken ?? false) ?? [],
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

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const {
    v3Trade: { state: v3TradeState },
    bestTrade: trade,
    serviceFee,
    currencyBalances,
    price,
    minPrice,
    currencies,
    parsedAmounts,
    formattedAmounts,
    inputError: swapInputError,
  } = useDerivedSwapInfo()

  const fee = trade?.route.pools[0].fee

  const aToken = currencies && currencies[Field.INPUT] ? currencies[Field.INPUT] : undefined
  const bToken = currencies && currencies[Field.OUTPUT] ? currencies[Field.OUTPUT] : undefined

  const { poolAddress, networkName } = usePoolAddress(aToken, bToken, fee)

  const gasAmount = useNetworkGasPrice()

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const { address: recipientAddress } = useENSAddress(recipient)

  const [routeNotFound, routeIsLoading, routeIsSyncing] = useMemo(
    () => [
      trade instanceof V3Trade ? !trade?.swaps : undefined,
      V3TradeState.LOADING === v3TradeState,
      V3TradeState.SYNCING === v3TradeState,
    ],
    [trade, v3TradeState]
  )

  const fiatValueInput = useUSDCValue(parsedAmounts.input)
  const fiatValueOutput = useUSDCValue(parsedAmounts.output)
  const priceImpact = routeIsSyncing ? undefined : computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput)

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const isValid = !swapInputError

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )
  const handleTypePrice = useCallback(
    (value: string) => {
      onUserInput(Field.PRICE, value)
    },
    [onUserInput]
  )

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
    history.push('/limitorder/')
  }, [history])

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: V3Trade<Currency, Currency, TradeType> | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] &&
      currencies[Field.OUTPUT] &&
      (independentField === Field.INPUT || independentField === Field.OUTPUT)
  )

  // check whether the user has approved the router on the input token
  const [approvalState, approveCallback] = useApproveCallbackFromTrade(trade, undefined, undefined)
  const {
    state: signatureState,
    signatureData,
    gatherPermitSignature,
  } = useERC20PermitFromTrade(trade, undefined, false)

  const handleApprove = useCallback(async () => {
    if (signatureState === UseERC20PermitState.NOT_SIGNED && gatherPermitSignature) {
      try {
        await gatherPermitSignature()
      } catch (error) {
        // try to approve if gatherPermitSignature failed for any reason other than the user rejecting it
        if (error?.code !== 4001) {
          await approveCallback()
        }
      }
    } else {
      await approveCallback()

      ReactGA.event({
        category: 'Trade',
        action: 'Approve',
        label: [trade?.inputAmount.currency.symbol].join('/'),
      })
    }
  }, [approveCallback, gatherPermitSignature, signatureState, trade?.inputAmount.currency.symbol])

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts.input?.equalTo(maxInputAmount))

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade,
    gasAmount,
    recipient,
    signatureData,
    parsedAmounts.input,
    price,
    serviceFee
  )

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
    swapCallback()
      .then((hash) => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
        ReactGA.event({
          category: 'Trade',
          action:
            recipient === null
              ? 'Trade w/o Send'
              : (recipientAddress ?? recipient) === account
              ? 'Trade w/o Send + recipient'
              : 'Trade w/ Send',
          label: [
            trade?.inputAmount?.currency?.symbol,
            trade?.outputAmount?.currency?.symbol,
            getTradeVersion(trade),
            'MH',
          ].join('/'),
        })
      })
      .catch((error) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      })
  }, [swapCallback, tradeToConfirm, showConfirm, recipient, recipientAddress, account, trade])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(true)

  const isArgentWallet = useIsArgentWallet()

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !isArgentWallet &&
    !swapInputError &&
    (approvalState === ApprovalState.NOT_APPROVED ||
      approvalState === ApprovalState.PENDING ||
      (approvalSubmitted && approvalState === ApprovalState.APPROVED))

  const handleConfirmDismiss = useCallback(() => {
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      history.push('/limitorder/')
    }
  }, [attemptingTxn, history, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false)
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact())
  }, [maxInputAmount, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection]
  )
  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  if (expertMode) {
    return (
      <>
        <FlexContainer>
          <FlexItemLeft>
            <MemoizedCandleSticks networkName={networkName} poolAddress={poolAddress} />
          </FlexItemLeft>
          <FlexItemRight>
            <StyledSwap>
              <TokenWarningModal
                isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
                tokens={importTokensNotInDefault}
                onConfirm={handleConfirmTokenWarning}
                onDismiss={handleDismissTokenWarning}
              />
              <AppBody>
                <SwapHeader />
                <Wrapper id="swap-page">
                  <ConfirmSwapModal
                    isOpen={showConfirm}
                    trade={trade}
                    originalTrade={tradeToConfirm}
                    onAcceptChanges={handleAcceptChanges}
                    attemptingTxn={attemptingTxn}
                    txHash={txHash}
                    recipient={recipient}
                    serviceFee={serviceFee}
                    priceAmount={price}
                    onConfirm={handleSwap}
                    swapErrorMessage={swapErrorMessage}
                    onDismiss={handleConfirmDismiss}
                    inputAmount={parsedAmounts.input}
                    outputAmount={parsedAmounts.output}
                  />

                  <AutoColumn gap={'md'}>
                    <div style={{ display: 'relative' }}>
                      <CurrencyInputPanel
                        label={
                          independentField === Field.OUTPUT && !showWrap ? (
                            <Trans>From (at most)</Trans>
                          ) : (
                            <Trans>From</Trans>
                          )
                        }
                        value={formattedAmounts.input}
                        showMaxButton={showMaxButton}
                        currency={currencies[Field.INPUT]}
                        onUserInput={handleTypeInput}
                        onMax={handleMaxInput}
                        fiatValue={fiatValueInput ?? undefined}
                        onCurrencySelect={handleInputSelect}
                        otherCurrency={currencies[Field.OUTPUT]}
                        showCommonBases={true}
                        id="swap-currency-input"
                        loading={independentField === Field.OUTPUT && routeIsSyncing}
                      />

                      <ArrowWrapper clickable={false}>
                        <X size="16" />
                      </ArrowWrapper>

                      <CurrencyInputPanel
                        value={formattedAmounts.price}
                        onUserInput={handleTypePrice}
                        label={<Trans>Target Price</Trans>}
                        showMaxButton={false}
                        hideBalance={true}
                        currency={currencies[Field.OUTPUT] ?? null}
                        otherCurrency={currencies[Field.INPUT]}
                        id="target-price"
                        showCommonBases={false}
                        locked={false}
                        showCurrencySelector={false}
                        showRate={true}
                        isInvertedRate={false}
                        price={price}
                        loading={independentField === Field.INPUT && routeIsSyncing}
                      />

                      <ArrowWrapper clickable>
                        <ArrowDown
                          size="16"
                          onClick={() => {
                            setApprovalSubmitted(false) // reset 2 step UI for approvals
                            onSwitchTokens()
                          }}
                          color={currencies[Field.INPUT] && currencies[Field.OUTPUT] ? theme.text1 : theme.text3}
                        />
                      </ArrowWrapper>

                      <CurrencyInputPanel
                        value={formattedAmounts.output}
                        onUserInput={handleTypeOutput}
                        label={
                          independentField === Field.INPUT && !showWrap ? (
                            <Trans>To (at least)</Trans>
                          ) : (
                            <Trans>To</Trans>
                          )
                        }
                        showMaxButton={false}
                        hideBalance={false}
                        fiatValue={fiatValueOutput ?? undefined}
                        priceImpact={priceImpact}
                        currency={currencies[Field.OUTPUT]}
                        onCurrencySelect={handleOutputSelect}
                        otherCurrency={currencies[Field.INPUT]}
                        showCommonBases={true}
                        id="swap-currency-output"
                        loading={independentField === Field.INPUT && routeIsSyncing}
                      />
                    </div>

                    {recipient !== null && !showWrap ? (
                      <>
                        <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                          <ArrowWrapper clickable={false}>
                            <ArrowDown size="16" color={theme.text2} />
                          </ArrowWrapper>
                          <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                            <Trans>- Remove recipient</Trans>
                          </LinkStyledButton>
                        </AutoRow>
                        <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                      </>
                    ) : null}
                    {!showWrap && trade && minPrice && (
                      <>
                        <Row justify={!trade ? 'center' : 'space-between'}>
                          <RowFixed style={{ position: 'relative' }}>
                            <MouseoverTooltipContent
                              wrap={false}
                              content={
                                <ResponsiveTooltipContainer>
                                  <SwapRoute trade={trade} syncing={routeIsSyncing} />
                                </ResponsiveTooltipContainer>
                              }
                              placement="bottom"
                              onOpen={() =>
                                ReactGA.event({
                                  category: 'Swap',
                                  action: 'Router Tooltip Open',
                                })
                              }
                            >
                              <AutoRow gap="4px" width="auto">
                                <AutoRouterLogo />
                                <LoadingOpacityContainer $loading={routeIsSyncing}>
                                  {trade instanceof V3Trade && trade.swaps.length > 1 && (
                                    <TYPE.blue fontSize={14}>{trade.swaps.length} routes</TYPE.blue>
                                  )}
                                </LoadingOpacityContainer>
                              </AutoRow>
                            </MouseoverTooltipContent>
                          </RowFixed>
                          <RowFixed style={{ position: 'relative' }}>
                            <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
                              <Trans>Current Price</Trans>
                            </TYPE.body>
                          </RowFixed>
                          <RowFixed>
                            <LoadingOpacityContainer $loading={routeIsSyncing}>
                              <TradePrice
                                price={trade.route.midPrice}
                                showInverted={showInverted}
                                setShowInverted={setShowInverted}
                              />
                            </LoadingOpacityContainer>
                          </RowFixed>
                        </Row>
                        <Row justify={!trade ? 'center' : 'space-between'}>
                          <RowFixed style={{ position: 'relative' }}>
                            {' '}
                            <MouseoverTooltipContent
                              wrap={false}
                              content={
                                <ResponsiveTooltipContainer origin="top right" width={'295px'}>
                                  <AdvancedSwapDetails
                                    trade={trade}
                                    serviceFee={serviceFee}
                                    priceAmount={price}
                                    outputAmount={parsedAmounts.output}
                                    syncing={routeIsSyncing}
                                  />
                                </ResponsiveTooltipContainer>
                              }
                              placement="bottom"
                              onOpen={() =>
                                ReactGA.event({
                                  category: 'Trade',
                                  action: 'Transaction Details Tooltip Open',
                                })
                              }
                            >
                              <StyledInfo />
                            </MouseoverTooltipContent>
                          </RowFixed>
                          <RowFixed style={{ position: 'relative' }}>
                            <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
                              <Trans>Min Price</Trans>
                            </TYPE.body>
                          </RowFixed>
                          <RowFixed>
                            <LoadingOpacityContainer $loading={routeIsSyncing}>
                              <TradePrice
                                price={minPrice}
                                showInverted={showInverted}
                                setShowInverted={setShowInverted}
                              />
                            </LoadingOpacityContainer>
                          </RowFixed>
                        </Row>
                      </>
                    )}
                    {!trade && !minPrice && (
                      <>
                        <Row justify={'end'} style={{ height: '24px' }}>
                          <RowFixed style={{ position: 'relative' }}></RowFixed>
                          <RowFixed style={{ position: 'relative' }}>
                            <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
                              <Trans>Current Price: 0</Trans>
                            </TYPE.body>
                          </RowFixed>
                        </Row>
                        <Row justify={'end'} style={{ height: '24px' }}>
                          <RowFixed style={{ position: 'relative' }}></RowFixed>
                          <RowFixed style={{ position: 'relative' }}>
                            <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
                              <Trans>Min Price: 0</Trans>
                            </TYPE.body>
                          </RowFixed>
                        </Row>
                      </>
                    )}

                    <ButtonStyle>
                      {swapIsUnsupported ? (
                        <ButtonPrimary disabled={true}>
                          <TYPE.main mb="4px">
                            <Trans>Unsupported Asset</Trans>
                          </TYPE.main>
                        </ButtonPrimary>
                      ) : !account ? (
                        <ButtonLight onClick={toggleWalletModal}>
                          <Trans>Connect Wallet</Trans>
                        </ButtonLight>
                      ) : showWrap ? (
                        <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
                          {wrapInputError ??
                            (wrapType === WrapType.WRAP ? (
                              <Trans>Wrap</Trans>
                            ) : wrapType === WrapType.UNWRAP ? (
                              <Trans>Unwrap</Trans>
                            ) : null)}
                        </ButtonPrimary>
                      ) : routeIsSyncing || routeIsLoading ? (
                        <GreyCard style={{ textAlign: 'center' }}>
                          <TYPE.main mb="4px">
                            <Dots>
                              <Trans>Loading</Trans>
                            </Dots>
                          </TYPE.main>
                        </GreyCard>
                      ) : routeNotFound && userHasSpecifiedInputOutput ? (
                        <GreyCard style={{ textAlign: 'center' }}>
                          <TYPE.main mb="4px">
                            <Trans>Insufficient liquidity for this trade.</Trans>
                          </TYPE.main>
                        </GreyCard>
                      ) : showApproveFlow && chainId !== 137 ? (
                        <AutoRow style={{ flexWrap: 'nowrap', width: '100%' }}>
                          <AutoColumn style={{ width: '100%' }} gap="12px">
                            <ButtonConfirmed
                              onClick={handleApprove}
                              disabled={
                                approvalState !== ApprovalState.NOT_APPROVED ||
                                approvalSubmitted ||
                                signatureState === UseERC20PermitState.SIGNED
                              }
                              width="100%"
                              altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
                              confirmed={
                                approvalState === ApprovalState.APPROVED ||
                                signatureState === UseERC20PermitState.SIGNED
                              }
                            >
                              <AutoRow justify="space-between" style={{ flexWrap: 'nowrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                  <CurrencyLogo
                                    currency={currencies[Field.INPUT]}
                                    size={'20px'}
                                    style={{ marginRight: '8px', flexShrink: 0 }}
                                  />
                                  {/* we need to shorten this string on mobile */}
                                  {approvalState === ApprovalState.APPROVED ||
                                  signatureState === UseERC20PermitState.SIGNED ? (
                                    <Trans>You can now trade {currencies[Field.INPUT]?.symbol}</Trans>
                                  ) : (
                                    <Trans>Allow Kromatika to use your {currencies[Field.INPUT]?.symbol}</Trans>
                                  )}
                                </span>
                                {approvalState === ApprovalState.PENDING ? (
                                  <Loader stroke="white" />
                                ) : (approvalSubmitted && approvalState === ApprovalState.APPROVED) ||
                                  signatureState === UseERC20PermitState.SIGNED ? (
                                  <CheckCircle size="20" color={theme.green1} />
                                ) : (
                                  <MouseoverTooltip
                                    text={
                                      <Trans>
                                        You must give the Kromatika smart contracts permission to use your{' '}
                                        {currencies[Field.INPUT]?.symbol}. You only have to do this once per token.
                                      </Trans>
                                    }
                                  >
                                    <HelpCircle size="20" color={'white'} style={{ marginLeft: '8px' }} />
                                  </MouseoverTooltip>
                                )}
                              </AutoRow>
                            </ButtonConfirmed>            
                            <ButtonError
                              onClick={() => {
                                setSwapState({
                                  tradeToConfirm: trade,
                                  attemptingTxn: false,
                                  swapErrorMessage: undefined,
                                  showConfirm: true,
                                  txHash: undefined,
                                })
                              }}
                              width="100%"
                              id="swap-button"
                              disabled={
                                chainId === 137 ||
                                !isValid ||
                                !approvalState ||
                                (approvalState !== ApprovalState.APPROVED &&
                                  signatureState !== UseERC20PermitState.SIGNED)
                              }
                              error={isValid}
                            >
                              <Text fontSize={16} fontWeight={500}>
                                {<Trans>Trade</Trans>}
                              </Text>
                            </ButtonError>
                          </AutoColumn>
                        </AutoRow>
                      ) : (
                        <ButtonError
                          onClick={() => {
                            setSwapState({
                              tradeToConfirm: trade,
                              attemptingTxn: false,
                              swapErrorMessage: undefined,
                              showConfirm: true,
                              txHash: undefined,
                            })
                          }}
                          id="swap-button"
                          disabled={!isValid || !!swapCallbackError || chainId === 137}
                          error={isValid && !swapCallbackError}
                        >
                          <Text fontSize={20} fontWeight={500}>
                            {swapInputError ? swapInputError : <Trans>Trade</Trans>}
                          </Text>
                        </ButtonError>
                      )}
                      {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
                    </ButtonStyle>
                  </AutoColumn>
                </Wrapper>
              </AppBody>
              <SwitchLocaleLink />
              {!swapIsUnsupported ? null : (
                <UnsupportedCurrencyFooter
                  show={swapIsUnsupported}
                  currencies={[currencies[Field.INPUT], currencies[Field.OUTPUT]]}
                />
              )}
            </StyledSwap>
            <MainContentWrapper>
              {positionsLoading ? (
                <LoadingRows>
                  <div />
                  <div />
                  <div />
                  <div />
                  <div />
                  <div />
                  <div />
                  <div />
                  <div />
                  <div />
                  <div />
                  <div />
                </LoadingRows>
              ) : filteredPositions && filteredPositions.length > 0 ? (
                <PositionList positions={filteredPositions} fundingBalance={fundingBalance} minBalance={minBalance} />
              ) : (
                <NoLiquidity>
                  <TYPE.body color={theme.text3} textAlign="center">
                    <Inbox size={48} strokeWidth={1} style={{ marginBottom: '.5rem' }} />
                    <div>
                      <Trans>Your limit orders will appear here.</Trans>
                    </div>
                  </TYPE.body>
                  {showConnectAWallet && (
                    <ButtonPrimary style={{ marginTop: '2em', padding: '8px 16px' }} onClick={toggleWalletModal}>
                      <Trans>Connect a wallet</Trans>
                    </ButtonPrimary>
                  )}
                </NoLiquidity>
              )}
            </MainContentWrapper>
          </FlexItemRight>
        </FlexContainer>
      </>
    )
  }

  return (
    <DivWrapperNoPro>
      <TokenWarningModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
        onDismiss={handleDismissTokenWarning}
      />
      <LimitOrderContainer>
        <MainContentWrapperNoPro>
          {positionsLoading ? (
            <LoadingRows>
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
            </LoadingRows>
          ) : filteredPositions && filteredPositions.length > 0 ? (
            <PositionList positions={filteredPositions} fundingBalance={fundingBalance} minBalance={minBalance} />
          ) : (
            <NoLiquidity>
              <TYPE.body color={theme.text3} textAlign="center">
                <Inbox size={48} strokeWidth={1} style={{ marginBottom: '.5rem' }} />
                <div>
                  <Trans>Your limit orders will appear here.</Trans>
                </div>
              </TYPE.body>
              {showConnectAWallet && (
                <ButtonPrimary style={{ marginTop: '2em', padding: '8px 16px' }} onClick={toggleWalletModal}>
                  <Trans>Connect a wallet</Trans>
                </ButtonPrimary>
              )}
            </NoLiquidity>
          )}
        </MainContentWrapperNoPro>
        <SwitchLocaleLink />
      </LimitOrderContainer>

      <AppBodyNoPro>
        <StyledNoProDiv>
          <SwapHeader />
          <Wrapper id="swap-page">
            <ConfirmSwapModal
              isOpen={showConfirm}
              trade={trade}
              originalTrade={tradeToConfirm}
              onAcceptChanges={handleAcceptChanges}
              attemptingTxn={attemptingTxn}
              txHash={txHash}
              recipient={recipient}
              serviceFee={serviceFee}
              priceAmount={price}
              onConfirm={handleSwap}
              swapErrorMessage={swapErrorMessage}
              onDismiss={handleConfirmDismiss}
              inputAmount={parsedAmounts.input}
              outputAmount={parsedAmounts.output}
            />

            <AutoColumn gap={'md'}>
              <div style={{ display: 'relative' }}>
                <CurrencyInputPanel
                  label={
                    independentField === Field.OUTPUT && !showWrap ? <Trans>From (at most)</Trans> : <Trans>From</Trans>
                  }
                  value={formattedAmounts.input}
                  showMaxButton={showMaxButton}
                  currency={currencies[Field.INPUT]}
                  onUserInput={handleTypeInput}
                  onMax={handleMaxInput}
                  fiatValue={fiatValueInput ?? undefined}
                  onCurrencySelect={handleInputSelect}
                  otherCurrency={currencies[Field.OUTPUT]}
                  showCommonBases={true}
                  id="swap-currency-input"
                  loading={independentField === Field.OUTPUT && routeIsSyncing}
                />

                <ArrowWrapper clickable={false}>
                  <X size="16" />
                </ArrowWrapper>

                <CurrencyInputPanel
                  value={formattedAmounts.price}
                  onUserInput={handleTypePrice}
                  label={<Trans>Target Price</Trans>}
                  showMaxButton={false}
                  hideBalance={true}
                  currency={currencies[Field.OUTPUT] ?? null}
                  otherCurrency={currencies[Field.INPUT]}
                  id="target-price"
                  showCommonBases={false}
                  locked={false}
                  showCurrencySelector={false}
                  showRate={true}
                  isInvertedRate={false}
                  price={price}
                  loading={independentField === Field.INPUT && routeIsSyncing}
                />

                <ArrowWrapper clickable>
                  <ArrowDown
                    size="16"
                    onClick={() => {
                      setApprovalSubmitted(false) // reset 2 step UI for approvals
                      onSwitchTokens()
                    }}
                    color={currencies[Field.INPUT] && currencies[Field.OUTPUT] ? theme.text1 : theme.text3}
                  />
                </ArrowWrapper>

                <CurrencyInputPanel
                  value={formattedAmounts.output}
                  onUserInput={handleTypeOutput}
                  label={
                    independentField === Field.INPUT && !showWrap ? <Trans>To (at least)</Trans> : <Trans>To</Trans>
                  }
                  showMaxButton={false}
                  hideBalance={false}
                  fiatValue={fiatValueOutput ?? undefined}
                  priceImpact={priceImpact}
                  currency={currencies[Field.OUTPUT]}
                  onCurrencySelect={handleOutputSelect}
                  otherCurrency={currencies[Field.INPUT]}
                  showCommonBases={true}
                  id="swap-currency-output"
                  loading={independentField === Field.INPUT && routeIsSyncing}
                />
              </div>

              {recipient !== null && !showWrap ? (
                <>
                  <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                    <ArrowWrapper clickable={false}>
                      <ArrowDown size="16" color={theme.text2} />
                    </ArrowWrapper>
                    <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                      <Trans>- Remove recipient</Trans>
                    </LinkStyledButton>
                  </AutoRow>
                  <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                </>
              ) : null}
              {!showWrap && trade && minPrice && (
                <>
                  <Row justify={!trade ? 'center' : 'space-between'}>
                    <RowFixed style={{ position: 'relative' }}>
                      <MouseoverTooltipContent
                        wrap={false}
                        content={
                          <ResponsiveTooltipContainer>
                            <SwapRoute trade={trade} syncing={routeIsSyncing} />
                          </ResponsiveTooltipContainer>
                        }
                        placement="bottom"
                        onOpen={() =>
                          ReactGA.event({
                            category: 'Swap',
                            action: 'Router Tooltip Open',
                          })
                        }
                      >
                        <AutoRow gap="4px" width="auto">
                          <AutoRouterLogo />
                          <LoadingOpacityContainer $loading={routeIsSyncing}>
                            {trade instanceof V3Trade && trade.swaps.length > 1 && (
                              <TYPE.blue fontSize={14}>{trade.swaps.length} routes</TYPE.blue>
                            )}
                          </LoadingOpacityContainer>
                        </AutoRow>
                      </MouseoverTooltipContent>
                    </RowFixed>
                    <RowFixed style={{ position: 'relative' }}>
                      <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
                        <Trans>Current Price</Trans>
                      </TYPE.body>
                    </RowFixed>
                    <RowFixed>
                      <LoadingOpacityContainer $loading={routeIsSyncing}>
                        <TradePrice
                          price={trade.route.midPrice}
                          showInverted={showInverted}
                          setShowInverted={setShowInverted}
                        />
                      </LoadingOpacityContainer>
                    </RowFixed>
                  </Row>
                  <Row justify={!trade ? 'center' : 'space-between'}>
                    <RowFixed style={{ position: 'relative' }}>
                      {' '}
                      <MouseoverTooltipContent
                        wrap={false}
                        content={
                          <ResponsiveTooltipContainer origin="top right" width={'295px'}>
                            <AdvancedSwapDetails
                              trade={trade}
                              serviceFee={serviceFee}
                              priceAmount={price}
                              outputAmount={parsedAmounts.output}
                              syncing={routeIsSyncing}
                            />
                          </ResponsiveTooltipContainer>
                        }
                        placement="bottom"
                        onOpen={() =>
                          ReactGA.event({
                            category: 'Trade',
                            action: 'Transaction Details Tooltip Open',
                          })
                        }
                      >
                        <StyledInfo />
                      </MouseoverTooltipContent>
                    </RowFixed>
                    <RowFixed style={{ position: 'relative' }}>
                      <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
                        <Trans>Min Price</Trans>
                      </TYPE.body>
                    </RowFixed>
                    <RowFixed>
                      <LoadingOpacityContainer $loading={routeIsSyncing}>
                        <TradePrice price={minPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
                      </LoadingOpacityContainer>
                    </RowFixed>
                  </Row>
                </>
              )}
              {!trade && !minPrice && (
                <>
                  <Row justify={'end'} style={{ height: '24px' }}>
                    <RowFixed style={{ position: 'relative' }}></RowFixed>
                    <RowFixed style={{ position: 'relative' }}>
                      <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
                        <Trans>Current Price: 0</Trans>
                      </TYPE.body>
                    </RowFixed>
                  </Row>
                  <Row justify={'end'} style={{ height: '24px' }}>
                    <RowFixed style={{ position: 'relative' }}></RowFixed>
                    <RowFixed style={{ position: 'relative' }}>
                      <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
                        <Trans>Min Price: 0</Trans>
                      </TYPE.body>
                    </RowFixed>
                  </Row>
                </>
              )}

              <ButtonStyle>
                {swapIsUnsupported ? (
                  <ButtonPrimary disabled={true}>
                    <TYPE.main mb="4px">
                      <Trans>Unsupported Asset</Trans>
                    </TYPE.main>
                  </ButtonPrimary>
                ) : !account ? (
                  <ButtonLight onClick={toggleWalletModal}>
                    <Trans>Connect Wallet</Trans>
                  </ButtonLight>
                ) : showWrap ? (
                  <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
                    {wrapInputError ??
                      (wrapType === WrapType.WRAP ? (
                        <Trans>Wrap</Trans>
                      ) : wrapType === WrapType.UNWRAP ? (
                        <Trans>Unwrap</Trans>
                      ) : null)}
                  </ButtonPrimary>
                ) : routeIsSyncing || routeIsLoading ? (
                  <GreyCard style={{ textAlign: 'center' }}>
                    <TYPE.main mb="4px">
                      <Dots>
                        <Trans>Loading</Trans>
                      </Dots>
                    </TYPE.main>
                  </GreyCard>
                ) : routeNotFound && userHasSpecifiedInputOutput ? (
                  <GreyCard style={{ textAlign: 'center' }}>
                    <TYPE.main mb="4px">
                      <Trans>Insufficient liquidity for this trade.</Trans>
                    </TYPE.main>
                  </GreyCard>
                ) : showApproveFlow ? (
                  <AutoRow style={{ flexWrap: 'nowrap', width: '100%' }}>
                    <AutoColumn style={{ width: '100%' }} gap="12px">
                      chainId !== 137 && (
                      <ButtonConfirmed
                        onClick={handleApprove}
                        disabled={
                          approvalState !== ApprovalState.NOT_APPROVED ||
                          approvalSubmitted ||
                          signatureState === UseERC20PermitState.SIGNED
                        }
                        width="100%"
                        altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
                        confirmed={
                          approvalState === ApprovalState.APPROVED || signatureState === UseERC20PermitState.SIGNED
                        }
                      >
                        <AutoRow justify="space-between" style={{ flexWrap: 'nowrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <CurrencyLogo
                              currency={currencies[Field.INPUT]}
                              size={'20px'}
                              style={{ marginRight: '8px', flexShrink: 0 }}
                            />
                            {/* we need to shorten this string on mobile */}
                            {approvalState === ApprovalState.APPROVED ||
                            signatureState === UseERC20PermitState.SIGNED ? (
                              <Trans>You can now trade {currencies[Field.INPUT]?.symbol}</Trans>
                            ) : (
                              <Trans>Allow Kromatika to use your {currencies[Field.INPUT]?.symbol}</Trans>
                            )}
                          </span>
                          {approvalState === ApprovalState.PENDING ? (
                            <Loader stroke="white" />
                          ) : (approvalSubmitted && approvalState === ApprovalState.APPROVED) ||
                            signatureState === UseERC20PermitState.SIGNED ? (
                            <CheckCircle size="20" color={theme.green1} />
                          ) : (
                            <MouseoverTooltip
                              text={
                                <Trans>
                                  You must give the Kromatika smart contracts permission to use your{' '}
                                  {currencies[Field.INPUT]?.symbol}. You only have to do this once per token.
                                </Trans>
                              }
                            >
                              <HelpCircle size="20" color={'white'} style={{ marginLeft: '8px' }} />
                            </MouseoverTooltip>
                          )}
                        </AutoRow>
                      </ButtonConfirmed>
                      )
                      <ButtonError
                        onClick={() => {
                          setSwapState({
                            tradeToConfirm: trade,
                            attemptingTxn: false,
                            swapErrorMessage: undefined,
                            showConfirm: true,
                            txHash: undefined,
                          })
                        }}
                        width="100%"
                        id="swap-button"
                        disabled={
                          chainId === 137 ||
                          !isValid ||
                          (approvalState !== ApprovalState.APPROVED && signatureState !== UseERC20PermitState.SIGNED)
                        }
                        error={isValid}
                      >
                        <Text fontSize={16} fontWeight={500}>
                          {<Trans>Trade</Trans>}
                        </Text>
                      </ButtonError>
                    </AutoColumn>
                  </AutoRow>
                ) : (
                  <ButtonError
                    onClick={() => {
                      setSwapState({
                        tradeToConfirm: trade,
                        attemptingTxn: false,
                        swapErrorMessage: undefined,
                        showConfirm: true,
                        txHash: undefined,
                      })
                    }}
                    id="swap-button"
                    disabled={!isValid || !!swapCallbackError || chainId === 137}
                    error={isValid && !swapCallbackError}
                  >
                    <Text fontSize={20} fontWeight={500}>
                      {swapInputError ? swapInputError : <Trans>Trade</Trans>}
                    </Text>
                  </ButtonError>
                )}
                {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
              </ButtonStyle>
            </AutoColumn>
          </Wrapper>
        </StyledNoProDiv>
      </AppBodyNoPro>
      {!swapIsUnsupported ? null : (
        <UnsupportedCurrencyFooter
          show={swapIsUnsupported}
          currencies={[currencies[Field.INPUT], currencies[Field.OUTPUT]]}
        />
      )}
    </DivWrapperNoPro>
  )
}
