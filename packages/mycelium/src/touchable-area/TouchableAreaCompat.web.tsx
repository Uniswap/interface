import * as React from 'react'
import { type CompatDomProps, createCompatComponent } from '../compat/dom'
import { THEME_COLOR_TOKENS } from '../text-compat/theme-tokens.generated'
import { touchableAreaCompatClassName } from './compile'
import { isModifierClick } from './modifier-click'
import type { TouchableAreaCompatEvent, TouchableAreaCompatProps } from './props'

/**
 * Web drop-in replacement for the `ui/src` Tamagui `TouchableArea`, rendering
 * the same CSS via Tailwind classes (see `./compile`) through the shared
 * compat DOM wrapper (`../compat/dom`). The parity suite in
 * `packages/tailwind/src/parity/touchable-area` proves the CSS equivalence
 * per prop pool, value, scope (pseudo/media/group), and theme; this file
 * carries the runtime semantics the legacy wrapper adds: role/tabindex
 * defaults, press propagation gating, modifier-press navigation, minimum
 * touch-target measurement, and Spore child color injection.
 *
 * Native rendering (Pressable semantics) is the `.native.tsx` split.
 */

/** Minimum web touch target (the legacy `useAutoDimensions` web default). */
const MIN_DIMENSION = 24

/** The wrapper normalizes the nullable press family before the DOM layer sees it. */
type TouchableAreaFrameProps = TouchableAreaCompatProps & CompatDomProps

const TouchableAreaFrame = createCompatComponent<TouchableAreaFrameProps>(
  touchableAreaCompatClassName,
  'TouchableAreaCompatFrame',
)

const TOKEN_SET: ReadonlySet<string> = new Set(THEME_COLOR_TOKENS)

/**
 * The legacy `getMaybeHoverColor`: a valid spore token whose `<token>Hovered`
 * counterpart exists maps to it; everything else passes through.
 */
function maybeHoverColor(color: string | undefined): string | undefined {
  if (color === undefined || !color.startsWith('$')) {
    return color
  }
  const name = color.slice(1)
  return TOKEN_SET.has(name) && TOKEN_SET.has(`${name}Hovered`) ? `${color}Hovered` : color
}

interface InjectedColorsOptions {
  children: React.ReactNode
  disabled: boolean | undefined
  variant: TouchableAreaCompatProps['variant']
  enabled: boolean
}

/**
 * The legacy `WithInjectedColors` contract: clone children injecting the
 * Spore color guidance — `color` (default $accent3), `backgroundColor`, and a
 * `$group-hover` pool with their hovered-token counterparts; disabled swaps
 * to the disabled palette and drops the hover pool. Nested TouchableAreas
 * keep their own styling.
 */
function withInjectedColors({ children, disabled, variant, enabled }: InjectedColorsOptions): React.ReactNode {
  if (!enabled) {
    return children
  }
  return React.Children.toArray(children).map((child) => {
    if (!React.isValidElement(child)) {
      return child
    }
    if (child.type === TouchableAreaCompat) {
      return child
    }
    const childProps = child.props as Record<string, unknown>
    let groupHover = childProps['$group-hover'] as Record<string, unknown> | undefined
    const maybeColor = (childProps['color'] as string | undefined) ?? '$accent3'
    const maybeBackgroundColor = childProps['backgroundColor'] as string | undefined
    if (!groupHover && [maybeColor, maybeBackgroundColor].some((value) => typeof value === 'string')) {
      groupHover = {
        color: disabled ? undefined : maybeHoverColor(maybeColor),
        backgroundColor: disabled ? undefined : maybeHoverColor(maybeBackgroundColor),
      }
    }
    const backgroundColor =
      disabled && (variant === 'filled' || maybeBackgroundColor !== undefined) ? '$surface2' : maybeBackgroundColor
    const color = disabled ? '$neutral2' : maybeColor
    return React.cloneElement(child, {
      color,
      backgroundColor,
      '$group-hover': groupHover,
    } as Partial<unknown>)
  })
}

type LayoutEvent = { nativeEvent: { layout: { x: number; y: number; width: number; height: number } } }

export const TouchableAreaCompat = React.forwardRef<HTMLElement, TouchableAreaCompatProps>(
  function TouchableAreaCompat(props, ref) {
    const {
      children,
      shouldConsiderMinimumDimensions = false,
      shouldStopPropagation = true,
      shouldAutomaticallyInjectColors = true,
      modifierPressHref,
      onModifierPress,
      onPress,
      onPressIn,
      onPressOut,
      onLayout,
      ...rest
    } = props

    const [minDimensions, setMinDimensions] = React.useState<{ width?: number; height?: number }>({})

    const handleLayout = React.useCallback(
      (event: LayoutEvent): void => {
        onLayout?.(event)
        if (!shouldConsiderMinimumDimensions) {
          return
        }
        const width = Math.round(event.nativeEvent.layout.width)
        const height = Math.round(event.nativeEvent.layout.height)
        const nextWidth = width <= MIN_DIMENSION ? MIN_DIMENSION : undefined
        const nextHeight = height <= MIN_DIMENSION ? MIN_DIMENSION : undefined
        setMinDimensions((previous) =>
          previous.width === nextWidth && previous.height === nextHeight
            ? previous
            : { width: nextWidth, height: nextHeight },
        )
      },
      [onLayout, shouldConsiderMinimumDimensions],
    )

    const gated = <E extends { stopPropagation?: () => void }>(
      handler: ((event: E) => void) | null | undefined,
    ): ((event: E) => void) | undefined => {
      if (handler === null || handler === undefined) {
        return undefined
      }
      return (event: E): void => {
        if (shouldStopPropagation && typeof event.stopPropagation === 'function') {
          event.stopPropagation()
        }
        handler(event)
      }
    }

    const pressHandler = gated(onPress)
    const modifierPressHandler =
      modifierPressHref !== undefined
        ? (event: TouchableAreaCompatEvent): void => {
            if (isModifierClick(event)) {
              onModifierPress?.(event)
              return
            }
            if (!pressHandler) {
              return
            }
            event.preventDefault()
            pressHandler(event)
          }
        : undefined

    const anchorMode = modifierPressHref !== undefined
    const tag = anchorMode ? 'a' : props.tag
    const role = props.role ?? (anchorMode ? 'link' : 'button')
    const unfocusable = props.disabled === true || props.focusable === false
    const tabIndex = props.tabIndex ?? (unfocusable ? -1 : anchorMode ? undefined : 0)

    const frameProps: TouchableAreaFrameProps = {
      ...rest,
      children: withInjectedColors({
        children,
        disabled: props.disabled,
        variant: props.variant,
        enabled: shouldAutomaticallyInjectColors,
      }),
      tag,
      role,
      tabIndex,
      href: anchorMode ? modifierPressHref : props.href,
      onLayout: handleLayout,
      onPress: modifierPressHandler ?? pressHandler,
      onLongPress: rest.onLongPress ?? undefined,
      onPressIn: gated(onPressIn),
      onPressOut: gated(onPressOut),
      ...(shouldConsiderMinimumDimensions ? { width: minDimensions.width, height: minDimensions.height } : undefined),
    }

    return <TouchableAreaFrame {...frameProps} ref={ref} />
  },
)
