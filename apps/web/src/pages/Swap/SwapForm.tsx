import {
  InterfaceElementName,
  InterfaceEventName,
  InterfaceSectionName,
  SwapEventName,
  SwapPriceImpactUserResponse,
} from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS, UniversalRouterVersion } from '@uniswap/universal-router-sdk'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button/buttons'
import { GrayCard } from 'components/Card/cards'
import { ConfirmSwapModal } from 'components/ConfirmSwapModal'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import ErrorIcon from 'components/Icons/Error'
import { ConnectWalletButtonText } from 'components/NavBar/accountCTAsExperimentUtils'
import Column, { AutoColumn } from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import PriceImpactModal from 'components/swap/PriceImpactModal'
import SwapDetailsDropdown from 'components/swap/SwapDetailsDropdown'
import confirmPriceImpactWithoutFee from 'components/swap/confirmPriceImpactWithoutFee'
import { ArrowContainer, ArrowWrapper, OutputSwapSection, SwapSection } from 'components/swap/styled'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { useMaxAmountIn } from 'hooks/useMaxAmountIn'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import usePrevious from 'hooks/usePrevious'
import useSelectChain from 'hooks/useSelectChain'
import { SwapResult, useSwapCallback } from 'hooks/useSwapCallback'
import { useUSDPrice } from 'hooks/useUSDPrice'
import useWrapCallback, { WrapErrorText } from 'hooks/useWrapCallback'
import JSBI from 'jsbi'
import { useTheme } from 'lib/styled-components'
import { formatSwapQuoteReceivedEventProperties } from 'lib/utils/analytics'
import { getIsReviewableQuote } from 'pages/Swap'
import { OutputTaxTooltipBody } from 'pages/Swap/TaxTooltipBody'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { Trans } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { InterfaceTrade, RouterPreference, TradeState } from 'state/routing/types'
import { isClassicTrade } from 'state/routing/utils'
import { serializeSwapStateToURLParameters, useSwapActionHandlers } from 'state/swap/hooks'
import { CurrencyState } from 'state/swap/types'
import { useSwapAndLimitContext, useSwapContext } from 'state/swap/useSwapContext'
import { ExternalLink, ThemedText } from 'theme/components'
import { Text } from 'ui/src'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { maybeLogFirstSwapAction } from 'uniswap/src/features/transactions/swap/utils/maybeLogFirstSwapAction'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { computeFiatValuePriceImpact } from 'utils/computeFiatValuePriceImpact'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { largerPercentValue } from 'utils/percent'
import { computeRealizedPriceImpact, warningSeverity } from 'utils/prices'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

interface SwapFormProps {
  disableTokenInputs?: boolean
  initialCurrencyLoading?: boolean
  onCurrencyChange?: (selected: CurrencyState) => void
}

