import type { SkPath } from '@shopify/react-native-skia'
import { Canvas, Skia } from '@shopify/react-native-skia'
import { useEffect, useMemo } from 'react'
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { AnimatedArc } from 'wallet/src/components/landing/shapes/AnimatedArc'

// Helper to convert degrees to radians
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

interface CreateArcPathOptions {
  cx: number
  cy: number
  radius: number
  startAngle: number
  endAngle: number
}

// Create a Skia path for an arc
function createSkiaArcPath({ cx, cy, radius, startAngle, endAngle }: CreateArcPathOptions): SkPath {
  const path = Skia.Path.Make()
  const startRad = degToRad(startAngle)

  // Calculate the sweep angle
  const sweepAngle = endAngle - startAngle

  // Move to the start point
  const startX = cx + radius * Math.cos(startRad)
  const startY = cy + radius * Math.sin(startRad)
  path.moveTo(startX, startY)

  // Add the arc using arcToOval
  const oval = {
    x: cx - radius,
    y: cy - radius,
    width: radius * 2,
    height: radius * 2,
  }
  path.arcToOval(oval, startAngle, sweepAngle, false)

  return path
}

interface AnimatedArcCircleProps {
  size: number
  strokeWidth: number
  strokeColor?: string
  arcs: Array<{ startAngle: number; endAngle: number }>
  delay?: number
  fadeEnds?: boolean
}

export function AnimatedArcCircle({
  size,
  strokeWidth,
  strokeColor,
  arcs,
  delay = 0,
  fadeEnds = false,
}: AnimatedArcCircleProps): JSX.Element {
  const colors = useSporeColors()

  const radius = (size - strokeWidth) / 2
  const center = size / 2

  // Animation progress for drawing the arcs
  const progress = useSharedValue(0)

  // Memoize the Skia paths to avoid recreating them on every render
  const arcPaths = useMemo(
    () =>
      arcs.map((arc) =>
        createSkiaArcPath({ cx: center, cy: center, radius, startAngle: arc.startAngle, endAngle: arc.endAngle }),
      ),
    [arcs, center, radius],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withTiming(1, {
        duration: 800,
        easing: Easing.out(Easing.cubic),
      })
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const resolvedStrokeColor = strokeColor ?? colors.surface3.val

  return (
    <Canvas style={{ width: size, height: size }}>
      {arcPaths.map((path, index) => (
        <AnimatedArc
          key={index}
          path={path}
          strokeWidth={strokeWidth}
          strokeColor={resolvedStrokeColor}
          progress={progress}
          fadeEnds={fadeEnds}
          center={{ x: center, y: center }}
          startAngle={arcs[index]?.startAngle}
          endAngle={arcs[index]?.endAngle}
          radius={radius}
        />
      ))}
    </Canvas>
  )
}
