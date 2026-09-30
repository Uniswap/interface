import { FloatingOverlayAnchor, FloatingOverlayArrow } from '@universe/mycelium/floating-overlay'
import { cloneElement, isValidElement, type ReactElement, useContext, useEffect } from 'react'
import { Pressable, type StyleProp, type ViewStyle } from 'react-native'
import { NativePopoverConfigContext, PopoverFrameSlotContext } from 'ui/src/components/popover/popoverContexts'
import { resolveNativeStyle } from 'ui/src/components/popover/popoverNativeHelpers'
import { resolvePopoverColor } from 'ui/src/components/popover/popoverStyleResolution'
import { resolveArrowSize } from 'ui/src/components/popover/shared'
import type {
  PopoverAdaptContentsProps,
  PopoverAdaptProps,
  PopoverAnchorProps,
  PopoverArrowProps,
  PopoverCloseProps,
  PopoverTriggerProps,
} from 'ui/src/components/popover/types'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { logger } from 'utilities/src/logger/logger'

/**
 * Native parts of the rebuilt Popover (INFRA-3318): Trigger / Anchor / Close /
 * Arrow / Adapt on the mycelium floating-overlay primitive (INFRA-2965), split from
 * the root/content leg for file-size hygiene. See Popover.native.tsx for the
 * leg-level contract.
 */

/**
 * Legacy trigger: renders its children in a pressable wrapper that toggles the
 * popover, and anchors positioning unless a custom `Popover.Anchor` exists. With
 * `asChild` the press handler is clone-merged onto the child element itself.
 */
export function PopoverTrigger(props: PopoverTriggerProps): JSX.Element | null {
  const {
    children,
    asChild,
    disabled,
    onPress,
    onMouseDown: _onMouseDown,
    onContextMenu: _onContextMenu,
    testID,
    'data-testid': _dataTestId,
    role: _role,
    tabIndex: _tabIndex,
    ...styleProps
  } = props
  const config = useContext(NativePopoverConfigContext)
  const colors = useSporeColors()
  const style = resolveNativeStyle(colors, styleProps as Record<string, unknown>)

  if (children === undefined || children === null) {
    return null
  }

  const handlePress = (): void => {
    if (disabled === true) {
      return
    }
    onPress?.()
    config.setOpen(!config.open, 'press')
  }

  let trigger: ReactElement
  if (asChild === true && isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>
    const childOnPress = child.props['onPress']
    trigger = cloneElement(child, {
      onPress: (event: unknown): void => {
        if (typeof childOnPress === 'function') {
          childOnPress(event)
        }
        handlePress()
      },
    })
  } else {
    trigger = (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        style={style as StyleProp<ViewStyle>}
        testID={testID}
        onPress={handlePress}
      >
        {children}
      </Pressable>
    )
  }

  if (config.hasCustomAnchor) {
    return trigger
  }
  return <FloatingOverlayAnchor>{trigger}</FloatingOverlayAnchor>
}

/** Custom anchor wrapper — positioning anchors here instead of the trigger. */
export function PopoverAnchor(props: PopoverAnchorProps): JSX.Element {
  const { children, ...styleProps } = props
  const config = useContext(NativePopoverConfigContext)
  const colors = useSporeColors()
  const style = resolveNativeStyle(colors, styleProps as Record<string, unknown>)
  const onCustomAnchorChange = config.onCustomAnchorChange

  useEffect(() => {
    onCustomAnchorChange(true)
    return () => onCustomAnchorChange(false)
  }, [onCustomAnchorChange])

  return <FloatingOverlayAnchor style={style as StyleProp<ViewStyle>}>{children}</FloatingOverlayAnchor>
}

/** Close control: presses request a close, like the legacy YStack-based `Popover.Close`. */
export function PopoverClose(props: PopoverCloseProps): JSX.Element {
  const { children, asChild, onPress, testID, ...styleProps } = props
  const config = useContext(NativePopoverConfigContext)
  const colors = useSporeColors()
  const style = resolveNativeStyle(colors, styleProps as Record<string, unknown>)

  const handlePress = (): void => {
    onPress?.()
    config.setOpen(false, 'press')
  }

  if (asChild === true && isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>
    const childOnPress = child.props['onPress']
    return cloneElement(child, {
      onPress: (event: unknown): void => {
        if (typeof childOnPress === 'function') {
          childOnPress(event)
        }
        handlePress()
      },
    })
  }

  return (
    <Pressable accessibilityRole="button" style={style as StyleProp<ViewStyle>} testID={testID} onPress={handlePress}>
      {children}
    </Pressable>
  )
}

/**
 * Arrow on the content edge facing the anchor. The legacy rotated-square's two
 * outlined edges are approximated by layering a border-colored triangle under the
 * fill triangle (the primitive's triangles carry no border of their own) —
 * ledgered and accepted by the executed device screenshot-diff on the PR.
 *
 * MUST be a DIRECT child of `Popover.Content`: the content leg hoists direct-child
 * arrows out of the padded frame onto the positioned wrapper, where the
 * primitive's absolute insets resolve correctly. An arrow nested in a fragment or
 * wrapper component stays in the frame slot and renders displaced inside the
 * bubble (warned below).
 */
export function PopoverArrow(props: PopoverArrowProps): JSX.Element {
  const { size: sizeProp, backgroundColor, borderColor, borderWidth: borderWidthProp } = props
  const config = useContext(NativePopoverConfigContext)
  const insideFrameSlot = useContext(PopoverFrameSlotContext)
  const colors = useSporeColors()

  const size = resolveArrowSize(sizeProp)
  const resolvedStyle = resolveNativeStyle(colors, { borderWidth: borderWidthProp })
  const borderWidth = typeof resolvedStyle.borderWidth === 'number' ? resolvedStyle.borderWidth : 0
  const fill = resolvePopoverColor(colors, backgroundColor) ?? String(colors.background.val)
  const border = resolvePopoverColor(colors, borderColor) ?? String(colors.borderColor.val)

  // Legacy `offset ?? arrowSize` fallback: register this arrow's size on the root.
  const onArrowSize = config.onArrowSize
  useEffect(() => {
    onArrowSize(size)
  }, [onArrowSize, size])

  useEffect(() => {
    // Dev-only invariant warning (release bundles compile the branch out); prod
    // must not ship it to Datadog.
    if (__DEV__ && insideFrameSlot) {
      logger.warn(
        'PopoverInternal.native.tsx',
        'PopoverArrow',
        'Popover.Arrow must be a DIRECT child of Popover.Content on native — an arrow nested in a fragment or wrapper component is not hoisted out of the padded content frame and renders displaced inside the bubble (INFRA-3318 device-diff arrow regression).',
      )
    }
  }, [insideFrameSlot])

  return (
    <>
      {borderWidth > 0 ? <FloatingOverlayArrow color={String(border)} size={size + borderWidth * 2} /> : null}
      <FloatingOverlayArrow color={String(fill)} size={size} />
    </>
  )
}

/**
 * Adapt-to-sheet is web-only (every call site gates `when` on `isWebApp`); the
 * native legacy popover with an inactive Adapt rendered nothing for the template,
 * which this no-op reproduces.
 */
function PopoverAdaptRoot(_props: PopoverAdaptProps): null {
  return null
}

function PopoverAdaptContents(_props: PopoverAdaptContentsProps): null {
  return null
}

export const PopoverAdapt = Object.assign(PopoverAdaptRoot, { Contents: PopoverAdaptContents })
