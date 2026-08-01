import { isTestEnv } from '@universe/environment'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'
import { View, type ViewProps } from 'tamagui'
import { type FlexProps } from 'ui/src/components/layout'

/** Longest theme transition is `lazy` (500ms); wait slightly longer so height + layout settle before unmount. */
const COLLAPSE_UNMOUNT_DELAY_MS = 550

export interface HeightAnimatorProps {
  open?: boolean
  useInitialHeight?: boolean
  animation?: FlexProps['animation']
  styleProps?: FlexProps
  animationDisabled?: boolean // we want to disable animation when inside of a bottom sheet
  unmountChildrenWhenCollapsed?: boolean
}

const enterStyle = { opacity: 0 } satisfies ViewProps['enterStyle']
const exitStyle = { opacity: 0 } satisfies ViewProps['exitStyle']

export const HeightAnimator = View.styleable<HeightAnimatorProps>(
  ({
    open = true,
    animationDisabled = false,
    children,
    useInitialHeight,
    animation = 'fast',
    styleProps,
    unmountChildrenWhenCollapsed = false,
  }) => {
    const lazyUnmount = Boolean(unmountChildrenWhenCollapsed && !useInitialHeight)
    const [visibleHeight, setVisibleHeight] = useState(useInitialHeight ? children.height : 0)
    const [renderChildren, setRenderChildren] = useState(!lazyUnmount || open)
    /** Preserves last content height so reopen after lazy-unmount does not mount inside a 0px-tall parent (onLayout may never run). */
    const lastNonZeroMeasuredHeightRef = useRef(0)

    const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
      const h = nativeEvent.layout.height
      if (typeof h === 'number') {
        if (h > 0) {
          lastNonZeroMeasuredHeightRef.current = h
        }
        setVisibleHeight(h)
      }
    }, [])

    useLayoutEffect(() => {
      if (!lazyUnmount) {
        setRenderChildren(true)
        return
      }

      if (animationDisabled || isTestEnv()) {
        setRenderChildren(open)
        if (!open && !useInitialHeight) {
          setVisibleHeight(0)
        }
        return
      }

      if (open) {
        setRenderChildren(true)
        // After lazy unmount we set visibleHeight to 0; reopening with h=0 prevents inner layout from measuring.
        if (!useInitialHeight && lastNonZeroMeasuredHeightRef.current > 0) {
          setVisibleHeight((prev: number) => (prev === 0 ? lastNonZeroMeasuredHeightRef.current : prev))
        }
      }
    }, [open, lazyUnmount, animationDisabled, useInitialHeight])

    useEffect(() => {
      if (!lazyUnmount || animationDisabled || isTestEnv() || open) {
        return undefined
      }

      const delayMs = COLLAPSE_UNMOUNT_DELAY_MS
      const id = setTimeout(() => {
        setRenderChildren(false)
        setVisibleHeight(0)
      }, delayMs)

      return () => {
        clearTimeout(id)
      }
    }, [open, lazyUnmount, animationDisabled])

    return (
      <View
        overflow="hidden"
        {...styleProps}
        animation={animationDisabled || isTestEnv() ? null : animation}
        enterStyle={enterStyle}
        exitStyle={exitStyle}
        height={open ? visibleHeight : 0}
        width="100%"
      >
        <View position="absolute" width="100%" onLayout={onLayout}>
          {renderChildren ? children : null}
        </View>
      </View>
    )
  },
)
