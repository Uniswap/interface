import { isWebApp } from '@universe/environment'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { ButtonVariant } from 'ui/src'
import { AnimatePresence, Button, Flex, useIsShortMobileDevice } from 'ui/src'
import { Passkey } from 'ui/src/components/icons/Passkey'
import type { AppTFunction } from 'ui/src/i18n/types'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import type { PasskeyAuthStatus } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useActivePlanStatus } from 'uniswap/src/features/transactions/swap/review/hooks/useActivePlanStatus'
import { DelayedSubmissionText } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/DelayedSubmissionText'
import { PendingSwapButton } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/PendingSwapButton'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/permitMethod'
import type { SwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isChained, isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

interface SubmitSwapButtonProps {
  disabled: boolean
  onSubmit: () => void
  showPendingUI: boolean
  warning?: Warning
  /**
   * When true, force the button into the amber `warning` variant regardless of
   * `warning?.severity`. Set by the gas-overrides flow when saved network-cost
   * overrides trigger a non-blocking validation warning (e.g. priority fee
   * underpriced). The user can still submit — the amber color flags risk.
   */
  gasOverrideWarning?: boolean
}

export function SubmitSwapButton({
  disabled,
  onSubmit,
  showPendingUI,
  warning,
  gasOverrideWarning,
}: SubmitSwapButtonProps): JSX.Element {
  const { t } = useTranslation()
  const { renderBiometricsIcon, passkeyAuthStatus } = useTransactionModalContext()

  const isSubmitting = useSwapFormStore((s) => s.isSubmitting)
  const {
    wrapType,
    trade: { trade, indicativeTrade },
  } = useSwapFormStoreDerivedSwapInfo((s) => ({
    wrapType: s.wrapType,
    trade: s.trade,
  }))
  const indicative = Boolean(!trade && indicativeTrade)
  const isChainedTrade = trade?.routing && isChained({ routing: trade.routing })

  const { hasActivePlan, lastStepFailed } = useActivePlanStatus()

  const swapTxContext = useSwapTxStore((s) => s)
  const actionText = getActionText({
    t,
    wrapType,
    swapTxContext,
    warning,
    isAuthenticated: Boolean(passkeyAuthStatus?.isSessionAuthenticated),
    hasActivePlan,
    lastStepFailed,
  })

  const isShortMobileDevice = useIsShortMobileDevice()
  const size = isShortMobileDevice ? 'medium' : 'large'

  const icon = useMemo(() => {
    if (renderBiometricsIcon) {
      return renderBiometricsIcon({})
    } else if (passkeyAuthStatus?.isSignedInWithPasskey && !passkeyAuthStatus.isSessionAuthenticated) {
      return <Passkey size="$icon.24" />
    }
    return undefined
  }, [renderBiometricsIcon, passkeyAuthStatus?.isSignedInWithPasskey, passkeyAuthStatus?.isSessionAuthenticated])

  const warningVariant: ButtonVariant | undefined =
    warning?.severity === WarningSeverity.High
      ? 'critical'
      : warning?.severity === WarningSeverity.Medium
        ? 'warning'
        : gasOverrideWarning
          ? 'warning'
          : undefined

  switch (true) {
    case indicative: {
      return (
        <Button loading variant="default" emphasis="secondary" size={size}>
          {t('swap.finalizingQuote')}
        </Button>
      )
    }
    case showPendingUI: {
      if (isChainedTrade && !isWebApp) {
        return <PendingSwapButton disabled={disabled} onSubmit={onSubmit} />
      }
      return (
        <Button loading variant="branded" emphasis="primary" size={size}>
          <DelayedSubmissionText />
        </Button>
      )
    }
    case isWebApp && isSubmitting: {
      return (
        <Button loading shouldAnimateBetweenLoadingStates={false} size={size}>
          <ConfirmInWalletText passkeyAuthStatus={passkeyAuthStatus} />
        </Button>
      )
    }
    case Boolean(warningVariant): {
      return (
        <Button
          variant={warningVariant}
          emphasis="primary"
          disabled={disabled}
          icon={icon}
          size={size}
          testID={TestID.Swap}
          onPress={onSubmit}
        >
          {actionText}
        </Button>
      )
    }
    default: {
      return (
        <Button
          variant={disabled ? 'default' : 'branded'}
          emphasis={disabled ? 'secondary' : 'primary'}
          disabled={disabled}
          icon={icon}
          size={size}
          testID={TestID.Swap}
          onPress={onSubmit}
        >
          {actionText}
        </Button>
      )
    }
  }
}

export enum SwapAction {
  Wrap = 'WRAP',
  Unwrap = 'UNWRAP',
  Swap = 'SWAP',
  SwapAndDeposit = 'SWAP_AND_DEPOSIT',
  SwapAnyway = 'SWAP_ANYWAY',
  ApproveAndSwap = 'APPROVE_AND_SWAP',
  SignAndSwap = 'SIGN_AND_SWAP',
  RetryPlan = 'RETRY_PLAN',
  ContinuePlan = 'CONTINUE_PLAN',
}

// TODO: Refactor this to not need the entire `swapTxContext` from the store
export const getActionText = ({
  t,
  wrapType,
  swapTxContext,
  warning,
  isAuthenticated,
  hasActivePlan,
  lastStepFailed,
}: {
  t: AppTFunction
  wrapType: WrapType
  swapTxContext?: SwapTxAndGasInfo
  warning?: Warning
  isAuthenticated?: boolean
  hasActivePlan?: boolean
  lastStepFailed?: boolean
}): string => {
  const action = getSwapAction({ wrapType, swapTxContext, warning, hasActivePlan, lastStepFailed })

  const textMap: Record<SwapAction, { default: string; authenticated: string }> = {
    [SwapAction.Wrap]: {
      default: t('swap.button.wrap'),
      authenticated: t('swap.confirmWrap'),
    },
    [SwapAction.Unwrap]: {
      default: t('swap.button.unwrap'),
      authenticated: t('swap.button.confirmUnwrap'),
    },
    [SwapAction.ApproveAndSwap]: {
      default: t('swap.approveAndSwap'),
      authenticated: t('swap.confirmApproveAndSwap'),
    },
    [SwapAction.SignAndSwap]: {
      default: t('swap.signAndSwap'),
      authenticated: t('swap.button.confirmSignAndSwap'),
    },
    [SwapAction.SwapAnyway]: {
      default: t('swap.button.swapAnyways'),
      authenticated: t('swap.button.confirmSwapAnyways'),
    },
    [SwapAction.Swap]: {
      default: t('swap.button.swap'),
      authenticated: t('swap.confirmSwap'),
    },
    [SwapAction.SwapAndDeposit]: {
      default: t('swap.button.swapAndDeposit'),
      authenticated: t('swap.button.swapAndDeposit'),
    },
    [SwapAction.RetryPlan]: {
      default: t('common.button.retry'),
      authenticated: t('common.button.retry'),
    },
    [SwapAction.ContinuePlan]: {
      default: t('common.button.continue'),
      authenticated: t('common.button.continue'),
    },
  }

  return isAuthenticated ? textMap[action].authenticated : textMap[action].default
}

function ConfirmInWalletText({ passkeyAuthStatus }: { passkeyAuthStatus?: PasskeyAuthStatus }): JSX.Element {
  const { t } = useTranslation()

  let text = t('common.confirmWallet')
  if (passkeyAuthStatus?.isSessionAuthenticated) {
    text = t('swap.button.submitting')
  } else if (passkeyAuthStatus?.isSignedInWithPasskey) {
    text = t('swap.button.submitting.passkey')
  }

  return (
    <AnimatePresence>
      <Flex animateEnterExit="fadeInDownOutDown" animation="quicker">
        <Button.Text>{text}</Button.Text>
      </Flex>
    </AnimatePresence>
  )
}

const getSwapAction = ({
  wrapType,
  swapTxContext,
  warning,
  hasActivePlan,
  lastStepFailed,
}: {
  wrapType: WrapType
  swapTxContext?: SwapTxAndGasInfo
  warning?: Warning
  hasActivePlan?: boolean
  lastStepFailed?: boolean
}): SwapAction => {
  if (wrapType === WrapType.Wrap) {
    return SwapAction.Wrap
  }
  if (wrapType === WrapType.Unwrap) {
    return SwapAction.Unwrap
  }

  const hasPermitTx =
    swapTxContext && isClassic(swapTxContext) ? swapTxContext.permit?.method === PermitMethod.Transaction : false
  const hasApproveTx = Boolean(swapTxContext?.approveTxRequest)

  if (isWebApp && (hasPermitTx || hasApproveTx)) {
    return SwapAction.ApproveAndSwap
  }
  if (isWebApp && swapTxContext && isClassic(swapTxContext) && swapTxContext.hasUnsignedPermit) {
    return SwapAction.SignAndSwap
  }
  if (hasActivePlan) {
    if (lastStepFailed) {
      return SwapAction.RetryPlan
    }
    return SwapAction.ContinuePlan
  }

  if (warning?.severity === WarningSeverity.High || warning?.severity === WarningSeverity.Medium) {
    return SwapAction.SwapAnyway
  }

  // Earn toggle flow: the chained trade ends in a vault deposit, so the CTA should say so.
  if (swapTxContext && isChained(swapTxContext) && swapTxContext.trade.earnIntent !== undefined) {
    return SwapAction.SwapAndDeposit
  }

  return SwapAction.Swap
}
