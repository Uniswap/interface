// eslint-disable-next-line no-restricted-imports
import 'react-toastify/dist/ReactToastify.css'

// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Fraction, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import AddTokenToWallet from 'components/AddTokenToWallet'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import ConfirmMarketModal from 'components/market/ConfirmMarketModal'
import MarketHeader from 'components/market/MarketHeader'
import { AutoRouterLogo } from 'components/swap/RouterLabel'
import SwapRoute from 'components/swap/SwapRoute'
import TradePrice from 'components/swap/TradePrice'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { MouseoverTooltip, MouseoverTooltipContent } from 'components/Tooltip'
import { LIMIT_ORDER_MANAGER_ADDRESSES } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import { CHAIN_NATIVE_TOKEN_SYMBOL, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useMarketCallback } from 'hooks/useMarketCallback'
import JSBI from 'jsbi'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown, CheckCircle, HelpCircle, Info } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { useDerivedMarketInfo, useMarketActionHandlers, useMarketState } from 'state/market/hooks'
import { SwapTransaction, V3TradeState } from 'state/validator/types'
import styled, { ThemeContext } from 'styled-components/macro'
import { CommonQuantity } from 'types/main'
import { shortenAddress } from 'utils'

import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import CandleSticks from '../../components/CandleSticks'
import { GreyCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import CurrencyLogo from '../../components/CurrencyLogo'
import Loader from '../../components/Loader'
import Row, { AutoRow, RowBetween, RowFixed } from '../../components/Row'
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
import {
  ArrowWrapper,
  Dots,
  ResponsiveTooltipContainer,
  SwapCallbackError,
  Wrapper,
} from '../../components/swap/styleds'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import TokenWarningModal from '../../components/TokenWarningModal'
import { useAllTokens, useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback'
import useENSAddress from '../../hooks/useENSAddress'
import { SignatureData, useERC20PermitFromTrade, UseERC20PermitState } from '../../hooks/useERC20Permit'
import useIsArgentWallet from '../../hooks/useIsArgentWallet'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import { Version } from '../../hooks/useToggledVersion'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback'
import { useActiveWeb3React } from '../../hooks/web3'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/market/actions'
import { useDefaultsFromURLSearch } from '../../state/market/hooks'
import { usePoolAddress } from '../../state/swap/hooks'
import { useExpertModeManager, useIsGaslessMode } from '../../state/user/hooks'
import { LinkStyledButton, TYPE } from '../../theme'
import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
import { getTradeVersion } from '../../utils/getTradeVersion'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { warningSeverity } from '../../utils/prices'
import AppBody from '../AppBody'

const WarningTitle = styled.div`
  width: 95%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  color: ${({ theme }) => theme.white};
`
const WarningDescription = styled.div`
  border-radius: 15px;
  background-color: #ff4343;
  width: 100%;
  padding: 10px;
  font-size: 15px;
  color: ${({ theme }) => theme.white};
`

const PriceImpactWarning = styled.div`
  border: 1px solid red;
  border-radius: 10px;
  background-color: #ff4343;
  margin: 10px;
  margin-bottom: 2px;
  padding: 10px;
  display: flex;
  justify-content: center;
`

const ReferralStylePro = styled.div`
  margin: 5px 0px;
  width: 100%;
  display: flex;
  justify-content: center;
  vertical-align: middle;
`

const ReferralStyle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
`

const ReferralContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-content: center;
  justify-content: center;
  padding: 8px;
  width: 100%;
`

const ReferralElement1 = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const ReferralElement2 = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const NoWalletStyle = styled.div`
  display: flex;
  align-content: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  flex-direction: column;

  padding-top: 20px;
  padding-bottom: 20px;
  padding-left: 20px;
  padding-right: 5px;
`

const StyledCopyButton = styled.a`
  :hover {
    text-decoration: underline;
  }

  :active {
    color: darkblue;
  }

  :visited {
    color: darkblue;
  }
`

const ClassicModeContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  border: none;
  height: 100%;
  width: 475px;
  padding: 1rem 0 8rem 0;
  z-index: 0;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    width: 100%;
    justify-content: center;
    padding: 1rem 1rem 8rem 1rem;
  `};
`

const StyledSwap = styled.div`
  flex-grow: 1;
  max-width: 100%;
  width: 100%;
  @media screen and (max-width: 1592px) {
    flex: 0 0 475px;
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

const FlexContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  border: none;
  padding: 1rem;
  width: calc(100% - 1rem);
  height: 100%;
  min-height: 90vh;
  z-index: 0;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
    height: 100%;
    padding: 1rem 1rem 8rem 1rem;
  `};
`

const FlexItem = styled.div`
  align-self: stretch;
  justify-self: stretch;

  :nth-child(1) {
    flex: 1;
  }

  :nth-child(2) {
    flex: 0 0 475px;
    max-width: 475px;
    ${({ theme }) => theme.mediaWidth.upToLarge`
      flex: 1;
      max-width: 100%;
    `};
  }
`

export default function Market({ history }: RouteComponentProps) {
  const { chainId, account } = useActiveWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()
  const [expertMode] = useExpertModeManager()
  const [priceImpactAccepted, setPriceImpactAccepted] = useState(false)
  const [feeImpactAccepted, setFeeImpactAccepted] = useState(false)
  const refEnabled = false //process.env.REACT_APP_REFERRAL_ENABLED
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
  const isGaslessMode =
    useIsGaslessMode() &&
    chainId !== SupportedChainId.OPTIMISM &&
    chainId !== SupportedChainId.BASE &&
    chainId !== SupportedChainId.MAINNET

  const obj = sessionStorage.getItem('referral')

  const [copied, setCopied] = useState(false)

  const [referer, setReferer] = useState<string | null>(null)

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.href}/r/${account}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 15000)
  }

  if (obj && obj != '' && referer == null && account && obj != account) setReferer(obj)

  const toggledVersion = Version.v2
  if (window.location.hash.includes('/r/0x')) {
    const index = window.location.hash.search('0x')
    const ref = window.location.hash.substring(index, index + 42)

    sessionStorage.setItem('referral', ref)
    window.location.hash = '#/swap'
  }

  // swap state
  const { independentField, typedValue, recipient } = useMarketState()

  // modal and loading
  const [
    { showConfirm, tradeToConfirm, signatureDataNew, swapTransactionNew, swapErrorMessage, attemptingTxn, txHash },
    setSwapState,
  ] = useState<{
    showConfirm: boolean
    tradeToConfirm: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined
    signatureDataNew: SignatureData | null
    swapTransactionNew: SwapTransaction | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    signatureDataNew: null,
    swapTransactionNew: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const {
    v2Trade: { state: v3TradeState, tx: swapTransaction },
    bestTrade: trade,
    allowedSlippage,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    paymentToken,
    paymentFees,
    priceImpactHigh,
    feeImpactHigh,
    amountToReceive,
    inputTokenShouldBeWrapped,
    quoteError,
  } = useDerivedMarketInfo(
    toggledVersion,
    showConfirm,
    isGaslessMode,
    signatureDataNew,
    feeImpactAccepted,
    priceImpactAccepted
  )

  if (currencies.OUTPUT == undefined) currencies.OUTPUT = null
  if (currencies.INPUT == undefined) currencies.INPUT = null

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const { address: recipientAddress } = useENSAddress(recipient)

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
    [independentField, parsedAmount, showWrap, trade?.inputAmount, trade?.outputAmount]
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
  // @dev: default value =  ApprovalState.UNKNOWN
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

  // check if the allowance of the user is still loading (=/= pending)
  const [approvalLoading, setApprovalLoading] = useState<boolean>(false)
  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  useEffect(() => {
    if (allowedSlippage && trade && approvalState === ApprovalState.UNKNOWN) {
      setApprovalLoading(true)
    } else setApprovalLoading(false)
  }, [allowedSlippage, trade, approvalState])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const showCommonQuantityButtons = Boolean(maxInputAmount?.greaterThan(0))

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useMarketCallback(
    trade,
    allowedSlippage,
    recipient,
    referer,
    signatureData,
    parsedAmounts[Field.INPUT],
    swapTransaction,
    showConfirm,
    isGaslessMode
  )

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    if (priceImpact && !confirmPriceImpactWithoutFee(priceImpact)) {
      return
    }
    setSwapState({
      attemptingTxn: true,
      tradeToConfirm,
      showConfirm,
      signatureDataNew: signatureData,
      swapTransactionNew: swapTransaction,
      swapErrorMessage: undefined,
      txHash: undefined,
    })
    swapCallback()
      .then((hash) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          signatureDataNew: signatureData,
          swapTransactionNew: swapTransaction,
          swapErrorMessage: undefined,
          txHash: hash,
        })
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

        window.safary?.trackSwap({
          fromAmount: parseFloat(trade?.inputAmount.quotient?.toString() ?? '0'),
          fromCurrency: trade?.inputAmount.currency.symbol as string,
          fromAmountUSD: parseFloat(fiatValueInput?.quotient?.toString() ?? '0'),
          contractAddress: LIMIT_ORDER_MANAGER_ADDRESSES[chainId as number],
          parameters: {
            walletAddress: account as string,
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
          signatureDataNew: signatureData,
          swapTransactionNew: swapTransaction,
          swapErrorMessage: error.message,
          txHash: undefined,
        })
      })
  }, [
    account,
    priceImpact,
    recipient,
    recipientAddress,
    showConfirm,
    signatureData,
    swapCallback,
    swapTransaction,
    trade,
    tradeToConfirm,
  ])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(true)

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
  }, [priceImpact, trade?.priceImpact])

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
    setSwapState({
      showConfirm: false,
      tradeToConfirm,
      signatureDataNew: null,
      swapTransactionNew: undefined,
      attemptingTxn,
      swapErrorMessage,
      txHash,
    })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, swapErrorMessage, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({
      tradeToConfirm: trade,
      signatureDataNew: signatureData,
      swapTransactionNew: swapTransaction,
      swapErrorMessage,
      txHash,
      attemptingTxn,
      showConfirm,
    })
  }, [attemptingTxn, showConfirm, signatureData, swapErrorMessage, swapTransaction, trade, txHash])

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleCommonQuantityInput = useCallback(
    (commonQuantity: CommonQuantity) => {
      if (maxInputAmount) {
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
    (outputCurrency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
    [onCurrencySelection]
  )

  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  const aToken = currencies && currencies[Field.INPUT] ? currencies[Field.INPUT] : undefined
  const bToken = currencies && currencies[Field.OUTPUT] ? currencies[Field.OUTPUT] : undefined
  const fee = undefined
  const { poolAddress, networkName } = usePoolAddress(aToken, bToken, fee)

  const wrapToken = function () {
    onCurrencySelection(Field.OUTPUT, WRAPPED_NATIVE_CURRENCY[chainId ?? 1])
  }
  const togglePriceImpactAccepted = () => {
    setPriceImpactAccepted(!priceImpactAccepted)
  }
  const toggleFeeImpactAccepted = () => {
    setFeeImpactAccepted(!feeImpactAccepted)
  }

  if (expertMode) {
    return (
      <>
        <FlexContainer>
          <FlexItem>
            <CandleSticks networkName={networkName} poolAddress={poolAddress} />
          </FlexItem>
          <FlexItem>
            <StyledSwap>
              <TokenWarningModal
                isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
                tokens={importTokensNotInDefault}
                onConfirm={handleConfirmTokenWarning}
                onDismiss={handleDismissTokenWarning}
              />
              <AppBody>
                <MarketHeader showChartSwitch={true} allowedSlippage={allowedSlippage} />
                <Wrapper id="swap-page">
                  <ConfirmMarketModal
                    isOpen={showConfirm}
                    trade={trade}
                    originalTrade={tradeToConfirm}
                    swapTransaction={swapTransaction}
                    originalSwapTransaction={swapTransactionNew}
                    onAcceptChanges={handleAcceptChanges}
                    attemptingTxn={attemptingTxn}
                    txHash={txHash}
                    recipient={recipient}
                    allowedSlippage={allowedSlippage}
                    onConfirm={handleSwap}
                    swapErrorMessage={swapErrorMessage}
                    onDismiss={handleConfirmDismiss}
                    referer={referer}
                    paymentToken={paymentToken}
                    paymentFees={paymentFees}
                    priceImpactHigh={priceImpactHigh}
                    feeImpactHigh={feeImpactHigh}
                    updateFeeImpact={toggleFeeImpactAccepted}
                    updatePriceImpact={togglePriceImpactAccepted}
                    priceImpactAccepted={priceImpactAccepted}
                    feeImpactAccepted={feeImpactAccepted}
                    routeIsNotFound={routeNotFound}
                    quoteErrorMessage={quoteError}
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
                        actionLabel={t`You sell`}
                        value={formattedAmounts[Field.INPUT]}
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
                        actionLabel={t`You buy`}
                        value={formattedAmounts[Field.OUTPUT]}
                        onUserInput={handleTypeOutput}
                        label={
                          independentField === Field.INPUT && !showWrap ? (
                            <Trans>To (at least)</Trans>
                          ) : (
                            <Trans>To</Trans>
                          )
                        }
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
                      <AutoColumn>
                        <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                          <ArrowWrapper clickable={false}>
                            <ArrowDown size="16" color={theme.text2} />
                          </ArrowWrapper>
                          <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                            <Trans>- Remove recipient</Trans>
                          </LinkStyledButton>
                        </AutoRow>
                        <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                      </AutoColumn>
                    ) : null}
                    {!showWrap && trade && (
                      <div>
                        <Row justify={!trade ? 'center' : 'space-between'}>
                          <RowFixed style={{ position: 'relative' }}>
                            <MouseoverTooltipContent
                              wrap={false}
                              content={
                                <ResponsiveTooltipContainer origin="top right" width={'295px'}>
                                  <Row justify={!trade ? 'center' : 'space-between'}>
                                    <RowFixed>
                                      <Text fontSize={14} fontWeight={400}>
                                        <Trans>Allowed Slippage:</Trans>
                                      </Text>
                                    </RowFixed>
                                    <RowFixed>
                                      <Text fontSize={14} fontWeight={400}>
                                        {allowedSlippage.toSignificant(2)}%
                                      </Text>
                                    </RowFixed>
                                  </Row>
                                  <Row justify={!trade ? 'center' : 'space-between'}>
                                    <RowFixed>
                                      <Text fontSize={14} fontWeight={400}>
                                        <Trans>Minimum Received:</Trans>
                                      </Text>
                                    </RowFixed>
                                    <RowFixed>
                                      <Text fontSize={14} fontWeight={400}>
                                        {isGaslessMode ? (
                                          <span>
                                            {amountToReceive?.toSignificant(6)} {trade?.outputAmount.currency.symbol}
                                          </span>
                                        ) : (
                                          <span>
                                            {trade?.minimumAmountOut(allowedSlippage).toSignificant(4)}{' '}
                                            {trade?.outputAmount.currency.symbol}
                                          </span>
                                        )}
                                      </Text>
                                    </RowFixed>
                                  </Row>
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
                            <Trans>
                              <span style={{ position: 'relative', left: '-4px' }}>&nbsp;Price: </span>
                            </Trans>
                          </RowFixed>
                          <RowFixed>
                            <LoadingOpacityContainer $loading={routeIsSyncing}>
                              <TradePrice
                                price={trade.executionPrice}
                                showInverted={showInverted}
                                setShowInverted={setShowInverted}
                              />
                            </LoadingOpacityContainer>
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
                        </Row>
                        {isGaslessMode && (
                          <Row justify={!trade ? 'center' : 'space-between'}>
                            <RowFixed style={{ position: 'relative' }}>
                              <MouseoverTooltipContent
                                wrap={false}
                                content={
                                  <ResponsiveTooltipContainer origin="top right" width={'295px'}>
                                    Total fees amount, denominated in the payment token.
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
                              <TYPE.body color={theme.text2} fontWeight={400} fontSize={14} justifyContent="start">
                                <Trans>Est. Fees:</Trans>
                              </TYPE.body>
                            </RowFixed>
                            {paymentFees && (
                              <RowFixed>
                                {paymentFees.toSignificant(4)} {paymentToken?.symbol}{' '}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  xmlnsXlink="http://www.w3.org/1999/xlink"
                                  width="22"
                                  height="18"
                                  viewBox="0 0 30 30"
                                  style={{ position: 'relative', top: '0px' }}
                                >
                                  <image
                                    x="4"
                                    y="4"
                                    width="22"
                                    height="23"
                                    xlinkHref="data:img/png;base64,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"
                                  />
                                </svg>
                              </RowFixed>
                            )}
                          </Row>
                        )}
                      </div>
                    )}
                    {inputTokenShouldBeWrapped && isGaslessMode && (
                      <AutoColumn gap="lg" justify="center">
                        <WarningDescription>
                          <WarningTitle>
                            <span style={{ position: 'relative', top: '-8px', left: '-5px' }}>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="25"
                                height="25"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                              </svg>
                            </span>
                            Switch to {WRAPPED_NATIVE_CURRENCY[chainId ?? 1]?.symbol} or wrap your{' '}
                            {CHAIN_NATIVE_TOKEN_SYMBOL[chainId ?? 1]} <br />
                            <br />
                          </WarningTitle>
                          Gasless trading operates with ERC20 tokens in order to execute the trade. Since{' '}
                          {CHAIN_NATIVE_TOKEN_SYMBOL[chainId ?? 1]} is native token (not ERC20 token), wrap operation is
                          needed to proceed with the trade.
                        </WarningDescription>
                        <ButtonPrimary onClick={wrapToken}>
                          Wrap my {CHAIN_NATIVE_TOKEN_SYMBOL[chainId ?? 1]}
                        </ButtonPrimary>
                      </AutoColumn>
                    )}
                    {currencies[Field.OUTPUT] && currencies[Field.OUTPUT]?.isToken && (
                      <AddTokenToWallet token={currencies[Field.OUTPUT] as Token} />
                    )}
                    {priceImpactHigh && (
                      <PriceImpactWarning>
                        <span>
                          Price impact is greater than 20%. Swap anyway?{' '}
                          <input
                            type="checkbox"
                            onChange={togglePriceImpactAccepted}
                            defaultChecked={priceImpactAccepted}
                          />{' '}
                        </span>
                      </PriceImpactWarning>
                    )}

                    {feeImpactHigh && (
                      <PriceImpactWarning>
                        <span>
                          Fee impact is greater than 20%. Swap anyway?{' '}
                          <input
                            type="checkbox"
                            onChange={() => toggleFeeImpactAccepted()}
                            defaultChecked={feeImpactAccepted}
                          />{' '}
                        </span>
                      </PriceImpactWarning>
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
                      ) : routeIsSyncing || routeIsLoading || approvalLoading ? (
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
                          <AutoColumn style={{ width: '100%' }} gap="md">
                            <ButtonConfirmed
                              onClick={handleApprove}
                              disabled={
                                (approvalState !== ApprovalState.NOT_APPROVED && approvalSubmitted) ||
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
                                <span
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    whiteSpace: 'break-spaces',
                                    width: '100%',
                                  }}
                                >
                                  <CurrencyLogo
                                    currency={currencies[Field.INPUT]}
                                    size={'20px'}
                                    style={{ marginRight: '8px', flexShrink: 0 }}
                                  />
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'center',
                                      width: '100%',
                                    }}
                                  >
                                    {/* we need to shorten this string on mobile */}
                                    {approvalState === ApprovalState.APPROVED ||
                                    signatureState === UseERC20PermitState.SIGNED ? (
                                      <Trans>You can now swap {currencies[Field.INPUT]?.symbol}</Trans>
                                    ) : (
                                      <Trans>Allow Kromatika to use your {currencies[Field.INPUT]?.symbol}</Trans>
                                    )}
                                  </div>
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
                                setSwapState({
                                  tradeToConfirm: trade,
                                  attemptingTxn: false,
                                  swapErrorMessage: undefined,
                                  showConfirm: true,
                                  signatureDataNew: signatureData,
                                  swapTransactionNew: swapTransaction,
                                  txHash: undefined,
                                })
                              }}
                              width="100%"
                              id="swap-button"
                              disabled={
                                !isValid ||
                                (approvalState !== ApprovalState.APPROVED &&
                                  signatureState !== UseERC20PermitState.SIGNED)
                              }
                              error={!isValid}
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
                            setSwapState({
                              tradeToConfirm: trade,
                              attemptingTxn: false,
                              swapErrorMessage: undefined,
                              showConfirm: true,
                              signatureDataNew: signatureData,
                              swapTransactionNew: swapTransaction,
                              txHash: undefined,
                            })
                          }}
                          id="swap-button"
                          disabled={!isValid || !!swapCallbackError}
                          error={!isValid && !swapCallbackError}
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
              {refEnabled && (
                <ReferralStylePro>
                  <AppBody>
                    {account ? (
                      <Trans>
                        <ReferralContainer>
                          <ReferralElement1>
                            <svg
                              width="40px"
                              height="40px"
                              viewBox="0 0 23 23"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              style={{ marginRight: '30px' }}
                            >
                              <rect
                                x="2"
                                y="21"
                                width="7"
                                height="5"
                                rx="0.6"
                                transform="rotate(-90 2 21)"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                              <rect
                                x="17"
                                y="15.5"
                                width="7"
                                height="5"
                                rx="0.6"
                                transform="rotate(-90 17 15.5)"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                              <rect
                                x="2"
                                y="10"
                                width="7"
                                height="5"
                                rx="0.6"
                                transform="rotate(-90 2 10)"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                              <path
                                d="M7 17.5H10.5C11.6046 17.5 12.5 16.6046 12.5 15.5V8.5C12.5 7.39543 11.6046 6.5 10.5 6.5H7"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                              <path d="M12.5 12H17" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          </ReferralElement1>
                          <ReferralElement2>
                            <Text>
                              <Trans>Earn crypto by sharing the following referral link </Trans>
                              <StyledCopyButton onClick={handleCopy} id="walletAddress">
                                {shortenAddress(account)} {copied ? <span>(Copied)</span> : <span>Copy</span>}
                              </StyledCopyButton>
                            </Text>
                          </ReferralElement2>
                        </ReferralContainer>
                      </Trans>
                    ) : (
                      <Trans>
                        <NoWalletStyle>
                          Connect wallet to generate referral link. How it works ?{' '}
                          <a href="https://docs.kromatika.finance" target="_blank" rel="noreferrer">
                            Read More
                          </a>
                        </NoWalletStyle>
                      </Trans>
                    )}
                  </AppBody>
                </ReferralStylePro>
              )}
            </StyledSwap>
          </FlexItem>
        </FlexContainer>
      </>
    )
  }

  return (
    <ClassicModeContainer>
      <TokenWarningModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
        onDismiss={handleDismissTokenWarning}
      />
      <StyledSwap>
        <AppBody>
          <MarketHeader showChartSwitch={true} allowedSlippage={allowedSlippage} />
          <Wrapper id="swap-page">
            <ConfirmMarketModal
              isOpen={showConfirm}
              trade={trade}
              originalTrade={tradeToConfirm}
              swapTransaction={swapTransaction}
              originalSwapTransaction={swapTransactionNew}
              onAcceptChanges={handleAcceptChanges}
              attemptingTxn={attemptingTxn}
              txHash={txHash}
              recipient={recipient}
              allowedSlippage={allowedSlippage}
              onConfirm={handleSwap}
              swapErrorMessage={swapErrorMessage}
              onDismiss={handleConfirmDismiss}
              referer={referer}
              paymentToken={paymentToken}
              paymentFees={paymentFees}
              priceImpactHigh={priceImpactHigh}
              feeImpactHigh={feeImpactHigh}
              updateFeeImpact={toggleFeeImpactAccepted}
              updatePriceImpact={togglePriceImpactAccepted}
              priceImpactAccepted={priceImpactAccepted}
              feeImpactAccepted={feeImpactAccepted}
              routeIsNotFound={routeNotFound}
              quoteErrorMessage={quoteError}
            />
            <AutoColumn gap={'md'}>
              <div style={{ display: 'relative' }}>
                <CurrencyInputPanel
                  actionLabel={t`You sell`}
                  label={
                    independentField === Field.OUTPUT && !showWrap ? <Trans>From (at most)</Trans> : <Trans>From</Trans>
                  }
                  value={formattedAmounts[Field.INPUT]}
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
                  actionLabel={t`You buy`}
                  value={formattedAmounts[Field.OUTPUT]}
                  onUserInput={handleTypeOutput}
                  label={
                    independentField === Field.INPUT && !showWrap ? <Trans>To (at least)</Trans> : <Trans>To</Trans>
                  }
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
              {!showWrap && trade && (
                <AutoColumn gap="sm">
                  <RowBetween>
                    <RowFixed>
                      <MouseoverTooltipContent
                        wrap={false}
                        content={
                          <ResponsiveTooltipContainer origin="top right" width={'295px'}>
                            <Row justify={!trade ? 'center' : 'space-between'}>
                              <RowFixed>
                                <Text fontSize={14} fontWeight={400}>
                                  <Trans>Allowed Slippage:</Trans>
                                </Text>
                              </RowFixed>
                              <RowFixed>
                                <Text fontSize={14} fontWeight={400}>
                                  <Trans>{allowedSlippage.toSignificant(2)}%</Trans>
                                </Text>
                              </RowFixed>
                            </Row>
                            <Row justify={!trade ? 'center' : 'space-between'}>
                              <RowFixed>
                                <Text fontSize={14} fontWeight={400}>
                                  <Trans>Minimum Received:</Trans>
                                </Text>
                              </RowFixed>
                              <RowFixed>
                                <Text fontSize={14} fontWeight={400}>
                                  {isGaslessMode ? (
                                    <span>
                                      {amountToReceive?.toSignificant(6)} {trade?.outputAmount.currency.symbol}
                                    </span>
                                  ) : (
                                    <span>
                                      {trade
                                        ? `${trade?.minimumAmountOut(allowedSlippage).toSignificant(4)} ${
                                            trade?.outputAmount.currency.symbol
                                          }`
                                        : '-'}
                                    </span>
                                  )}
                                </Text>
                              </RowFixed>
                            </Row>
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
                      <TYPE.body color={theme.text2} fontWeight={400} fontSize={14} justifyContent="start">
                        <Trans>Price</Trans>
                      </TYPE.body>
                    </RowFixed>
                    <RowFixed>
                      <LoadingOpacityContainer $loading={routeIsSyncing}>
                        <TradePrice
                          price={trade.executionPrice}
                          showInverted={showInverted}
                          setShowInverted={setShowInverted}
                        />
                      </LoadingOpacityContainer>
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
                  </RowBetween>
                  {isGaslessMode && (
                    <Row justify={!trade ? 'center' : 'space-between'}>
                      <RowFixed style={{ position: 'relative' }}>
                        <MouseoverTooltipContent
                          wrap={false}
                          content={
                            <ResponsiveTooltipContainer origin="top right" width={'295px'}>
                              Total fees amount, denominated in the payment token.
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
                        <TYPE.body color={theme.text2} fontWeight={400} fontSize={14} justifyContent="start">
                          <Trans>Est. Fees:</Trans>
                        </TYPE.body>
                      </RowFixed>
                      {paymentFees && (
                        <RowFixed>
                          {paymentFees.toSignificant(4)} {paymentToken?.symbol}{' '}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            xmlnsXlink="http://www.w3.org/1999/xlink"
                            width="22"
                            height="18"
                            viewBox="0 0 30 30"
                            style={{ position: 'relative', top: '0px' }}
                          >
                            <image
                              x="4"
                              y="4"
                              width="22"
                              height="23"
                              xlinkHref="data:img/png;base64,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"
                            />
                          </svg>
                        </RowFixed>
                      )}
                    </Row>
                  )}
                </AutoColumn>
              )}
              {inputTokenShouldBeWrapped && isGaslessMode && (
                <AutoColumn gap="lg" justify="center">
                  <WarningDescription>
                    <WarningTitle>
                      <span style={{ position: 'relative', top: '-8px', left: '-5px' }}>
                        {' '}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="25"
                          height="25"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                          <line x1="12" y1="9" x2="12" y2="13"></line>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                      </span>
                      Switch to {WRAPPED_NATIVE_CURRENCY[chainId ?? 1]?.symbol} or wrap your{' '}
                      {CHAIN_NATIVE_TOKEN_SYMBOL[chainId ?? 1]} <br />
                      <br />{' '}
                    </WarningTitle>
                    Gasless trading operates with ERC20 tokens in order to execute the trade. Since{' '}
                    {CHAIN_NATIVE_TOKEN_SYMBOL[chainId ?? 1]} is native token (not ERC20 token), wrap operation is
                    needed to proceed with the trade.
                  </WarningDescription>
                  <ButtonPrimary onClick={wrapToken}>Wrap my {CHAIN_NATIVE_TOKEN_SYMBOL[chainId ?? 1]}</ButtonPrimary>
                </AutoColumn>
              )}
              {currencies[Field.OUTPUT] && currencies[Field.OUTPUT]?.isToken && (
                <AddTokenToWallet token={currencies[Field.OUTPUT] as Token} />
              )}
              {priceImpactHigh && (
                <PriceImpactWarning>
                  <span>
                    Price impact is greater than 20%. Swap anyway?{' '}
                    <input type="checkbox" onChange={togglePriceImpactAccepted} defaultChecked={priceImpactAccepted} />{' '}
                  </span>
                </PriceImpactWarning>
              )}
              {feeImpactHigh && (
                <PriceImpactWarning>
                  <span>
                    Fee impact is greater than 20%. Swap anyway?{' '}
                    <input
                      type="checkbox"
                      onChange={() => toggleFeeImpactAccepted()}
                      defaultChecked={feeImpactAccepted}
                    />
                  </span>
                </PriceImpactWarning>
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
                ) : routeIsSyncing || routeIsLoading || approvalLoading ? (
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
                    <AutoColumn style={{ width: '100%' }} gap="md">
                      <ButtonConfirmed
                        onClick={handleApprove}
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
                        <AutoRow justify="space-between" style={{ flexWrap: 'nowrap' }}>
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              whiteSpace: 'break-spaces',
                              width: '100%',
                            }}
                          >
                            <CurrencyLogo
                              currency={currencies[Field.INPUT]}
                              size={'20px'}
                              style={{ marginRight: '8px', flexShrink: 0 }}
                            />
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                width: '100%',
                              }}
                            >
                              {/* we need to shorten this string on mobile */}
                              {approvalState === ApprovalState.APPROVED ||
                              signatureState === UseERC20PermitState.SIGNED ? (
                                <Trans>You can now swap {currencies[Field.INPUT]?.symbol}</Trans>
                              ) : (
                                <Trans>Allow Kromatika to use your {currencies[Field.INPUT]?.symbol}</Trans>
                              )}
                            </div>
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
                          setSwapState({
                            tradeToConfirm: trade,
                            attemptingTxn: false,
                            swapErrorMessage: undefined,
                            showConfirm: true,
                            signatureDataNew: signatureData,
                            swapTransactionNew: swapTransaction,
                            txHash: undefined,
                          })
                        }}
                        width="100%"
                        id="swap-button"
                        disabled={
                          !isValid ||
                          (approvalState !== ApprovalState.APPROVED && signatureState !== UseERC20PermitState.SIGNED)
                        }
                        error={!isValid}
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
                      setSwapState({
                        tradeToConfirm: trade,
                        attemptingTxn: false,
                        swapErrorMessage: undefined,
                        showConfirm: true,
                        signatureDataNew: signatureData,
                        swapTransactionNew: swapTransaction,
                        txHash: undefined,
                      })
                    }}
                    id="swap-button"
                    disabled={!isValid || !!swapCallbackError}
                    error={!isValid && !swapCallbackError}
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
      </StyledSwap>
      <SwitchLocaleLink />

      {!swapIsUnsupported ? null : (
        <UnsupportedCurrencyFooter
          show={swapIsUnsupported}
          currencies={[currencies[Field.INPUT], currencies[Field.OUTPUT]]}
        />
      )}
      {refEnabled && (
        <ReferralStyle>
          <AppBody>
            {account ? (
              <Trans>
                <ReferralContainer>
                  <ReferralElement1>
                    <svg
                      width="40px"
                      height="40px"
                      viewBox="0 0 23 23"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ marginRight: '30px' }}
                    >
                      <rect
                        x="2"
                        y="21"
                        width="7"
                        height="5"
                        rx="0.6"
                        transform="rotate(-90 2 21)"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <rect
                        x="17"
                        y="15.5"
                        width="7"
                        height="5"
                        rx="0.6"
                        transform="rotate(-90 17 15.5)"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <rect
                        x="2"
                        y="10"
                        width="7"
                        height="5"
                        rx="0.6"
                        transform="rotate(-90 2 10)"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M7 17.5H10.5C11.6046 17.5 12.5 16.6046 12.5 15.5V8.5C12.5 7.39543 11.6046 6.5 10.5 6.5H7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path d="M12.5 12H17" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </ReferralElement1>
                  <ReferralElement2>
                    <Text>
                      <Trans>Earn crypto by sharing the following referral link </Trans>
                      <StyledCopyButton onClick={handleCopy} id="walletAddress">
                        {shortenAddress(account)} {copied ? <span>(Copied)</span> : <span>Copy</span>}
                      </StyledCopyButton>
                    </Text>
                  </ReferralElement2>
                </ReferralContainer>
              </Trans>
            ) : (
              <Trans>
                <NoWalletStyle>
                  Connect wallet to generate referral link. How it works ?
                  <a href="https://docs.kromatika.finance" target="_blank" rel="noreferrer">
                    Read More
                  </a>
                </NoWalletStyle>
              </Trans>
            )}
          </AppBody>
        </ReferralStyle>
      )}
    </ClassicModeContainer>
  )
}
