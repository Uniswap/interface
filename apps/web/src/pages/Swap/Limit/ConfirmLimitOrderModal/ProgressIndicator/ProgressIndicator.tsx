import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, useSporeColors } from 'ui/src'
import { Sign } from 'ui/src/components/icons/Sign'
import { Swap } from 'ui/src/components/icons/Swap'
import { DEP_accentColors } from 'ui/src/theme'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyLogo } from '~/components/Logo/CurrencyLogo'
import { useAccount } from '~/hooks/useAccount'
import { useColor } from '~/hooks/useColor'
import { useNativeCurrency } from '~/lib/hooks/useNativeCurrency'
import { ICON_SIZE, Step, StepDetails } from '~/pages/Swap/Limit/ConfirmLimitOrderModal/ProgressIndicator/Step'
import { useBlockConfirmationTime } from '~/pages/Swap/Limit/ConfirmLimitOrderModal/ProgressIndicator/useBlockConfirmationTime'
import { ConfirmModalState } from '~/pages/Swap/Limit/ConfirmLimitOrderModal/state'
import { InterfaceTrade } from '~/state/routing/types'
import { isLimitTrade, isUniswapXSwapTrade, isUniswapXTradeType } from '~/state/routing/utils'
import { useIsTransactionConfirmed, useUniswapXOrderByOrderHash } from '~/state/transactions/hooks'
import { Divider } from '~/theme/components/Dividers'
import type { LimitOrderResult } from '~/types/trade'
import { SignatureExpiredError } from '~/utils/errors'

/** Single source of truth for progress-indicator modal states (excludes {@link ConfirmModalState.REVIEWING}). */
export const PROGRESS_INDICATOR_STEPS = [
  ConfirmModalState.WRAPPING,
  ConfirmModalState.RESETTING_TOKEN_ALLOWANCE,
  ConfirmModalState.APPROVING_TOKEN,
  ConfirmModalState.PERMITTING,
  ConfirmModalState.PENDING_CONFIRMATION,
] as const

export type ProgressIndicatorStep = (typeof PROGRESS_INDICATOR_STEPS)[number]

const LIMIT_STEP_RING_KEYFRAMES = `
@keyframes limitConfirmStepRingPulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
`

export function isProgressIndicatorStep(state: ConfirmModalState): state is ProgressIndicatorStep {
  return (PROGRESS_INDICATOR_STEPS as readonly ConfirmModalState[]).includes(state)
}

