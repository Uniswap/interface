import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { type ChainedQuoteResponse, TradingApi } from '@universe/api'
import { isMobileApp } from '@universe/environment'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, ModalCloseIcon, Text, TouchableArea, useIsShortMobileDevice } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { useTradingApiEarnQuoteQuery } from 'uniswap/src/data/apiClients/tradingApi/useTradingApiEarnQuoteQuery'
import { useActiveAccount } from 'uniswap/src/features/accounts/store/hooks'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEarnWithdrawInputAmount } from 'uniswap/src/features/earn/amount'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import {
  getEarnStepProgressLabel,
  isEarnActivePlanExecuting,
  useEarnPlanProgressState,
} from 'uniswap/src/features/earn/EarnPlanProgressIndicator'
import { EarnReviewActionRow, getEarnReviewCtaDisabled } from 'uniswap/src/features/earn/EarnReviewActionRow'
import {
  EarnReviewBlockingMessage,
  getEarnReviewHasBlockingError,
} from 'uniswap/src/features/earn/EarnReviewBlockingMessage'
import { EarnReviewLayout, type EarnReviewRenderLayout } from 'uniswap/src/features/earn/EarnReviewLayout'
import { getEarnTradingApiErrorDetail, getEarnWithdrawErrorMessage } from 'uniswap/src/features/earn/errors'
import { useEarnInsufficientGasWarning } from 'uniswap/src/features/earn/hooks/useEarnInsufficientGasWarning'
import { useEarnNetworkCostLabel } from 'uniswap/src/features/earn/hooks/useEarnNetworkCostLabel'
import { useEarnReviewAnalytics } from 'uniswap/src/features/earn/hooks/useEarnReviewAnalytics'
import { useEarnReviewExecutionHandlers } from 'uniswap/src/features/earn/hooks/useEarnReviewExecutionHandlers'
import {
  getEarnExecutionErrorMessage,
  shouldShowEarnTroubleshootingLink,
} from 'uniswap/src/features/earn/planExecution'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnVaultWithdrawDestinationCurrencyId } from 'uniswap/src/features/earn/withdrawDestination'
import { WithdrawReviewDetails } from 'uniswap/src/features/earn/WithdrawReviewDetails'
import { useLocalFiatToUSDConverter } from 'uniswap/src/features/fiatCurrency/useLocalFiatToUSDConverter'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { EarnEventName } from 'uniswap/src/features/telemetry/constants/features'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import type {
  EarnAnalyticsEntryPoint,
  EarnAnalyticsSurface as EarnAnalyticsSurfaceValue,
} from 'uniswap/src/features/telemetry/types'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useFiatTokenConversion } from 'uniswap/src/features/transactions/hooks/useFiatTokenConversion'
import type { PlanFinalizedCallbackParams } from 'uniswap/src/features/transactions/swap/plan/types'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { isChainedQuoteResponse } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  getTokenAddressForApi,
  toTradingApiSupportedChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useStore } from 'zustand'

const DEFAULT_EARN_ANALYTICS_SURFACE = isMobileApp ? EarnAnalyticsSurface.Mobile : EarnAnalyticsSurface.Web

export interface ExecuteEarnWithdrawParams {
  earnIntent: TradingApi.EarnIntent
  withdrawMode: TradingApi.EarnWithdrawMode
  inputCurrency: Currency
  inputAmount: CurrencyAmount<Currency>
  outputCurrency: Currency
  quote: ChainedQuoteResponse
  onSuccess: () => void
  onFailure: (error?: Error, onPressRetry?: () => void) => void
  onSubmitted?: () => void
  onPlanFinalized?: (params: PlanFinalizedCallbackParams) => void
}

interface WithdrawReviewViewProps {
  vault: EarnVaultInfo
  position: EarnPositionInfo
  amount: string
  chainId: UniverseChainId
  destinationCurrencyId?: string
  withdrawMode?: TradingApi.EarnWithdrawMode
  onBack: () => void
  onClose: () => void
  onWithdraw?: () => void
  onExecuteWithdraw?: (params: ExecuteEarnWithdrawParams) => void
  onExecutionFailure?: (error?: Error) => void
  onPlanFinalized?: (params: PlanFinalizedCallbackParams) => void
  analyticsEntryPoint?: EarnAnalyticsEntryPoint
  analyticsSurface?: EarnAnalyticsSurfaceValue
  /** See {@link EarnReviewLayout} — lets the mobile bottom-sheet modal pin the action in a footer overlay. */
  renderLayout?: EarnReviewRenderLayout
}

