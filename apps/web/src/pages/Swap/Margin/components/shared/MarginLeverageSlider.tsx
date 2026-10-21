import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { Slider } from 'ui/src'

// Visual leverage slider extracted from the size popover: a mycelium-backed `Slider` (continuous pointer
// drag + arrow keys) with dot ticks on the inactive track ahead of the thumb and integer labels below.
// The 2-decimal floor clamp stays at the call site: onChange receives the raw leverage float. Colors are
// prop-controllable because this renders on the fixed-dark $scrim popover AND on theme-aware modal surfaces.
export function MarginLeverageSlider({
  value,
  cap,
  onChange,
  trackColor = '$statusSuccess',
  inactiveTrackColor = '$surface3',
  thumbColor = '$neutral1',
  tickColor = '$neutral2',
}: {
  value: number
  // Must be > 1: it is the divisor of every track fraction, so a cap of exactly 1 renders no ticks and
  // pins the thumb at NaN. Callers derive it through getMarginLeverageCap, which floors at MIN_LEVERAGE.
  cap: number
  onChange: (next: number) => void
  trackColor?: string
  inactiveTrackColor?: string
  thumbColor?: string
  tickColor?: string
}): JSX.Element {
  const { t } = useTranslation()

  // Integer marks 1x..⌊cap⌋x at their true track fraction, plus Max at 100%. Drop any integer that would
  // collide with the Max label near the right edge.
  const sliderTicks = [
    ...Array.from({ length: Math.floor(cap) }, (_, index) => ({
      label: `${index + 1}x`,
      fraction: index / (cap - 1),
    })).filter((tick) => tick.fraction <= 0.9),
    { label: t('common.max'), fraction: 1 },
  ]
  // Dots sit only on the inactive track segment (ahead of the thumb), matching the design.
  const thumbFraction = (Math.min(value, cap) - 1) / (cap - 1)

  return (
    <Flex gap="$spacing8" width="100%">
      <Flex width="100%" height={24} justifyContent="center" position="relative">
        <Slider
          value={Math.min(value, cap)}
          min={1}
          max={cap}
          step={0.1}
          onChange={onChange}
          trackColor={inactiveTrackColor}
          activeColor={trackColor}
          thumbColor={thumbColor}
          trackHeight={4}
          thumbSize={16}
          ariaLabel={t('margin.leverage.sliderLabel')}
          ariaValueText={`${Math.min(value, cap).toFixed(2)}x`}
        />
        {sliderTicks
          .filter((tick) => tick.fraction > thumbFraction && tick.fraction < 1)
          .map((tick) => (
            <Flex
              key={`dot-${tick.label}`}
              position="absolute"
              width={4}
              height={4}
              borderRadius="$roundedFull"
              backgroundColor={tickColor}
              opacity={0.6}
              pointerEvents="none"
              style={{ left: `${tick.fraction * 100}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
            />
          ))}
      </Flex>
      <Flex height={16} width="100%" position="relative">
        {sliderTicks.map((tick) => (
          <Flex
            key={tick.label}
            position="absolute"
            style={
              tick.fraction === 0
                ? { left: 0 }
                : tick.fraction === 1
                  ? { right: 0 }
                  : { left: `${tick.fraction * 100}%`, transform: 'translateX(-50%)' }
            }
          >
            <Text variant="body4" color={tickColor} opacity={0.8}>
              {tick.label}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}
