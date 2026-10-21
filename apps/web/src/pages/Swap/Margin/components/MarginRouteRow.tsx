import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { Tooltip } from 'ui/src'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Shuffle } from 'ui/src/components/icons/Shuffle'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { MarginVenueLogo } from '~/pages/Swap/Margin/components/MarginVenueLogo'
import { marginVenueLabel } from '~/pages/Swap/Margin/marginFormat'
import type { MarginRouteStep } from '~/pages/Swap/Margin/marginRouteSteps'
import { marginChainName } from '~/pages/Swap/Margin/marginRouteText'

// Product name, not translated — mirrors uniswapRoutingProvider.name in the swap flow.
const UNISWAP_API_LABEL = 'Uniswap API'

// Nullable return + default branch: oxlint's type-aware consistent-return doesn't model
// union exhaustiveness, so a returning switch must carry a default.
function StepRow({ step }: { step: MarginRouteStep }): JSX.Element | null {
  const { t } = useTranslation()
  switch (step.type) {
    case 'swap':
      return (
        <Flex row alignItems="center" gap="$spacing8">
          <CoinConvert size="$icon.16" color="$neutral2" />
          <Text variant="body4" color="$neutral1">
            {t('margin.plan.step.preSwapOnChain', {
              from: step.fromSymbol,
              to: step.toSymbol,
              chain: marginChainName(step.chainId),
            })}
          </Text>
        </Flex>
      )
    case 'bridge':
      return (
        <Flex row alignItems="center" gap="$spacing8">
          <Shuffle size="$icon.16" color="$neutral2" />
          <Text variant="body4" color="$neutral1">
            {t('margin.plan.step.bridge', {
              symbol: step.symbol,
              from: marginChainName(step.fromChainId),
              to: marginChainName(step.toChainId),
            })}
          </Text>
        </Flex>
      )
    case 'open':
      return (
        <Flex row alignItems="center" gap="$spacing8">
          <MarginVenueLogo venue={step.venue} />
          <Text variant="body4" color="$neutral1">
            {t('margin.route.step.open', { venue: marginVenueLabel(step.venue) })}
          </Text>
        </Flex>
      )
    default:
      return null
  }
}

// Exported for tests: tooltip body without the hover machinery.
export function MarginRouteTooltipContent({ steps }: { steps: MarginRouteStep[] }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex gap="$spacing8" p="$spacing4">
      <Flex row alignItems="center" gap="$spacing4">
        <UniswapLogo size="$icon.16" color="$accent1" />
        <Text variant="body4" color="$neutral2">
          {t('margin.route.tooltip.title', { provider: UNISWAP_API_LABEL })}
        </Text>
      </Flex>
      {steps.map((step, index) => (
        <StepRow key={`${step.type}-${index}`} step={step} />
      ))}
    </Flex>
  )
}

// Swap-style Route row: label + info tooltip left, provider identity right.
export function MarginRouteRow({ steps }: { steps: MarginRouteStep[] }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex row justifyContent="space-between" alignItems="center" gap="$spacing12">
      <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
        <Tooltip.Trigger>
          <Flex row alignItems="center" gap="$spacing4">
            <Text variant="body3" color="$neutral2">
              {t('margin.fees.route')}
            </Text>
            <InfoCircleFilled size="$icon.16" color="$neutral3" />
          </Flex>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <Tooltip.Arrow />
          <MarginRouteTooltipContent steps={steps} />
        </Tooltip.Content>
      </Tooltip>
      <Flex row alignItems="center" gap="$spacing4">
        <UniswapLogo size="$icon.16" color="$accent1" />
        <Text variant="body3" color="$neutral1">
          {UNISWAP_API_LABEL}
        </Text>
      </Flex>
    </Flex>
  )
}
