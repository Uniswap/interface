import { TradingApi } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Button, Flex, styled, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { isCancelTimedOut } from 'uniswap/src/features/transactions/cancel/cancelTimeoutStateMachine'
import { CancelOrderPreCheckResult } from 'uniswap/src/features/transactions/cancel/getCancelOrderTxRequest'
import { TransactionStatus, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

export const OrderAlertContainer = styled(Flex, {
  row: true,
  mt: '$spacing16',
  p: '$spacing12',
  borderWidth: 1.3,
  borderStyle: 'solid',
  borderColor: '$surface3',
  borderRadius: '$rounded20',
  gap: '$gap12',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
})

export const AlertIconContainer = styled(Flex, {
  flexShrink: 0,
  backgroundColor: '$statusWarning',
  width: 40,
  height: 40,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '$rounded12',
})

// Exported for the never-empty-title tripwire test
export function getOrderTitle({ order, t }: { order: UniswapXOrderDetails; t: TFunction }): string {
  const isLimit = order.routing === TradingApi.Routing.DUTCH_LIMIT

  // Cancel-flow states are evaluated before the status switch
  if (getFeatureFlag(FeatureFlags.LimitCancelTimeout)) {
    if (isCancelTimedOut(order)) {
      return t('limits.cancel.likelyToFail')
    }
    if (order.status === TransactionStatus.Cancelling && order.cancelTxMined) {
      return t('limits.cancel.finalizing')
    }
    if (order.cancelFailedReason === 'filled') {
      return t('limits.cancel.alreadyFilled')
    }
  }

  switch (order.status) {
    case TransactionStatus.Pending:
      return isLimit ? t('common.limit.pending') : t('common.orderPending')
    case TransactionStatus.Expired:
      return isLimit ? t('common.limit.expired') : t('common.orderExpired')
    case TransactionStatus.Cancelling:
      return t('common.pending.cancellation')
    case TransactionStatus.InsufficientFunds:
      return t('common.insufficient.funds')
    case TransactionStatus.Canceled:
      return isLimit ? t('common.limit.canceled') : t('common.orderCanceled')
    case TransactionStatus.Success:
      return isLimit ? t('common.limit.executed') : t('common.orderExecuted')
    case TransactionStatus.Failed:
      return isLimit ? t('common.limit.failed') : t('common.swap.failed')
    case TransactionStatus.FailedCancel:
      return t('transaction.status.cancellation.failed')
    default:
      // Never return '' for any reachable state
      return t('common.unknown')
  }
}

/**
 * Confirm-time pre-check refused (order already filled/cancelled/expired, or the cancel tx could
 * not be built): surface WHY instead of silently closing the dialog. The poller/Revert paths have
 * per-branch messaging — this is the modal path's equivalent. Exported for tests.
 */
export function showCancelPreCheckRefusalPopup({
  preCheck,
  orderId,
}: {
  preCheck: Exclude<CancelOrderPreCheckResult, { kind: 'ready' }>
  orderId: string
}): void {
  if (preCheck.kind === 'unavailable') {
    // Nothing was submitted and no wallet prompt occurred — neutral retry message
    popupRegistry.addPopup(
      { type: PopupType.Error, error: i18n.t('limits.cancel.broadcastFailed') },
      `cancel-precheck-unavailable-${orderId}`,
    )
    return
  }
  switch (preCheck.orderStatus) {
    case TradingApi.OrderStatus.FILLED:
      popupRegistry.addPopup(
        { type: PopupType.Error, error: i18n.t('limits.cancel.alreadyFilled') },
        `cancel-precheck-filled-${orderId}`,
      )
      break
    case TradingApi.OrderStatus.CANCELLED:
      popupRegistry.addPopup(
        { type: PopupType.Success, message: i18n.t('limits.cancel.lateSuccess') },
        `cancel-precheck-cancelled-${orderId}`,
      )
      break
    case TradingApi.OrderStatus.EXPIRED:
      popupRegistry.addPopup(
        { type: PopupType.Success, message: i18n.t('limits.cancel.expired') },
        `cancel-precheck-expired-${orderId}`,
      )
      break
    default:
      // ERROR / unknown terminal states: the order died on its own; the pollers converge the row
      break
  }
}

/**
 * DES-807 timed-out-cancellation alert: soft and auto-resolving (derived from the record),
 * with the double-gas disclosure and the Revert CTA.
 */
export function CancelTimeoutAlert({
  order,
  onRevert,
}: {
  order: UniswapXOrderDetails
  onRevert?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <OrderAlertContainer>
      <AlertIconContainer>
        <AlertTriangleFilled color="$neutral2" size="$icon.20" />
      </AlertIconContainer>
      <Flex flex={1} gap="$gap8">
        <Text variant="body2">{t('limits.cancel.timeout.alert')}</Text>
        {!order.cancelTxHash && (
          <Text variant="body3" color="$neutral2">
            {t('limits.cancel.revert.notSubmitted')}
          </Text>
        )}
        <Text variant="body3" color="$neutral2">
          {t('limits.cancel.timeout.doubleGas')}
        </Text>
        {onRevert && (
          <Flex row mt="$spacing4">
            <Button size="small" variant="branded" emphasis="primary" onPress={onRevert}>
              {t('limits.cancel.timeout.revertCta')}
            </Button>
          </Flex>
        )}
      </Flex>
    </OrderAlertContainer>
  )
}
