import {
  BrowserEvent,
  InterfaceElementName,
  InterfaceEventName,
  InterfaceSectionName,
  SharedEventName,
  SwapEventName,
} from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
//import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { useWeb3React } from '@web3-react/core'
import POOL_EXTENDED_ABI from 'abis/pool-extended.json'
import { Trace, TraceEvent, sendAnalyticsEvent, useTrace } from 'analytics'
import { useToggleAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonError, ButtonGray, ButtonLight, ButtonPrimary } from 'components/Button'
import { GrayCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { ConfirmSwapModal } from 'components/ConfirmSwapModal'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import PriceImpactModal from 'components/swap/PriceImpactModal'
import PriceImpactWarning from 'components/swap/PriceImpactWarning'
import SwapDetailsDropdown from 'components/swap/SwapDetailsDropdown'
import confirmPriceImpactWithoutFee from 'components/swap/confirmPriceImpactWithoutFee'
import { Field } from 'components/swap/constants'
import { ArrowContainer, ArrowWrapper, OutputSwapSection, SwapSection } from 'components/swap/styled'
import { useConnectionReady } from 'connection/eagerlyConnect'
import { getChainInfo } from 'constants/chainInfo'
import { asSupportedChain, isSupportedChain } from 'constants/chains'
import { TOKEN_SHORTHANDS } from 'constants/tokens'
import { useCurrency, useDefaultActiveTokens } from 'hooks/Tokens'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
//import { useMaxAmountIn } from 'hooks/useMaxAmountIn'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { /*usePermit2Allowance,*/ AllowanceState } from 'hooks/usePermit2Allowance'
import usePrevious from 'hooks/usePrevious'
import { SwapResult, useSwapCallback } from 'hooks/useSwapCallback'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useUSDPrice } from 'hooks/useUSDPrice'
import useWrapCallback, { WrapErrorText, WrapType } from 'hooks/useWrapCallback'
import { Trans } from 'i18n'
import JSBI from 'jsbi'
import { formatSwapQuoteReceivedEventProperties } from 'lib/utils/analytics'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { useActiveSmartPool, useSelectActiveSmartPool } from 'state/application/hooks'
import { useAppSelector } from 'state/hooks'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import { isClassicTrade } from 'state/routing/utils'
import {
  queryParametersToCurrencyState,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapAndLimitContext,
  useSwapContext,
} from 'state/swap/hooks'
import { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { maybeLogFirstSwapAction } from 'tracing/swapFlowLoggers'
import { computeFiatValuePriceImpact } from 'utils/computeFiatValuePriceImpact'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { isEmptyObject } from 'utils/isEmpty'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { largerPercentValue } from 'utils/percent'
import { computeRealizedPriceImpact, warningSeverity } from 'utils/prices'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import { RowFixed } from '../../components/Row'
import SmartPoolSearchModal from '../../components/SearchModal/SmartPoolSearchModal'
import { useScreenSize } from '../../hooks/useScreenSize'
//import { PoolInitParams, PoolWithAddress } from '../../hooks/useSmartPools'
import { useMultipleContractSingleData } from '../../lib/hooks/multicall'
import { useAllPoolsData /*, useRegisteredPools*/ } from '../../state/pool/hooks'
import { CurrencyState } from 'state/swap/types'
import { getIsReviewableQuote } from '.'
import { OutputTaxTooltipBody } from './TaxTooltipBody'

const SWAP_FORM_CURRENCY_SEARCH_FILTERS = {
  showCommonBases: true,
}

const PoolSelect = styled(ButtonGray)<{
  visible: boolean
  selected: boolean
  hideInput?: boolean
  disabled?: boolean
}>`
  align-items: center;
  background-color: ${({ selected, theme }) => (selected ? theme.backgroundInteractive : theme.accentAction)};
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  color: ${({ selected, theme }) => (selected ? theme.textPrimary : theme.white)};
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
    background-color: ${({ selected, theme }) => (selected ? theme.backgroundInteractive : theme.accentAction)};
  }
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
`

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  margin: 0 0.25rem 0 0.35rem;
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.textPrimary : theme.white)};
    stroke-width: 1.5px;
  }
`
const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

export const ArrowContainer = styled.div`
  display: inline-block;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;
