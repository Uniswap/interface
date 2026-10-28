import { type ColorTokens, Flex, type FlexCompatProps, Shine } from '@universe/mycelium'
import { type ComponentRef, forwardRef } from 'react'

const HEIGHT = 10
interface ProgressBarProps {
  percentage: number
  // Callers resolve these from theme hooks (mycelium's useSporeColors/opacify return plain
  // strings, not the ColorTokens literal union), so both accept either a real token or a
  // resolved color string. `(string & {})` keeps ColorTokens' literal autocomplete instead of
  // collapsing the union to plain string.
  color?: ColorTokens | (string & {})
  height?: number
  showEndDots?: boolean
  showWhiteDot?: boolean
  borderColor?: ColorTokens
  customFillStyle?: React.CSSProperties
  fillBorderColor?: ColorTokens | (string & {})
  shouldAnimate?: boolean
}

// These three take caller overrides for the same props their configs set
// (height/borderColor/backgroundColor/width), which the factory's class lane
// cannot yield to — so they stay compat-prop wrappers: config props first,
// caller spread last, exactly the legacy props-over-config order.
const ProgressContainer = forwardRef<ComponentRef<typeof Flex>, FlexCompatProps>(
  function ProgressContainer(props, ref) {
    return (
      <Flex
        ref={ref}
        position="relative"
        height={HEIGHT}
        borderRadius="$roundedFull"
        overflow="visible"
        borderWidth="$spacing1"
        borderColor="$surface3"
        backgroundColor="$surface3"
        {...props}
      />
    )
  },
)

const FilledPortion = forwardRef<ComponentRef<typeof Flex>, FlexCompatProps>(function FilledPortion(props, ref) {
  return (
    <Flex
      ref={ref}
      height="100%"
      borderRadius="$roundedFull"
      position="relative"
      backgroundImage="repeating-linear-gradient(-45deg, transparent 0px, transparent 3px, rgba(255,255,255,0.8) 3px, rgba(255,255,255,0.8) 4px)"
      {...props}
    />
  )
})

const WhiteDot = forwardRef<ComponentRef<typeof Flex>, FlexCompatProps>(function WhiteDot(props, ref) {
  return (
    <Flex
      ref={ref}
      position="absolute"
      right={0}
      top="50%"
      width={HEIGHT - 2}
      height={HEIGHT - 2}
      backgroundColor="$white"
      borderRadius="$roundedFull"
      transform="translateY(-50%)"
      zIndex={2}
      {...props}
    />
  )
})

export const ProgressBar = ({
  percentage,
  color,
  height = HEIGHT,
  showEndDots = true,
  showWhiteDot = true,
  borderColor = '$surface3',
  customFillStyle,
  fillBorderColor,
  shouldAnimate = true,
}: ProgressBarProps) => {
  const clampedPercentage = Math.max(0, Math.min(100, percentage * 100))
  const hasProgress = clampedPercentage > 0

  return (
    <Flex row gap="$spacing6" alignItems="center">
      {showEndDots && <Flex width={8} height={8} backgroundColor="$neutral1" borderRadius="$roundedFull" />}
      <ProgressContainer grow height={height} borderColor={borderColor}>
        {hasProgress && (
          // Shine only takes simple sizes, so the calc() geometry lives on this wrapper and Shine fills it.
          <Flex
            height="calc(100% + 2px)"
            top={-1}
            left={-1}
            borderRadius="$roundedFull"
            width={`calc(${clampedPercentage}% + 2px)`}
          >
            <Shine shimmerDurationSeconds={2} disabled={!shouldAnimate} width="100%" height="100%">
              <FilledPortion
                backgroundColor={color}
                style={customFillStyle}
                borderColor={fillBorderColor}
                borderWidth={fillBorderColor ? 1 : 0}
                height={height}
              >
                {showWhiteDot && <WhiteDot width={height - 2} height={height - 2} />}
              </FilledPortion>
            </Shine>
          </Flex>
        )}
      </ProgressContainer>
      {showEndDots && (
        <Flex
          width={8}
          height={8}
          backgroundColor={clampedPercentage >= 100 ? color : '$surface3'}
          borderRadius="$roundedFull"
        />
      )}
    </Flex>
  )
}
