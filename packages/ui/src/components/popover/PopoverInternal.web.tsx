import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import {
  cloneElement,
  type CSSProperties,
  forwardRef,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type Ref,
  useContext,
  useLayoutEffect,
} from 'react'
import { WebPopoverConfigContext } from 'ui/src/components/popover/popoverContexts'
import { resolvePopoverColor, resolvePopoverWebStyle } from 'ui/src/components/popover/popoverStyleResolution'
import {
  arrowInnerStyle,
  arrowSideOf,
  arrowWindowStyle,
  FRAME_BASE_STYLE,
  mediaQueryFor,
  useMediaQueryMatch,
} from 'ui/src/components/popover/popoverWebHelpers'
import { resolveArrowSize } from 'ui/src/components/popover/shared'
import type {
  PopoverAdaptContentsProps,
  PopoverAdaptProps,
  PopoverAdaptWhen,
  PopoverAnchorProps,
  PopoverArrowProps,
  PopoverCloseProps,
  PopoverTriggerProps,
} from 'ui/src/components/popover/types'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import type { media } from 'ui/src/theme/media'
import { useComposedRefs } from 'utilities/src/react/composeRefs'

/**
 * Web parts of the rebuilt Popover (INFRA-3318): Trigger / Anchor / Close / Arrow /
 * Adapt on Base UI, split from the root/content leg for file-size hygiene. Inline
 * styles only (see Popover.web.tsx for the leg-level contract).
 */

/**
 * Renders a plain `div` wrapper like the legacy Tamagui trigger stack (not a native
 * button) so arbitrary trigger content keeps its own semantics; with `asChild`, the
 * child element itself becomes the trigger, like Tamagui — the resolved style props
 * and `onPress` are clone-merged onto the child (its own style/onClick/ref preserved
 * and composed).
 */
export const PopoverTrigger = forwardRef<HTMLDivElement, PopoverTriggerProps>(function PopoverTrigger(props, ref) {
  const {
    children,
    asChild,
    disabled,
    onPress,
    onMouseDown,
    onContextMenu,
    testID,
    'data-testid': dataTestId,
    role,
    tabIndex,
    ...styleProps
  } = props
  const colors = useSporeColors()
  const config = useContext(WebPopoverConfigContext)
  const resolvedCallerStyle = resolvePopoverWebStyle(colors, styleProps)
  const testId = dataTestId ?? testID
  // Base UI's prop merge lets an explicit `undefined` beat its own `role="button"` / `tabIndex=0`, so only spread the props that are set.
  const semanticsProps = {
    ...(role !== undefined ? { role } : undefined),
    ...(tabIndex !== undefined ? { tabIndex } : undefined),
  }

  const hoverProps = config.openOnHover
    ? { openOnHover: true, delay: config.openDelayMs, closeDelay: config.closeDelayMs }
    : undefined

  const renderAsChild = asChild === true && isValidElement(children)
  const child = renderAsChild ? (children as ReactElement<Record<string, unknown>>) : undefined
  const childRef = child?.props['ref'] as Ref<HTMLDivElement> | undefined
  // Composed once at the top level (memoized on the ref identities) so function refs
  // don't see ref(null)/ref(node) churn from a fresh composed callback every render.
  // In the non-asChild path childRef is undefined and composeRefs skips the slot.
  // The root registration is one of the slots: Popover.Content resolves the host portal
  // container by walking up from this node (see Popover.web.tsx).
  const composedTriggerRef = useComposedRefs<HTMLDivElement>(config.setTriggerElement, childRef, ref)

  if (child !== undefined) {
    const childStyle = child.props['style'] as CSSProperties | undefined
    const childOnClick = child.props['onClick']
    const composedClick = (event: MouseEvent<HTMLDivElement>): void => {
      if (typeof childOnClick === 'function') {
        childOnClick(event)
      }
      onPress?.(event)
    }
    const renderElement = cloneElement(child, {
      // Conditional spreads: cloneElement config values override even when
      // `undefined`, which would wipe a child's own data-testid or style.
      ...(testId !== undefined ? { 'data-testid': testId } : undefined),
      ...(Object.keys(resolvedCallerStyle).length > 0 || childStyle !== undefined
        ? { style: { ...resolvedCallerStyle, ...childStyle } }
        : undefined),
      ...(onPress !== undefined || childOnClick !== undefined ? { onClick: composedClick } : undefined),
      ref: composedTriggerRef,
    })
    return (
      <PopoverPrimitive.Trigger
        data-slot="ui-popover-trigger"
        nativeButton={false}
        disabled={disabled}
        {...hoverProps}
        {...semanticsProps}
        render={renderElement}
        onMouseDown={onMouseDown}
        onContextMenu={onContextMenu}
      />
    )
  }

  return (
    <PopoverPrimitive.Trigger
      data-slot="ui-popover-trigger"
      nativeButton={false}
      disabled={disabled}
      {...hoverProps}
      {...semanticsProps}
      data-testid={testId}
      // The forwarded ref rides the render div: Base UI types the Trigger's own ref
      // as HTMLButtonElement, but the legacy trigger surface is a plain div.
      // oxlint-disable-next-line react/forbid-elements -- the rebuilt trigger IS the raw DOM boundary (no Tamagui Flex here)
      render={<div ref={composedTriggerRef} style={{ ...FRAME_BASE_STYLE, ...resolvedCallerStyle }} />}
      onClick={onPress}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
    >
      {children}
    </PopoverPrimitive.Trigger>
  )
})