export function SwapForm({
  disableTokenInputs = false,
  initialCurrencyLoading = false,
  onCurrencyChange,
}: SwapFormProps) {
  const { isDisconnected, chainId: connectedChainId } = useAccount()

  const trace = useTrace()

  const { chainId } = useMultichainContext()
  const { prefilledState, currencyState } = useSwapAndLimitContext()
  const supportedChainId = useSupportedChainId(chainId)
  const { swapState, setSwapState, derivedSwapInfo } = useSwapContext()
  const { typedValue, independentField } = swapState

  // token warning stuff
  const prefilledInputCurrencyInfo = useCurrencyInfo(prefilledState.inputCurrency)
  const prefilledOutputCurrencyInfo = useCurrencyInfo(prefilledState.outputCurrency)
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const [showPriceImpactModal, setShowPriceImpactModal] = useState<boolean>(false)

  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  // dismiss warning if prefilled tokens don't have warnings
  const prefilledCurrencyInfosWithWarnings: { field: CurrencyField; currencyInfo: CurrencyInfo }[] = useMemo(() => {
    const tokens = []
    if (
      prefilledInputCurrencyInfo?.currency.isToken &&
      prefilledInputCurrencyInfo.safetyLevel !== SafetyLevel.Verified
    ) {
      tokens.push({ field: CurrencyField.INPUT, currencyInfo: prefilledInputCurrencyInfo })
    }
    if (
      prefilledOutputCurrencyInfo?.currency.isToken &&
      prefilledOutputCurrencyInfo.safetyLevel !== SafetyLevel.Verified
    ) {
      tokens.push({ field: CurrencyField.OUTPUT, currencyInfo: prefilledOutputCurrencyInfo })
    }
    return tokens
  }, [prefilledInputCurrencyInfo, prefilledOutputCurrencyInfo])

  const theme = useTheme()

  // toggle wallet when disconnected
  const accountDrawer = useAccountDrawer()

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
    [inputTax, outputTax],
  )

  useEffect(() => {
    // Force exact input if the user switches to an output token with tax
    if (outputTokenHasTax && independentField === CurrencyField.OUTPUT) {
      setSwapState((state) => ({
        ...state,
        independentField: CurrencyField.INPUT,
        typedValue: '',
      }))
    }
  }, [independentField, outputTokenHasTax, setSwapState, trade?.outputAmount])

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[CurrencyField.INPUT], currencies[CurrencyField.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NotApplicable

  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
            [CurrencyField.INPUT]: parsedAmount,
            [CurrencyField.OUTPUT]: parsedAmount,
          }
        : {
            [CurrencyField.INPUT]: independentField === CurrencyField.INPUT ? parsedAmount : trade?.inputAmount,
            [CurrencyField.OUTPUT]: independentField === CurrencyField.OUTPUT ? parsedAmount : trade?.outputAmount,
          },
    [independentField, parsedAmount, showWrap, trade],
  )

  const showFiatValueInput = Boolean(parsedAmounts[CurrencyField.INPUT])
  const showFiatValueOutput = Boolean(parsedAmounts[CurrencyField.OUTPUT])
  const getSingleUnitAmount = (currency?: Currency) => {
    if (!currency) {
      return undefined
    }
    return CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(10 ** currency.decimals))
  }

  const fiatValueInput = useUSDPrice(
    parsedAmounts[CurrencyField.INPUT] ?? getSingleUnitAmount(currencies[CurrencyField.INPUT]),
    currencies[CurrencyField.INPUT],
  )
  const fiatValueOutput = useUSDPrice(
    parsedAmounts[CurrencyField.OUTPUT] ?? getSingleUnitAmount(currencies[CurrencyField.OUTPUT]),
    currencies[CurrencyField.OUTPUT],
  )

  const [routeNotFound, routeIsLoading, routeIsSyncing] = useMemo(
    () => [
      tradeState === TradeState.NO_ROUTE_FOUND,
      tradeState === TradeState.LOADING,
      tradeState === TradeState.LOADING && Boolean(trade),
    ],
    [trade, tradeState],
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
    [fiatValueTradeInput, fiatValueTradeOutput, preTaxFiatValueTradeOutput, routeIsSyncing, trade, showWrap],
  )

  const { onSwitchTokens, onCurrencySelection, onUserInput } = useSwapActionHandlers()
  const dependentField: CurrencyField =
    independentField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(CurrencyField.INPUT, value)
      maybeLogFirstSwapAction(trace)
    },
    [onUserInput, trace],
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(CurrencyField.OUTPUT, value)
      maybeLogFirstSwapAction(trace)
    },
    [onUserInput, trace],
  )

  const navigate = useNavigate()
  const swapIsUnsupported = useIsSwapUnsupported(currencies[CurrencyField.INPUT], currencies[CurrencyField.OUTPUT])
  const isLandingPage = useIsPage(PageType.LANDING)

  const navigateToSwapWithParams = useCallback(() => {
    const serializedSwapState = serializeSwapStateToURLParameters({
      inputCurrency: currencyState.inputCurrency,
      outputCurrency: currencyState.outputCurrency,
      typedValue: swapState.typedValue,
      independentField: swapState.independentField,
      chainId: supportedChainId ?? UniverseChainId.Mainnet,
    })
    navigate('/swap' + serializedSwapState)
  }, [
    currencyState.inputCurrency,
    currencyState.outputCurrency,
    navigate,
    supportedChainId,
    swapState.independentField,
    swapState.typedValue,
  ])

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
    [dependentField, formatCurrencyAmount, independentField, parsedAmounts, showWrap, typedValue],
  )

  const selectChain = useSelectChain()

  const userHasSpecifiedInputOutput = Boolean(
    currencies[CurrencyField.INPUT] &&
      currencies[CurrencyField.OUTPUT] &&
      parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0)),
  )

  const maximumAmountIn = useMaxAmountIn(trade, allowedSlippage)
  const allowance = usePermit2Allowance(
    maximumAmountIn ??
      (parsedAmounts[CurrencyField.INPUT]?.currency.isToken
        ? (parsedAmounts[CurrencyField.INPUT] as CurrencyAmount<Token>)
        : undefined),
    supportedChainId ? UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V1_2, supportedChainId) : undefined,
    trade?.fillType,
  )

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[CurrencyField.INPUT]),
    [currencyBalances],
  )
  const showMaxButton = Boolean(
    maxInputAmount?.greaterThan(0) && !parsedAmounts[CurrencyField.INPUT]?.equalTo(maxInputAmount),
  )
  const swapFiatValues = useMemo(() => {
    return { amountIn: fiatValueTradeInput.data, amountOut: fiatValueTradeOutput.data, feeUsd: outputFeeFiatValue }
  }, [fiatValueTradeInput.data, fiatValueTradeOutput.data, outputFeeFiatValue])

  // the callback to execute the swap
  const swapCallback = useSwapCallback(
    trade,
    swapFiatValues,
    allowedSlippage,
    allowance.state === AllowanceState.ALLOWED ? allowance.permitSignature : undefined,
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
    if (!onWrap) {
      return
    }

    try {
      if (supportedChainId && connectedChainId !== chainId) {
        const correctChain = await selectChain(supportedChainId)
        if (!correctChain) {
          return
        }
      }
      const txHash = await onWrap()
      setSwapFormState((currentState) => ({
        ...currentState,
        swapError: undefined,
        txHash,
      }))
      onUserInput(CurrencyField.INPUT, '')
    } catch (error) {
      if (!didUserReject(error)) {
        sendAnalyticsEvent(SwapEventName.SWAP_ERROR, {
          wrapType,
          input: currencies[CurrencyField.INPUT],
          output: currencies[CurrencyField.OUTPUT],
        })
      } else {
        logger.debug('SwapForm', 'handleOnWrap', 'rejected wrap/unwrap')
      }
      setSwapFormState((currentState) => ({
        ...currentState,
        swapError: error,
        txHash: undefined,
      }))
    }
  }, [currencies, onUserInput, onWrap, wrapType, connectedChainId, chainId, supportedChainId, selectChain])

  // warnings on the greater of fiat value price impact and execution price impact
  const { priceImpactSeverity, largerPriceImpact } = useMemo(() => {
    if (!isClassicTrade(trade)) {
      return { priceImpactSeverity: 0, largerPriceImpact: undefined }
    }

    const marketPriceImpact = trade?.priceImpact ? computeRealizedPriceImpact(trade) : undefined
    const largerPriceImpact = largerPercentValue(marketPriceImpact, preTaxStablecoinPriceImpact)
    return {
      priceImpactSeverity: warningSeverity(largerPriceImpact),
      largerPriceImpact: largerPriceImpact?.multiply(-1.0),
    }
  }, [preTaxStablecoinPriceImpact, trade])

  const handleConfirmDismiss = useCallback(() => {
    setSwapFormState((currentState) => ({ ...currentState, showConfirm: false }))
    // If swap had a temporary router preference override, we want to reset it
    setSwapState((state) => ({ ...state, routerPreferenceOverride: undefined }))
    // If there was a swap, we want to clear the input
    if (swapResult) {
      onUserInput(CurrencyField.INPUT, '')
    }
  }, [onUserInput, setSwapState, swapResult])

  const handleAcceptChanges = useCallback(() => {
    setSwapFormState((currentState) => ({ ...currentState, tradeToConfirm: trade }))
  }, [trade])

  const handleInputSelect = useCallback(
    (inputCurrency: Currency) => {
      onCurrencySelection(CurrencyField.INPUT, inputCurrency)
      onCurrencyChange?.({
        inputCurrency,
        outputCurrency: currencyState.outputCurrency,
      })
      maybeLogFirstSwapAction(trace)
    },
    [onCurrencyChange, onCurrencySelection, currencyState, trace],
  )
  const inputCurrencyNumericalInputRef = useRef<HTMLInputElement>(null)

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(CurrencyField.INPUT, maxInputAmount.toExact())
    maybeLogFirstSwapAction(trace)
  }, [maxInputAmount, onUserInput, trace])

  const handleOutputSelect = useCallback(
    (outputCurrency: Currency) => {
      onCurrencySelection(CurrencyField.OUTPUT, outputCurrency)
      onCurrencyChange?.({
        inputCurrency: currencyState.inputCurrency,
        outputCurrency,
      })
      maybeLogFirstSwapAction(trace)
    },
    [onCurrencyChange, onCurrencySelection, currencyState, trace],
  )

  const showPriceImpactWarning = isClassicTrade(trade) && largerPriceImpact && priceImpactSeverity > 3

  const prevTrade = usePrevious(trade)
  useEffect(() => {
    if (!trade || prevTrade === trade) {
      return
    } // no new swap quote to log

    sendAnalyticsEvent(SwapEventName.SWAP_QUOTE_RECEIVED, {
      ...formatSwapQuoteReceivedEventProperties(trade, allowedSlippage, swapQuoteLatency, outputFeeFiatValue),
      ...trace,
    })
  }, [prevTrade, trade, trace, allowedSlippage, swapQuoteLatency, outputFeeFiatValue])

  const showDetailsDropdown = Boolean(
    !isLandingPage && !showWrap && userHasSpecifiedInputOutput && (trade || routeIsLoading || routeIsSyncing),
  )

  const inputCurrency = currencies[CurrencyField.INPUT] ?? undefined

  // @ts-ignore
  const isUsingBlockedExtension = window.ethereum?.['isPocketUniverseZ']

  return (
    <>
      {prefilledCurrencyInfosWithWarnings.length >= 1 && (
        <TokenWarningModal
          isVisible={prefilledCurrencyInfosWithWarnings.length >= 1 && !dismissTokenWarning}
          currencyInfo0={prefilledCurrencyInfosWithWarnings[0].currencyInfo}
          currencyInfo1={prefilledCurrencyInfosWithWarnings[1]?.currencyInfo ?? undefined}
          onAcknowledge={handleConfirmTokenWarning}
          onReject={() => {
            setDismissTokenWarning(true)
            onCurrencySelection(CurrencyField.INPUT, undefined)
            onCurrencySelection(CurrencyField.OUTPUT, undefined)
          }}
          closeModalOnly={() => {
            setDismissTokenWarning(true)
          }}
          onToken0BlockAcknowledged={() => onCurrencySelection(prefilledCurrencyInfosWithWarnings[0].field, undefined)}
          onToken1BlockAcknowledged={() => onCurrencySelection(prefilledCurrencyInfosWithWarnings[1].field, undefined)}
        />
      )}
      {trade && showConfirm && (
        <ConfirmSwapModal
          trade={trade}
          priceImpact={largerPriceImpact}
          inputCurrency={inputCurrency}
          originalTrade={tradeToConfirm}
          onAcceptChanges={handleAcceptChanges}
          onCurrencySelection={onCurrencySelection}
          swapResult={swapResult}
          allowedSlippage={allowedSlippage}
          clearSwapState={clearSwapState}
          onConfirm={handleSwap}
          allowance={allowance}
          swapError={swapError}
          onDismiss={handleConfirmDismiss}
          onXV2RetryWithClassic={() => {
            // Keep swap parameters but re-quote X trade with classic API
            setSwapState((state) => ({
              ...state,
              routerPreferenceOverride: RouterPreference.API,
            }))
            handleContinueToReview()
          }}
          fiatValueInput={fiatValueTradeInput}
          fiatValueOutput={fiatValueTradeOutput}
        />
      )}
      {showPriceImpactModal && showPriceImpactWarning && (
        <PriceImpactModal
          priceImpact={largerPriceImpact}
          onDismiss={() => {
            sendAnalyticsEvent(SwapEventName.SWAP_PRICE_IMPACT_ACKNOWLEDGED, {
              response: SwapPriceImpactUserResponse.REJECTED,
            })
            setShowPriceImpactModal(false)
          }}
          onContinue={() => {
            sendAnalyticsEvent(SwapEventName.SWAP_PRICE_IMPACT_ACKNOWLEDGED, {
              response: SwapPriceImpactUserResponse.ACCEPTED,
            })
            setShowPriceImpactModal(false)
            handleContinueToReview()
          }}
        />
      )}
      <div style={{ display: 'relative' }}>
        <SwapSection>
          <Trace section={InterfaceSectionName.CURRENCY_INPUT_PANEL}>
            <SwapCurrencyInputPanel
              label={<Trans i18nKey="common.sell.label" />}
              disabled={disableTokenInputs}
              value={formattedAmounts[CurrencyField.INPUT]}
              showMaxButton={showMaxButton}
              currency={currencies[CurrencyField.INPUT] ?? null}
              currencyField={CurrencyField.INPUT}
              onUserInput={handleTypeInput}
              onMax={handleMaxInput}
              fiatValue={showFiatValueInput ? fiatValueInput : undefined}
              onCurrencySelect={handleInputSelect}
              otherCurrency={currencies[CurrencyField.OUTPUT]}
              id={InterfaceSectionName.CURRENCY_INPUT_PANEL}
              loading={independentField === CurrencyField.OUTPUT && routeIsSyncing}
              initialCurrencyLoading={initialCurrencyLoading}
              ref={inputCurrencyNumericalInputRef}
            />
          </Trace>
        </SwapSection>
        <ArrowWrapper clickable={!!supportedChainId}>
          <Trace
            logPress
            eventOnTrigger={SwapEventName.SWAP_TOKENS_REVERSED}
            element={InterfaceElementName.SWAP_TOKENS_REVERSE_ARROW_BUTTON}
          >
            <ArrowContainer
              data-testid="swap-currency-button"
              onClick={() => {
                if (disableTokenInputs) {
                  return
                }
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
          </Trace>
        </ArrowWrapper>
      </div>
      <AutoColumn gap="xs">
        <div>
          <OutputSwapSection>
            <Trace section={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}>
              <SwapCurrencyInputPanel
                value={formattedAmounts[CurrencyField.OUTPUT]}
                disabled={disableTokenInputs}
                onUserInput={handleTypeOutput}
                label={<Trans i18nKey="common.buy.label" />}
                showMaxButton={false}
                hideBalance={false}
                fiatValue={showFiatValueOutput ? fiatValueOutput : undefined}
                priceImpact={stablecoinPriceImpact}
                currency={currencies[CurrencyField.OUTPUT] ?? null}
                currencyField={CurrencyField.OUTPUT}
                onCurrencySelect={handleOutputSelect}
                otherCurrency={currencies[CurrencyField.INPUT]}
                id={InterfaceSectionName.CURRENCY_OUTPUT_PANEL}
                loading={independentField === CurrencyField.INPUT && routeIsSyncing}
                numericalInputSettings={{
                  // We disable numerical input here if the selected token has tax, since we cannot guarantee exact_outputs for FOT tokens
                  disabled: inputTokenHasTax || outputTokenHasTax,
                  // Focus the input currency panel if the user tries to type into the disabled output currency panel
                  onDisabledClick: () => inputCurrencyNumericalInputRef.current?.focus(),
                  disabledTooltipBody: (
                    <OutputTaxTooltipBody
                      currencySymbol={currencies[inputTokenHasTax ? CurrencyField.INPUT : CurrencyField.OUTPUT]?.symbol}
                    />
                  ),
                }}
              />
            </Trace>
          </OutputSwapSection>
        </div>

        <div>
          {isLandingPage ? (
            <ButtonPrimary
              $borderRadius="16px"
              onClick={() => navigateToSwapWithParams()}
              fontWeight={535}
              data-testid="wrap-button"
            >
              <Text variant="buttonLabel1" color="$neutralContrast">
                <Trans i18nKey="common.getStarted" />
              </Text>
            </ButtonPrimary>
          ) : swapIsUnsupported ? (
            <ButtonPrimary $borderRadius="16px" disabled={true}>
              <ThemedText.DeprecatedMain mb="4px">
                <Trans i18nKey="common.unsupportedAsset_one" />
              </ThemedText.DeprecatedMain>
            </ButtonPrimary>
          ) : isDisconnected ? (
            <Trace
              logPress
              eventOnTrigger={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
              properties={{ received_swap_quote: getIsReviewableQuote(trade, tradeState, swapInputError) }}
              element={InterfaceElementName.CONNECT_WALLET_BUTTON}
            >
              <ButtonLight onClick={accountDrawer.open} fontWeight={535} $borderRadius="16px">
                <ConnectWalletButtonText />
              </ButtonLight>
            </Trace>
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
              ) : wrapType === WrapType.Wrap ? (
                <Trans i18nKey="common.wrap.button" />
              ) : wrapType === WrapType.Unwrap ? (
                <Trans i18nKey="common.unwrap.button" />
              ) : null}
            </ButtonPrimary>
          ) : routeNotFound && userHasSpecifiedInputOutput && !routeIsLoading && !routeIsSyncing ? (
            <GrayCard style={{ textAlign: 'center' }}>
              <ThemedText.DeprecatedMain mb="4px">
                <Trans i18nKey="swap.form.insufficientLiquidity" />
              </ThemedText.DeprecatedMain>
            </GrayCard>
          ) : (
            <Trace logPress element={InterfaceElementName.SWAP_BUTTON}>
              <ButtonError
                onClick={() => {
                  showPriceImpactWarning ? setShowPriceImpactModal(true) : handleContinueToReview()
                }}
                id="swap-button"
                data-testid="swap-button"
                disabled={isUsingBlockedExtension || !getIsReviewableQuote(trade, tradeState, swapInputError)}
              >
                <Text fontSize={20} color="$neutralContrast">
                  {swapInputError ?? <Trans i18nKey="common.swap" />}
                </Text>
              </ButtonError>
            </Trace>
          )}
          {showDetailsDropdown && (
            <SwapDetailsDropdown
              trade={trade}
              syncing={routeIsSyncing}
              loading={routeIsLoading}
              allowedSlippage={allowedSlippage}
              priceImpact={largerPriceImpact}
            />
          )}
          {isUsingBlockedExtension && <SwapNotice />}
        </div>
      </AutoColumn>
    </>
  )
}

function SwapNotice() {
  const theme = useTheme()
  return (
    <Row
      align="flex-start"
      gap="md"
      backgroundColor={theme.surface2}
      marginTop="12px"
      borderRadius="12px"
      padding="16px"
    >
      <Row width="auto" borderRadius="16px" backgroundColor={theme.critical2} padding="8px">
        <ErrorIcon />
      </Row>

      <Column flex="10" gap="sm">
        <ThemedText.SubHeader>Blocked Extension</ThemedText.SubHeader>
        <ThemedText.BodySecondary lineHeight="22px">
          <Trans
            i18nKey="swap.form.pocketUniverseExtension.warning"
            components={{
              termsLink: (
                <ExternalLink href="https://uniswap.org/terms-of-service">
                  <Trans i18nKey="common.termsOfService" />
                </ExternalLink>
              ),
            }}
          />
        </ThemedText.BodySecondary>
      </Column>
    </Row>
  )
}
