import { ColorTokens, Flex, Shine, styled } from 'ui/src'

const HEIGHT = 10
interface ProgressBarProps {
  percentage: number
  graduationThreshold: number
  color?: ColorTokens
}

const ProgressContainer = styled(Flex, {
  position: 'relative',
  height: HEIGHT,
  borderRadius: '$roundedFull',
  overflow: 'visible',
  borderWidth: '$spacing1',
  borderColor: '$surface3',
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

const ThresholdLine = styled(Flex, {
  position: 'absolute',
  top: -5,
  width: 1,
  height: HEIGHT + 8,
  backgroundColor: '$neutral1',
  transform: 'translateX(-50%)', // center the line to the percentage
  zIndex: 1,
})

export const ProgressBar = ({ percentage, color, graduationThreshold }: ProgressBarProps) => {
  const clampedPercentage = Math.max(0, Math.min(100, percentage * 100))
  const hasProgress = clampedPercentage > 0
  const thresholdPercentage = Math.max(0, Math.min(100, graduationThreshold * 100))

  return (
    <Flex row gap="$spacing6" alignItems="center">
      <Flex width={8} height={8} backgroundColor="$neutral1" borderRadius="$roundedFull" />
      <ProgressContainer grow>
        <ThresholdLine left={`${thresholdPercentage}%`} />
        {hasProgress && (
          <Shine
            shimmerDurationSeconds={2}
            height="calc(100% + 2px)"
            top={-1}
            left={-1}
            borderRadius="$roundedFull"
            width={`calc(${clampedPercentage}% + 2px)`}
          >
            <FilledPortion backgroundColor={color}>
              <WhiteDot />
            </FilledPortion>
          </Shine>
        )}
      </ProgressContainer>
      <Flex
        width={8}
        height={8}
        backgroundColor={clampedPercentage >= 100 ? color : '$surface3'}
        borderRadius="$roundedFull"
      />
    </Flex>
  )
}
