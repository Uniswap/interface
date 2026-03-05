import { TradingApi } from '@universe/api'
import { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, HorizontalDottedLineSeparator, Text, useSporeColors } from 'ui/src'
import { CheckCircleFilled, Shuffle } from 'ui/src/components/icons'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { RoutingLabel } from 'uniswap/src/components/RoutingDiagram/RoutingLabel'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { ChainedActionTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const STEPS_TO_HIDE = [TradingApi.PlanStepType.APPROVAL_PERMIT]

/**
 * Component that displays the routing information for the given plan.
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
      <Flex width="100%" gap="$spacing8">
        <Flex row alignItems="center" width="100%" gap="$spacing8" justifyContent="space-between">
          {stepsToShow?.map((step, idx) => (
            <Fragment key={'steplogo-' + idx}>
              <Flex alignItems="center" justifyContent="center">
                <StepLogo step={step} />
              </Flex>
              {idx < stepsToShow.length - 1 && (
                <Flex flex={1} justifyContent="center">
                  <HorizontalDottedLineSeparator strokeColor={sporeColors.neutral3.val} strokeWidth={2} />
                </Flex>
              )}
            </Fragment>
          ))}
        </Flex>
        <Text color="$neutral2" variant="body3">
          {t('swap.details.routingInfo.plan')}
        </Text>
      </Flex>
    )
  }, [stepsToShow, sporeColors.neutral3.val, t])

  return (
    <Flex row alignItems="center" justifyContent="space-between">
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
        <Flex centered row gap="$spacing4">
          <Text color="$neutral2" variant="body3">
            {t('common.bestRoute')}
          </Text>
        </Flex>
      </WarningInfo>
      <Flex row shrink justifyContent="flex-end">
        <RoutingLabel trade={trade} />
      </Flex>
    </Flex>
  )
}

const ICON_SIZE = iconSizes.icon20
const halfIconSize = ICON_SIZE / 2
const offset = -halfIconSize / 4

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
      return (
        <SplitLogo
          chainId={chainIdIn}
          inputCurrencyInfo={currencyInfoIn}
          outputCurrencyInfo={currencyInfoOut}
          size={ICON_SIZE}
        />
      )
    case TradingApi.PlanStepType.BRIDGE:
      return (
        <Flex row alignItems="center" gap="$spacing8">
          <CurrencyLogo currencyInfo={currencyInfoIn} size={ICON_SIZE} hideNetworkLogo={false} />
          <Shuffle color="$neutral3" size="$icon.12" />
          <CurrencyLogo currencyInfo={currencyInfoOut} size={ICON_SIZE} hideNetworkLogo={false} />
        </Flex>
      )
    case TradingApi.PlanStepType.APPROVAL_PERMIT:
    case TradingApi.PlanStepType.APPROVAL_TXN:
    case TradingApi.PlanStepType.RESET_APPROVAL_TXN:
    default: {
      return (
        <Flex>
          <CurrencyLogo currencyInfo={currencyInfoIn} size={ICON_SIZE} hideNetworkLogo={true} />
          <Flex
            bottom={offset}
            position="absolute"
            right={offset}
            zIndex={zIndexes.mask}
            backgroundColor="$background"
            borderRadius="$roundedFull"
          >
            <CheckCircleFilled color="$statusSuccess" size={halfIconSize} />
          </Flex>
        </Flex>
      )
    }
  }
}