export function ProgressIndicator({
  steps,
  currentStep,
  trade,
  limitOrderResult,
  wrapTxHash,
  tokenApprovalPending = false,
  revocationPending = false,
  limitOrderError,
  onRetryUniswapXSignature,
}: {
  steps: ProgressIndicatorStep[]
  currentStep: ProgressIndicatorStep
  trade?: InterfaceTrade
  limitOrderResult?: LimitOrderResult
  wrapTxHash?: string
  tokenApprovalPending?: boolean
  revocationPending?: boolean
  limitOrderError?: Error | string
  onRetryUniswapXSignature?: () => void
}) {
  const { t } = useTranslation()
  const { chainId } = useAccount()
  const nativeCurrency = useNativeCurrency(chainId)
  const inputTokenColor = useColor(trade?.inputAmount.currency.wrapped)
  const colors = useSporeColors()

  // Dynamic estimation of transaction wait time based on confirmation of previous block
  const { blockConfirmationTime } = useBlockConfirmationTime()
  const [estimatedTransactionTime, setEstimatedTransactionTime] = useState<number>()
  useEffect(() => {
    // Value continuously updates as new blocks get confirmed
    // Only set step timers once to prevent resetting
    if (blockConfirmationTime && !estimatedTransactionTime) {
      // Add buffer to account for variable confirmation
      setEstimatedTransactionTime(Math.ceil(blockConfirmationTime * 1.2))
    }
  }, [blockConfirmationTime, estimatedTransactionTime])

  const uniswapXOrder = useUniswapXOrderByOrderHash(
    isUniswapXTradeType(limitOrderResult?.type) ? limitOrderResult.response.orderHash : '',
  )

  const swapConfirmed = uniswapXOrder?.status === TransactionStatus.Success
  const wrapConfirmed = useIsTransactionConfirmed(wrapTxHash)

  const swapPending = limitOrderResult !== undefined && !swapConfirmed
  const wrapPending = wrapTxHash !== undefined && !wrapConfirmed
  const transactionPending = revocationPending || tokenApprovalPending || wrapPending || swapPending

  // Retry logic for UniswapX orders when a signature expires
  const [signatureExpiredErrorId, setSignatureExpiredErrorId] = useState('')
  useEffect(() => {
    if (limitOrderError instanceof SignatureExpiredError && limitOrderError.id !== signatureExpiredErrorId) {
      setSignatureExpiredErrorId(limitOrderError.id)
      onRetryUniswapXSignature?.()
    }
  }, [onRetryUniswapXSignature, signatureExpiredErrorId, limitOrderError])

  function getStatus(targetStep: ProgressIndicatorStep) {
    const currentIndex = steps.indexOf(currentStep)
    const targetIndex = steps.indexOf(targetStep)
    if (currentIndex < targetIndex) {
      return StepStatus.Preview
    } else if (currentIndex === targetIndex) {
      return transactionPending ? StepStatus.InProgress : StepStatus.Active
    } else {
      return StepStatus.Complete
    }
  }

  const stepDetails: Record<ProgressIndicatorStep, StepDetails> = useMemo(
    () => ({
      [ConfirmModalState.WRAPPING]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} size={ICON_SIZE} />,
        rippleColor: inputTokenColor,
        previewTitle: t('common.wrap', { symbol: nativeCurrency.symbol ?? t('common.token') }),
        actionRequiredTitle: t('common.wrapIn', { symbol: nativeCurrency.symbol ?? t('common.token') }),
        inProgressTitle: t('common.wrappingToken', { symbol: nativeCurrency.symbol ?? t('common.token') }),
        learnMoreLinkText: t('common.whyWrap', { symbol: nativeCurrency.symbol ?? t('common.token') }),
        learnMoreLinkHref: UniswapHelpUrls.articles.wethExplainer,
      },
      [ConfirmModalState.RESETTING_TOKEN_ALLOWANCE]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} size={ICON_SIZE} />,
        rippleColor: inputTokenColor,
        previewTitle: t('common.resetLimit', { symbol: trade?.inputAmount.currency.symbol ?? t('common.token') }),
        actionRequiredTitle: t('common.resetLimitWallet', {
          symbol: trade?.inputAmount.currency.symbol ?? t('common.token'),
        }),
        inProgressTitle: t('common.resettingLimit', {
          symbol: trade?.inputAmount.currency.symbol ?? t('common.token'),
        }),
      },
      [ConfirmModalState.APPROVING_TOKEN]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} size={ICON_SIZE} />,
        rippleColor: inputTokenColor,
        previewTitle: t('common.approveSpend', { symbol: trade?.inputAmount.currency.symbol ?? t('common.token') }),
        actionRequiredTitle: t('common.wallet.approve'),
        inProgressTitle: t('common.approvePending'),
        learnMoreLinkText: t('common.whyApprove'),
        learnMoreLinkHref: UniswapHelpUrls.articles.approvalsExplainer,
      },
      [ConfirmModalState.PERMITTING]: {
        icon: (
          <Flex centered width={ICON_SIZE} height={ICON_SIZE} borderRadius="$roundedFull" backgroundColor="$accent1">
            <Sign size="$icon.12" />
          </Flex>
        ),
        rippleColor: colors.accent1.val,
        previewTitle: t('common.signMessage'),
        actionRequiredTitle: t('common.signMessageWallet'),
        learnMoreLinkText: t('common.whySign'),
        learnMoreLinkHref: UniswapHelpUrls.articles.approvalsExplainer,
      },
      [ConfirmModalState.PENDING_CONFIRMATION]: {
        icon: (
          <Flex centered width={ICON_SIZE} height={ICON_SIZE} borderRadius="$roundedFull" backgroundColor="$neutral2">
            <Swap size="$icon.12" color="$white" />
          </Flex>
        ),
        rippleColor: DEP_accentColors.blue400,
        previewTitle: isLimitTrade(trade) ? t('common.confirm') : t('swap.confirmSwap'),
        actionRequiredTitle: isLimitTrade(trade) ? t('common.confirmWallet') : t('common.confirmSwap'),
        inProgressTitle: isLimitTrade(trade) ? t('common.pendingEllipsis') : t('common.swapPending'),
        ...(isUniswapXSwapTrade(trade) && {
          timeToStart: trade.order.info.deadline - Math.floor(Date.now() / 1000),
          delayedStartTitle: t('common.confirmTimedOut'),
        }),
        learnMoreLinkText: isLimitTrade(trade) ? t('limits.learnMore') : t('common.learnMoreSwap'),
        learnMoreLinkHref: isLimitTrade(trade)
          ? UniswapHelpUrls.articles.limitsInfo
          : UniswapHelpUrls.articles.howToSwapTokens,
      },
    }),
    [trade, inputTokenColor, t, nativeCurrency.symbol, colors],
  )

  if (steps.length === 0) {
    return null
  }

  return (
    <Flex>
      <style>{LIMIT_STEP_RING_KEYFRAMES}</style>
      <Flex height="$spacing28" px="$spacing16" justifyContent="center">
        <Divider />
      </Flex>
      {steps.map((step, i) => {
        return (
          <Flex key={`progress-indicator-step-${i}`}>
            <Step stepStatus={getStatus(step)} stepDetails={stepDetails[step]} />
            {i !== steps.length - 1 && <Flex width={2} height={10} backgroundColor="$neutral3" ml={18} />}
          </Flex>
        )
      })}
    </Flex>
  )
}
