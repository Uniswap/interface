import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Flex } from 'ui/src/components/layout'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { WAVE_TILE_COUNT, WAVE_WIDTH, resolveWaveLoader } from 'ui/src/loading/WaveLoader/shared'
import { Wave } from 'ui/src/loading/WaveLoader/Wave'
import type { WaveLoaderProps } from 'ui/src/loading/WaveLoader/WaveLoader'

export function WaveLoader({ height, color, disabled, variant }: WaveLoaderProps): JSX.Element {
  const colors = useSporeColors()
  const waveColor = color ?? colors.neutral3.val
  const { duration, path } = resolveWaveLoader(height, variant)
  const progress = useSharedValue(0)

  useEffect(() => {
    if (disabled) {
      progress.value = 0
      return undefined
    }
    progress.value = withRepeat(withTiming(1, { duration, reduceMotion: ReduceMotion.System }), Infinity, false)
    return () => {
      progress.value = 0
    }
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [disabled, duration])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [0, -WAVE_WIDTH]),
      },
    ],
  }))

  return (
    <Flex height={height} overflow="hidden" width="100%">
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <Flex row height="100%" width={WAVE_WIDTH * WAVE_TILE_COUNT}>
          {Array.from({ length: WAVE_TILE_COUNT }, (_, i) => (
            <Wave key={i} color={waveColor} height={height} path={path} />
          ))}
        </Flex>
      </Animated.View>
    </Flex>
  )
}
