import { Group } from '@visx/group'
import { LinePath } from '@visx/shape'
import { easeCubicInOut } from 'd3'
import { interpolatePath } from 'd3-interpolate-path'
import usePrevious from 'hooks/usePrevious'
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
}: Omit<LineChartProps<T>, 'width' | 'height' | 'children'>) {
  const lineRef = useRef<SVGPathElement>(null)
  const [lineLength, setLineLength] = useState(0)
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false)
  const [animateBetweenLineState, setAnimateBetweenLineState] = useState<{ from: T[]; to: T[] } | undefined>()

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
  const prevData = usePrevious(data)
  useEffect(() => {
    if (data !== prevData && prevData) {
      setAnimateBetweenLineState({
        from: prevData,
        to: data,
      })
    }
  }, [data, prevData])

  const anim = useSpring({
    frame: animateBetweenLineState ? 1 : 0,
    config,
    onRest: () => setAnimateBetweenLineState(undefined),
  })

  return (
    <Group top={marginTop}>
      <LinePath curve={curve} x={getX} y={getY}>
        {({ path }) => {
          const pathD = path(data) || ''
          return (
            <>
              <animated.path
                d={pathD}
                ref={lineRef}
                strokeWidth={strokeWidth}
                strokeOpacity={hasAnimatedIn && !animateBetweenLineState ? 1 : 0}
                fill="none"
                stroke={lineColor}
              />
              {animateBetweenLineState && (
                <animated.path
                  d={anim.frame.to(
                    interpolatePath(path(animateBetweenLineState?.from), path(animateBetweenLineState?.to))
                  )}
                  ref={lineRef}
                  strokeWidth={strokeWidth}
                  strokeOpacity={hasAnimatedIn ? 1 : 0}
                  fill="none"
                  stroke={lineColor}
                />
              )}
              {shouldAnimate && lineLength !== 0 && (
                <animated.path
                  d={pathD}
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
  )
}

export default AnimatedInLineChart
