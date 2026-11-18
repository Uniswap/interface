import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { curveToAnimationTiming, ENTER_PRESET_CLASSES } from '@universe/mycelium/compat'
import { X } from '@universe/mycelium/icons/X'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { useQueryState } from 'nuqs'
import { type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAccount } from '~/connection/hooks/useAccount'
import { useSelectChain } from '~/connection/hooks/useSelectChain'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { CreatePositionErrorCallout } from '~/features/Liquidity/Create/CreatePositionErrorCallout'
import {
  DepositCta,
  DepositFooterModals,
  DepositGateBanners,
  useDepositStepController,
} from '~/features/Liquidity/Deposit'
import { DepositInputForm } from '~/features/Liquidity/DepositInputForm'
import { HookModal } from '~/features/Liquidity/HookModal'
import { LowLPSlippageWarning } from '~/features/Liquidity/LowLPSlippageWarning'
import { PDP_DEPOSIT_PARAM, PDP_DEPOSIT_RANGE } from '~/features/Liquidity/poolBrowserEntry'
import { needsHookReview } from '~/features/Liquidity/utils/hookReview'
import { usePdpChartTypeQueryState } from '~/pages/PoolDetails/components/ChartSection/chartTypeQueryState'
import {
  type PdpFlowActivity,
  usePdpFlowActivity,
} from '~/pages/PoolDetails/components/LiquidityPanel/PdpFlowActivityContext'
import { PdpPriceRangeSummary } from '~/pages/PoolDetails/components/LiquidityPanel/PdpPriceRangeSummary'
import { PdpRangeEditor } from '~/pages/PoolDetails/components/LiquidityPanel/PdpRangeEditor'
import { isPriceRangeSet } from '~/pages/PoolDetails/components/LiquidityPanel/rangeEditor'
import { ChartType } from '~/utils/charts'

/**
 * Opens the range editor for a `?deposit=range` link (the pool browser's), then drops the param so a refresh
 * doesn't reopen it. The editor needs a range to start from, so it waits for the default range to be seeded.
 */
function useOpenRangeEditorFromLink(openRangeEditor: () => void): void {
  const { priceRangeState } = useCreateLiquidityContext()
  const [depositParam, setDepositParam] = useQueryState(PDP_DEPOSIT_PARAM)
  const isRangeSeeded = isPriceRangeSet(priceRangeState)

  useEffect(() => {
    if (depositParam !== PDP_DEPOSIT_RANGE || !isRangeSeeded) {
      return
    }
    openRangeEditor()
    void setDepositParam(null)
  }, [depositParam, isRangeSeeded, openRangeEditor, setDepositParam])
}

/**
 * Calls `showPriceChart` once when the flow starts from a typed amount, after that render lands. A start from
 * the editor brings the chart up itself, and a range edit's default amount comes with the editor already open.
 */
function useShowPriceChartOnFirstAmount({
  isFlowActive,
  isRangeExpanded,
  showPriceChart,
}: {
  isFlowActive: boolean
  isRangeExpanded: boolean
  showPriceChart: () => void
}): void {
  const [wasFlowActive, setWasFlowActive] = useState(isFlowActive)
  const [isPending, setIsPending] = useState(false)
  if (wasFlowActive !== isFlowActive) {
    setWasFlowActive(isFlowActive)
    if (isFlowActive && !isRangeExpanded) {
      setIsPending(true)
    }
  }
  useEffect(() => {
    if (!isPending) {
      return
    }
    setIsPending(false)
    showPriceChart()
  }, [isPending, showPriceChart])
}

// The row rises into place on Spore's default `quick` curve.
const RANGE_REVEAL_CLASS = `${ENTER_PRESET_CLASSES.fadeInBelow} motion-reduce:animate-none`
const RANGE_REVEAL_TIMING = curveToAnimationTiming(SPORE_ANIMATION_CURVE_CSS.quick)

/** Leaves the deposit flow: no amounts, the pool's default range. */
function ClearFlowButton({ onPress }: { onPress: () => void }): JSX.Element {
  const { t } = useTranslation()
  return (
    <TouchableArea aria-label={t('common.clear')} onPress={onPress}>
      <X size="$icon.20" color="$neutral2" hoverColor="$neutral2Hovered" />
    </TouchableArea>
  )
}

/**
 * The PDP's deposit flow. Outside the flow's providers, which mount only once the pool's tokens parse, it
 * renders `fallback` instead: the flow's hooks would throw there.
 */
export function PdpDepositPanel({ fallback = null }: { fallback?: ReactNode }): ReactNode {
  const flowActivity = usePdpFlowActivity()
  return flowActivity ? <PdpDepositPanelContent flowActivity={flowActivity} /> : fallback
}

