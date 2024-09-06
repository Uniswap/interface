// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Fraction, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import AddTokenToWallet from 'components/AddTokenToWallet'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import TradePrice from 'components/swap/TradePrice'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { MouseoverTooltip } from 'components/Tooltip'
import { LIMIT_ORDER_MANAGER_ADDRESSES } from 'constants/addresses'
import { useV3Positions } from 'hooks/useV3Positions'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown, CheckCircle, HelpCircle, X } from 'react-feather'
import ReactGA from 'react-ga'
import { useHistory } from 'react-router-dom'
import { Text } from 'rebass'
import { isTransactionRecent, useAllTransactions } from 'state/transactions/hooks'
import { TransactionDetails } from 'state/transactions/reducer'
import { V3TradeState } from 'state/validator/types'
import styled, { ThemeContext } from 'styled-components/macro'
import { CommonQuantity } from 'types/main'

import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import MemoizedCandleSticks from '../../components/CandleSticks'
import { GreyCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import CurrencyLogo from '../../components/CurrencyLogo'
import LimitOrderList from '../../components/LimitOrderList'
import Loader from '../../components/Loader'
import FullPositionCard from '../../components/PositionCard'
import Row, { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal'
import { ArrowWrapper, Dots, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
import SwapHeader from '../../components/swap/SwapHeader'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import Toggle from '../../components/Toggle'
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
import { useExpertModeManager, useNetworkGasPrice } from '../../state/user/hooks'
import { LinkStyledButton, TYPE } from '../../theme'
import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
import { getTradeVersion } from '../../utils/getTradeVersion'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'

const ClassicModeContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  border: none;
  padding: 1rem 1rem 7rem;
  width: calc(100% - 1rem);
  height: 100%;
  min-height: 90vh;
  z-index: 0;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem 1rem 8rem;
  `};

  :nth-child(4) {
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;

    > div:nth-child(1) {
      flex: 1;
      min-width: 280px;
      max-width: 475px;
      ${({ theme }) => theme.mediaWidth.upToMedium`
        min-width: 100%;
        max-width: 100%;
        order: 2;
      `};
    }

    > div:nth-child(2) {
      flex: 2;
      order: 0;
    }

    > div:nth-child(3) {
      flex: 1;
      min-width: 280px;
      max-width: 475px;
      ${({ theme }) => theme.mediaWidth.upToMedium`
        min-width: 100%;
        max-width: 100%;
        order: 1;
      `};
    }
  }
`

const SwapModalContainer = styled(AppBody)`
  flex: 1;
  width: 100%;
  min-width: 280px;
  max-width: 475px;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
    max-width: 100%;
  `};
`

const GridContainer = styled.div`
  display: grid;
  grid-template-rows: 1fr fit-content();
  grid-template-columns: minmax(min(100%, 475px), 1fr) minmax(min(100%, 475px), 475px);
  row-gap: 2rem;
  column-gap: 2rem;

  border: none;
  padding: 1rem 1rem 7rem;
  width: 100%;
  height: 100%;
  min-height: 90vh;
  z-index: 0;

  & > :nth-child(n + 2) {
    height: fit-content;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: minmax(min(100%, 475px), 1fr);
    padding: 1rem 1rem 8rem;
  `};
`

// we want the latest one to come first, so return negative if a is after b
function newTransactionsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

const FundingBalance = () => {
  const { account } = useActiveWeb3React()
  const { fundingBalance, minBalance, gasPrice } = useV3Positions(account)

  return <FullPositionCard fundingBalance={fundingBalance} minBalance={minBalance} gasPrice={gasPrice} />
}

const LimitOrderModal = () => {
  const theme = useContext(ThemeContext)
  const toggleWalletModal = useWalletModalToggle()
  const { account } = useActiveWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()
  const allTransactions = useAllTransactions()

  useMemo(() => {
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
      setApprovalSubmitted(false)
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
  const history = useHistory()
  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
    history.push('/limitorder')
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
  const showCommonQuantityButtons = Boolean(maxInputAmount?.greaterThan(0))

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
        window.safary?.track({
          eventType: 'FELO',
          eventName: 'Create FELO',
          parameters: {
            walletAddress: account as string,
            inputCurrency: trade?.inputAmount?.currency?.symbol as string,
            inputAmount: parseFloat(trade?.inputAmount?.quotient?.toString() ?? '0'),
            toAmount: parseFloat(trade?.outputAmount.quotient?.toString() ?? '0'),
            toCurrency: trade?.outputAmount.currency.symbol as string,
            toAmountUSD: parseFloat(fiatValueOutput?.quotient?.toString() ?? '0'),
          },
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
  }, [account, recipient, recipientAddress, showConfirm, swapCallback, trade, tradeToConfirm])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

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
      history.push('/limitorder')
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

  const handleCommonQuantityInput = useCallback(
    (commonQuantity: CommonQuantity) => {
      if (maxInputAmount) {
        setApprovalSubmitted(false)
        if (commonQuantity === '25%') {
          onUserInput(Field.INPUT, maxInputAmount.divide(new Fraction(4, 1)).toExact())
        }
        if (commonQuantity === '50%') {
          onUserInput(Field.INPUT, maxInputAmount.divide(new Fraction(4, 2)).toExact())
        }
        if (commonQuantity === '75%') {
          onUserInput(Field.INPUT, maxInputAmount.divide(new Fraction(4, 3)).toExact())
        }
        if (commonQuantity === '100%') {
          onUserInput(Field.INPUT, maxInputAmount.toExact())
        }
      }
    },
    [maxInputAmount, onUserInput]
  )

  const handleOutputSelect = useCallback(
    (outputCurrency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection]
  )
  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  return (
    <>
      <TokenWarningModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
        onDismiss={handleDismissTokenWarning}
      />
      <SwapModalContainer>
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
          <AutoColumn gap="md">
            <div style={{ display: 'relative' }}>
              <CurrencyInputPanel
                currencySearchTitle="Select a token - Uniswap V3 pairs only"
                actionLabel={t`You send`}
                label={
                  independentField === Field.OUTPUT && !showWrap ? <Trans>From (at most)</Trans> : <Trans>From</Trans>
                }
                value={formattedAmounts.input}
                showCommonQuantityButtons={showCommonQuantityButtons}
                currency={currencies[Field.INPUT]}
                onUserInput={handleTypeInput}
                onCommonQuantity={handleCommonQuantityInput}
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
                currencySearchTitle="Select a token - Uniswap V3 pairs only"
                value={formattedAmounts.price}
                onUserInput={handleTypePrice}
                label={<Trans>Target Price+++</Trans>}
                showCommonQuantityButtons={false}
                hideBalance={true}
                currency={currencies[Field.OUTPUT] ?? null}
                otherCurrency={currencies[Field.INPUT]}
                id="target-price"
                showCommonBases={false}
                locked={false}
                showCurrencySelector={false}
                showRate={true}
                isInvertedRate={showInverted}
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
                currencySearchTitle="Select a token - Uniswap V3 pairs only"
                actionLabel={t`You receive at least`}
                value={formattedAmounts.output}
                onUserInput={handleTypeOutput}
                label={independentField === Field.INPUT && !showWrap ? <Trans>To (at least)</Trans> : <Trans>To</Trans>}
                showCommonQuantityButtons={false}
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
              <AutoColumn gap="sm" style={{ margin: '8px' }}>
                <Row justify={'flex-end'}>
                  <RowFixed style={{ position: 'relative' }}>
                    <Toggle
                      id="toggle-buy-sell"
                      isActive={showInverted}
                      toggle={() => setShowInverted((showInverted) => !showInverted)}
                      checked={<Trans>Input</Trans>}
                      unchecked={<Trans>Output</Trans>}
                    />
                  </RowFixed>
                </Row>
                <RowBetween>
                  <TYPE.body color={theme.text2} fontWeight={400} fontSize={14} minWidth="100px">
                    <Trans>Current Price</Trans>
                  </TYPE.body>
                  <LoadingOpacityContainer $loading={routeIsSyncing}>
                    <TradePrice
                      price={trade.route.midPrice}
                      showInverted={showInverted}
                      setShowInverted={setShowInverted}
                    />
                  </LoadingOpacityContainer>
                </RowBetween>
                <RowBetween>
                  <TYPE.body color={theme.text2} fontWeight={400} fontSize={14}>
                    <Trans>Min Price</Trans>
                  </TYPE.body>
                  <LoadingOpacityContainer $loading={routeIsSyncing} style={{ justifySelf: 'end' }}>
                    <TradePrice price={minPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
                  </LoadingOpacityContainer>
                </RowBetween>
              </AutoColumn>
            )}
            {!trade && !minPrice && (
              <AutoColumn gap="sm">
                <Row justify={'flex-end'}>
                  <RowFixed style={{ position: 'relative' }}>
                    <Toggle
                      id="toggle-buy-sell"
                      isActive={showInverted}
                      toggle={() => setShowInverted((showInverted) => !showInverted)}
                      checked={<Trans>Input</Trans>}
                      unchecked={<Trans>Output</Trans>}
                    />
                  </RowFixed>
                </Row>
                <Row justify={'end'} style={{ height: '24px' }}>
                  <RowFixed style={{ position: 'relative' }} />
                  <RowFixed style={{ position: 'relative' }}>
                    <TYPE.body color={theme.text2} fontWeight={400} fontSize={14}>
                      <Trans>Current Price: 0</Trans>
                    </TYPE.body>
                  </RowFixed>
                </Row>
                <Row justify={'end'} style={{ height: '24px' }}>
                  <RowFixed style={{ position: 'relative' }} />
                  <RowFixed style={{ position: 'relative' }}>
                    <TYPE.body color={theme.text2} fontWeight={400} fontSize={14}>
                      <Trans>Min Price: 0</Trans>
                    </TYPE.body>
                  </RowFixed>
                </Row>
              </AutoColumn>
            )}
            {currencies[Field.OUTPUT] && currencies[Field.OUTPUT]?.isToken && (
              <AddTokenToWallet token={currencies[Field.OUTPUT] as Token} />
            )}
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
              <AutoRow
                style={{
                  display: 'flex',
                  width: '100%',
                  textAlign: 'center',
                  justifyContent: 'center',
                }}
              >
                <AutoColumn
                  style={{
                    width: '100%',
                    textAlign: 'center',
                    justifyContent: 'center',
                    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
                  }}
                  gap="md"
                >
                  <ButtonConfirmed
                    onClick={handleApprove}
                    doWrap={true}
                    disabled={
                      (approvalState !== ApprovalState.NOT_APPROVED && approvalSubmitted) ||
                      signatureState === UseERC20PermitState.SIGNED
                    }
                    width="100%"
                    altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
                    confirmed={
                      approvalState === ApprovalState.APPROVED || signatureState === UseERC20PermitState.SIGNED
                    }
                  >
                    <AutoRow noWrap={true} style={{ textAlign: 'center', alignItems: 'center', display: 'flex' }}>
                      <div
                        style={{
                          display: 'flex',
                          flexShrink: 0,
                          alignItems: 'center',
                          verticalAlign: 'middle',
                          justifyContent: 'center',
                          textAlign: 'center',
                          whiteSpace: 'break-spaces',
                        }}
                      >
                        <CurrencyLogo currency={currencies[Field.INPUT]} size={'20px'} style={{ marginRight: '8px' }} />
                      </div>
                      <div
                        style={{
                          flexGrow: 1,
                          textAlign: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {/* we need to shorten this string on mobile */}
                        {approvalState === ApprovalState.APPROVED || signatureState === UseERC20PermitState.SIGNED ? (
                          <Trans>You can now trade {currencies[Field.INPUT]?.symbol}</Trans>
                        ) : (
                          <Trans>Allow Kromatika to use your {currencies[Field.INPUT]?.symbol}</Trans>
                        )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          verticalAlign: 'middle',
                          flexShrink: 0,
                        }}
                      >
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
                      </div>
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
                      !isValid ||
                      !approvalState ||
                      (approvalState !== ApprovalState.APPROVED && signatureState !== UseERC20PermitState.SIGNED)
                    }
                    error={!isValid}
                  >
                    <Text fontSize={20} fontWeight={500}>
                      {<Trans>Create FELO</Trans>}
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
                disabled={!isValid || !!swapCallbackError}
                error={!isValid && !swapCallbackError}
              >
                <Text fontSize={20} fontWeight={500}>
                  {swapInputError ? swapInputError : <Trans>Create FELO</Trans>}
                </Text>
              </ButtonError>
            )}
            {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
          </AutoColumn>
        </Wrapper>
      </SwapModalContainer>
      {!swapIsUnsupported ? null : (
        <UnsupportedCurrencyFooter
          show={swapIsUnsupported}
          currencies={[currencies[Field.INPUT], currencies[Field.OUTPUT]]}
        />
      )}
    </>
  )
}

export default function LimitOrder() {
  const { bestTrade, currencies } = useDerivedSwapInfo()
  const fee = bestTrade?.route.pools[0].fee
  const aToken = currencies && currencies[Field.INPUT] ? currencies[Field.INPUT] : undefined
  const bToken = currencies && currencies[Field.OUTPUT] ? currencies[Field.OUTPUT] : undefined
  const { poolAddress, networkName } = usePoolAddress(aToken, bToken, fee)
  const [expertMode] = useExpertModeManager()

  if (expertMode) {
    return (
      <>
        <GridContainer>
          <MemoizedCandleSticks networkName={networkName} poolAddress={poolAddress} />
          <LimitOrderModal />
          <LimitOrderList />
          <FundingBalance />
          <SwitchLocaleLink />
        </GridContainer>
      </>
    )
  }

  return (
    <ClassicModeContainer>
      <FundingBalance />
      <LimitOrderModal />
      <LimitOrderList />
      <SwitchLocaleLink />
    </ClassicModeContainer>
  )
}
