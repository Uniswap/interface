import { Interface } from '@ethersproject/abi'
import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent, Trace, TraceEvent, useTrace } from '@uniswap/analytics'
import {
  BrowserEvent,
  InterfaceElementName,
  InterfaceEventName,
  InterfacePageName,
  InterfaceSectionName,
  SharedEventName,
  SwapEventName,
} from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import POOL_EXTENDED_ABI from 'abis/pool-extended.json'
import { sendEvent } from 'components/analytics'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import PriceImpactWarning from 'components/swap/PriceImpactWarning'
import SwapDetailsDropdown from 'components/swap/SwapDetailsDropdown'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import { getChainInfo } from 'constants/chainInfo'
import { isSupportedChain, SupportedChainId } from 'constants/chains'
import useENSAddress from 'hooks/useENSAddress'
import { useMaxAmountIn } from 'hooks/useMaxAmountIn'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import usePrevious from 'hooks/usePrevious'
import { useSwapCallback } from 'hooks/useSwapCallback'
import { useUSDPrice } from 'hooks/useUSDPrice'
import JSBI from 'jsbi'
import { formatSwapQuoteReceivedEventProperties } from 'lib/utils/analytics'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { ReactNode } from 'react'
import { ArrowDown } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { InterfaceTrade } from 'state/routing/types'
import { TradeState } from 'state/routing/types'
import styled, { useTheme } from 'styled-components/macro'
import { currencyAmountToPreciseFloat, formatTransactionAmount } from 'utils/formatNumbers'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { switchChain } from 'utils/switchChain'

import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { ButtonConfirmed, ButtonError, ButtonGray, ButtonLight, ButtonPrimary } from '../../components/Button'
import { GrayCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import SwapCurrencyInputPanel from '../../components/CurrencyInputPanel/SwapCurrencyInputPanel'
import Loader from '../../components/Loader'
import { AutoRow, RowFixed } from '../../components/Row'
import SmartPoolSearchModal from '../../components/SearchModal/SmartPoolSearchModal'
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal'
import { ArrowWrapper, PageWrapper, SwapCallbackError, SwapWrapper } from '../../components/swap/styleds'
import SwapHeader from '../../components/swap/SwapHeader'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import { getSwapCurrencyId, TOKEN_SHORTHANDS } from '../../constants/tokens'
import { useCurrency, useDefaultActiveTokens } from '../../hooks/Tokens'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
//import { PoolInitParams, PoolWithAddress } from '../../hooks/useSmartPools'
import useWrapCallback, { WrapErrorText, WrapType } from '../../hooks/useWrapCallback'
import { useMultipleContractSingleData } from '../../lib/hooks/multicall'
import { useAllPoolsData /*, useRegisteredPools*/ } from '../../state/pool/hooks'
import { Field, replaceSwapState } from '../../state/swap/actions'
import { useDefaultsFromURLSearch, useDerivedSwapInfo, useSwapActionHandlers } from '../../state/swap/hooks'
import swapReducer, { initialState as initialSwapState, SwapState } from '../../state/swap/reducer'
import { useExpertModeManager } from '../../state/user/hooks'
import { ThemedText } from '../../theme'
import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { computeRealizedPriceImpact, warningSeverity } from '../../utils/prices'
import { supportedChainId } from '../../utils/supportedChainId'

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const ArrowContainer = styled.div`
  display: inline-block;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;
`

const PoolSelect = styled(ButtonGray)<{
  visible: boolean
  selected: boolean
  hideInput?: boolean
  disabled?: boolean
}>`
  align-items: center;
  background-color: ${({ selected, theme }) => (selected ? theme.deprecated_bg2 : theme.deprecated_primary1)};
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  color: ${({ selected, theme }) => (selected ? theme.deprecated_text1 : theme.deprecated_white)};
  cursor: pointer;
  border-radius: 16px;
  outline: none;
  user-select: none;
  border: none;
  font-size: 24px;
  font-weight: 500;
  height: ${({ hideInput }) => (hideInput ? '2.8rem' : '2.4rem')};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  padding: 0 8px;
  justify-content: space-between;
  margin-bottom: 16px;
  margin-left: ${({ hideInput }) => (hideInput ? '0' : '12px')};
  :focus,
  :hover {
    background-color: ${({ selected, theme }) =>
      selected ? theme.deprecated_bg3 : darken(0.05, theme.deprecated_primary1)};
  }
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
`

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  margin: 0 0.25rem 0 0.35rem;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.deprecated_text1 : theme.deprecated_white)};
    stroke-width: 1.5px;
  }
