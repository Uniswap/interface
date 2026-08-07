import { Path, Svg } from 'react-native-svg'
import { WAVE_HEIGHT, WAVE_PATH_DEFAULT, WAVE_WIDTH } from 'ui/src/loading/WaveLoader/shared'

type WaveProps = {
  color: string
  height: number
  path?: string
}

export function Wave({ color, height, path = WAVE_PATH_DEFAULT }: WaveProps): JSX.Element {
  // react-native-svg's stroke parser rejects the rgba() alpha channel — move it to strokeOpacity.
  const [r, g, b, a] = color.match(/[\d.]+/g)?.map(Number) ?? []
  return (
    <Svg width={WAVE_WIDTH} height={height} viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT}`} preserveAspectRatio="none">
      <Path
        d={path}
        stroke={a === undefined ? color : `rgb(${r}, ${g}, ${b})`}
        strokeOpacity={a ?? 1}
        fill="transparent"
        strokeWidth={2}
        vectorEffect="nonScalingStroke"
      />
    </Svg>
  )
}
