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
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { DepositReviewDetails } from 'uniswap/src/features/earn/DepositReviewDetails'
import {
  getDepositInputCurrencyAmount,
  getDepositQuoteRequestBase,
  getDepositTokenAmountLabel,
  getPreparedDepositExecutionParams,
} from 'uniswap/src/features/earn/DepositReviewViewUtils'
import {
  getEarnStepProgressLabel,
  isEarnActivePlanExecuting,
  useEarnPlanProgressState,
} from 'uniswap/src/features/earn/EarnPlanProgressIndicator'
import { EarnReviewActionRow, getEarnReviewCtaDisabled } from 'uniswap/src/features/earn/EarnReviewActionRow'
import {
  EarnReviewBlockingMessage,
  getEarnDepositQuoteErrorMessage,
  getEarnReviewHasBlockingError,
} from 'uniswap/src/features/earn/EarnReviewBlockingMessage'
import { useEarnInsufficientGasWarning } from 'uniswap/src/features/earn/hooks/useEarnInsufficientGasWarning'
import { useEarnNetworkCostLabel } from 'uniswap/src/features/earn/hooks/useEarnNetworkCostLabel'
import { useEarnReviewAnalytics } from 'uniswap/src/features/earn/hooks/useEarnReviewAnalytics'
import { useEarnReviewExecutionHandlers } from 'uniswap/src/features/earn/hooks/useEarnReviewExecutionHandlers'
import { getEarnExecutionErrorMessage } from 'uniswap/src/features/earn/planExecution'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalFiatToUSDConverter } from 'uniswap/src/features/fiatCurrency/useLocalFiatToUSDConverter'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type {
  EarnAnalyticsEntryPoint,
  EarnAnalyticsSurface as EarnAnalyticsSurfaceValue,
} from 'uniswap/src/features/telemetry/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useFiatTokenConversion } from 'uniswap/src/features/transactions/hooks/useFiatTokenConversion'
import type { PlanFinalizedCallbackParams } from 'uniswap/src/features/transactions/swap/plan/types'
import { activePlanStore } from 'uniswap/src/features/transactions/swap/review/stores/activePlan/activePlanStore'
import { isChainedQuoteResponse } from 'uniswap/src/features/transactions/swap/utils/routing'
import { toTradingApiSupportedChainId } from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useStore } from 'zustand'

const DEFAULT_EARN_ANALYTICS_SURFACE = isMobileApp ? EarnAnalyticsSurface.Mobile : EarnAnalyticsSurface.Web

export interface ExecuteEarnDepositParams {
  earnIntent: TradingApi.EarnIntent
  inputCurrency: Currency
  inputAmount: CurrencyAmount<Currency>
  outputCurrency: Currency
  quote: ChainedQuoteResponse
  onSuccess: () => void
  onFailure: (error?: Error, onPressRetry?: () => void) => void
  onSubmitted?: () => void
  onPlanFinalized?: (params: PlanFinalizedCallbackParams) => void
}

interface DepositReviewViewProps {
  vault: EarnVaultInfo
  position: EarnPositionInfo | undefined
  amount: string
  /** Exact token-unit amount for Max deposits. */
  tokenAmount?: string
  sourceChainId?: UniverseChainId
  sourceCurrencyId: string
  onBack: () => void
  onClose: () => void
  onDeposit?: () => void
  onExecuteDeposit?: (params: ExecuteEarnDepositParams) => void
  onExecutionFailure?: (error?: Error) => void
  onPlanFinalized?: (params: PlanFinalizedCallbackParams) => void
  analyticsEntryPoint?: EarnAnalyticsEntryPoint
  analyticsSurface?: EarnAnalyticsSurfaceValue
  originatingTransactionId?: string
  projectedMonthlyEarningsUsd?: number
  sourceUpsellCurrencyId?: string
  swapAmountUsd?: number
}

