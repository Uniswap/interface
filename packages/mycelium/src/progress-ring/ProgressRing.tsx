import type { JSX } from 'react'
import { Circle, Svg } from '../components/factories/svg-elements'
import { useSporeColors } from '../theme-hooks-compat'

export interface ProgressRingProps {
  size: number
  strokeWidth: number
  progress: number
  color: string
  trackColor?: string
}

export function ProgressRing({ size, strokeWidth, progress, color, trackColor }: ProgressRingProps): JSX.Element {
  const colors = useSporeColors()
  const radius = (size - strokeWidth) / 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const clampedProgress = Math.max(0, Math.min(1, progress))

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trackColor ?? colors.surface3.val}
        strokeWidth={strokeWidth}
      />
      {clampedProgress > 0 && (
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clampedProgress)}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          // Web only; native ignores it
          style={{ transition: 'stroke-dashoffset 300ms ease' }}
        />
      )}
    </Svg>
  )
}