export function WithdrawReviewView({
  vault,
  position,
  amount,
  chainId,
  destinationCurrencyId: destinationCurrencyIdProp,
  withdrawMode = TradingApi.EarnWithdrawMode.EXACT_ASSETS,
  onBack,
  onClose,
  onWithdraw,
  onExecuteWithdraw,
  onExecutionFailure,
  onPlanFinalized,
  analyticsEntryPoint = EarnEntryPoint.GlobalModal,
  analyticsSurface = DEFAULT_EARN_ANALYTICS_SURFACE,
  renderLayout,
}: WithdrawReviewViewProps): JSX.Element {
  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const destinationCurrencyId =
    destinationCurrencyIdProp ??
    getEarnVaultWithdrawDestinationCurrencyId({
      vault,
      destinationChainId: chainId,
    })
  const currencyInfo = useCurrencyInfo(destinationCurrencyId)
  const currency = currencyInfo?.currency
  const vaultUnderlyingCurrencyInfo = useCurrencyInfo(vault.displayCurrencyId)
  const vaultShareCurrencyInfo = useCurrencyInfo(buildCurrencyId(vault.chainId, vault.vaultAddress))
  const vaultShareCurrency = vaultShareCurrencyInfo?.currency
  const symbol = currency?.symbol ?? ''
  const outputTradingApiChainId = toTradingApiSupportedChainId(chainId)
  const vaultTradingApiChainId = toTradingApiSupportedChainId(vault.chainId)
  const evmAccount = useActiveAccount(Platform.EVM)
  const activePlan = useStore(activePlanStore, (state) => state.activePlan)
  const priceChangeInterruptedPlanIds = useStore(activePlanStore, (state) => state.priceChangeInterruptedPlanIds)
  const earnPlanProgress = useEarnPlanProgressState()

  const [expanded, setExpanded] = useState(false)
  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), [])
  const {
    clearExecutionState,
    executionError,
    handleBack,
    handleClose,
    handleFailure,
    handleRetry,
    handleSuccess,
    isSubmitting,
    onPressRetry,
    startSubmitting,
  } = useEarnReviewExecutionHandlers({
    onBack,
    onClose,
    onExecutionFailure,
    onSuccess: onWithdraw,
  })

  // amount is local fiat; convert to USD for math against depositedUsd.
  const localFiatToUsd = useLocalFiatToUSDConverter()
  const parsedAmountLocalFiat = Number(amount) || 0
  const parsedAmountUsd = localFiatToUsd(parsedAmountLocalFiat) ?? parsedAmountLocalFiat
  const { fiatToToken } = useFiatTokenConversion({ currency })
  const tokenAmountValue = fiatToToken(amount)
  const tokenAmountLabel =
    tokenAmountValue !== null
      ? formatNumberOrString({
          value: tokenAmountValue,
          type: NumberType.TokenNonTx,
        })
      : '—'
  const exactAssetsAmount = useMemo(
    () =>
      tokenAmountValue !== null
        ? getCurrencyAmount({
            value: tokenAmountValue,
            valueType: ValueType.Exact,
            currency,
          })
        : undefined,
    [currency, tokenAmountValue],
  )
  const quoteRequestAmount = useMemo(
    () =>
      getEarnWithdrawInputAmount({
        currency,
        exactAssetsAmount,
        position,
        withdrawMode,
      }),
    [currency, exactAssetsAmount, position, withdrawMode],
  )

  const earnIntent = useMemo<TradingApi.EarnIntent | undefined>(() => {
    if (!vaultTradingApiChainId) {
      return undefined
    }

    return {
      action: TradingApi.EarnAction.WITHDRAW,
      vault: vault.vaultAddress,
      chainId: vaultTradingApiChainId,
      withdrawMode,
    }
  }, [vault.vaultAddress, vaultTradingApiChainId, withdrawMode])

  const quoteRequestBase: TradingApi.QuoteRequest | undefined = useMemo(() => {
    const tokenOut = getTokenAddressForApi(currency)
    if (
      !evmAccount ||
      !currency ||
      !quoteRequestAmount ||
      !tokenOut ||
      !outputTradingApiChainId ||
      !vaultTradingApiChainId
    ) {
      return undefined
    }
    return {
      type: TradingApi.TradeType.EXACT_INPUT,
      amount: quoteRequestAmount.quotient.toString(),
      tokenIn: vault.vaultAddress,
      tokenOut,
      tokenInChainId: vaultTradingApiChainId,
      tokenOutChainId: outputTradingApiChainId,
      swapper: evmAccount.address,
      recipient: evmAccount.address,
      routingPreference: TradingApi.RoutingPreference.BEST_PRICE,
    }
  }, [currency, evmAccount, quoteRequestAmount, outputTradingApiChainId, vault.vaultAddress, vaultTradingApiChainId])

  const isExecuting = isEarnActivePlanExecuting({ activePlan, priceChangeInterruptedPlanIds })
  const quoteQuery = useTradingApiEarnQuoteQuery({
    base: quoteRequestBase,
    earnIntent,
    enabled: !!onExecuteWithdraw && !isExecuting,
  })
  const networkCostLabel = useEarnNetworkCostLabel({
    chainId: vault.chainId,
    isLoading: quoteQuery.isPending,
    quote: quoteQuery.data ?? undefined,
  })
  const chainedQuote = useMemo(
    () => (quoteQuery.data && isChainedQuoteResponse(quoteQuery.data) ? quoteQuery.data : undefined),
    [quoteQuery.data],
  )
  const executionInputAmount = useMemo(() => {
    if (!vaultShareCurrency || !quoteQuery.data || !isChainedQuoteResponse(quoteQuery.data)) {
      return undefined
    }

    const earnPreview = quoteQuery.data.quote.earnPreview
    const sharesRaw =
      earnPreview?.type === 'EXACT_ASSETS_WITHDRAW'
        ? earnPreview.estimatedSharesIn
        : earnPreview?.type === 'MAX_SHARES_WITHDRAW'
          ? earnPreview.maxRedeemableSharesIn
          : undefined

    return sharesRaw
      ? (getCurrencyAmount({ value: sharesRaw, valueType: ValueType.Raw, currency: vaultShareCurrency }) ?? undefined)
      : undefined
  }, [quoteQuery.data, vaultShareCurrency])
  const hasQuoteError = quoteQuery.isError && !quoteQuery.isFetching
  const quoteErrorMessage = hasQuoteError ? getEarnWithdrawErrorMessage({ error: quoteQuery.error, t }) : undefined
  const executionErrorFallbackMessage = getEarnTradingApiErrorDetail(executionError)
    ? getEarnWithdrawErrorMessage({ error: executionError, t })
    : t('explore.earn.review.transactionFailed')
  const executionErrorMessage = getEarnExecutionErrorMessage({
    error: executionError,
    fallback: executionErrorFallbackMessage,
  })
  const insufficientGasWarning = useEarnInsufficientGasWarning({
    accountAddress: evmAccount?.address,
    fallbackChainId: vault.chainId,
    flow: 'withdraw',
    inputAmount: undefined,
    quote: quoteQuery.data,
  })

  const formatLocalFiat = useCallback(
    (usdValue: number): string => convertFiatAmountFormatted(usdValue, NumberType.FiatStandard),
    [convertFiatAmountFormatted],
  )

  const balanceAfterUsd = Math.max(position.depositedUsd - parsedAmountUsd, 0)
  const { logFailed, logFinalized, logSubmitted, reviewedEventProperties } = useEarnReviewAnalytics({
    action: 'withdraw',
    amountUsd: parsedAmountUsd,
    analyticsEntryPoint,
    analyticsSurface,
    destinationChainId: chainId,
    destinationCurrency: currency,
    position,
    quote: chainedQuote,
    sourceChainId: vault.chainId,
    sourceTokenAddress: vault.vaultAddress,
    sourceTokenSymbol: vaultShareCurrency?.symbol,
    tokenAmount: tokenAmountValue ?? undefined,
    underlyingTokenSymbol: vaultUnderlyingCurrencyInfo?.currency.symbol,
    vault,
    withdrawMode,
  })

  const hasBlockingError = getEarnReviewHasBlockingError({ hasQuoteError, insufficientGasWarning })
  const ctaDisabled = getEarnReviewCtaDisabled({
    hasBlockingError,
    isSubmitting,
    isExecuting,
    isQuotePending: quoteQuery.isPending,
    quote: quoteQuery.data ?? undefined,
    hasAccount: !!evmAccount,
    hasInputAmount: !!quoteRequestAmount && !!executionInputAmount,
    hasExecuteHandler: !!onExecuteWithdraw,
  })

  const handleWithdrawPress = useCallback(() => {
    clearExecutionState()
    if (
      !currency ||
      !executionInputAmount ||
      !vaultShareCurrency ||
      !quoteQuery.data ||
      !isChainedQuoteResponse(quoteQuery.data) ||
      !earnIntent ||
      !onExecuteWithdraw
    ) {
      return
    }
    startSubmitting()
    onExecuteWithdraw({
      earnIntent,
      withdrawMode,
      inputCurrency: vaultShareCurrency,
      inputAmount: executionInputAmount,
      outputCurrency: currency,
      quote: quoteQuery.data,
      onSuccess: handleSuccess,
      onFailure: (error, onPressRetryCallback) => {
        logFailed(error)
        handleFailure(error, onPressRetryCallback)
      },
      onSubmitted: logSubmitted,
      onPlanFinalized: (params) => {
        logFinalized(params)
        onPlanFinalized?.(params)
      },
    })
  }, [
    currency,
    clearExecutionState,
    earnIntent,
    executionInputAmount,
    handleFailure,
    handleSuccess,
    logFailed,
    logFinalized,
    logSubmitted,
    onExecuteWithdraw,
    onPlanFinalized,
    quoteQuery.data,
    startSubmitting,
    vaultShareCurrency,
    withdrawMode,
  ])

  const stepProgressLabel = useMemo(
    () =>
      getEarnStepProgressLabel({
        activePlan,
        t,
        vaultStepType: TradingApi.PlanStepType.VAULT_WITHDRAW,
        vaultStepLabel: t('transaction.status.withdraw.pending'),
      }),
    [activePlan, t],
  )
  const action = (
    <EarnReviewActionRow
      ctaDisabled={ctaDisabled}
      ctaLabel={insufficientGasWarning.warning?.buttonText ?? t('explore.earn.withdraw.cta', { symbol })}
      executionError={executionError}
      isExecuting={isExecuting}
      isShortMobileDevice={isShortMobileDevice}
      progress={earnPlanProgress}
      retryLabel={t('common.button.retry')}
      stepProgressLabel={stepProgressLabel}
      onBack={handleBack}
      onPress={handleWithdrawPress}
      onRetry={onPressRetry ? handleRetry : undefined}
    />
  )

  return (
    <Trace logImpression eventOnTrigger={EarnEventName.EarnWithdrawReviewed} properties={reviewedEventProperties}>
      <EarnReviewLayout action={action} renderLayout={renderLayout}>
        {isMobileApp ? (
          <Text variant="subheading2" color="$neutral2" textAlign="center">
            {t('explore.earn.withdraw.confirm')}
          </Text>
        ) : (
          <Flex row alignItems="center" justifyContent="space-between">
            <TouchableArea onPress={handleBack}>
              <BackArrow color="$neutral2" size="$icon.24" />
            </TouchableArea>
            <Text variant="subheading2" color="$neutral2">
              {t('explore.earn.withdraw.confirm')}
            </Text>
            <ModalCloseIcon onClose={handleClose} />
          </Flex>
        )}

        <Flex alignItems="center" gap="$spacing12" py="$spacing32">
          <Text variant="heading1" color="$neutral1">
            {formatLocalFiat(parsedAmountUsd)}
          </Text>
          <Flex row alignItems="center" gap="$spacing8">
            <TokenLogo
              hideNetworkLogo
              url={currencyInfo?.logoUrl}
              size={iconSizes.icon24}
              symbol={symbol}
              name={currency?.name}
            />
            <Text variant="body2" color="$neutral2">
              {`${tokenAmountLabel} ${symbol}`}
            </Text>
          </Flex>
        </Flex>

        {!earnPlanProgress && (
          <WithdrawReviewDetails
            balanceAfterUsd={balanceAfterUsd}
            chainId={chainId}
            expanded={expanded}
            formatLocalFiat={formatLocalFiat}
            networkCostLabel={networkCostLabel}
            positionDepositedUsd={position.depositedUsd}
            vault={vault}
            onToggleExpanded={toggleExpanded}
          />
        )}

        <EarnReviewBlockingMessage
          executionErrorMessage={executionErrorMessage}
          hasQuoteError={hasQuoteError}
          insufficientGasWarning={insufficientGasWarning}
          quoteErrorMessage={quoteErrorMessage}
          showTroubleshootingLink={shouldShowEarnTroubleshootingLink(executionError)}
        />
      </EarnReviewLayout>
    </Trace>
  )
}