/**
 * Measurable anchor wrapper: when present, positioning anchors here instead of the
 * trigger (legacy `hasCustomAnchor`). The forwarded ref exposes the DOM node
 * (SendRecipientForm measures it with getBoundingClientRect).
 */
export const PopoverAnchor = forwardRef<HTMLDivElement, PopoverAnchorProps>(function PopoverAnchor(props, ref) {
  const { children, ...styleProps } = props
  const colors = useSporeColors()
  const config = useContext(WebPopoverConfigContext)
  const resolvedCallerStyle = resolvePopoverWebStyle(colors, styleProps)
  // The context registration is itself a ref slot: composing it with the forwarded
  // ref keeps one stable callback ref and preserves a React 19 cleanup, if any.
  const registerAnchor = useComposedRefs<HTMLDivElement>(config.setAnchorElement, ref ?? undefined)

  return (
    // oxlint-disable-next-line react/forbid-elements -- the rebuilt anchor IS the raw DOM boundary (no Tamagui Flex here)
    <div ref={registerAnchor} data-slot="ui-popover-anchor" style={{ ...FRAME_BASE_STYLE, ...resolvedCallerStyle }}>
      {children}
    </div>
  )
})

/**
 * Close control: a plain `div` wrapper (or the cloned child with `asChild`) that
 * requests a close on press, like the legacy YStack-based `Popover.Close`.
 */
export const PopoverClose = forwardRef<HTMLDivElement, PopoverCloseProps>(function PopoverClose(props, ref) {
  const { children, asChild, onPress, testID, ...styleProps } = props
  const colors = useSporeColors()
  const config = useContext(WebPopoverConfigContext)
  const resolvedCallerStyle = resolvePopoverWebStyle(colors, styleProps)

  const handlePress = (event: MouseEvent<HTMLDivElement>): void => {
    onPress?.(event)
    config.setOpen(false, 'press')
  }

  const renderAsChild = asChild === true && isValidElement(children)
  const child = renderAsChild ? (children as ReactElement<Record<string, unknown>>) : undefined
  const childRef = child?.props['ref'] as Ref<HTMLDivElement> | undefined
  // Top-level memoized composition, same as PopoverTrigger (childRef slot is skipped
  // in the non-asChild path).
  const composedCloseRef = useComposedRefs<HTMLDivElement>(childRef, ref)

  if (child !== undefined) {
    const childOnClick = child.props['onClick']
    const childStyle = child.props['style'] as CSSProperties | undefined
    return cloneElement(child, {
      ...(Object.keys(resolvedCallerStyle).length > 0 || childStyle !== undefined
        ? { style: { ...resolvedCallerStyle, ...childStyle } }
        : undefined),
      onClick: (event: MouseEvent<HTMLDivElement>): void => {
        if (typeof childOnClick === 'function') {
          childOnClick(event)
        }
        handlePress(event)
      },
      ref: composedCloseRef,
    })
  }

  return (
    // oxlint-disable-next-line react/forbid-elements -- the rebuilt close IS the raw DOM boundary (no Tamagui Flex here)
    <div
      ref={ref}
      data-slot="ui-popover-close"
      data-testid={testID}
      style={{ ...FRAME_BASE_STYLE, ...resolvedCallerStyle }}
      onClick={handlePress}
    >
      {children}
    </div>
  )
})

