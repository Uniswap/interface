import { Flex, Shine, styled, Text } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import i18n from 'uniswap/src/i18n'
import { useEvent } from 'utilities/src/react/hooks'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { popupRegistry } from '~/components/Popups/registry'
import { PopupType } from '~/components/Popups/types'
import { useChartPriceState } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import { useLiquidityChartStoreRenderingContext } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/viewSelectors'
import { DefaultPriceStrategy } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { useLiquidityChartStoreActions } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

const Container = styled(Flex, {
  flex: 1,
  width: '100%',
  p: '$spacing12',
  gap: '$spacing8',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
  position: 'relative',
  $sm: {
    p: '$spacing8',
    gap: '$spacing4',
  },
  ...ClickableTamaguiStyle,
})

type PriceStrategy = {
  key: DefaultPriceStrategy
  title: string
  display: string
  description: string
  tooltip?: string
}

// price = 1.0001^tick, so a ±N-tick band around current tick is a (1.0001^N − 1) fractional move.
// Trims trailing zeros so 0.30% renders as 0.3% but 0.03% / 1.82% stay precise.
const formatStableDisplay = (tickSpacing: number): string => {
  const pct = (Math.pow(1.0001, 3 * tickSpacing) - 1) * 100
  return `± ${pct.toFixed(2).replace(/\.?0+$/, '')}%`
}

const getPriceStrategies = (tickSpacing: number): PriceStrategy[] => [
  {
    key: DefaultPriceStrategy.STABLE,
    title: i18n.t('position.stable'),
    display: formatStableDisplay(tickSpacing),
    description: i18n.t('position.stable.description'),
    tooltip: '± 3 ticks',
  },
  {
    key: DefaultPriceStrategy.WIDE,
    title: i18n.t('position.wide'),
    display: '–50% — +100%',
    description: i18n.t('position.wide.description'),
  },
  {
    key: DefaultPriceStrategy.ONE_SIDED_LOWER,
    title: i18n.t('position.one_sided_lower'),
    display: '–50%',
    description: i18n.t('position.one_sided_lower.description'),
  },
  {
    key: DefaultPriceStrategy.ONE_SIDED_UPPER,
    title: i18n.t('position.one_sided_upper'),
    display: '+100%',
    description: i18n.t('position.one_sided_upper.description'),
  },
]

const DefaultPriceStrategyComponent = ({
  strategy,
  onSelect,
  selected,
}: {
  strategy: PriceStrategy
  onSelect: (key: DefaultPriceStrategy) => void
  selected: boolean
}) => {
  return (
    <Trace logPress element={ElementName.LiquidityDefaultPriceStrategy} properties={{ strategy: strategy.key }}>
      <Container
        group
        onPress={() => onSelect(strategy.key)}
        background={selected ? '$surface3' : '$surface1'}
        justifyContent="space-between"
      >
        <Flex gap="$spacing8" $sm={{ gap: '$spacing2' }}>
          <Flex row gap="$gap12" justifyContent="space-between" alignItems="center">
            <Text variant="buttonLabel3" color="$neutral2">
              {strategy.title}
            </Text>
            {strategy.tooltip ? (
              <Text
                variant="body4"
                color="$neutral2"
                opacity={0}
                animation="quick"
                animateOnly={['opacity']}
                $group-hover={{ opacity: 1 }}
              >
                {strategy.tooltip}
              </Text>
            ) : null}
          </Flex>
          <Text variant="body2">{strategy.display}</Text>
        </Flex>
        <Flex mt="$spacing16" gap="$spacing2">
          <Text variant="body4" color="$neutral2">
            {strategy.description}
          </Text>
        </Flex>
      </Container>
    </Trace>
  )
}

export function DefaultPriceStrategies({ isLoading }: { isLoading: boolean }) {
  const { selectedPriceStrategy, isFullRange } = useChartPriceState()
  const renderingContext = useLiquidityChartStoreRenderingContext()
  const actions = useLiquidityChartStoreActions()

  const handleSelect = useEvent((key: DefaultPriceStrategy) => {
    if (key === selectedPriceStrategy) {
      return
    }

    try {
      // If in full range mode, switch to custom first
      if (isFullRange) {
        actions.setChartState({ isFullRange: false })
      }
      actions.setPriceStrategy({ priceStrategy: key, animate: !isFullRange })
    } catch (_e) {
      popupRegistry.addPopup(
        { type: PopupType.Error, error: i18n.t('position.default_price_strategies.error') },
        'default-price-strategy-error',
        POPUP_MEDIUM_DISMISS_MS,
      )
    }
  })

  if (!isLoading && !renderingContext) {
    return null
  }

  const priceStrategies = renderingContext ? getPriceStrategies(renderingContext.tickSpacing) : []

  return (
    <Flex backgroundColor="$surface2" gap="$gap16" p="$spacing16">
      <Flex justifyContent="space-between" row alignItems="center">
        <Text variant="body3" color="$neutral2">
          {i18n.t('position.default_price_strategies')}
        </Text>
      </Flex>
      <Flex
        $platform-web={{
          display: 'grid',
        }}
        gridTemplateColumns="repeat(4, 1fr)"
        gap="$spacing8"
        $sm={{
          gridTemplateColumns: 'repeat(2, 1fr)',
        }}
      >
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <Shine width="100%" key={i}>
                <Flex height={130} $sm={{ height: 112 }} borderRadius="$rounded12" backgroundColor="$surface3" />
              </Shine>
            ))
          : priceStrategies.map((strategy) => (
              <DefaultPriceStrategyComponent
                key={strategy.key}
                onSelect={handleSelect}
                selected={strategy.key === selectedPriceStrategy}
                strategy={strategy}
              />
            ))}
      </Flex>
    </Flex>
  )
}