// eslint-disable-next-line complexity
export function DepositReviewView({
  vault,
  position,
  amount,
  tokenAmount,
  sourceChainId,
  sourceCurrencyId,
  onBack,
  onClose,
  onDeposit,
  onExecuteDeposit,
  onExecutionFailure,
  onPlanFinalized,
  analyticsEntryPoint = EarnEntryPoint.GlobalModal,
  analyticsSurface = DEFAULT_EARN_ANALYTICS_SURFACE,
  originatingTransactionId,
  projectedMonthlyEarningsUsd,
  sourceUpsellCurrencyId,
  swapAmountUsd,
}: DepositReviewViewProps): JSX.Element {
  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()
  const { convertFiatAmountFormatted, formatNumberOrString, formatPercent } = useLocalizationContext()
  // Logo and chain badge follow the source (where they're depositing from), not the vault chain.
  const sourceCurrencyInfo = useCurrencyInfo(sourceCurrencyId)
  const currency = sourceCurrencyInfo?.currency
  const vaultUnderlyingCurrencyInfo = useCurrencyInfo(vault.displayCurrencyId)
  const vaultShareCurrencyInfo = useCurrencyInfo(buildCurrencyId(vault.chainId, vault.vaultAddress))
  const vaultShareCurrency = vaultShareCurrencyInfo?.currency
  const quoteSourceChainId = sourceChainId ?? currency?.chainId
  const quoteSourceTradingApiChainId = toTradingApiSupportedChainId(quoteSourceChainId)
  const vaultTradingApiChainId = toTradingApiSupportedChainId(vault.chainId)
  const symbol = currency?.symbol ?? 'USDC'
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
    onSuccess: onDeposit,
  })

  // amount is local fiat; convert to USD for math against depositedUsd / projected earnings.
  const localFiatToUsd = useLocalFiatToUSDConverter()
  const parsedAmountLocalFiat = Number(amount) || 0
  const parsedAmountUsd = localFiatToUsd(parsedAmountLocalFiat) ?? parsedAmountLocalFiat
  const projectedAnnualEarningsUsd = parsedAmountUsd * (vault.apyPercent / 100)

  // Max quotes use the exact token amount, not the display-rounded fiat value.
  const { fiatToToken } = useFiatTokenConversion({ currency })
  const tokenAmountValue = tokenAmount ?? fiatToToken(amount)
  const tokenAmountLabel = getDepositTokenAmountLabel({ formatNumberOrString, tokenAmountValue })
  const inputCurrencyAmount = useMemo(
    () => getDepositInputCurrencyAmount({ currency, tokenAmountValue }),
    [currency, tokenAmountValue],
  )

  const earnIntent = useMemo<TradingApi.EarnIntent | undefined>(() => {
    if (!vaultTradingApiChainId) {
      return undefined
    }

    return {
      action: TradingApi.EarnAction.DEPOSIT,
      vault: vault.vaultAddress,
      chainId: vaultTradingApiChainId,
    }
  }, [vault.vaultAddress, vaultTradingApiChainId])

  const quoteRequestBase: TradingApi.QuoteRequest | undefined = useMemo(() => {
    return getDepositQuoteRequestBase({
      accountAddress: evmAccount?.address,
      currency,
      inputCurrencyAmount,
      quoteSourceTradingApiChainId,
      vault,
      vaultTradingApiChainId,
    })
  }, [currency, evmAccount?.address, inputCurrencyAmount, quoteSourceTradingApiChainId, vault, vaultTradingApiChainId])

  const isExecuting = isEarnActivePlanExecuting({ activePlan, priceChangeInterruptedPlanIds })
  const quoteQuery = useTradingApiEarnQuoteQuery({
    base: quoteRequestBase,
    earnIntent,
    enabled: !!onExecuteDeposit && !isExecuting,
  })
  const networkCostLabel = useEarnNetworkCostLabel({
    chainId: quoteSourceChainId ?? vault.chainId,
    isLoading: quoteQuery.isPending,
    quote: quoteQuery.data ?? undefined,
  })
  const chainedQuote = useMemo(
    () => (quoteQuery.data && isChainedQuoteResponse(quoteQuery.data) ? quoteQuery.data : undefined),
    [quoteQuery.data],
  )
  const hasQuoteError = quoteQuery.isError && !quoteQuery.isFetching
  const quoteErrorMessage = getEarnDepositQuoteErrorMessage({
    hasQuoteError,
    error: quoteQuery.error,
    t,
  })
  const insufficientGasWarning = useEarnInsufficientGasWarning({
    accountAddress: evmAccount?.address,
    fallbackChainId: quoteSourceChainId ?? vault.chainId,
    flow: 'deposit',
    inputAmount: inputCurrencyAmount,
    quote: quoteQuery.data ?? undefined,
  })

  const formatLocalFiat = useCallback(
    (usdValue: number): string => convertFiatAmountFormatted(usdValue, NumberType.FiatStandard),
    [convertFiatAmountFormatted],
  )

  const currentBalanceUsd = position?.depositedUsd ?? 0
  const balanceAfterUsd = currentBalanceUsd + parsedAmountUsd
  const { logFailed, logFinalized, logSubmitted } = useEarnReviewAnalytics({
    action: 'deposit',
    amountUsd: parsedAmountUsd,
    analyticsEntryPoint,
    analyticsSurface,
    destinationChainId: vault.chainId,
    destinationTokenAddress: vault.vaultAddress,
    destinationTokenSymbol: vaultShareCurrency?.symbol,
    originatingTransactionId,
    position,
    projectedMonthlyEarningsUsd,
    quote: chainedQuote,
    sourceChainId: quoteSourceChainId,
    sourceCurrency: currency,
    sourceUpsellCurrencyId,
    swapAmountUsd,
    tokenAmount: tokenAmountValue ?? undefined,
    underlyingTokenSymbol: vaultUnderlyingCurrencyInfo?.currency.symbol,
    vault,
  })

  const hasBlockingError = getEarnReviewHasBlockingError({ hasQuoteError, insufficientGasWarning })
  const executionErrorMessage = getEarnExecutionErrorMessage({
    error: executionError,
    fallback: t('explore.earn.review.transactionFailed'),
  })

  const ctaDisabled = getEarnReviewCtaDisabled({
    hasBlockingError,
    isSubmitting,
    isExecuting,
    isQuotePending: quoteQuery.isPending,
    quote: quoteQuery.data ?? undefined,
    hasAccount: !!evmAccount,
    hasInputAmount: !!inputCurrencyAmount && !!vaultShareCurrency,
    hasExecuteHandler: !!onExecuteDeposit,
  })

  const handleDepositPress = useCallback(() => {
    clearExecutionState()
    const executionParams = getPreparedDepositExecutionParams({
      currency,
      earnIntent,
      inputCurrencyAmount,
      onExecuteDeposit,
      quote: quoteQuery.data ?? undefined,
      vaultShareCurrency,
    })
    if (!executionParams) {
      return
    }
    startSubmitting()
    executionParams.onExecuteDeposit({
      earnIntent: executionParams.earnIntent,
      inputCurrency: executionParams.currency,
      inputAmount: executionParams.inputCurrencyAmount,
      outputCurrency: executionParams.vaultShareCurrency,
      quote: executionParams.quote,
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
    clearExecutionState,
    currency,
    earnIntent,
    handleFailure,
    handleSuccess,
    inputCurrencyAmount,
    logFailed,
    logFinalized,
    logSubmitted,
    onExecuteDeposit,
    onPlanFinalized,
    quoteQuery.data,
    startSubmitting,
    vaultShareCurrency,
  ])

  const stepProgressLabel = useMemo(
    () =>
      getEarnStepProgressLabel({
        activePlan,
        t,
        vaultStepType: TradingApi.PlanStepType.VAULT_DEPOSIT,
        vaultStepLabel: t('common.depositing'),
      }),
    [activePlan, t],
  )

  return (
    <Flex gap="$spacing16">
      {isMobileApp ? (
        <Text variant="subheading2" color="$neutral2" textAlign="center">
          {t('explore.earn.deposit.confirm')}
        </Text>
      ) : (
        <Flex row alignItems="center" justifyContent="space-between">
          <TouchableArea onPress={handleBack}>
            <BackArrow color="$neutral2" size="$icon.24" />
          </TouchableArea>
          <Text variant="subheading2" color="$neutral2">
            {t('explore.earn.deposit.confirm')}
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
            hideNetworkLogo={isMobileApp}
            url={sourceCurrencyInfo?.logoUrl}
            size={iconSizes.icon24}
            chainId={quoteSourceChainId}
            symbol={symbol}
            name={currency?.name}
          />
          <Text variant="body2" color="$neutral2">
            {`${tokenAmountLabel} ${symbol}`}
          </Text>
        </Flex>
      </Flex>

      {!earnPlanProgress && (
        <DepositReviewDetails
          balanceAfterUsd={balanceAfterUsd}
          currentBalanceUsd={currentBalanceUsd}
          expanded={expanded}
          formatLocalFiat={formatLocalFiat}
          formatPercent={formatPercent}
          networkCostLabel={networkCostLabel}
          projectedAnnualEarningsUsd={projectedAnnualEarningsUsd}
          vault={vault}
          onToggleExpanded={toggleExpanded}
        />
      )}

      <EarnReviewBlockingMessage
        executionErrorMessage={executionErrorMessage}
        hasQuoteError={hasQuoteError}
        insufficientGasWarning={insufficientGasWarning}
        quoteErrorMessage={quoteErrorMessage}
      />

      <EarnReviewActionRow
        ctaDisabled={ctaDisabled}
        ctaLabel={insufficientGasWarning.warning?.buttonText ?? t('explore.earn.deposit.cta', { symbol })}
        executionError={executionError}
        isExecuting={isExecuting}
        isShortMobileDevice={isShortMobileDevice}
        progress={earnPlanProgress}
        retryLabel={t('common.button.retry')}
        stepProgressLabel={stepProgressLabel}
        onBack={handleBack}
        onPress={handleDepositPress}
        onRetry={onPressRetry ? handleRetry : undefined}
      />
    </Flex>
  )
}
