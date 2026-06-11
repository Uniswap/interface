import { useCallback, useEffect, useRef, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { View, type ViewProps } from 'tamagui'

const enterStyle = { opacity: 0 } satisfies ViewProps['enterStyle']
const exitStyle = { opacity: 0 } satisfies ViewProps['exitStyle']

// Matches the "fast" animation duration in packages/ui/src/theme/animations/index.web.ts
const FAST_ANIMATION_DURATION_MS = 100

export const WidthAnimator = View.styleable<{ open?: boolean; height: number; contentWidth?: number }>((props) => {
  const { open = true, height, children, contentWidth, ...rest } = props
  // Initialize to contentWidth so the outer view starts at the right size when provided,
  // avoiding a 0→N jump before onLayout fires.
  const [measuredWidth, setMeasuredWidth] = useState(contentWidth ?? 0)
  const visibleWidth = contentWidth ?? measuredWidth
  const [overflow, setOverflow] = useState<'hidden' | 'visible'>('hidden')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (open) {
      timerRef.current = setTimeout(() => setOverflow('visible'), FAST_ANIMATION_DURATION_MS)
    } else {
      clearTimeout(timerRef.current)
      setOverflow('hidden')
    }
    return () => clearTimeout(timerRef.current)
  }, [open])

  const onLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      if (nativeEvent.layout.width && !contentWidth) {
        setMeasuredWidth(nativeEvent.layout.width)
      }
    },
    [contentWidth],
  )

  return (
    // TODO: figure out how to allow dynamic height based on content
    <View
      animation="fast"
      enterStyle={enterStyle}
      exitStyle={exitStyle}
      height={height}
      overflow={overflow}
      width={open ? visibleWidth : 0}
      {...rest}
    >
      {/* width="100%" resolves against the outer view's actual rendered width (post flex-shrink),
          so content inside naturally shrinks when the container shrinks. */}
      <View position="absolute" width="100%" height="100%" onLayout={onLayout}>
        {children}
      </View>
    </View>
  )
})
