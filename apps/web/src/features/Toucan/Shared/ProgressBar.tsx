import { ColorTokens, Flex, Shine, styled } from 'ui/src'

const HEIGHT = 10
interface ProgressBarProps {
  percentage: number
  color?: ColorTokens
  height?: number
  showEndDots?: boolean
  showWhiteDot?: boolean
  borderColor?: ColorTokens
  customFillStyle?: React.CSSProperties
  fillBorderColor?: ColorTokens
  shouldAnimate?: boolean
}

const ProgressContainer = styled(Flex, {
  position: 'relative',
  height: HEIGHT,
  borderRadius: '$roundedFull',
  overflow: 'visible',
  borderWidth: '$spacing1',
  borderColor: '$surface3',
  backgroundColor: '$surface3',
})

const FilledPortion = styled(Flex, {
  height: '100%',
  borderRadius: '$roundedFull',
  position: 'relative',
  backgroundImage:
    'repeating-linear-gradient(-45deg, transparent 0px, transparent 3px, rgba(255,255,255,0.8) 3px, rgba(255,255,255,0.8) 4px)',
})

const WhiteDot = styled(Flex, {
  position: 'absolute',
  right: '0',
  top: '50%',
  width: HEIGHT - 2,
  height: HEIGHT - 2,
  backgroundColor: '$white',
  borderRadius: '$roundedFull',
  transform: 'translateY(-50%)',
  zIndex: 2,
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
          <Shine
            shimmerDurationSeconds={2}
            height="calc(100% + 2px)"
            top={-1}
            left={-1}
            borderRadius="$roundedFull"
            width={`calc(${clampedPercentage}% + 2px)`}
            disabled={!shouldAnimate}
          >
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
