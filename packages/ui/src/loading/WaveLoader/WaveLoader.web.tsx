import { Flex } from 'ui/src/components/layout'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { WAVE_TILE_COUNT, WAVE_WIDTH, resolveWaveLoader } from 'ui/src/loading/WaveLoader/shared'
import { Wave } from 'ui/src/loading/WaveLoader/Wave'
import type { WaveLoaderProps } from 'ui/src/loading/WaveLoader/WaveLoader'
import { useInjectSingleStylesheet } from 'utilities/src/react/useInjectSingleStylesheet'

const CSS_RULE_ID = '__wave_loader_keyframes__'
const WAVE_KEYFRAME_NAME = 'wave-loader-scroll'
const KEYFRAMES_CSS = `
@keyframes ${WAVE_KEYFRAME_NAME} {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-${WAVE_WIDTH}px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .${WAVE_KEYFRAME_NAME} {
    animation: none !important;
  }
}
`

export function WaveLoader({ height, color, disabled, variant }: WaveLoaderProps): JSX.Element {
  const colors = useSporeColors()
  const waveColor = color ?? colors.neutral3.val
  const { duration, path } = resolveWaveLoader(height, variant)

  useInjectSingleStylesheet({ id: CSS_RULE_ID, css: KEYFRAMES_CSS, active: !disabled })

  return (
    <Flex height={height} overflow="hidden" width="100%">
      <Flex
        row
        className={disabled ? undefined : WAVE_KEYFRAME_NAME}
        height="100%"
        width={WAVE_WIDTH * WAVE_TILE_COUNT}
        style={
          disabled
            ? undefined
            : {
                animationName: WAVE_KEYFRAME_NAME,
                animationDuration: `${duration}ms`,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
              }
        }
      >
        {Array.from({ length: WAVE_TILE_COUNT }, (_, i) => (
          <Wave key={i} color={waveColor} height={height} path={path} />
        ))}
      </Flex>
    </Flex>
  )
}
