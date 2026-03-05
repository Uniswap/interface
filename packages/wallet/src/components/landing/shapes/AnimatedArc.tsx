import type { SkPath } from '@shopify/react-native-skia'
import { LinearGradient, Path, vec } from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { processColor } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import { useDerivedValue } from 'react-native-reanimated'

// Helper to convert degrees to radians
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

// Create a transparent version of a color
function makeTransparent(color: string): string {
  // Use React Native's processColor to parse the color
  const processed = processColor(color)
  if (typeof processed !== 'number') {
    // Fallback: just return transparent
    return 'transparent'
  }
  // processColor returns 0xAARRGGBB format
  // biome-ignore lint/suspicious/noBitwiseOperators: bitwise operation required to convert to unsigned 32-bit integer
  const r = (processed >> 16) & 0xff
  // biome-ignore lint/suspicious/noBitwiseOperators: bitwise operation required to convert to unsigned 32-bit integer
  const g = (processed >> 8) & 0xff
  // biome-ignore lint/suspicious/noBitwiseOperators: bitwise operation required to convert to unsigned 32-bit integer
  const b = processed & 0xff
  return `rgba(${r}, ${g}, ${b}, 0)`
}

interface AnimatedArcProps {
  path: SkPath
  strokeWidth: number
  strokeColor: string
  progress: SharedValue<number>
  fadeEnds?: boolean
  center?: { x: number; y: number }
  startAngle?: number
  endAngle?: number
  radius?: number
}

export function AnimatedArc({
  path,
  strokeWidth,
  strokeColor,
  progress,
  fadeEnds = false,
  center,
  startAngle = 0,
  endAngle = 90,
  radius = 100,
}: AnimatedArcProps): JSX.Element {
  const animatedEnd = useDerivedValue(() => progress.value)

  // Calculate gradient points for fading ends
  const gradientConfig = useMemo(() => {
    if (!fadeEnds || !center) {
      return null
    }

    const transparentColor = makeTransparent(strokeColor)

    // Calculate start and end points of the arc
    const startRad = degToRad(startAngle)
    const endRad = degToRad(endAngle)

    const startPoint = {
      x: center.x + radius * Math.cos(startRad),
      y: center.y + radius * Math.sin(startRad),
    }
    const endPoint = {
      x: center.x + radius * Math.cos(endRad),
      y: center.y + radius * Math.sin(endRad),
    }

    return {
      colors: [transparentColor, strokeColor, strokeColor, transparentColor],
      positions: [0, 0.15, 0.85, 1],
      start: startPoint,
      end: endPoint,
    }
  }, [fadeEnds, center, startAngle, endAngle, radius, strokeColor])

  if (fadeEnds && gradientConfig) {
    return (
      <Path path={path} style="stroke" strokeWidth={strokeWidth} strokeCap="butt" start={0} end={animatedEnd}>
        <LinearGradient
          start={vec(gradientConfig.start.x, gradientConfig.start.y)}
          end={vec(gradientConfig.end.x, gradientConfig.end.y)}
          colors={gradientConfig.colors}
          positions={gradientConfig.positions}
        />
      </Path>
    )
  }

  return (
    <Path
      path={path}
      style="stroke"
      strokeWidth={strokeWidth}
      color={strokeColor}
      strokeCap="round"
      start={0}
      end={animatedEnd}
    />
  )
}
