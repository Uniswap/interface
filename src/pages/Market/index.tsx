import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { FiatValue } from 'components/CurrencyInputPanel/FiatValue'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { AdvancedMarketDetails } from 'components/market/AdvancedMarketDetails'
import ConfirmMarketModal from 'components/market/ConfirmMarketModal'
import MarketHeader from 'components/market/MarketHeader'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import PositionList from 'components/PositionList'
import { AdvancedSwapDetails } from 'components/swap/AdvancedSwapDetails'
import { AutoRouterLogo } from 'components/swap/RouterLabel'
import SwapRoute from 'components/swap/SwapRoute'
import TradePrice from 'components/swap/TradePrice'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { MouseoverTooltip, MouseoverTooltipContent } from 'components/Tooltip'
import { useMarketCallback } from 'hooks/useMarketCallback'
import JSBI from 'jsbi'
import { LoadingRows } from 'pages/Pool/styleds'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown, CheckCircle, HelpCircle, Inbox, Info, X } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { useDerivedMarketInfo, useMarketActionHandlers, useMarketState } from 'state/market/hooks'
import { V3TradeState } from 'state/routing/types'
import styled, { ThemeContext } from 'styled-components/macro'

import GasIconLight from '../../assets/images/gas-pump.svg'
import GasIconDark from '../../assets/images/gas-pump-dark.png'
import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { GreyCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import CurrencyLogo from '../../components/CurrencyLogo'
import Loader from '../../components/Loader'
import Row, { AutoRow, RowFixed } from '../../components/Row'
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
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
import useToggledVersion, { Version } from '../../hooks/useToggledVersion'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback'
import { useActiveWeb3React } from '../../hooks/web3'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/market/actions'
import { useDefaultsFromURLSearch, useDerivedSwapInfo, usePoolAddress } from '../../state/swap/hooks'
import { useDarkModeManager, useExpertModeManager } from '../../state/user/hooks'
import { LinkStyledButton, TYPE } from '../../theme'
import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
import { getTradeVersion } from '../../utils/getTradeVersion'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { warningSeverity } from '../../utils/prices'
import AppBody from '../AppBody'
import { MemoizedCandleSticks } from '../LimitOrder/CandleSticks'

const StyledInfo = styled(Info)`
  height: 16px;
  width: 16px;
  margin-left: 4px;
  color: ${({ theme }) => theme.text3};
  :hover {
    color: ${({ theme }) => theme.text1};
  }
`

const StyledSwap = styled.div`
  flex-grow: 1;
  max-width: 100%;
  width: 100%;

  @media screen and (max-width: 1592px) {
    flex: 0 0 480px;
  }
`
const ButtonStyle = styled.div`
  margin-top: 0px;
`

const MarketContainer = styled.div`
  margin-top: 100px;
  width: 100%;
  height: 100vh;
`

const ClassicModeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  @media screen and (max-width: 900px) {
    width: 95%;
    margin-left: 20px;
  }

  @media screen and (max-width: 600px) {
    width: 98%;
    margin-left: 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
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

export default function Market({ history }: RouteComponentProps) {
  const { account } = useActiveWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()
  const [expertMode, toggleExpertMode] = useExpertModeManager()

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

  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // for expert mode
  const [isExpertMode] = [false]

  // get version from the url
  const toggledVersion = Version.v2

  // swap state
  const { independentField, typedValue, recipient } = useMarketState()
  const {
    v2Trade: { state: v3TradeState, tx: swapTransaction, savings: uniSavings },
    bestTrade: trade,
    allowedSlippage,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
  } = useDerivedMarketInfo(toggledVersion)

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const { address: recipientAddress } = useENSAddress(recipient)

  const [darkMode] = useDarkModeManager()

  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
            [Field.INPUT]: parsedAmount,
            [Field.OUTPUT]: parsedAmount,
          }
        : {
            [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
            [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
          },
    [independentField, parsedAmount, showWrap, trade]
  )

  const [routeNotFound, routeIsLoading, routeIsSyncing] = useMemo(
    () => [
      trade instanceof V3Trade ? !trade?.swaps : !trade?.route,
      V3TradeState.LOADING === v3TradeState,
      V3TradeState.SYNCING === v3TradeState,
    ],
    [trade, v3TradeState]
  )

  const fiatValueInput = useUSDCValue(parsedAmounts[Field.INPUT])
  const fiatValueOutput = useUSDCValue(parsedAmounts[Field.OUTPUT])
  const priceImpact = routeIsSyncing ? undefined : computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput)

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useMarketActionHandlers()
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

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

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
    history.push('/market/')
  }, [history])

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
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

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )

  // check whether the user has approved the router on the input token
  const [approvalState, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage, swapTransaction)
  const {
    state: signatureState,
    signatureData,
    gatherPermitSignature,
  } = useERC20PermitFromTrade(trade, allowedSlippage, true)

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
        category: 'Swap',
        action: 'Approve',
        label: [trade?.inputAmount.currency.symbol, toggledVersion].join('/'),
      })
    }
  }, [approveCallback, gatherPermitSignature, signatureState, toggledVersion, trade?.inputAmount.currency.symbol])

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useMarketCallback(
    trade,
    allowedSlippage,
    recipient,
    signatureData,
    swapTransaction,
    showConfirm
  )

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    if (priceImpact && !confirmPriceImpactWithoutFee(priceImpact)) {
      return
    }
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
    swapCallback()
      .then((hash) => {
        setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
        ReactGA.event({
          category: 'Swap',
          action:
            recipient === null
              ? 'Swap w/o Send'
              : (recipientAddress ?? recipient) === account
              ? 'Swap w/o Send + recipient'
              : 'Swap w/ Send',
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
  }, [swapCallback, priceImpact, tradeToConfirm, showConfirm, recipient, recipientAddress, account, trade])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  // warnings on the greater of fiat value price impact and execution price impact
  const priceImpactSeverity = useMemo(() => {
    const executionPriceImpact = trade?.priceImpact
    return warningSeverity(
      executionPriceImpact && priceImpact
        ? executionPriceImpact.greaterThan(priceImpact)
          ? executionPriceImpact
          : priceImpact
        : executionPriceImpact ?? priceImpact
    )
  }, [priceImpact, trade])

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
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm })
  }, [attemptingTxn, showConfirm, swapErrorMessage, trade, txHash])

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact())
  }, [maxInputAmount, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
    [onCurrencySelection]
  )

  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  const priceImpactTooHigh = priceImpactSeverity > 3 && !isExpertMode
  const aToken = currencies && currencies[Field.INPUT] ? currencies[Field.INPUT] : undefined
  const bToken = currencies && currencies[Field.OUTPUT] ? currencies[Field.OUTPUT] : undefined
  const fee = undefined
  const { poolAddress, networkName } = usePoolAddress(aToken, bToken, fee)

  // if (expertMode) {
  //   return (
  //     <>
  //       <FlexContainer>
  //         <FlexItemLeft>
  //           <MemoizedCandleSticks networkName={networkName} poolAddress={poolAddress} />
  //         </FlexItemLeft>
  //         <FlexItemRight>
  //           <StyledSwap>
  //             <TokenWarningModal
  //               isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
  //               tokens={importTokensNotInDefault}
  //               onConfirm={handleConfirmTokenWarning}
  //               onDismiss={handleDismissTokenWarning}
  //             />
  //             <AppBody>
  //               <MarketHeader allowedSlippage={allowedSlippage} />
  //               <Wrapper id="swap-page">
  //                 <ConfirmMarketModal
  //                   isOpen={showConfirm}
  //                   trade={trade}
  //                   originalTrade={tradeToConfirm}
  //                   onAcceptChanges={handleAcceptChanges}
  //                   attemptingTxn={attemptingTxn}
  //                   txHash={txHash}
  //                   recipient={recipient}
  //                   allowedSlippage={allowedSlippage}
  //                   onConfirm={handleSwap}
  //                   swapErrorMessage={swapErrorMessage}
  //                   onDismiss={handleConfirmDismiss}
  //                 />

  //                 <AutoColumn gap={'sm'}>
  //                   <div style={{ display: 'relative' }}>
  //                     <CurrencyInputPanel
  //                       label={
  //                         independentField === Field.OUTPUT && !showWrap ? (
  //                           <Trans>From (at most)</Trans>
  //                         ) : (
  //                           <Trans>From</Trans>
  //                         )
  //                       }
  //                       value={formattedAmounts[Field.INPUT]}
  //                       showMaxButton={showMaxButton}
  //                       currency={currencies[Field.INPUT]}
  //                       onUserInput={handleTypeInput}
  //                       onMax={handleMaxInput}
  //                       fiatValue={fiatValueInput ?? undefined}
  //                       onCurrencySelect={handleInputSelect}
  //                       otherCurrency={currencies[Field.OUTPUT]}
  //                       showCommonBases={true}
  //                       id="swap-currency-input"
  //                       loading={independentField === Field.OUTPUT && routeIsSyncing}
  //                     />
  //                     <ArrowWrapper clickable>
  //                       <ArrowDown
  //                         size="16"
  //                         onClick={() => {
  //                           setApprovalSubmitted(false) // reset 2 step UI for approvals
  //                           onSwitchTokens()
  //                         }}
  //                         color={currencies[Field.INPUT] && currencies[Field.OUTPUT] ? theme.text1 : theme.text3}
  //                       />
  //                     </ArrowWrapper>
  //                     <CurrencyInputPanel
  //                       value={formattedAmounts[Field.OUTPUT]}
  //                       onUserInput={handleTypeOutput}
  //                       label={
  //                         independentField === Field.INPUT && !showWrap ? (
  //                           <Trans>To (at least)</Trans>
  //                         ) : (
  //                           <Trans>To</Trans>
  //                         )
  //                       }
  //                       showMaxButton={false}
  //                       hideBalance={false}
  //                       fiatValue={fiatValueOutput ?? undefined}
  //                       priceImpact={priceImpact}
  //                       currency={currencies[Field.OUTPUT]}
  //                       onCurrencySelect={handleOutputSelect}
  //                       otherCurrency={currencies[Field.INPUT]}
  //                       showCommonBases={true}
  //                       id="swap-currency-output"
  //                       loading={independentField === Field.INPUT && routeIsSyncing}
  //                     />
  //                   </div>

  //                   {recipient !== null && !showWrap ? (
  //                     <>
  //                       <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
  //                         <ArrowWrapper clickable={false}>
  //                           <ArrowDown size="16" color={theme.text2} />
  //                         </ArrowWrapper>
  //                         <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
  //                           <Trans>- Remove recipient</Trans>
  //                         </LinkStyledButton>
  //                       </AutoRow>
  //                       <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
  //                     </>
  //                   ) : null}

  //                   {!showWrap && trade && (
  //                     <div>
  //                       <Row justify={!trade ? 'center' : 'space-between'}>
  //                         <RowFixed style={{ position: 'relative' }}>
  //                           <MouseoverTooltipContent
  //                             wrap={false}
  //                             content={
  //                               <ResponsiveTooltipContainer>
  //                                 <SwapRoute trade={trade} syncing={routeIsSyncing} />
  //                               </ResponsiveTooltipContainer>
  //                             }
  //                             placement="bottom"
  //                             onOpen={() =>
  //                               ReactGA.event({
  //                                 category: 'Swap',
  //                                 action: 'Router Tooltip Open',
  //                               })
  //                             }
  //                           >
  //                             <AutoRow gap="4px" width="auto">
  //                               <AutoRouterLogo />
  //                               <LoadingOpacityContainer $loading={routeIsSyncing}>
  //                                 {trade instanceof V3Trade && trade.swaps.length > 1 && (
  //                                   <TYPE.blue fontSize={14}>{trade.swaps.length} routes</TYPE.blue>
  //                                 )}
  //                               </LoadingOpacityContainer>
  //                             </AutoRow>
  //                           </MouseoverTooltipContent>
  //                         </RowFixed>
  //                         <RowFixed>
  //                           <LoadingOpacityContainer $loading={routeIsSyncing}>
  //                             <TradePrice
  //                               price={trade.executionPrice}
  //                               showInverted={showInverted}
  //                               setShowInverted={setShowInverted}
  //                             />
  //                           </LoadingOpacityContainer>
  //                           <MouseoverTooltipContent
  //                             wrap={false}
  //                             content={
  //                               <ResponsiveTooltipContainer origin="top right" width={'295px'}>
  //                                 <AdvancedMarketDetails
  //                                   trade={trade}
  //                                   allowedSlippage={allowedSlippage}
  //                                   syncing={routeIsSyncing}
  //                                 />
  //                               </ResponsiveTooltipContainer>
  //                             }
  //                             placement="bottom"
  //                             onOpen={() =>
  //                               ReactGA.event({
  //                                 category: 'Swap',
  //                                 action: 'Transaction Details Tooltip Open',
  //                               })
  //                             }
  //                           >
  //                             <StyledInfo />
  //                           </MouseoverTooltipContent>
  //                         </RowFixed>
  //                       </Row>
  //                       <Row justify={!trade ? 'center' : 'space-between'}>
  //                         <RowFixed style={{ position: 'relative' }}>
  //                           <MouseoverTooltipContent
  //                             wrap={false}
  //                             content={
  //                               <ResponsiveTooltipContainer>
  //                                 <SwapRoute trade={trade} syncing={routeIsSyncing} />
  //                               </ResponsiveTooltipContainer>
  //                             }
  //                             placement="bottom"
  //                             onOpen={() =>
  //                               ReactGA.event({
  //                                 category: 'Swap',
  //                                 action: 'Router Tooltip Open',
  //                               })
  //                             }
  //                           >
  //                             <AutoRow gap="4px" width="auto">
  //                               <AutoRouterLogo />
  //                               <LoadingOpacityContainer $loading={routeIsSyncing}>
  //                                 {trade instanceof V3Trade && trade.swaps.length > 1 && (
  //                                   <TYPE.blue fontSize={14}>{trade.swaps.length} routes</TYPE.blue>
  //                                 )}
  //                               </LoadingOpacityContainer>
  //                             </AutoRow>
  //                           </MouseoverTooltipContent>
  //                         </RowFixed>
  //                         <RowFixed>
  //                           <LoadingOpacityContainer $loading={routeIsSyncing}>
  //                             <TYPE.subHeader>
  //                               <Trans>Network fee: $ {swapTransaction?.gasUseEstimateUSD} </Trans>
  //                             </TYPE.subHeader>
  //                           </LoadingOpacityContainer>
  //                           <MouseoverTooltipContent
  //                             wrap={false}
  //                             content={
  //                               <ResponsiveTooltipContainer origin="top right" width={'295px'}>
  //                                 <AdvancedMarketDetails
  //                                   trade={trade}
  //                                   allowedSlippage={allowedSlippage}
  //                                   syncing={routeIsSyncing}
  //                                 />
  //                               </ResponsiveTooltipContainer>
  //                             }
  //                             placement="bottom"
  //                             onOpen={() =>
  //                               ReactGA.event({
  //                                 category: 'Swap',
  //                                 action: 'Transaction Details Tooltip Open',
  //                               })
  //                             }
  //                           >
  //                             <StyledInfo />
  //                           </MouseoverTooltipContent>
  //                         </RowFixed>
  //                       </Row>
  //                     </div>
  //                   )}

  //                   <div>
  //                     {swapIsUnsupported ? (
  //                       <ButtonPrimary disabled={true}>
  //                         <TYPE.main mb="4px">
  //                           <Trans>Unsupported Asset</Trans>
  //                         </TYPE.main>
  //                       </ButtonPrimary>
  //                     ) : !account ? (
  //                       <ButtonLight onClick={toggleWalletModal}>
  //                         <Trans>Connect Wallet</Trans>
  //                       </ButtonLight>
  //                     ) : showWrap ? (
  //                       <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
  //                         {wrapInputError ??
  //                           (wrapType === WrapType.WRAP ? (
  //                             <Trans>Wrap</Trans>
  //                           ) : wrapType === WrapType.UNWRAP ? (
  //                             <Trans>Unwrap</Trans>
  //                           ) : null)}
  //                       </ButtonPrimary>
  //                     ) : routeIsSyncing || routeIsLoading ? (
  //                       <GreyCard style={{ textAlign: 'center' }}>
  //                         <TYPE.main mb="4px">
  //                           <Dots>
  //                             <Trans>Loading</Trans>
  //                           </Dots>
  //                         </TYPE.main>
  //                       </GreyCard>
  //                     ) : routeNotFound && userHasSpecifiedInputOutput ? (
  //                       <GreyCard style={{ textAlign: 'center' }}>
  //                         <TYPE.main mb="4px">
  //                           <Trans>Insufficient liquidity for this trade.</Trans>
  //                         </TYPE.main>
  //                       </GreyCard>
  //                     ) : showApproveFlow ? (
  //                       <AutoRow style={{ flexWrap: 'nowrap', width: '100%' }}>
  //                         <AutoColumn style={{ width: '100%' }} gap="12px">
  //                           <ButtonConfirmed
  //                             onClick={handleApprove}
  //                             disabled={
  //                               approvalState !== ApprovalState.NOT_APPROVED ||
  //                               approvalSubmitted ||
  //                               signatureState === UseERC20PermitState.SIGNED
  //                             }
  //                             width="100%"
  //                             altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
  //                             confirmed={
  //                               approvalState === ApprovalState.APPROVED ||
  //                               signatureState === UseERC20PermitState.SIGNED
  //                             }
  //                           >
  //                             <AutoRow justify="space-between" style={{ flexWrap: 'nowrap' }}>
  //                               <span style={{ display: 'flex', alignItems: 'center' }}>
  //                                 <CurrencyLogo
  //                                   currency={currencies[Field.INPUT]}
  //                                   size={'20px'}
  //                                   style={{ marginRight: '8px', flexShrink: 0 }}
  //                                 />
  //                                 {/* we need to shorten this string on mobile */}
  //                                 {approvalState === ApprovalState.APPROVED ||
  //                                 signatureState === UseERC20PermitState.SIGNED ? (
  //                                   <Trans>You can now swap {currencies[Field.INPUT]?.symbol}</Trans>
  //                                 ) : (
  //                                   <Trans>
  //                                     Allow the Kromatika Aggregator to use your {currencies[Field.INPUT]?.symbol}
  //                                   </Trans>
  //                                 )}
  //                               </span>
  //                               {approvalState === ApprovalState.PENDING ? (
  //                                 <Loader stroke="white" />
  //                               ) : (approvalSubmitted && approvalState === ApprovalState.APPROVED) ||
  //                                 signatureState === UseERC20PermitState.SIGNED ? (
  //                                 <CheckCircle size="20" color={theme.green1} />
  //                               ) : (
  //                                 <MouseoverTooltip
  //                                   text={
  //                                     <Trans>
  //                                       You must give the Kromatika Aggregator a permission to use your{' '}
  //                                       {currencies[Field.INPUT]?.symbol}. You only have to do this once per token.
  //                                     </Trans>
  //                                   }
  //                                 >
  //                                   <HelpCircle size="20" color={'white'} style={{ marginLeft: '8px' }} />
  //                                 </MouseoverTooltip>
  //                               )}
  //                             </AutoRow>
  //                           </ButtonConfirmed>
  //                           <ButtonError
  //                             onClick={() => {
  //                               if (isExpertMode) {
  //                                 handleSwap()
  //                               } else {
  //                                 setSwapState({
  //                                   tradeToConfirm: trade,
  //                                   attemptingTxn: false,
  //                                   swapErrorMessage: undefined,
  //                                   showConfirm: true,
  //                                   txHash: undefined,
  //                                 })
  //                               }
  //                             }}
  //                             width="100%"
  //                             id="swap-button"
  //                             disabled={
  //                               !isValid ||
  //                               (approvalState !== ApprovalState.APPROVED &&
  //                                 signatureState !== UseERC20PermitState.SIGNED)
  //                             }
  //                             error={isValid}
  //                           >
  //                             <Text fontSize={16} fontWeight={500}>
  //                               <Trans>Swap</Trans>
  //                             </Text>
  //                           </ButtonError>
  //                         </AutoColumn>
  //                       </AutoRow>
  //                     ) : (
  //                       <ButtonError
  //                         onClick={() => {
  //                           if (isExpertMode) {
  //                             handleSwap()
  //                           } else {
  //                             setSwapState({
  //                               tradeToConfirm: trade,
  //                               attemptingTxn: false,
  //                               swapErrorMessage: undefined,
  //                               showConfirm: true,
  //                               txHash: undefined,
  //                             })
  //                           }
  //                         }}
  //                         id="swap-button"
  //                         disabled={!isValid || !!swapCallbackError}
  //                         error={isValid && !swapCallbackError}
  //                       >
  //                         <Text fontSize={20} fontWeight={500}>
  //                           {swapInputError ? swapInputError : <Trans>Swap</Trans>}
  //                         </Text>
  //                       </ButtonError>
  //                     )}
  //                     {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
  //                   </div>
  //                 </AutoColumn>
  //               </Wrapper>
  //             </AppBody>
  //             <SwitchLocaleLink />
  //             {!swapIsUnsupported ? null : (
  //               <UnsupportedCurrencyFooter
  //                 show={swapIsUnsupported}
  //                 currencies={[currencies[Field.INPUT], currencies[Field.OUTPUT]]}
  //               />
  //             )}
  //           </StyledSwap>
  //         </FlexItemRight>
  //       </FlexContainer>
  //     </>
  //   )
  // }

  return (
    <MarketContainer>
      <ClassicModeContainer>
        <TokenWarningModal
          isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
          tokens={importTokensNotInDefault}
          onConfirm={handleConfirmTokenWarning}
          onDismiss={handleDismissTokenWarning}
        />
        <AppBody>
          <MarketHeader allowedSlippage={allowedSlippage} />
          <Wrapper id="swap-page">
            <ConfirmMarketModal
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
            />

            <AutoColumn gap={'sm'}>
              <div style={{ display: 'relative' }}>
                <CurrencyInputPanel
                  label={
                    independentField === Field.OUTPUT && !showWrap ? <Trans>From (at most)</Trans> : <Trans>From</Trans>
                  }
                  value={formattedAmounts[Field.INPUT]}
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
                  value={formattedAmounts[Field.OUTPUT]}
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

              {!showWrap && trade && (
                <div>
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
                      <LoadingOpacityContainer $loading={routeIsSyncing}>
                        <TradePrice
                          price={trade.executionPrice}
                          showInverted={showInverted}
                          setShowInverted={setShowInverted}
                        />
                      </LoadingOpacityContainer>
                    </RowFixed>
                    <RowFixed style={{ position: 'relative', top: '-3px' }}>
                      <LoadingOpacityContainer $loading={routeIsSyncing}>
                        <TYPE.subHeader>
                          <Trans>${swapTransaction?.gasUseEstimateUSD} </Trans>
                          <img
                            src={darkMode ? GasIconDark : GasIconLight}
                            style={{
                              width: '22px',
                              height: '14px',
                              position: 'relative',
                              top: '2px',
                            }}
                          />
                        </TYPE.subHeader>
                      </LoadingOpacityContainer>
                    </RowFixed>
                  </Row>
                  <Row justify={!trade ? 'center' : 'space-between'}>
                    <RowFixed>
                      <MouseoverTooltipContent
                        wrap={false}
                        content={
                          <ResponsiveTooltipContainer origin="top right" width={'295px'}>
                            <AdvancedMarketDetails
                              trade={trade}
                              allowedSlippage={allowedSlippage}
                              syncing={routeIsSyncing}
                            />
                          </ResponsiveTooltipContainer>
                        }
                        placement="bottom"
                        onOpen={() =>
                          ReactGA.event({
                            category: 'Swap',
                            action: 'Transaction Details Tooltip Open',
                          })
                        }
                      >
                        <StyledInfo />
                      </MouseoverTooltipContent>
                    </RowFixed>
                    {uniSavings && fiatValueOutput && uniSavings.lessThan(fiatValueOutput) ? (
                      <Row justify={'end'} style={{ height: '24px' }}>
                        <RowFixed style={{ marginRight: '5px' }}>
                          <TYPE.body color={theme.text2} fontWeight={500} fontSize={14}>
                            <Trans>You save: </Trans>
                          </TYPE.body>
                        </RowFixed>
                        <RowFixed>
                          <LoadingOpacityContainer $loading={routeIsSyncing}>
                            <TYPE.subHeader>
                              <FiatValue
                                fiatValue={fiatValueOutput.subtract(uniSavings)}
                                priceImpact={computeFiatValuePriceImpact(uniSavings, fiatValueOutput)}
                              />
                            </TYPE.subHeader>
                          </LoadingOpacityContainer>
                        </RowFixed>
                      </Row>
                    ) : null}
                  </Row>
                </div>
              )}
              <div>
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
                              <Trans>You can now swap {currencies[Field.INPUT]?.symbol}</Trans>
                            ) : (
                              <Trans>
                                Allow the Kromatika Aggregator to use your {currencies[Field.INPUT]?.symbol}
                              </Trans>
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
                                  You must give the Kromatika Aggregator a permission to use your{' '}
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
                          if (isExpertMode) {
                            handleSwap()
                          } else {
                            setSwapState({
                              tradeToConfirm: trade,
                              attemptingTxn: false,
                              swapErrorMessage: undefined,
                              showConfirm: true,
                              txHash: undefined,
                            })
                          }
                        }}
                        width="100%"
                        id="swap-button"
                        disabled={
                          !isValid ||
                          (approvalState !== ApprovalState.APPROVED && signatureState !== UseERC20PermitState.SIGNED)
                        }
                        error={isValid}
                      >
                        <Text fontSize={16} fontWeight={500}>
                          <Trans>Swap</Trans>
                        </Text>
                      </ButtonError>
                    </AutoColumn>
                  </AutoRow>
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
                          txHash: undefined,
                        })
                      }
                    }}
                    id="swap-button"
                    disabled={!isValid || !!swapCallbackError}
                    error={isValid && !swapCallbackError}
                  >
                    <Text fontSize={20} fontWeight={500}>
                      {swapInputError ? swapInputError : <Trans>Swap</Trans>}
                    </Text>
                  </ButtonError>
                )}
                {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
              </div>
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
      </ClassicModeContainer>
    </MarketContainer>
  )
}