`

const SwapSection = styled.div`
  position: relative;
  background-color: ${({ theme }) => theme.backgroundModule};
  border-radius: 12px;
  padding: 16px;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;

  &:before {
    box-sizing: border-box;
    background-size: 100%;
    border-radius: inherit;

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
    pointer-events: none;
    content: '';
    border: 1px solid ${({ theme }) => theme.backgroundModule};
  }

  &:hover:before {
    border-color: ${({ theme }) => theme.stateOverlayHover};
  }

  &:focus-within:before {
    border-color: ${({ theme }) => theme.stateOverlayPressed};
  }
`

const OutputSwapSection = styled(SwapSection)`
  border-bottom: ${({ theme }) => `1px solid ${theme.backgroundSurface}`};
`

function getIsValidSwapQuote(
  trade: InterfaceTrade | undefined,
  tradeState: TradeState,
  swapInputError?: ReactNode
): boolean {
  return Boolean(swapInputError && trade && tradeState === TradeState.VALID)
}

function largerPercentValue(a?: Percent, b?: Percent) {
  if (a && b) {
    return a.greaterThan(b) ? a : b
  } else if (a) {
    return a
  } else if (b) {
    return b
  }
  return undefined
}

const TRADE_STRING = 'SwapRouter'

export default function SwapPage({ className }: { className?: string }) {
  const { chainId: connectedChainId } = useWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()
  return (
    <Trace page={InterfacePageName.SWAP_PAGE} shouldLogImpression>
      <PageWrapper>
        <Swap
          className={className}
          chainId={connectedChainId}
          prefilledState={{
            [Field.INPUT]: { currencyId: loadedUrlParams?.[Field.INPUT]?.currencyId },
            [Field.OUTPUT]: { currencyId: loadedUrlParams?.[Field.OUTPUT]?.currencyId },
          }}
        />
        <NetworkAlert />
      </PageWrapper>
      <SwitchLocaleLink />
    </Trace>
  )
}

/**
 * The swap component displays the swap interface, manages state for the swap, and triggers onchain swaps.
 *
 * In most cases, chainId should refer to the connected chain, i.e. `useWeb3React().chainId`.
 * However if this component is being used in a context that displays information from a different, unconnected
 * chain (e.g. the TDP), then chainId should refer to the unconnected chain.
 */
export function Swap({
  className,
  prefilledState = {},
  chainId,
  onCurrencyChange,
  disableTokenInputs = false,
}: {
  className?: string
  prefilledState?: Partial<SwapState>
  chainId?: SupportedChainId
  onCurrencyChange?: (selected: Pick<SwapState, Field.INPUT | Field.OUTPUT>) => void
  disableTokenInputs?: boolean
}) {
  const { account, chainId: connectedChainId, connector } = useWeb3React()
  const trace = useTrace()

  // token warning stuff
  const prefilledInputCurrency = useCurrency(prefilledState?.[Field.INPUT]?.currencyId)
  const prefilledOutputCurrency = useCurrency(prefilledState?.[Field.OUTPUT]?.currencyId)

  const [loadedInputCurrency, setLoadedInputCurrency] = useState(prefilledInputCurrency)
  const [loadedOutputCurrency, setLoadedOutputCurrency] = useState(prefilledOutputCurrency)

  useEffect(() => {
    setLoadedInputCurrency(prefilledInputCurrency)
    setLoadedOutputCurrency(prefilledOutputCurrency)
  }, [prefilledInputCurrency, prefilledOutputCurrency])

  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c?.isToken ?? false) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useDefaultActiveTokens(chainId)
  const importTokensNotInDefault = useMemo(
    () =>
      urlLoadedTokens &&
      urlLoadedTokens
        .filter((token: Token) => {
          return !(token.address in defaultTokens)
        })
        .filter((token: Token) => {
          // Any token addresses that are loaded from the shorthands map do not need to show the import URL
          const supported = supportedChainId(chainId)
          if (!supported) return true
          return !Object.keys(TOKEN_SHORTHANDS).some((shorthand) => {
            const shorthandTokenAddress = TOKEN_SHORTHANDS[shorthand][supported]
            return shorthandTokenAddress && shorthandTokenAddress === token.address
          })
        }),
    [chainId, defaultTokens, urlLoadedTokens]
  )

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletDrawer = useToggleAccountDrawer()

  // for expert mode
  const [isExpertMode] = useExpertModeManager()

  // TODO: the following is expensive as overwrites all pools data, however it is called just once. It is useful when
  //  switching chain in the swap page s otherwise the state is cleared when page is reloaded.
  //  We sould try and update state only if poolsLogs is undefined
  //const poolsLogs = useRegisteredPools()
  const { data: poolsLogs } = useAllPoolsData()
  const poolAddresses: (string | undefined)[] = useMemo(() => {
    if (!poolsLogs) return []

    return poolsLogs.map((p) => p.pool)
  }, [poolsLogs])
  const PoolInterface = new Interface(POOL_EXTENDED_ABI)
  const results = useMultipleContractSingleData(poolAddresses, PoolInterface, 'getPool')

  // TODO: careful: on swap page returns [], only by goint to 'Mint' page will it query events
  const operatedPools: Token[] | undefined = useMemo(() => {
    if (!account || !chainId || !results || !poolAddresses) return
    const mockToken = new Token(0, account, 1)
    return results
      .map((result, i) => {
        const { result: pools, loading } = result
        const poolAddress = poolAddresses[i]

        if (loading || !pools || !pools?.[0] || !poolAddress) return mockToken
        //const parsed: PoolInitParams[] | undefined = pools?.[0]
        const { name, symbol, decimals, owner } = pools?.[0]
        if (!name || !symbol || !decimals || !owner || !poolAddress) return mockToken
        //const poolWithAddress: PoolWithAddress = { name, symbol, decimals, owner, poolAddress }
        const isPoolOperator = owner === account
        if (!isPoolOperator) return mockToken
        return new Token(chainId, poolAddress, decimals, symbol, name)
      })
      .filter((p) => p !== mockToken)
    //.filter((p) => account === owner)
  }, [account, chainId, poolAddresses, results])

  const defaultPool = useMemo(() => {
    if (!operatedPools) return
    return operatedPools[0]
  }, [operatedPools])

  // swap state
  const [state, dispatch] = useReducer(swapReducer, { ...initialSwapState, ...prefilledState })
  const { typedValue, recipient, independentField } = state
  const { independentField, typedValue, recipient, smartPoolAddress, smartPoolName } = useSwapState()
  const smartPool = useCurrency(smartPoolAddress)

  const previousConnectedChainId = usePrevious(connectedChainId)
  const previousPrefilledState = usePrevious(prefilledState)
  useEffect(() => {
    const combinedInitialState = { ...initialSwapState, ...prefilledState }
    const chainChanged = previousConnectedChainId && previousConnectedChainId !== connectedChainId
    const prefilledInputChanged =
      previousPrefilledState &&
      previousPrefilledState?.[Field.INPUT]?.currencyId !== prefilledState?.[Field.INPUT]?.currencyId
    const prefilledOutputChanged =
      previousPrefilledState &&
      previousPrefilledState?.[Field.OUTPUT]?.currencyId !== prefilledState?.[Field.OUTPUT]?.currencyId
    if (chainChanged || prefilledInputChanged || prefilledOutputChanged) {
      dispatch(
        replaceSwapState({
          ...initialSwapState,
          ...prefilledState,
          field: combinedInitialState.independentField ?? Field.INPUT,
          inputCurrencyId: combinedInitialState.INPUT.currencyId ?? undefined,
          outputCurrencyId: combinedInitialState.OUTPUT.currencyId ?? undefined,
        })
      )
    }
  }, [connectedChainId, prefilledState, previousConnectedChainId, previousPrefilledState])

  const {
    trade: { state: tradeState, trade },
    allowedSlippage,
    autoSlippage,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
  } = useDerivedSwapInfo(state, chainId)

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
    [independentField, parsedAmount, showWrap, trade]
  )

  const fiatValueInput = useUSDPrice(parsedAmounts[Field.INPUT])
  const fiatValueOutput = useUSDPrice(parsedAmounts[Field.OUTPUT])
  const showFiatValueInput = Boolean(parsedAmounts[Field.INPUT])
  const showFiatValueOutput = Boolean(parsedAmounts[Field.OUTPUT])

  const [routeNotFound, routeIsLoading, routeIsSyncing] = useMemo(
    () => [!trade?.swaps, TradeState.LOADING === tradeState, TradeState.LOADING === tradeState && Boolean(trade)],
    [trade, tradeState]
  )

  const fiatValueTradeInput = useUSDPrice(trade?.inputAmount)
  const fiatValueTradeOutput = useUSDPrice(trade?.outputAmount)
  const stablecoinPriceImpact = useMemo(
    () =>
      routeIsSyncing || !trade
        ? undefined
        : computeFiatValuePriceImpact(fiatValueTradeInput.data, fiatValueTradeOutput.data),
    [fiatValueTradeInput, fiatValueTradeOutput, routeIsSyncing, trade]
  )

  const { onSwitchTokens, onCurrencySelection, onUserInput, onPoolSelection } = useSwapActionHandlers()
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

  const navigate = useNavigate()
  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
    navigate('/swap/')
  }, [navigate])

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapError, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm?: InterfaceTrade
    attemptingTxn: boolean
    swapError?: Error
    txHash?: string
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapError: undefined,
    txHash: undefined,
  })

  const formattedAmounts = useMemo(
    () => ({
      [independentField]: typedValue,
      [dependentField]: showWrap
        ? parsedAmounts[independentField]?.toExact() ?? ''
        : formatTransactionAmount(currencyAmountToPreciseFloat(parsedAmounts[dependentField])),
    }),
    [dependentField, independentField, parsedAmounts, showWrap, typedValue]
  )

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )

  const maximumAmountIn = useMaxAmountIn(trade, allowedSlippage)
  const allowance = usePermit2Allowance(
    maximumAmountIn ??
      (parsedAmounts[Field.INPUT]?.currency.isToken
        ? (parsedAmounts[Field.INPUT] as CurrencyAmount<Token>)
        : undefined),
    isSupportedChain(chainId) ? UNIVERSAL_ROUTER_ADDRESS(chainId) : undefined
  )

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT]),
    [currencyBalances]
  )
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))
  const swapFiatValues = useMemo(() => {
    return { amountIn: fiatValueTradeInput.data, amountOut: fiatValueTradeOutput.data }
  }, [fiatValueTradeInput, fiatValueTradeOutput])

  // the callback to execute the swap
  const { callback: swapCallback } = useSwapCallback(
    trade,
    swapFiatValues,
    allowedSlippage,
    recipient,
    signatureData,
    smartPoolAddress
  )

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    if (stablecoinPriceImpact && !confirmPriceImpactWithoutFee(stablecoinPriceImpact)) {
      return
    }
    setSwapState((currentState) => ({
      ...currentState,
      attemptingTxn: true,
      swapError: undefined,
      txHash: undefined,
    }))
    swapCallback()
      .then((hash) => {
        setSwapState((currentState) => ({
          ...currentState,
          attemptingTxn: false,
          swapError: undefined,
          txHash: hash,
        }))
        sendEvent({
          category: 'Swap',
          action: 'transaction hash',
          label: hash,
        })
        sendEvent({
          category: 'Swap',
          action:
            recipient === null
              ? 'Swap w/o Send'
              : (recipientAddress ?? recipient) === account
              ? 'Swap w/o Send + recipient'
              : 'Swap w/ Send',
          label: [TRADE_STRING, trade?.inputAmount?.currency?.symbol, trade?.outputAmount?.currency?.symbol, 'MH'].join(
            '/'
          ),
        })
      })
      .catch((error) => {
        setSwapState((currentState) => ({
          ...currentState,
          attemptingTxn: false,
          swapError: error,
          txHash: undefined,
        }))
      })
  }, [
    swapCallback,
    stablecoinPriceImpact,
    recipient,
    recipientAddress,
    account,
    trade?.inputAmount?.currency?.symbol,
    trade?.outputAmount?.currency?.symbol,
  ])

  // errors
  const [swapQuoteReceivedDate, setSwapQuoteReceivedDate] = useState<Date | undefined>()

  // warnings on the greater of fiat value price impact and execution price impact
  const { priceImpactSeverity, largerPriceImpact } = useMemo(() => {
    const marketPriceImpact = trade?.priceImpact ? computeRealizedPriceImpact(trade) : undefined
    const largerPriceImpact = largerPercentValue(marketPriceImpact, stablecoinPriceImpact)
    return { priceImpactSeverity: warningSeverity(largerPriceImpact), largerPriceImpact }
  }, [stablecoinPriceImpact, trade])

  const handleConfirmDismiss = useCallback(() => {
    setSwapState((currentState) => ({ ...currentState, showConfirm: false }))
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [onUserInput, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState((currentState) => ({ ...currentState, tradeToConfirm: trade }))
  }, [trade])

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      onCurrencySelection(Field.INPUT, inputCurrency)
      onCurrencyChange?.({
        [Field.INPUT]: {
          currencyId: getSwapCurrencyId(inputCurrency),
        },
        [Field.OUTPUT]: state[Field.OUTPUT],
      })
    },
    [onCurrencyChange, onCurrencySelection, state]
  )

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact())
    sendEvent({
      category: 'Swap',
      action: 'Max',
    })
  }, [maxInputAmount, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
      onCurrencyChange?.({
        [Field.INPUT]: state[Field.INPUT],
        [Field.OUTPUT]: {
          currencyId: getSwapCurrencyId(outputCurrency),
        },
      })
    },
    [onCurrencyChange, onCurrencySelection, state]
  )

  const priceImpactTooHigh = priceImpactSeverity > 3 && !isExpertMode
  const showPriceImpactWarning = largerPriceImpact && priceImpactSeverity > 3

  const prevTrade = usePrevious(trade)
  useEffect(() => {
    if (!trade || prevTrade === trade) return // no new swap quote to log
    const now = new Date()
    // Initialize default pool
    if (!smartPoolAddress && defaultPool) {
      onPoolSelection(defaultPool)
    }
    // If a trade exists, and we need to log the receipt of this new swap quote:
    if (newSwapQuoteNeedsLogging && !!trade) {
      // Set the current datetime as the time of receipt of latest swap quote.
      setSwapQuoteReceivedDate(now)
      // Log swap quote.
      sendAnalyticsEvent(
        EventName.SWAP_QUOTE_RECEIVED,
        formatSwapQuoteReceivedEventProperties(trade, trade.gasUseEstimateUSD ?? undefined, fetchingSwapQuoteStartTime)
      )
      // Latest swap quote has just been logged, so we don't need to log the current trade anymore
      // unless user inputs change again and a new trade is in the process of being generated.
      setNewSwapQuoteNeedsLogging(false)
      // New quote is not being fetched, so set start time of quote fetch to undefined.
      setFetchingSwapQuoteStartTime(undefined)
    }
    // If another swap quote is being loaded based on changed user inputs:
    if (routeIsLoading) {
      setNewSwapQuoteNeedsLogging(true)
      if (!fetchingSwapQuoteStartTime) setFetchingSwapQuoteStartTime(now)
    }
  }, [
    newSwapQuoteNeedsLogging,
    routeIsSyncing,
    routeIsLoading,
    fetchingSwapQuoteStartTime,
    trade,
    setSwapQuoteReceivedDate,
    onPoolSelection,
    defaultPool,
    smartPoolAddress,
  ])

    setSwapQuoteReceivedDate(new Date())
    sendAnalyticsEvent(SwapEventName.SWAP_QUOTE_RECEIVED, {
      ...formatSwapQuoteReceivedEventProperties(trade, trade.gasUseEstimateUSD ?? undefined),
      ...trace,
    })
  }, [prevTrade, trade, trace])

  const showDetailsDropdown = Boolean(
    !showWrap && userHasSpecifiedInputOutput && (trade || routeIsLoading || routeIsSyncing)
  )

  return (
    <SwapWrapper chainId={chainId} className={className} id="swap-page">
      <TokenSafetyModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokenAddress={importTokensNotInDefault[0]?.address}
        secondTokenAddress={importTokensNotInDefault[1]?.address}
        onContinue={handleConfirmTokenWarning}
        onCancel={handleDismissTokenWarning}
        showCancel={true}
      />
      <SwapHeader autoSlippage={autoSlippage} />
      {trade && showConfirm && (
        <ConfirmSwapModal
          trade={trade}
          originalTrade={tradeToConfirm}
          onAcceptChanges={handleAcceptChanges}
          txHash={txHash}
          allowedSlippage={allowedSlippage}
          onConfirm={handleSwap}
          allowance={allowance}
          swapError={swapError}
          onDismiss={handleConfirmDismiss}
          swapQuoteReceivedDate={swapQuoteReceivedDate}
          fiatValueInput={fiatValueTradeInput}
          fiatValueOutput={fiatValueTradeOutput}
        />
        <PageWrapper>
          <SwapWrapper chainId={chainId} id="swap-page">
            <SwapHeader allowedSlippage={allowedSlippage} />
            <PoolSelect
              disabled={!isSupportedChain(chainId)}
              visible={true}
              selected={true}
              hideInput={false}
              className="operated-pool-select-button"
              onClick={() => {
                setModalOpen(true)
              }}
            >
              <Aligner>
                <RowFixed>
                  {operatedPools && (
                    <StyledTokenName className="pool-name-container" active={true}>
                      {smartPoolName ?? <Trans>Create your pool first</Trans>}
                    </StyledTokenName>
                  )}
                </RowFixed>
                <StyledDropDown selected={!!smartPoolAddress} />
              </Aligner>
            </PoolSelect>
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
              swapQuoteReceivedDate={swapQuoteReceivedDate}
              fiatValueInput={fiatValueInput}
              fiatValueOutput={fiatValueOutput}
            />
            {operatedPools && smartPoolName && (
              <SmartPoolSearchModal
                isOpen={modalOpen}
                onDismiss={handleDismissSearch}
                onCurrencySelect={onPoolSelection}
                selectedCurrency={smartPool}
                operatedPools={operatedPools}
                showCommonBases={false}
                showCurrencyAmount={false}
                disableNonToken={false}
              />
            )}
            <div style={{ display: 'relative' }}>
              <SwapSection>
                <Trace section={SectionName.CURRENCY_INPUT_PANEL}>
                  <SwapCurrencyInputPanel
                    label={
                      independentField === Field.OUTPUT && !showWrap ? (
                        <Trans>From (at most)</Trans>
                      ) : (
                        <Trans>From</Trans>
                      )
                    }
                    value={formattedAmounts[Field.INPUT]}
                    showMaxButton={showMaxButton}
                    currency={currencies[Field.INPUT] ?? null}
                    onUserInput={handleTypeInput}
                    onMax={handleMaxInput}
                    fiatValue={fiatValueInput ?? undefined}
                    onCurrencySelect={handleInputSelect}
                    otherCurrency={currencies[Field.OUTPUT]}
                    showCommonBases={true}
                    id={SectionName.CURRENCY_INPUT_PANEL}
                    loading={independentField === Field.OUTPUT && routeIsSyncing}
                  />
                </Trace>
              </SwapSection>
              <ArrowWrapper clickable={isSupportedChain(chainId)}>
                <TraceEvent
                  events={[BrowserEvent.onClick]}
                  name={EventName.SWAP_TOKENS_REVERSED}
                  element={ElementName.SWAP_TOKENS_REVERSE_ARROW_BUTTON}
                >
                  <ArrowContainer
                    onClick={() => {
                      setApprovalSubmitted(false) // reset 2 step UI for approvals
                      onSwitchTokens()
                    }}
                    color={theme.textPrimary}
                  >
                    <ArrowDown
                      size="16"
                      color={
                        currencies[Field.INPUT] && currencies[Field.OUTPUT]
                          ? theme.deprecated_text1
                          : theme.deprecated_text3
                      }
                    />
                  </ArrowContainer>
                </TraceEvent>
              </ArrowWrapper>
            </div>
            <AutoColumn gap="12px">
              <div>
                <OutputSwapSection showDetailsDropdown={showDetailsDropdown}>
                  <Trace section={SectionName.CURRENCY_OUTPUT_PANEL}>
                    <SwapCurrencyInputPanel
                      value={formattedAmounts[Field.OUTPUT]}
                      onUserInput={handleTypeOutput}
                      label={
                        independentField === Field.INPUT && !showWrap ? <Trans>To (at least)</Trans> : <Trans>To</Trans>
                      }
                      showMaxButton={false}
                      hideBalance={false}
                      fiatValue={fiatValueOutput ?? undefined}
                      priceImpact={stablecoinPriceImpact}
                      currency={currencies[Field.OUTPUT] ?? null}
                      onCurrencySelect={handleOutputSelect}
                      otherCurrency={currencies[Field.INPUT]}
                      showCommonBases={true}
                      id={SectionName.CURRENCY_OUTPUT_PANEL}
                      loading={independentField === Field.INPUT && routeIsSyncing}
                    />
                  </Trace>
                </OutputSwapSection>
                {showDetailsDropdown && (
                  <DetailsSwapSection>
                    <SwapDetailsDropdown
                      trade={trade}
                      syncing={routeIsSyncing}
                      loading={routeIsLoading}
                      showInverted={showInverted}
                      setShowInverted={setShowInverted}
                      allowedSlippage={allowedSlippage}
                    />
                  </DetailsSwapSection>
                )}
              </div>
              {showPriceImpactWarning && <PriceImpactWarning priceImpact={largerPriceImpact} />}
              <div>
                {swapIsUnsupported ? (
                  <ButtonPrimary disabled={true}>
                    <ThemedText.DeprecatedMain mb="4px">
                      <Trans>Unsupported Asset</Trans>
                    </ThemedText.DeprecatedMain>
                  </ButtonPrimary>
                ) : !account ? (
                  <TraceEvent
                    events={[BrowserEvent.onClick]}
                    name={EventName.CONNECT_WALLET_BUTTON_CLICKED}
                    properties={{ received_swap_quote: getIsValidSwapQuote(trade, tradeState, swapInputError) }}
                    element={ElementName.CONNECT_WALLET_BUTTON}
                  >
                    <ButtonLight onClick={toggleWalletModal} fontWeight={600}>
                      <Trans>Connect Wallet</Trans>
                    </ButtonLight>
                  </TraceEvent>
                ) : showWrap ? (
                  <ButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap} fontWeight={600}>
                    {wrapInputError ? (
                      <WrapErrorText wrapInputError={wrapInputError} />
                    ) : wrapType === WrapType.WRAP ? (
                      <Trans>Wrap</Trans>
                    ) : wrapType === WrapType.UNWRAP ? (
                      <Trans>Unwrap</Trans>
                    ) : null}
                  </ButtonPrimary>
                ) : routeNotFound && userHasSpecifiedInputOutput && !routeIsLoading && !routeIsSyncing ? (
                  <GrayCard style={{ textAlign: 'center' }}>
                    <ThemedText.DeprecatedMain mb="4px">
                      <Trans>Insufficient liquidity for this trade.</Trans>
                    </ThemedText.DeprecatedMain>
                  </GrayCard>
                ) : showApproveFlow ? (
                  <AutoRow style={{ flexWrap: 'nowrap', width: '100%' }}>
                    <AutoColumn style={{ width: '100%' }} gap="12px">
                      <ButtonConfirmed
                        fontWeight={600}
                        onClick={handleApprove}
                        disabled={approveTokenButtonDisabled}
                        width="100%"
                        altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
                        confirmed={
                          approvalState === ApprovalState.APPROVED || signatureState === UseERC20PermitState.SIGNED
                        }
                      >
                        <AutoRow justify="space-between" style={{ flexWrap: 'nowrap' }} height="20px">
                          <ThemedText.SubHeader width="100%" textAlign="center" color="white">
                            {/* we need to shorten this string on mobile */}
                            {approvalState === ApprovalState.APPROVED ||
                            signatureState === UseERC20PermitState.SIGNED ? (
                              <Trans>You can now trade {currencies[Field.INPUT]?.symbol}</Trans>
                            ) : (
                              <Trans>Allow the Uniswap Protocol to use your {currencies[Field.INPUT]?.symbol}</Trans>
                            )}
                          </ThemedText.SubHeader>
                          {approvalPending || approvalState === ApprovalState.PENDING ? (
                            <Loader stroke={theme.white} />
                          ) : (approvalSubmitted && approvalState === ApprovalState.APPROVED) ||
                            signatureState === UseERC20PermitState.SIGNED ? (
                            <CheckCircle size="20" color={theme.deprecated_green1} />
                          ) : (
                            <MouseoverTooltip
                              text={
                                <Trans>
                                  You must give the Uniswap smart contracts permission to use your{' '}
                                  {currencies[Field.INPUT]?.symbol}. You only have to do this once per token.
                                </Trans>
                              }
                            >
                              <HelpCircle size="20" color={theme.deprecated_white} style={{ marginLeft: '8px' }} />
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
                          routeIsSyncing ||
                          routeIsLoading ||
                          (approvalState !== ApprovalState.APPROVED && signatureState !== UseERC20PermitState.SIGNED) ||
                          priceImpactTooHigh
                        }
                        error={isValid && priceImpactSeverity > 2}
                      >
                        <Text fontSize={16} fontWeight={600}>
                          {priceImpactTooHigh ? (
                            <Trans>High Price Impact</Trans>
                          ) : trade && priceImpactSeverity > 2 ? (
                            <Trans>Swap Anyway</Trans>
                          ) : (
                            <Trans>Swap</Trans>
                          )}
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
                    disabled={!isValid || routeIsSyncing || routeIsLoading || priceImpactTooHigh || !!swapCallbackError}
                    error={isValid && priceImpactSeverity > 2 && !swapCallbackError}
                  >
                    <Text fontSize={20} fontWeight={600}>
                      {swapInputError ? (
                        swapInputError
                      ) : routeIsSyncing || routeIsLoading ? (
                        <Trans>Swap</Trans>
                      ) : priceImpactSeverity > 2 ? (
                        <Trans>Swap Anyway</Trans>
                      ) : priceImpactTooHigh ? (
                        <Trans>Price Impact Too High</Trans>
                      ) : (
                        <Trans>Swap</Trans>
                      )}
                    </Text>
                  </ButtonError>
                )}
                {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
              </div>
            </AutoColumn>
          </SwapWrapper>
          <NetworkAlert />
        </PageWrapper>
        <SwitchLocaleLink />
        {!swapIsUnsupported ? null : (
          <UnsupportedCurrencyFooter
            show={swapIsUnsupported}
            currencies={[currencies[Field.INPUT], currencies[Field.OUTPUT]]}
          />
        )}
        {showPriceImpactWarning && <PriceImpactWarning priceImpact={largerPriceImpact} />}
        <div>
          {swapIsUnsupported ? (
            <ButtonPrimary disabled={true}>
              <ThemedText.DeprecatedMain mb="4px">
                <Trans>Unsupported Asset</Trans>
              </ThemedText.DeprecatedMain>
            </ButtonPrimary>
          ) : !account ? (
            <TraceEvent
              events={[BrowserEvent.onClick]}
              name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
              properties={{ received_swap_quote: getIsValidSwapQuote(trade, tradeState, swapInputError) }}
              element={InterfaceElementName.CONNECT_WALLET_BUTTON}
            >
              <ButtonLight onClick={toggleWalletDrawer} fontWeight={600}>
                <Trans>Connect Wallet</Trans>
              </ButtonLight>
            </TraceEvent>
          ) : chainId && chainId !== connectedChainId ? (
            <ButtonPrimary
              onClick={async () => {
                try {
                  await switchChain(connector, chainId)
                } catch (error) {
                  if (didUserReject(error)) {
                    // Ignore error, which keeps the user on the previous chain.
                  } else {
                    // TODO(WEB-3306): This UX could be improved to show an error state.
                    throw error
                  }
                }
              }}
            >
              Connect to {getChainInfo(chainId)?.label}
            </ButtonPrimary>
          ) : showWrap ? (
            <ButtonPrimary
              disabled={Boolean(wrapInputError)}
              onClick={onWrap}
              fontWeight={600}
              data-testid="wrap-button"
            >
              {wrapInputError ? (
                <WrapErrorText wrapInputError={wrapInputError} />
              ) : wrapType === WrapType.WRAP ? (
                <Trans>Wrap</Trans>
              ) : wrapType === WrapType.UNWRAP ? (
                <Trans>Unwrap</Trans>
              ) : null}
            </ButtonPrimary>
          ) : routeNotFound && userHasSpecifiedInputOutput && !routeIsLoading && !routeIsSyncing ? (
            <GrayCard style={{ textAlign: 'center' }}>
              <ThemedText.DeprecatedMain mb="4px">
                <Trans>Insufficient liquidity for this trade.</Trans>
              </ThemedText.DeprecatedMain>
            </GrayCard>
          ) : (
            <TraceEvent
              events={[BrowserEvent.onClick]}
              name={SharedEventName.ELEMENT_CLICKED}
              element={InterfaceElementName.SWAP_BUTTON}
            >
              <ButtonError
                onClick={() => {
                  if (isExpertMode) {
                    handleSwap()
                  } else {
                    setSwapState({
                      tradeToConfirm: trade,
                      attemptingTxn: false,
                      swapError: undefined,
                      showConfirm: true,
                      txHash: undefined,
                    })
                  }
                }}
                id="swap-button"
                data-testid="swap-button"
                disabled={!isValid || routeIsSyncing || routeIsLoading || priceImpactTooHigh}
                error={isValid && priceImpactSeverity > 2 && allowance.state === AllowanceState.ALLOWED}
              >
                <Text fontSize={20} fontWeight={600}>
                  {swapInputError ? (
                    swapInputError
                  ) : routeIsSyncing || routeIsLoading ? (
                    <Trans>Swap</Trans>
                  ) : priceImpactTooHigh ? (
                    <Trans>Price Impact Too High</Trans>
                  ) : priceImpactSeverity > 2 ? (
                    <Trans>Swap Anyway</Trans>
                  ) : (
                    <Trans>Swap</Trans>
                  )}
                </Text>
              </ButtonError>
            </TraceEvent>
          )}
          {Boolean(isExpertMode && swapError) && <SwapCallbackError error={swapError?.message} />}
        </div>
      </AutoColumn>
    </SwapWrapper>
  )
}
