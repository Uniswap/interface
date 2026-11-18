import { clickableStyle, cn, Flex, type FlexCompatProps, Shine, Text } from '@universe/mycelium'
import { Check } from '@universe/mycelium/icons/Check'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import i18n from 'uniswap/src/i18n'
import { useEvent } from 'utilities/src/react/hooks'
import { useChartPriceState } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/selectors/priceSelectors'
import { DefaultPriceStrategy } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { useLiquidityChartStoreActions } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'
import { POPUP_MEDIUM_DISMISS_MS } from '~/utils/popups/constants'
import { popupRegistry } from '~/utils/popups/registry'
import { PopupType } from '~/utils/popups/types'

function Container({ $sm: sm, hoverStyle, pressStyle, className, style, ...props }: FlexCompatProps): JSX.Element {
  return (
    <Flex
      flex={1}
      width="100%"
      p="$spacing12"
      gap="$spacing8"
      borderRadius="$rounded12"
      borderWidth={1}
      borderColor="$surface3"
      position="relative"
      // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
      $sm={{
        p: '$spacing8',
        gap: '$spacing4',
        ...sm,
      }}
      {...clickableStyle}
      // `clickableStyle`'s object-valued keys merge too: a replacing spread drops the hover/press
      // opacity feedback, the `no-underline` class, or the opacity-scoped transition.
      hoverStyle={{ ...clickableStyle.hoverStyle, ...hoverStyle }}
      pressStyle={{ ...clickableStyle.pressStyle, ...pressStyle }}
      className={cn(clickableStyle.className, className)}
      style={[clickableStyle.style, style]}
      {...props}
    />
  )
}

export type PriceStrategy<Key extends string = DefaultPriceStrategy> = {
  key: Key
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

export const getPriceStrategies = (tickSpacing: number): PriceStrategy[] => [
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

/**
 * One preset card; shared with surfaces that apply presets without the range chart (the PDP panel). `compact`
 * is a tighter card for a narrow panel, with the description under the value. A surface with presets of its
 * own passes its own keys.
 */
export const PriceStrategyCard = <Key extends string = DefaultPriceStrategy>({
  strategy,
  onSelect,
  selected,
  compact = false,
}: {
  strategy: PriceStrategy<Key>
  onSelect: (key: Key) => void
  selected: boolean
  compact?: boolean
}) => {
  if (compact) {
    return (
      <Trace logPress element={ElementName.LiquidityDefaultPriceStrategy} properties={{ strategy: strategy.key }}>
        <Container
          onPress={() => onSelect(strategy.key)}
          // A filled tile with no outline, so it needs a $surface1 ground (the PDP panel), not a $surface2 card.
          backgroundColor={selected ? '$surface3' : '$surface2'}
          borderWidth={0}
          borderRadius="$rounded16"
          px="$spacing16"
          py="$spacing12"
          gap="$spacing8"
          $sm={{ px: '$spacing16', py: '$spacing12', gap: '$spacing8' }}
        >
          <Text variant="buttonLabel3" color="$neutral2">
            {strategy.title}
          </Text>
          <Text variant="subheading1" color="$neutral1">
            {strategy.display}
          </Text>
          <Flex gap="$gap4">
            <Flex height={1} width="100%" backgroundColor="$surface3" mb="$spacing2" />
            <Text variant="body4" color="$neutral2">
              {strategy.description}
            </Text>
          </Flex>
          {/* Out of the flow, so selecting a card doesn't reflow its title. */}
          {selected && (
            <Flex position="absolute" top="$spacing12" right="$spacing12" pointerEvents="none">
              <Check size="$icon.16" color="$neutral1" />
            </Flex>
          )}
        </Container>
      </Trace>
    )
  }
  return (
    <Trace logPress element={ElementName.LiquidityDefaultPriceStrategy} properties={{ strategy: strategy.key }}>
      <Container
        group
        onPress={() => onSelect(strategy.key)}
        backgroundColor={selected ? '$surface3' : '$surface1'}
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
                transition="opacity 200ms cubic-bezier(0.25,0.46,0.45,0.94)"
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
  const { selectedPriceStrategy, isFullRange, tickSpacing } = useChartPriceState()
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

  const priceStrategies = getPriceStrategies(tickSpacing)

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
              <PriceStrategyCard
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