function PdpDepositPanelContent({ flowActivity }: { flowActivity: PdpFlowActivity }): JSX.Element | null {
  const { t } = useTranslation()
  const { protocolVersion, positionState, setPositionState, currencies } = useCreateLiquidityContext()
  const {
    hasTokens,
    disabledBeforeCalldata,
    isNativePool,
    errorCalloutProps,
    depositInputFormProps,
    ctaProps,
    gateBannersProps,
    footerModalsProps,
  } = useDepositStepController()
  const isFlowActive = flowActivity.isActive
  const isRangeExpanded = flowActivity.isRangeExpanded
  const [chartType, setChartType] = usePdpChartTypeQueryState()
  // The range only matters once there's something to deposit, so the row waits for the flow to start (an
  // amount, or the editor opened, as a pool browser link does) and goes again when it's cleared.
  const isRangeShown = isFlowActive
  // v2 pairs are always full range, so there's no range to show.
  const hasRange = protocolVersion !== ProtocolVersion.V2
  // The deposit's range is drawn on the page's price chart, so starting one brings that tab up.
  const showPriceChart = () => {
    // Only on a change: nuqs doesn't skip an unchanged value, so it'd still write the URL and re-render the route.
    if (chartType !== ChartType.PRICE) {
      setChartType(ChartType.PRICE)
    }
  }
  useShowPriceChartOnFirstAmount({ isFlowActive, isRangeExpanded, showPriceChart })
  const setRangeExpanded = (expanded: boolean) => {
    if (expanded) {
      showPriceChart()
    }
    flowActivity.setRangeExpanded(expanded)
  }
  // A v2 pair has no range to open; its link just lands on the pool.
  useOpenRangeEditorFromLink(() => {
    if (hasRange) {
      setRangeExpanded(true)
    }
  })
  const [isHookModalOpen, setIsHookModalOpen] = useState(false)
  const [isSwitchingChain, setIsSwitchingChain] = useState(false)
  const account = useAccount()
  const selectChain = useSelectChain()

  if (!hasTokens) {
    return null
  }

  // The page's chain comes from the pool, not the wallet. Switch before the review opens: the review's
  // transaction would switch it anyway, but while that request waits the review shows no steps.
  const poolChainId = currencies.display.TOKEN0?.chainId
  const switchToPoolChain = async (): Promise<boolean> => {
    if (!poolChainId || account.chainId === poolChainId) {
      return true
    }
    setIsSwitchingChain(true)
    try {
      return await selectChain(poolChainId)
    } finally {
      setIsSwitchingChain(false)
    }
  }

  // A hooked pool's hook is reviewed on press rather than on load, which would block the page. The
  // calldata query waits for that approval, so until then readiness comes from the amounts alone.
  const hookNeedsReview = needsHookReview(positionState)
  const openNext = hookNeedsReview ? () => setIsHookModalOpen(true) : ctaProps.onReview
  const reviewCtaProps = {
    onReview: async () => {
      if (await switchToPoolChain()) {
        openNext()
      }
    },
    ...(hookNeedsReview && {
      disabled: disabledBeforeCalldata,
      requestLoading: false,
    }),
    ...(isSwitchingChain && { requestLoading: true }),
  }
  const approveHookAndReview = () => {
    setPositionState((state) => ({ ...state, userApprovedHook: state.hook }))
    setIsHookModalOpen(false)
    // The review opens straight away and its confirm button waits for the calldata the approval unblocks.
    ctaProps.onReview()
  }

  return (
    <Flex gap="$gap12" width="100%">
      {/* "Deposit" in a small line, as in the Figma, in the chart tabs' 48px row so the inputs line up with the
          chart. */}
      <Flex row alignItems="center" justifyContent="space-between" height="$spacing48" px="$spacing8">
        <Text variant="body3" color="$neutral2" userSelect="none">
          {t('common.deposit')}
        </Text>
        {isFlowActive && <ClearFlowButton onPress={flowActivity.exit} />}
      </Flex>
      {/* Not held for the range: it's seeded while the page loads, and an amount typed before it lands
          fills the other side once it does. */}
      <DepositInputForm
        autofocus={false}
        variant="stacked"
        keepDisabledFieldsVisible
        {...depositInputFormProps}
        // The pool's own tokens only for now: no Add as ETH / WETH switch.
        token0UnderCardComponent={undefined}
        token1UnderCardComponent={undefined}
      />
      {hasRange && isRangeShown && (
        <Flex className={RANGE_REVEAL_CLASS} style={RANGE_REVEAL_TIMING}>
          <PdpPriceRangeSummary expanded={isRangeExpanded} onToggle={() => setRangeExpanded(!isRangeExpanded)}>
            <PdpRangeEditor />
          </PdpPriceRangeSummary>
        </Flex>
      )}
      <LowLPSlippageWarning isNativePool={isNativePool} />
      <DepositGateBanners {...gateBannersProps} />
      <Flex row>
        <DepositCta {...ctaProps} {...reviewCtaProps} submitLabel={t('common.createPosition')} />
      </Flex>
      <CreatePositionErrorCallout {...errorCalloutProps} />
      <DepositFooterModals {...footerModalsProps} />
      {positionState.hook && (
        <HookModal
          isOpen={isHookModalOpen && hookNeedsReview}
          address={positionState.hook}
          // The pool's hook can't be removed, so declining just closes the review.
          cancelLabel={t('common.button.cancel')}
          onClose={() => setIsHookModalOpen(false)}
          onCancel={() => setIsHookModalOpen(false)}
          onContinue={approveHookAndReview}
        />
      )}
    </Flex>
  )
}
