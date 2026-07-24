import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import type { DynamicSizeTextProps } from 'ui/src/components/text/DynamicSizeText/DynamicSizeText'
import { bodyFont } from 'ui/src/theme/fonts'

const RESIZING_STEP_SIZE = 2
const DEFAULT_MIN_WEB_FONT_SIZE = 8
const DEFAULT_MAX_WEB_FONT_SIZE = 16

export function DynamicSizeText({
  minWebFontSize = DEFAULT_MIN_WEB_FONT_SIZE,
  maxWebFontSize = DEFAULT_MAX_WEB_FONT_SIZE,
  children,
  style,
  floatingSuffix,
  gap,
  ...props
}: DynamicSizeTextProps): JSX.Element {
  const measureRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [fontSize, setFontSize] = useState<number | null>(null)

  const fitText = useCallback(
    (width: number) => {
      let canvas = canvasRef.current
      if (!canvas) {
        canvas = document.createElement('canvas')
        canvasRef.current = canvas
      }

      const context = canvas.getContext('2d')
      if (!context) {
        return minWebFontSize
      }

      if (!width || !children) {
        return minWebFontSize
      }

      const text = typeof children === 'string' ? children : ''

      const flattened = StyleSheet.flatten(style) as { fontFamily?: unknown }
      const ff = flattened.fontFamily
      const fontFamily = typeof ff === 'string' ? ff : bodyFont.family

      let low = minWebFontSize
      let high = maxWebFontSize
      let best = minWebFontSize

      while (low <= high) {
        let mid = Math.floor((low + high) / 2)
        mid = mid - (mid % RESIZING_STEP_SIZE)

        context.font = `${mid}px ${fontFamily}`
        const measured = context.measureText(text).width

        if (measured <= width) {
          best = mid
          low = mid + RESIZING_STEP_SIZE
        } else {
          high = mid - RESIZING_STEP_SIZE
        }
      }

      return best
    },
    [children, minWebFontSize, maxWebFontSize, style],
  )

  // Text stays out of flex flow (absolute) so this slot’s width is pure flex math — large font
  // no longer blocks shrinking. ResizeObserver + window resize cover layout that skips RO callbacks.
  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) {
      return () => {}
    }

    const readWidth = (): number => {
      const node = measureRef.current
      return node ? node.getBoundingClientRect().width : 0
    }

    const measureAndSet = (): void => {
      setFontSize(fitText(readWidth()))
    }

    measureAndSet()

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(measureAndSet)
    })

    observer.observe(el)

    globalThis.addEventListener('resize', measureAndSet)

    const vv = globalThis.visualViewport
    vv?.addEventListener('resize', measureAndSet)

    return () => {
      observer.disconnect()
      globalThis.removeEventListener('resize', measureAndSet)
      vv?.removeEventListener('resize', measureAndSet)
    }
  }, [children, fitText, minWebFontSize, maxWebFontSize, style])

  return (
    <Flex overflow="hidden" flexGrow={0} width="100%">
      <Flex row gap={gap} height={0} overflow="hidden">
        <Flex ref={measureRef} overflow="hidden" flexGrow={1} />
        {floatingSuffix}
      </Flex>
      <Flex shrink row gap={gap} alignItems="center" minWidth={0} overflow="hidden" width="100%">
        {fontSize !== null && (
          <Text
            {...props}
            style={[style, { fontSize, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }]}
          >
            {children}
          </Text>
        )}
        {floatingSuffix}
      </Flex>
    </Flex>
  )
}
