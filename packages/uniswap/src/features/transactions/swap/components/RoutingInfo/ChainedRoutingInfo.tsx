import { TradingApi } from '@universe/api'
import { useSporeColors, zIndexes } from '@universe/mycelium'
import {
  BestRouteLabel,
  PLAN_STEP_ICON_SIZE,
  PlanRoutingCaption,
  PlanStepLogo,
  PlanStepLogoKind,
  RoutingInfoRow,
} from '@universe/swap-ui'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { HorizontalDottedLineSeparator } from 'ui/src'
import { Shuffle } from 'ui/src/components/icons'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { RoutingLabel } from 'uniswap/src/components/RoutingDiagram/RoutingLabel'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const STEPS_TO_HIDE = [TradingApi.PlanStepType.APPROVAL_PERMIT]

/**
 * Adapter for the plan routing row: resolves the plan steps into logos and owns the info shell.
 * The row and caption layout come from swap-ui.
 */
export function PlanRoutingInfo({ trade }: { trade: ChainedActionTrade }): JSX.Element {
  const sporeColors = useSporeColors()
  const steps = trade.quote.quote.steps
  const { t } = useTranslation()
  const stepsToShow = useMemo(() => {
    return steps?.filter((step) => !STEPS_TO_HIDE.includes(step.stepType))
  }, [steps])

  const caption = useMemo(() => {
    return (
      <PlanRoutingCaption
        stepLogos={stepsToShow?.map((step, idx) => <StepLogo key={'steplogo-' + idx} step={step} />) ?? []}
        stepSeparator={<HorizontalDottedLineSeparator strokeColor={sporeColors.neutral3.val} strokeWidth={2} />}
      />
    )
  }, [stepsToShow, sporeColors.neutral3.val])

  return (
    <RoutingInfoRow
      info={
        <WarningInfo
          modalProps={{
            modalName: ModalName.SwapReview,
            captionComponent: caption,
            rejectText: t('common.button.close'),
            icon: <Shuffle color="$neutral1" size="$icon.24" />,
            severity: WarningSeverity.None,
            title: t('swap.tradeRoutes'),
            zIndex: zIndexes.popover,
          }}
          tooltipProps={{
            text: caption,
            placement: 'top',
            maxWidth: 350,
          }}
          analyticsTitle="Order routing"
        >
          <BestRouteLabel />
        </WarningInfo>
      }
      label={<RoutingLabel trade={trade} />}
    />
  )
}

const StepLogo = ({ step }: { step: TradingApi.TruncatedPlanStep }): JSX.Element | null => {
  const chainIdIn = toSupportedChainId(step.tokenInChainId)
  const chainIdOut = toSupportedChainId(step.tokenOutChainId)
  const currencyInId = chainIdIn ? buildCurrencyId(chainIdIn, step.tokenIn ?? '') : undefined
  const currencyOutId = chainIdOut ? buildCurrencyId(chainIdOut, step.tokenOut ?? '') : undefined
  const currencyInfoIn = useCurrencyInfo(currencyInId)
  const currencyInfoOut = useCurrencyInfo(currencyOutId)

  switch (step.stepType) {
    case TradingApi.PlanStepType.CLASSIC:
    case TradingApi.PlanStepType.DUTCH_LIMIT:
    case TradingApi.PlanStepType.DUTCH_V2:
    case TradingApi.PlanStepType.DUTCH_V3:
    case TradingApi.PlanStepType.PRIORITY:
    case TradingApi.PlanStepType.VAULT_DEPOSIT:
    case TradingApi.PlanStepType.VAULT_WITHDRAW:
      return (
        <SplitLogo
          chainId={chainIdIn}
          inputCurrencyInfo={currencyInfoIn}
          outputCurrencyInfo={currencyInfoOut}
          size={PLAN_STEP_ICON_SIZE}
        />
      )
    case TradingApi.PlanStepType.BRIDGE:
      return (
        <PlanStepLogo
          kind={PlanStepLogoKind.Bridge}
          inputLogo={<CurrencyLogo currencyInfo={currencyInfoIn} size={PLAN_STEP_ICON_SIZE} hideNetworkLogo={false} />}
          outputLogo={
            <CurrencyLogo currencyInfo={currencyInfoOut} size={PLAN_STEP_ICON_SIZE} hideNetworkLogo={false} />
          }
        />
      )
    case TradingApi.PlanStepType.APPROVAL_PERMIT:
    case TradingApi.PlanStepType.APPROVAL_TXN:
    case TradingApi.PlanStepType.RESET_APPROVAL_TXN:
    default: {
      return (
        <PlanStepLogo
          kind={PlanStepLogoKind.Approval}
          inputLogo={<CurrencyLogo currencyInfo={currencyInfoIn} size={PLAN_STEP_ICON_SIZE} hideNetworkLogo={true} />}
        />
      )
    }
  }
}
