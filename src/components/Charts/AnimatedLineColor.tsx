import React from 'react'
import { animated, SpringValue } from 'react-spring'

type AnimatedLineColorsProps = {
  d: string
  strokeWidth: number
  hasAnimatedIn: boolean
  lineRef: React.RefObject<SVGPathElement>
  shouldAnimate: boolean
  lineLength: number
  spring: SpringValue<number>
}

export const AnimatedLineColors = ({
  d,
  strokeWidth,
  hasAnimatedIn,
  lineRef,
  shouldAnimate,
  lineLength,
  spring,
}: AnimatedLineColorsProps) => {
  return (
    <svg width="100%" height="100%">
      <defs>
        <linearGradient id="lineGradient" gradientTransform="rotate(90)">
          <stop offset="0%" stopColor="rgba(25, 235, 206, 1)" />
          <stop offset="84.28%" stopColor="rgba(138, 21, 230, 1)" />
        </linearGradient>
      </defs>
      <animated.path
        d={d}
        ref={lineRef}
        strokeWidth={strokeWidth}
        strokeOpacity={hasAnimatedIn ? 1 : 0}
        fill="none"
        stroke="url(#lineGradient)"
      />
      {shouldAnimate && lineLength !== 0 && (
        <animated.path
          d={d}
          strokeWidth={strokeWidth}
          fill="none"
          stroke="url(#lineGradient)"
          strokeDashoffset={spring.to((v) => v * lineLength)}
          strokeDasharray={lineLength}
        />
      )}
    </svg>
  )
}
