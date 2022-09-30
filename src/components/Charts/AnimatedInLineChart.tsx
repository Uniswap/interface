import { Group } from '@visx/group'
import { LinePath } from '@visx/shape'
import { easeCubicInOut } from 'd3'
import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { animated, useSpring } from 'react-spring'
import { useTheme } from 'styled-components/macro'

import { LineChartProps } from './LineChart'

const config = {
  duration: 800,
  easing: easeCubicInOut,
}

// code reference: https://airbnb.io/visx/lineradial

function AnimatedInLineChart<T>({
  data,
  getX,
  getY,
  marginTop,
  curve,
  color,
  strokeWidth,
  width,
  height,
  children,
}: LineChartProps<T>) {
  const lineRef = useRef<SVGPathElement>(null)
  const [lineLength, setLineLength] = useState(0)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false)

  const spring = useSpring({
    frame: shouldAnimate ? 0 : 1,
    config,
    onRest: () => {
      setShouldAnimate(false)
      setHasAnimatedIn(true)
    },
  })

  const effectDependency = lineRef.current
  useEffect(() => {
    if (lineRef.current) {
      setLineLength(lineRef.current.getTotalLength())
      setShouldAnimate(true)
    }
  }, [effectDependency])
  const theme = useTheme()
  const lineColor = color ?? theme.accentAction

  return (
    <svg width={width} height={height}>
      <Group top={marginTop}>
        <LinePath curve={curve} x={getX} y={getY}>
          {({ path }) => {
            const d = path(data) || ''
            return (
              <>
                <animated.path
                  d={d}
                  ref={lineRef}
                  strokeWidth={strokeWidth}
                  strokeOpacity={hasAnimatedIn ? 1 : 0}
                  fill="none"
                  stroke={lineColor}
                />
                {shouldAnimate && lineLength !== 0 && (
                  <animated.path
                    d={d}
                    strokeWidth={strokeWidth}
                    fill="none"
                    stroke={lineColor}
                    strokeDashoffset={spring.frame.to((v) => v * lineLength)}
                    strokeDasharray={lineLength}
                  />
                )}
              </>
            )
          }}
        </LinePath>
      </Group>
      {children}
    </svg>
  )
}

export default AnimatedInLineChart