/**
 * The legacy rotated-square arrow (geometry in popoverWebHelpers). Size follows the
 * legacy `getSpace(size, { shift: -2 })` algebra; colors default to the legacy
 * `$background`/`$borderColor` theme keys and resolve through useSporeColors.
 */
export function PopoverArrow(props: PopoverArrowProps): JSX.Element | null {
  const { size: sizeProp, backgroundColor, borderColor, borderWidth: borderWidthProp, unstyled: _unstyled } = props
  const colors = useSporeColors()
  const config = useContext(WebPopoverConfigContext)

  const size = resolveArrowSize(sizeProp)
  const borderWidth =
    typeof borderWidthProp === 'number'
      ? borderWidthProp
      : ((resolvePopoverWebStyle(colors, { borderWidth: borderWidthProp }).borderWidth as number | undefined) ?? 0)
  const resolvedBackground = resolvePopoverColor(colors, backgroundColor) ?? String(colors.background.val)
  const resolvedBorder = resolvePopoverColor(colors, borderColor) ?? String(colors.borderColor.val)

  // Legacy `offset ?? arrowSize` fallback: register this arrow's size on the root.
  const onArrowSize = config.onArrowSize
  useLayoutEffect(() => {
    onArrowSize(size)
  }, [onArrowSize, size])

  // The legacy arrow renders null while the popover is adapted into a sheet.
  if (config.adaptActive) {
    return null
  }

  return (
    <PopoverPrimitive.Arrow
      data-slot="ui-popover-arrow"
      render={(arrowProps, state) => {
        const side = arrowSideOf(state.side)
        return (
          // oxlint-disable-next-line react/forbid-elements -- raw DOM inside the rebuilt arrow (no Tamagui Flex here)
          <div {...arrowProps} style={{ ...arrowProps.style, ...arrowWindowStyle({ side, size, borderWidth }) }}>
            {/* oxlint-disable-next-line react/forbid-elements -- raw DOM inside the rebuilt arrow (no Tamagui Flex here) */}
            <div
              data-slot="ui-popover-arrow-inner"
              style={arrowInnerStyle({
                side,
                size,
                borderWidth,
                backgroundColor: resolvedBackground,
                borderColor: resolvedBorder,
              })}
            />
          </div>
        )
      }}
    />
  )
}

function useAdaptWhenActive(when: PopoverAdaptWhen | undefined): boolean {
  const isMediaKey = typeof when === 'string'
  const matches = useMediaQueryMatch(isMediaKey ? mediaQueryFor(when as keyof typeof media) : undefined)
  if (typeof when === 'boolean') {
    return when
  }
  if (isMediaKey) {
    return matches
  }
  return false
}

/**
 * Legacy `Popover.Adapt`: when `when` is active (boolean or matched media key), the
 * children template renders and `Popover.Content` teleports its children into
 * `Popover.Adapt.Contents`; when inactive the template unmounts entirely.
 */
function PopoverAdaptRoot({ when, children }: PopoverAdaptProps): JSX.Element | null {
  const config = useContext(WebPopoverConfigContext)
  const active = useAdaptWhenActive(when)
  const setAdaptActive = config.setAdaptActive

  // Registration is an effect (setState on the root during another component's
  // render is illegal); cleanup deactivates on unmount so Content re-floats.
  useLayoutEffect(() => {
    setAdaptActive(active)
    return () => setAdaptActive(false)
  }, [setAdaptActive, active])

  if (!active) {
    return null
  }
  return <>{children}</>
}

function PopoverAdaptContents(_props: PopoverAdaptContentsProps): JSX.Element {
  const config = useContext(WebPopoverConfigContext)
  return (
    // oxlint-disable-next-line react/forbid-elements -- portal target for the adapt displacement (no visual box)
    <div ref={config.setAdaptContainer} data-slot="ui-popover-adapt-contents" style={{ display: 'contents' }} />
  )
}

export const PopoverAdapt = Object.assign(PopoverAdaptRoot, { Contents: PopoverAdaptContents })
