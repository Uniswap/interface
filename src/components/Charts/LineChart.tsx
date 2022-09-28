import { Group } from '@visx/group'
import { LinePath } from '@visx/shape'
import { CurveFactory } from 'd3'
import React from 'react'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { animated, useSpring } from 'react-spring/web'
import { useTheme } from 'styled-components'
import { Color } from 'theme/styled'

interface LineChartProps<T> {
  data: T[]
  getX: (t: T) => number
  getY: (t: T) => number
  marginTop?: number
  curve: CurveFactory
  color?: Color
  strokeWidth: number
  children?: ReactNode
  width: number
  height: number
}

const springConfig = {
  tension: 20,
}

function LineChart<T>({
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
  const [shouldAnimate, setShouldAnimate] = useState<boolean>(false)

  const spring = useSpring({
    frame: shouldAnimate ? 0 : 1,
    config: springConfig,
    onRest: () => setShouldAnimate(false),
  })
  const [lineLength, setLineLength] = useState<number>(0)
  // set line length once it is known after initial render
  const effectDependency = lineRef.current
  useEffect(() => {
    if (lineRef.current) {
      console.log('LINE LENGTH: ', lineRef.current.getTotalLength())
      setLineLength(lineRef.current.getTotalLength())
    }
  }, [effectDependency])

  const theme = useTheme()

  return (
    <svg width={width} height={height} onClick={() => setShouldAnimate(true)}>
      <Group top={marginTop}>
        <LinePath
          curve={curve}
          stroke={color ?? theme.accentAction}
          strokeWidth={strokeWidth}
          data={data}
          x={getX}
          y={getY}
        >
          {({ path }) => {
            const d = path(data) || ''
            return (
              <>
                <animated.path
                  d={d}
                  ref={lineRef}
                  strokeWidth={2}
                  strokeOpacity={0.1}
                  strokeLinecap="round"
                  fill="none"
                  stroke={'white'}
                />
                {shouldAnimate && (
                  <animated.path
                    d={d}
                    strokeWidth={2}
                    strokeOpacity={1}
                    strokeLinecap="round"
                    fill="none"
                    stroke={'green'}
                    strokeDashoffset={spring.frame.interpolate((v: any) => v * lineLength)}
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

export default LineChart
