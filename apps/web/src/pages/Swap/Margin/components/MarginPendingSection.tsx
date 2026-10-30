import { useMutation, useQueryClient } from '@tanstack/react-query'
import { normalizeTokenAddressForCache } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import type { TFunction } from 'i18next'
import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import {
  MARGIN_NATIVE_TOKEN_ADDRESS,
  MarginApiClient,
  type MarginPendingPlan,
} from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MARGIN_POSITIONS_QUERY_KEY } from 'uniswap/src/data/apiClients/tradingApi/useMarginPositionsQuery'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo, useCurrencyInfos } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { buildCurrencyId, buildNativeCurrencyId, normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import { useAccount } from '~/hooks/useAccount'
import { shouldOfferPendingCancel, useMarginPendingPlans } from '~/pages/Swap/Margin/hooks/marginPendingPlans'
import {
  type MarginAcquiredEpoch,
  marginPlanExecutionStore,
  useMarginPlanExecution,
} from '~/pages/Swap/Margin/hooks/marginPlanExecutionStore'
import { clearPersistedPlanId, getPersistedMarginPlanId } from '~/pages/Swap/Margin/hooks/marginPlanPointer'
import { clearPlanProofs, readStepProof } from '~/pages/Swap/Margin/hooks/marginStepProofCache'
import { useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { buildFallbackMarginMarket } from '~/pages/Swap/Margin/hooks/useResolveMarginMarket'
import { usableWireAmount } from '~/pages/Swap/Margin/marginFormat'
import { formatLeverage, getMarginDirectionStyle } from '~/pages/Swap/Margin/marginFormat'
import { marginChainName } from '~/pages/Swap/Margin/marginRouteText'
import { marginFallbackPairLabel, marginMarketDirection, marginPairLabel } from '~/pages/Swap/Margin/marginTokenDisplay'

// Headed section by the positions table, listing stranded OPEN plans. The card offers Cancel only
// where it is safe — a broadcast-but-unlanded proof withholds it, since cancelling then orphans the
// funds. Resume for a same-device strand rides the persisted-pointer banner (shouldShowPointerBanner),
// so a non-cancellable open is recovered by resuming there rather than stranded with no affordance.
export function MarginPendingSection(): JSX.Element | null {
  const { t } = useTranslation()
  const pendingPlans = useMarginPendingPlans()

  if (pendingPlans.length === 0) {
    return null
  }

  return (
    // mb stacks on the parent's $spacing12 gap — the section needs more separation from the
    // Active/Closed tabs than the table sections keep between themselves.
    <Flex gap="$spacing8" mb="$spacing12">
      <Text variant="subheading2" color="$neutral1">
        {t('margin.table.sectionIncomplete')}
      </Text>
      <Flex gap="$spacing8">
        {pendingPlans.map((pending) => (
          <MarginPendingRow key={pending.planId} pending={pending} />
        ))}
      </Flex>
    </Flex>
  )
}

function MarginPendingRow({ pending }: { pending: MarginPendingPlan }): JSX.Element {
  const { t } = useTranslation()
  const account = useAccount()
  const queryClient = useQueryClient()
  const { value: cancelFailed, setTrue: markCancelFailed, setFalse: clearCancelFailed } = useBooleanState(false)

  const paymentChainId = pending.swapConfig?.chainId ?? MARGIN_CHAIN_ID
  const paymentToken = pending.swapConfig?.token
  const paymentCurrencyId = paymentToken
    ? normalizeTokenAddressForCache(paymentToken) === MARGIN_NATIVE_TOKEN_ADDRESS
      ? buildNativeCurrencyId(paymentChainId)
      : buildCurrencyId(paymentChainId, paymentToken)
    : undefined
  const paymentInfo = useCurrencyInfo(paymentCurrencyId)

  // No pending-plan bucket exists on useResolveMarginMarket's rows param, so this resolves standalone:
  // the live registry first, else a currency-info-backed synthetic market (mirrors
  // useResolveMarginMarketForPosition).
  const { getMarketByTokens } = useMarginMarkets()
  const pendingCurrencyIds = useMemo(
    () => [
      buildCurrencyId(MARGIN_CHAIN_ID, pending.collateralToken),
      buildCurrencyId(MARGIN_CHAIN_ID, pending.debtToken),
    ],
    [pending.collateralToken, pending.debtToken],
  )
  const pendingCurrencyInfos = useCurrencyInfos(pendingCurrencyIds)
  const pendingCurrencyInfoById = useMemo(() => {
    const map = new Map<string, CurrencyInfo>()
    for (const info of pendingCurrencyInfos) {
      if (info) {
        map.set(normalizeCurrencyIdForMapLookup(info.currencyId), info)
      }
    }
    return map
  }, [pendingCurrencyInfos])
  const market =
    getMarketByTokens(pending) ??
    buildFallbackMarginMarket({ tokens: pending, currencyInfoById: pendingCurrencyInfoById })
  const pairLabel = market
    ? marginPairLabel({ market })
    : marginFallbackPairLabel({
        collateralToken: pending.collateralToken,
        debtToken: pending.debtToken,
        currencyInfos: pendingCurrencyInfoById,
      })
  const { formatNumberOrString } = useLocalizationContext()
  const subtitle = buildPendingRowSubtitle({ pending, paymentChainId, paymentInfo, formatNumberOrString, t })
  const direction = pending.direction ?? marginMarketDirection(pending)
  const directionStyle = getMarginDirectionStyle(direction)
  const directionLabel = direction === MarginDirection.SHORT ? t('margin.side.short') : t('margin.side.long')

  // isExecuting mirrors the single-flight lock; executingPlanId can't be used here — create-driven
  // runs hold the lock as 'PENDING_CREATE', so a planId comparison would never match.
  const isExecutingThisPlan = useMarginPlanExecution((s) => s.isExecuting && s.plan?.planId === pending.planId)
  const hasUnlandedLocalProof = Boolean(
    account.address &&
    readStepProof({ swapper: account.address, planId: pending.planId, stepIndex: pending.currentStep })?.txHash,
  )
  const offerCancel = shouldOfferPendingCancel({
    cancellable: pending.cancellable,
    isExecutingThisPlan,
    hasUnlandedLocalProof,
  })

  // The cancel holds the SAME single-flight lock the executor takes, for the POST's whole duration.
  // `shouldOfferPendingCancel` only closes the render-time direction — it refuses Cancel while the
  // executor is already driving. The reverse was open: Cancel and the resume banner describe the same
  // plan and sit one above the other, so a click on each sent a wallet prompt into an in-flight cancel.
  // The broadcast then landed against a plan the server had just cancelled, and `onSuccess` deleted
  // the very proof recording it. Holding the lock makes the concurrent `resumePlan` bail at
  // `acquireRunEpoch`, exactly as a second Continue click already does.
  const cancelEpoch = useRef<MarginAcquiredEpoch | undefined>(undefined)
  const cancelMutation = useMutation({
    mutationFn: async () => await MarginApiClient.cancelMarginPlan({ planId: pending.planId }),
    onSuccess: async () => {
      if (account.address) {
        // Unpin the pointer only when it still points at THIS plan (one slot per swapper).
        if (getPersistedMarginPlanId(account.address)?.planId === pending.planId) {
          clearPersistedPlanId(account.address)
        }
        // A cancelled plan's broadcast proofs must never replay onto a later plan.
        clearPlanProofs({ swapper: account.address, planId: pending.planId })
      }
      // Drop the store's copy too: a stale non-terminal plan would keep useIsPlanInFlight true
      // forever (manage actions disabled, Open CTA resuming a dead plan) with no visible surface.
      if (marginPlanExecutionStore.getState().plan?.planId === pending.planId) {
        marginPlanExecutionStore.getState().actions.reset()
      }
      await queryClient.invalidateQueries({ queryKey: MARGIN_POSITIONS_QUERY_KEY })
    },
    onError: (error) => {
      logger.error(error, { tags: { file: 'MarginPendingSection', function: 'cancelMutation' } })
      markCancelFailed()
    },
    onSettled: () => {
      // Released AFTER onSuccess's teardown, so no run can start against a plan mid-dismantling.
      // reset() already frees the lock and moves the epoch, which makes this release a no-op.
      const epoch = cancelEpoch.current
      cancelEpoch.current = undefined
      if (epoch !== undefined) {
        marginPlanExecutionStore.getState().actions.releaseExecution({ epoch })
      }
    },
  })

  const onCancel = useEvent(() => {
    clearCancelFailed()
    // Refuses rather than races: whoever holds the lock owns the plan. The refusal has to SPEAK, though
    // — `offerCancel` only goes false for a lock held under THIS plan's id (`isExecutingThisPlan`
    // compares planIds), so a lock held by another plan, or as 'PENDING_CREATE', leaves this button
    // enabled. Silent, every click on a second stranded card during the first one's POST was a dead
    // no-op. Surfacing it through the same line a failed cancel uses is better than a button that
    // does nothing and says nothing.
    const acquired = marginPlanExecutionStore.getState().actions.tryAcquireExecution({ planId: pending.planId })
    if (!acquired.acquired) {
      markCancelFailed()
      return
    }
    cancelEpoch.current = acquired.epoch
    cancelMutation.mutate()
  })

  return (
    <Flex gap="$spacing4" px="$spacing12" py="$spacing8" borderRadius="$rounded12" backgroundColor="$surface2">
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row alignItems="center" gap="$gap8" flexShrink={1} minWidth={0}>
          <Text variant="body3" color="$neutral1" numberOfLines={1}>
            {pairLabel}
          </Text>
          <Flex
            flexShrink={0}
            px="$spacing6"
            py="$spacing2"
            borderRadius="$roundedFull"
            backgroundColor="$statusWarning2"
          >
            <Text variant="buttonLabel4" color="$statusWarning">
              {t('margin.table.incompleteOpen')}
            </Text>
          </Flex>
        </Flex>
        <Flex row alignItems="center" gap="$gap4" flexShrink={0}>
          {/* Button defaults to flex:1/flexBasis:0 (equal-share), which lets its own label ellipsize
              under squeeze — opt out so the label always renders whole. */}
          {offerCancel ? (
            <Button
              size="xxsmall"
              variant="default"
              emphasis="secondary"
              disabled={cancelMutation.isPending}
              loading={cancelMutation.isPending}
              onPress={onCancel}
              flexGrow={0}
              flexShrink={0}
              flexBasis="auto"
            >
              {t('common.button.cancel')}
            </Button>
          ) : null}
        </Flex>
      </Flex>
      <Flex row alignItems="center" gap="$spacing4">
        <Text variant="body4" color={directionStyle.color}>
          {directionLabel}
        </Text>
        <Text variant="body4" color="$neutral2">
          · {subtitle}
        </Text>
      </Flex>
      {cancelFailed ? (
        <Text variant="body4" color="$statusCritical">
          {t('margin.pending.cancelFailed')}
        </Text>
      ) : null}
    </Flex>
  )
}

// "payment → · leverage · step" line. The market pair already sits in the row header, so this
// omits it. The payment hop is dropped when unresolvable.
export function buildPendingRowSubtitle({
  pending,
  paymentChainId,
  paymentInfo,
  formatNumberOrString,
  t,
}: {
  pending: MarginPendingPlan
  paymentChainId: number
  paymentInfo: Maybe<CurrencyInfo>
  // App-locale formatter, not toLocaleString's browser default: this amount sits beside app-formatted
  // figures, and every other number in this surface goes through it.
  formatNumberOrString: LocalizationContextState['formatNumberOrString']
  t: TFunction
}): string {
  const parts: string[] = []

  const paymentSymbol = paymentInfo?.currency.symbol
  const paymentDecimals = paymentInfo?.currency.decimals
  // Through the guarded reader: this runs in the render body, and BigInt throws a SyntaxError on any
  // non-integer string — taking the whole positions surface to the error boundary rather than dropping
  // one line of a subtitle. `usableWireAmount` also refuses the '0' sentinel, which has nothing to say
  // here either.
  const paymentAmount =
    pending.swapConfig?.token && pending.swapConfig.amount && paymentDecimals !== undefined
      ? usableWireAmount({ raw: pending.swapConfig.amount, decimals: paymentDecimals })
      : undefined
  if (paymentAmount !== undefined && paymentSymbol) {
    const amount = formatNumberOrString({ value: paymentAmount, type: NumberType.TokenNonTx })
    parts.push(
      t('margin.pending.paymentFrom', { amount, symbol: paymentSymbol, chain: marginChainName(paymentChainId) }),
    )
  }

  if (pending.leverageTarget) {
    parts.push(t('margin.pending.leverage', { leverage: formatLeverage(Number(pending.leverageTarget)) }))
  }

  parts.push(t('margin.pending.stepProgress', { current: pending.currentStep + 1, total: pending.stepCount }))

  return parts.join(' · ')
}
