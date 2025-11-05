import { useTheme } from 'lib/styled-components'
import { useEffect, useRef, useState } from 'react'
import { Flex } from 'ui/src'

export interface ChartModelWithLiveDot {
  getLastPointCoordinates?: () => { x: number; y: number } | null
}

interface LiveDotRendererProps {
  chartModel: ChartModelWithLiveDot
  isHovering: boolean
  chartContainer?: HTMLElement | null
}

// TODO(PORT-494): figure out why the dot isn't rendering at the correct coordinated after resize
function useHideOnResize(
  chartContainer: HTMLElement | null | undefined,
  setCoordinates: (coordinates: { x: number; y: number } | null) => void,
): boolean {
  const [hasResized, setHasResized] = useState(false)

  useEffect(() => {
    if (!chartContainer || hasResized) {
      return undefined
    }

    // Track if this is the first callback (initial layout)
    let isFirstCallback = true

    // Permanently hide dot after any resize (until page refresh)
    const resizeObserver = new ResizeObserver(() => {
      // Ignore the first callback (initial layout measurement)
      if (isFirstCallback) {
        isFirstCallback = false
        return
      }

      // This is a real resize after initial layout
      setHasResized(true)
      // Clear coordinates immediately when resize is detected to prevent wrong positioning
      setCoordinates(null)
      // Stop observing once resize is detected since dot will never show again
      resizeObserver.disconnect()
    })
    resizeObserver.observe(chartContainer)

    return () => {
      resizeObserver.disconnect()
    }
  }, [chartContainer, setCoordinates, hasResized])

  return hasResized
}

export function LiveDotRenderer({ chartModel, isHovering, chartContainer }: LiveDotRendererProps) {
  const [coordinates, setCoordinates] = useState<{ x: number; y: number } | null>(null)
  const hasResized = useHideOnResize(chartContainer, setCoordinates)
  const theme = useTheme()
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Only render if the chart model has getLastPointCoordinates method
    if (!('getLastPointCoordinates' in chartModel)) {
      return undefined
    }

    const updateCoordinates = () => {
      // Stop updating if resize has occurred
      if (hasResized) {
        return
      }
      const coords = chartModel.getLastPointCoordinates?.()
      setCoordinates(coords ?? null)
      rafRef.current = requestAnimationFrame(updateCoordinates)
    }

    updateCoordinates()

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [chartModel, hasResized])

  if (!coordinates || isHovering || hasResized) {
    return null
  }

  return (
    <Flex
      position="absolute"
      pointerEvents="none"
      style={{
        left: `${coordinates.x}px`,
        top: `${coordinates.y}px`,
        transform: 'translate(-50%, -50%)',
        zIndex: 3,
      }}
    >
      {/* Outer pulsing ring */}
      <Flex
        position="absolute"
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: theme.accent1,
          opacity: 0.3,
          transform: 'translate(-50%, -50%)',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />
      <Flex
        position="absolute"
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: theme.accent1,
          opacity: 0.3,
          transform: 'translate(-50%, -50%)',
          animation: 'pulse 2s ease-in-out infinite 0.5s',
        }}
      />
      {/* Inner dot */}
      <Flex
        position="absolute"
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: theme.accent1,
          left: '50%',
          top: '50%',
          borderWidth: '2px',
          borderColor: theme.surface1,
          transform: 'translate(-50%, -50%)',
        }}
      />
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.5;
            }
            75% {
              transform: translate(-50%, -50%) scale(3);
              opacity: 0;
            }
            100% {
              transform: translate(-50%, -50%) scale(3);
              opacity: 0;
            }
          }
        `}
      </style>
    </Flex>
  )
}