`


interface SwapFormProps {
  disableTokenInputs?: boolean
  onCurrencyChange?: (selected: CurrencyState) => void
}

export function SwapForm({ disableTokenInputs = false, onCurrencyChange }: SwapFormProps) {
  const connectionReady = useConnectionReady()
  const { account, chainId: connectedChainId, connector } = useWeb3React()
  const trace = useTrace()

  const { chainId, prefilledState, currencyState } = useSwapAndLimitContext()
  const { swapState, setSwapState, derivedSwapInfo } = useSwapContext()
  const { typedValue, independentField } = swapState

  // token warning stuff
  const parsedQs = useParsedQueryString()
  const prefilledCurrencies = useMemo(() => {
    return queryParametersToCurrencyState(parsedQs)
  }, [parsedQs])
  const prefilledInputCurrency = useCurrency(prefilledCurrencies?.inputCurrencyId, chainId)
  const prefilledOutputCurrency = useCurrency(prefilledCurrencies?.outputCurrencyId, chainId)

  const [loadedInputCurrency, setLoadedInputCurrency] = useState(prefilledInputCurrency)
  const [loadedOutputCurrency, setLoadedOutputCurrency] = useState(prefilledOutputCurrency)

  useEffect(() => {
    setLoadedInputCurrency(prefilledInputCurrency)
    setLoadedOutputCurrency(prefilledOutputCurrency)
  }, [prefilledInputCurrency, prefilledOutputCurrency])

  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const [showPriceImpactModal, setShowPriceImpactModal] = useState<boolean>(false)

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
  const urlTokensNotInDefault = useMemo(
    () =>
      urlLoadedTokens && !isEmptyObject(defaultTokens)
        ? urlLoadedTokens
            .filter((token: Token) => {
              return !(token.address in defaultTokens)
            })
            .filter((token: Token) => {
              // Any token addresses that are loaded from the shorthands map do not need to show the import URL
              const supported = asSupportedChain(chainId)
              if (!supported) return true
              return !Object.keys(TOKEN_SHORTHANDS).some((shorthand) => {
                const shorthandTokenAddress = TOKEN_SHORTHANDS[shorthand][supported]
                return shorthandTokenAddress && shorthandTokenAddress === token.address
              })
            })
        : [],
    [chainId, defaultTokens, urlLoadedTokens]
  )

  const theme = useTheme()

  // toggle wallet when disconnected
  const toggleWalletDrawer = useToggleAccountDrawer()

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

  const smartPool = useCurrency(smartPoolAddress)
  const { address: smartPoolAddress, name: smartPoolName } = useActiveSmartPool()
  const {
    trade: { state: tradeState, trade, swapQuoteLatency },
    allowedSlippage,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
    outputFeeFiatValue,
    inputTax,
    outputTax,
  } = derivedSwapInfo

  const [inputTokenHasTax, outputTokenHasTax] = useMemo(
    () => [!inputTax.equalTo(0), !outputTax.equalTo(0)],
    [inputTax, outputTax]
  )

  useEffect(() => {
    // Force exact input if the user switches to an output token with tax
    if (outputTokenHasTax && independentField === Field.OUTPUT) {
      setSwapState((state) => ({
        ...state,
        independentField: Field.INPUT,
        typedValue: '',
      }))
    }
  }, [independentField, outputTokenHasTax, setSwapState, trade?.outputAmount])

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

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

  const showFiatValueInput = Boolean(parsedAmounts[Field.INPUT])
  const showFiatValueOutput = Boolean(parsedAmounts[Field.OUTPUT])
  const getSingleUnitAmount = (currency?: Currency) => {
    if (!currency) return
    return CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(10 ** currency.decimals))
  }

  const fiatValueInput = useUSDPrice(
    parsedAmounts[Field.INPUT] ?? getSingleUnitAmount(currencies[Field.INPUT]),
    currencies[Field.INPUT]
  )
  const fiatValueOutput = useUSDPrice(
    parsedAmounts[Field.OUTPUT] ?? getSingleUnitAmount(currencies[Field.OUTPUT]),
    currencies[Field.OUTPUT]
  )

  const [routeNotFound, routeIsLoading, routeIsSyncing] = useMemo(
    () => [
      tradeState === TradeState.NO_ROUTE_FOUND,
      tradeState === TradeState.LOADING,
      tradeState === TradeState.LOADING && Boolean(trade),
    ],
    [trade, tradeState]
  )

  const fiatValueTradeInput = useUSDPrice(trade?.inputAmount)
  const fiatValueTradeOutput = useUSDPrice(trade?.outputAmount)
  const preTaxFiatValueTradeOutput = useUSDPrice(trade?.outputAmount)
  const [stablecoinPriceImpact, preTaxStablecoinPriceImpact] = useMemo(
    () =>
      routeIsSyncing || !isClassicTrade(trade) || showWrap
        ? [undefined, undefined]
        : [
            computeFiatValuePriceImpact(fiatValueTradeInput.data, fiatValueTradeOutput.data),
            computeFiatValuePriceImpact(fiatValueTradeInput.data, preTaxFiatValueTradeOutput.data),
          ],
    [fiatValueTradeInput, fiatValueTradeOutput, preTaxFiatValueTradeOutput, routeIsSyncing, trade, showWrap]
  )

  const { onSwitchTokens, onCurrencySelection, onUserInput } = useSwapActionHandlers(dispatch)
  const onPoolSelect = useSelectActiveSmartPool()
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
      maybeLogFirstSwapAction(trace)
    },
    [onUserInput, trace]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
      maybeLogFirstSwapAction(trace)
    },
    [onUserInput, trace]
  )

  const navigate = useNavigate()
  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
    navigate('/swap/')
  }, [navigate])

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapError, swapResult }, setSwapFormState] = useState<{
    showConfirm: boolean
    tradeToConfirm?: InterfaceTrade
    swapError?: Error
    swapResult?: SwapResult
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    swapError: undefined,
    swapResult: undefined,
  })

  const previousConnectedChainId = usePrevious(connectedChainId)
  const previousPrefilledState = usePrevious(prefilledState)
  useEffect(() => {
    const chainChanged = previousConnectedChainId && previousConnectedChainId !== connectedChainId
    const prefilledInputChanged =
      previousPrefilledState?.inputCurrency &&
      !prefilledState.inputCurrency?.equals(previousPrefilledState.inputCurrency)
    const prefilledOutputChanged =
      previousPrefilledState?.outputCurrency &&
      !prefilledState?.outputCurrency?.equals(previousPrefilledState.outputCurrency)

    if (chainChanged || prefilledInputChanged || prefilledOutputChanged) {
      // reset local state
      setSwapFormState({
        tradeToConfirm: undefined,
        swapError: undefined,
        showConfirm: false,
        swapResult: undefined,
      })
    }
  }, [
    connectedChainId,
    prefilledState.inputCurrency,
    prefilledState?.outputCurrency,
    previousConnectedChainId,
    previousPrefilledState,
  ])

  const { formatCurrencyAmount } = useFormatter()
  const formattedAmounts = useMemo(
    () => ({
      [independentField]: typedValue,
      [dependentField]: showWrap
        ? parsedAmounts[independentField]?.toExact() ?? ''
        : formatCurrencyAmount({
            amount: parsedAmounts[dependentField],
            type: NumberType.SwapTradeAmount,
            placeholder: '',
          }),
    }),
    [dependentField, formatCurrencyAmount, independentField, parsedAmounts, showWrap, typedValue]
  )

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )

  //const maximumAmountIn = useMaxAmountIn(trade, allowedSlippage)
  // we skip allowance check entirely for pools
  //const isPool = true
  //const allowance = usePermit2Allowance(
  //  maximumAmountIn ??
  //    (parsedAmounts[Field.INPUT]?.currency.isToken
  //      ? (parsedAmounts[Field.INPUT] as CurrencyAmount<Token>)
  //      : undefined),
  //  isSupportedChain(chainId) ? UNIVERSAL_ROUTER_ADDRESS(chainId) : undefined,
  //  trade?.fillType,
  //  isPool
  //)
  const allowance = { state: AllowanceState.ALLOWED, permitSignature: undefined }

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT]),
    [currencyBalances]
  )
  const showMaxButton = Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))
  const swapFiatValues = useMemo(() => {
    return { amountIn: fiatValueTradeInput.data, amountOut: fiatValueTradeOutput.data, feeUsd: outputFeeFiatValue }
  }, [fiatValueTradeInput.data, fiatValueTradeOutput.data, outputFeeFiatValue])

  // the callback to execute the swap
  const swapCallback = useSwapCallback(
    trade,
    swapFiatValues,
    allowedSlippage,
    smartPoolAddress ?? undefined,
    allowance.state === AllowanceState.ALLOWED ? allowance.permitSignature : undefined
  )

  const handleContinueToReview = useCallback(() => {
    setSwapFormState({
      tradeToConfirm: trade,
      swapError: undefined,
      showConfirm: true,
      swapResult: undefined,
    })
  }, [trade])

  const clearSwapState = useCallback(() => {
    setSwapFormState((currentState) => ({
      ...currentState,
      swapError: undefined,
      swapResult: undefined,
    }))
  }, [])

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    if (preTaxStablecoinPriceImpact && !confirmPriceImpactWithoutFee(preTaxStablecoinPriceImpact)) {
      return
    }
    swapCallback()
      .then((result) => {
        setSwapFormState((currentState) => ({
          ...currentState,
          swapError: undefined,
          swapResult: result,
        }))
      })
      .catch((error) => {
        setSwapFormState((currentState) => ({
          ...currentState,
          swapError: error,
          swapResult: undefined,
        }))
      })
  }, [swapCallback, preTaxStablecoinPriceImpact])

  const handleOnWrap = useCallback(async () => {
    if (!onWrap) return
    try {
      const txHash = await onWrap()
      setSwapFormState((currentState) => ({
        ...currentState,
        swapError: undefined,
        txHash,
      }))
      onUserInput(Field.INPUT, '')
    } catch (error) {
      if (!didUserReject(error)) {
        sendAnalyticsEvent(SwapEventName.SWAP_ERROR, {
          wrapType,
          input: currencies[Field.INPUT],
          output: currencies[Field.OUTPUT],
        })
      }
      console.error('Could not wrap/unwrap', error)
      setSwapFormState((currentState) => ({
        ...currentState,
        swapError: error,
        txHash: undefined,
      }))
    }
  }, [currencies, onUserInput, onWrap, wrapType])

  // warnings on the greater of fiat value price impact and execution price impact
  const { priceImpactSeverity, largerPriceImpact } = useMemo(() => {
    if (!isClassicTrade(trade)) {
      return { priceImpactSeverity: 0, largerPriceImpact: undefined }
    }

    const marketPriceImpact = trade?.priceImpact ? computeRealizedPriceImpact(trade) : undefined
    const largerPriceImpact = largerPercentValue(marketPriceImpact, preTaxStablecoinPriceImpact)
    return { priceImpactSeverity: warningSeverity(largerPriceImpact), largerPriceImpact }
  }, [preTaxStablecoinPriceImpact, trade])

  const handleConfirmDismiss = useCallback(() => {
    setSwapFormState((currentState) => ({ ...currentState, showConfirm: false }))
    // If there was a swap, we want to clear the input
    if (swapResult) {
      onUserInput(Field.INPUT, '')
    }
  }, [onUserInput, swapResult])

  const handleAcceptChanges = useCallback(() => {
    setSwapFormState((currentState) => ({ ...currentState, tradeToConfirm: trade }))
  }, [trade])

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      onCurrencySelection(Field.INPUT, inputCurrency)
      onCurrencyChange?.({
        inputCurrency,
        outputCurrency: currencyState.outputCurrency,
      })
      maybeLogFirstSwapAction(trace)
    },
    [onCurrencyChange, onCurrencySelection, currencyState, trace]
  )
  const inputCurrencyNumericalInputRef = useRef<HTMLInputElement>(null)

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact())
    maybeLogFirstSwapAction(trace)
  }, [maxInputAmount, onUserInput, trace])

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
      onCurrencyChange?.({
        inputCurrency: currencyState.inputCurrency,
        outputCurrency,
      })
      maybeLogFirstSwapAction(trace)
    },
    [onCurrencyChange, onCurrencySelection, currencyState, trace]
  )

  const showPriceImpactWarning = isClassicTrade(trade) && largerPriceImpact && priceImpactSeverity > 3

  const prevTrade = usePrevious(trade)
  useEffect(() => {
    // Initialize default pool
    if (defaultPool && (!smartPoolAddress || smartPoolAddress === null)) {
      onPoolSelect(defaultPool)
    }

    if (!trade || prevTrade === trade) return // no new swap quote to log

    sendAnalyticsEvent(SwapEventName.SWAP_QUOTE_RECEIVED, {
      ...formatSwapQuoteReceivedEventProperties(trade, allowedSlippage, swapQuoteLatency, outputFeeFiatValue),
      ...trace,
    })
  }, [prevTrade, trade, trace, allowedSlippage, swapQuoteLatency, outputFeeFiatValue, onPoolSelect, defaultPool, smartPoolAddress])

  const showDetailsDropdown = Boolean(
    !showWrap && userHasSpecifiedInputOutput && (trade || routeIsLoading || routeIsSyncing)
  )

  const inputCurrency = currencies[Field.INPUT] ?? undefined
  const switchChain = useSwitchChain()
  const switchingChain = useAppSelector((state) => state.wallets.switchingChain)

  return (
    <>
      <TokenSafetyModal
        isOpen={urlTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokenAddress={urlTokensNotInDefault[0]?.address}
        secondTokenAddress={urlTokensNotInDefault[1]?.address}
        onContinue={handleConfirmTokenWarning}
        onCancel={handleDismissTokenWarning}
        showCancel={true}
      />
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
                {smartPoolName && smartPoolName.length > 3 ? smartPoolName : <Trans>Create your pool first</Trans>}
              </StyledTokenName>
            )}
          </RowFixed>
          <StyledDropDown selected={!!smartPoolAddress} />
        </Aligner>
      </PoolSelect>
      {trade && showConfirm && (
        <ConfirmSwapModal
          trade={trade}
          inputCurrency={inputCurrency}
          originalTrade={tradeToConfirm}
          onAcceptChanges={handleAcceptChanges}
          onCurrencySelection={onCurrencySelection}
          selectedPool={smartPool}
          swapResult={swapResult}
          allowedSlippage={allowedSlippage}
          clearSwapState={clearSwapState}
          onConfirm={handleSwap}
          //allowance={allowance}
          swapError={swapError}
          onDismiss={handleConfirmDismiss}
          fiatValueInput={fiatValueTradeInput}
          fiatValueOutput={fiatValueTradeOutput}
        />
      )}
      {operatedPools && smartPoolName && (
        <SmartPoolSearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onPoolSelect}
          selectedCurrency={smartPool}
          operatedPools={operatedPools}
          showCommonBases={false}
          showCurrencyAmount={false}
          disableNonToken={false}
        />
      )}
      {showPriceImpactModal && showPriceImpactWarning && (
        <PriceImpactModal
          priceImpact={largerPriceImpact}
          onDismiss={() => setShowPriceImpactModal(false)}
          onContinue={() => {
            setShowPriceImpactModal(false)
            handleContinueToReview()
          }}
        />
      )}
      <div style={{ display: 'relative' }}>
        <SwapSection>
          <Trace section={InterfaceSectionName.CURRENCY_INPUT_PANEL}>
            <SwapCurrencyInputPanel
              label={<Trans>You pay</Trans>}
              disabled={disableTokenInputs}
              value={formattedAmounts[Field.INPUT]}
              showMaxButton={showMaxButton}
              currency={currencies[Field.INPUT] ?? null}
              onUserInput={handleTypeInput}
              onMax={handleMaxInput}
              fiatValue={showFiatValueInput ? fiatValueInput : undefined}
              onCurrencySelect={handleInputSelect}
              otherCurrency={currencies[Field.OUTPUT]}
              currencySearchFilters={SWAP_FORM_CURRENCY_SEARCH_FILTERS}
              id={InterfaceSectionName.CURRENCY_INPUT_PANEL}
              loading={independentField === Field.OUTPUT && routeIsSyncing}
              ref={inputCurrencyNumericalInputRef}
            />
          </Trace>
        </SwapSection>
        <ArrowWrapper clickable={isSupportedChain(chainId)}>
          <TraceEvent
            events={[BrowserEvent.onClick]}
            name={SwapEventName.SWAP_TOKENS_REVERSED}
            element={InterfaceElementName.SWAP_TOKENS_REVERSE_ARROW_BUTTON}
          >
            <ArrowContainer
              data-testid="swap-currency-button"
              onClick={() => {
                if (disableTokenInputs) return
                onSwitchTokens({
                  newOutputHasTax: inputTokenHasTax,
                  previouslyEstimatedOutput: formattedAmounts[dependentField],
                })
                maybeLogFirstSwapAction(trace)
              }}
              color={theme.neutral1}
            >
              <ArrowDown size="16" color={theme.neutral1} />
            </ArrowContainer>
          </TraceEvent>
        </ArrowWrapper>
      </div>
      <AutoColumn gap="12px">
        <div>
          <OutputSwapSection>
            <Trace section={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}>
              <SwapCurrencyInputPanel
                value={formattedAmounts[Field.OUTPUT]}
                disabled={disableTokenInputs}
                onUserInput={handleTypeOutput}
                label={<Trans>You receive</Trans>}
                showMaxButton={false}
                hideBalance={false}
                fiatValue={showFiatValueOutput ? fiatValueOutput : undefined}
                priceImpact={stablecoinPriceImpact}
                currency={currencies[Field.OUTPUT] ?? null}
                onCurrencySelect={handleOutputSelect}
                otherCurrency={currencies[Field.INPUT]}
                currencySearchFilters={SWAP_FORM_CURRENCY_SEARCH_FILTERS}
                id={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}
                loading={independentField === Field.INPUT && routeIsSyncing}
                numericalInputSettings={{
                  // We disable numerical input here if the selected token has tax, since we cannot guarantee exact_outputs for FOT tokens
                  disabled: inputTokenHasTax || outputTokenHasTax,
                  // Focus the input currency panel if the user tries to type into the disabled output currency panel
                  onDisabledClick: () => inputCurrencyNumericalInputRef.current?.focus(),
                  disabledTooltipBody: (
                    <OutputTaxTooltipBody
                      currencySymbol={currencies[inputTokenHasTax ? Field.INPUT : Field.OUTPUT]?.symbol}
                    />
                  ),
                }}
              />
            </Trace>
          </OutputSwapSection>
        </div>

        {showPriceImpactWarning && <PriceImpactWarning priceImpact={largerPriceImpact} />}
        <div>
          {swapIsUnsupported ? (
            <ButtonPrimary $borderRadius="16px" disabled={true}>
              <ThemedText.DeprecatedMain mb="4px">
                <Trans>Unsupported asset</Trans>
              </ThemedText.DeprecatedMain>
            </ButtonPrimary>
          ) : switchingChain ? (
            <ButtonPrimary $borderRadius="16px" disabled={true}>
              <Trans>Connecting to {{ label: getChainInfo(switchingChain)?.label }}</Trans>
            </ButtonPrimary>
          ) : connectionReady && !account ? (
            <TraceEvent
              events={[BrowserEvent.onClick]}
              name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
              properties={{ received_swap_quote: getIsReviewableQuote(trade, tradeState, swapInputError) }}
              element={InterfaceElementName.CONNECT_WALLET_BUTTON}
            >
              <ButtonLight onClick={toggleWalletDrawer} fontWeight={535} $borderRadius="16px">
                <Trans>Connect wallet</Trans>
              </ButtonLight>
            </TraceEvent>
          ) : chainId && chainId !== connectedChainId ? (
            <ButtonPrimary
              $borderRadius="16px"
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
              $borderRadius="16px"
              disabled={Boolean(wrapInputError)}
              onClick={handleOnWrap}
              fontWeight={535}
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
                  showPriceImpactWarning ? setShowPriceImpactModal(true) : handleContinueToReview()
                }}
                id="swap-button"
                data-testid="swap-button"
                disabled={!getIsReviewableQuote(trade, tradeState, swapInputError)}
                error={!swapInputError && priceImpactSeverity > 2 && allowance.state === AllowanceState.ALLOWED}
              >
                <Text fontSize={20}>
                  {swapInputError ? (
                    swapInputError
                  ) : routeIsSyncing || routeIsLoading ? (
                    <Trans>Swap</Trans>
                  ) : priceImpactSeverity > 2 ? (
                    <Trans>Swap anyway</Trans>
                  ) : (
                    <Trans>Swap</Trans>
                  )}
                </Text>
              </ButtonError>
            </TraceEvent>
          )}
          {showDetailsDropdown && (
            <SwapDetailsDropdown
              trade={trade}
              syncing={routeIsSyncing}
              loading={routeIsLoading}
              allowedSlippage={allowedSlippage}
            />
          )}
        </div>
      </AutoColumn>
    </>
  )
}
