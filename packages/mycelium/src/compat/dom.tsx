/**
 * The component-agnostic DOM wrapper for compat components: forwards aria /
 * legacy-a11y / event / behavioral props to the rendered element exactly as
 * Tamagui web does (accessibilityRole → ARIA role, onPress → click firing
 * onPress + onLongPress, disabled detaching the composed interaction surface,
 * `tag` rendering, `onLayout` via ResizeObserver). A component supplies only
 * how to compute its className; `createCompatComponent` wires the rest.
 */
import * as React from 'react'
import type { CompatAriaProps, CompatBehavioralProps, CompatEventProps, CompatLegacyA11yProps } from './props'

/** The prop surface the DOM wrapper reads (everything except styling). */
export type CompatDomProps = CompatAriaProps & CompatLegacyA11yProps & CompatEventProps & CompatBehavioralProps

/** RN accessibilityRole → ARIA role (the react-native-web mapping). */
const ACCESSIBILITY_ROLE_TO_ROLE: Record<string, React.AriaRole> = {
  adjustable: 'slider',
  alert: 'alert',
  button: 'button',
  checkbox: 'checkbox',
  combobox: 'combobox',
  header: 'heading',
  image: 'img',
  imagebutton: 'button',
  link: 'link',
  list: 'list',
  menu: 'menu',
  menubar: 'menubar',
  menuitem: 'menuitem',
  none: 'presentation',
  progressbar: 'progressbar',
  radio: 'radio',
  radiogroup: 'radiogroup',
  scrollbar: 'scrollbar',
  search: 'searchbox',
  slider: 'slider',
  spinbutton: 'spinbutton',
  summary: 'region',
  switch: 'switch',
  tab: 'tab',
  tablist: 'tablist',
  text: 'presentation',
  timer: 'timer',
  toolbar: 'toolbar',
}

const ARIA_PROP_KEYS = [
  'aria-busy',
  'aria-checked',
  'aria-disabled',
  'aria-expanded',
  'aria-hidden',
  'aria-label',
  'aria-labelledby',
  'aria-live',
  'aria-modal',
  'aria-selected',
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
  'aria-valuetext',
] as const

/**
 * Handlers Tamagui consumes into its composed interaction surface (re-emitted
 * from its own hover/press/focus wiring) — so, like the onPress family, they
 * are detached when `disabled` is set.
 */
const TAMAGUI_COMPOSED_EVENT_PROPS = [
  'onMouseEnter',
  'onMouseLeave',
  'onMouseDown',
  'onMouseUp',
  'onFocus',
  'onBlur',
] as const

/** Raw DOM handlers Tamagui passes through untouched (attached even when disabled). */
const FORWARDED_EVENT_PROPS = [
  'onPointerEnter',
  'onPointerLeave',
  'onPointerMove',
  'onPointerCancel',
  'onPointerEnterCapture',
  'onPointerLeaveCapture',
  'onPointerDownCapture',
  'onPointerUpCapture',
  'onPointerMoveCapture',
  'onPointerCancelCapture',
  'onTouchStart',
  'onTouchMove',
  'onTouchEnd',
  'onTouchCancel',
  'onTouchEndCapture',
] as const

/**
 * Translate the non-style compat surface (aria / legacy a11y / behavioral /
 * interaction props) into DOM props exactly as Tamagui web forwards them —
 * onPress → click (firing onPress + onLongPress), onPressIn/Out →
 * pointerdown/up, onHoverIn/Out → mouseenter/leave, `disabled` detaching the
 * composed interaction surface. Used by `createCompatComponent` and by compat
 * components that render a third-party element (e.g. a Base UI popup) instead
 * of their own tag but still owe the legacy prop forwarding.
 */
export function domProps(props: CompatDomProps): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  // ARIA passthrough + legacy RN accessibility mappings (react-native-web behavior).
  for (const key of ARIA_PROP_KEYS) {
    if (props[key] !== undefined) {
      out[key] = props[key]
    }
  }
  if (props.accessibilityLabel !== undefined && out['aria-label'] === undefined) {
    out['aria-label'] = props.accessibilityLabel
  }
  const role =
    props.role ??
    (props.accessibilityRole !== undefined ? ACCESSIBILITY_ROLE_TO_ROLE[props.accessibilityRole] : undefined)
  if (role !== undefined) {
    out['role'] = role
  }
  if (props.id !== undefined) {
    out['id'] = props.id
  }
  if (props.title !== undefined) {
    out['title'] = props.title
  }
  if (props.tabIndex !== undefined) {
    out['tabIndex'] = typeof props.tabIndex === 'string' ? Number(props.tabIndex) : props.tabIndex
  }
  if (props.href !== undefined) {
    out['href'] = props.href
  }
  if (props.target !== undefined) {
    out['target'] = props.target
  }
  if (props.htmlFor !== undefined) {
    out['htmlFor'] = props.htmlFor
  }
  if (props.rel !== undefined) {
    out['rel'] = props.rel
  }
  if (props.download !== undefined) {
    out['download'] = props.download
  }
  if (props.dangerouslySetInnerHTML !== undefined) {
    out['dangerouslySetInnerHTML'] = props.dangerouslySetInnerHTML
  }
  if (props.disabled === true) {
    out['aria-disabled'] = true
  }
  // Interaction handlers: Tamagui's own web mapping (press → click firing
  // onPress + onLongPress, pressIn/Out → pointerdown/up, hoverIn/Out →
  // mouseenter/leave). `disabled` detaches this composed interaction surface
  // entirely, exactly like Tamagui web does — raw DOM handlers below still
  // pass through, matching Tamagui's untouched viewProps.
  if (props.disabled !== true) {
    if (props.onPress !== undefined || props.onLongPress !== undefined) {
      const { onPress, onLongPress } = props
      // Tamagui web has no long-press timing: its click handler invokes
      // onPress and onLongPress together.
      out['onClick'] = (event: React.MouseEvent<HTMLElement>): void => {
        onPress?.(event)
        onLongPress?.(event)
      }
    }
    if (props.onPressIn !== undefined) {
      out['onPointerDown'] = props.onPressIn
    }
    if (props.onPressOut !== undefined) {
      out['onPointerUp'] = props.onPressOut
    }
    if (props.onHoverIn !== undefined) {
      out['onMouseEnter'] = props.onHoverIn
    }
    if (props.onHoverOut !== undefined) {
      out['onMouseLeave'] = props.onHoverOut
    }
    for (const key of TAMAGUI_COMPOSED_EVENT_PROPS) {
      if (props[key] !== undefined) {
        out[key] = props[key]
      }
    }
  }
  for (const key of FORWARDED_EVENT_PROPS) {
    if (props[key] !== undefined) {
      out[key] = props[key]
    }
  }
  return out
}

type OnLayout = NonNullable<CompatEventProps['onLayout']>

/**
 * react-native-web `onLayout` semantics: notify with the border-box rect
 * after mount and again whenever the element resizes. Returns a callback ref
 * to attach to the observed element (merge it with any forwarded ref).
 */
export function useOnLayout(onLayout: OnLayout | undefined): (node: HTMLElement | null) => void {
  const handlerRef = React.useRef<OnLayout | undefined>(onLayout)
  handlerRef.current = onLayout
  const cleanupRef = React.useRef<(() => void) | undefined>(undefined)
  return React.useCallback((node: HTMLElement | null) => {
    cleanupRef.current?.()
    cleanupRef.current = undefined
    if (node === null || handlerRef.current === undefined) {
      return
    }
    const notify = (): void => {
      const rect = node.getBoundingClientRect()
      handlerRef.current?.({
        nativeEvent: { layout: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } },
      })
    }
    if (typeof ResizeObserver === 'undefined') {
      notify()
      return
    }
    const observer = new ResizeObserver(notify)
    observer.observe(node)
    cleanupRef.current = (): void => observer.disconnect()
  }, [])
}

/**
 * Build a web-only, drop-in compat component from a className computer. The
 * returned component forwards its ref (merged with the `onLayout` observer
 * ref) and renders `tag ?? 'div'` with the shared DOM prop forwarding.
 */
export function createCompatComponent<P extends CompatDomProps>(
  computeClassName: (props: P) => string,
  displayName: string,
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<HTMLElement>> {
  const Component = React.forwardRef<HTMLElement, P>(function CompatComponent(props, ref) {
    const { children, style, testID, tag } = props
    const layoutRef = useOnLayout(props.onLayout)
    // Merges the layout callback ref with the forwarded ref. Memoized so the
    // callback ref doesn't refire (null, node) on every render; `layoutRef` is
    // stable, so this only refires when the forwarded ref itself changes.
    const setRef = React.useCallback(
      (node: HTMLElement | null): void => {
        layoutRef(node)
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref !== null) {
          ref.current = node
        }
      },
      [layoutRef, ref],
    )
    return React.createElement(
      tag ?? 'div',
      {
        ...domProps(props),
        ref: setRef,
        // forwardRef types the render prop as PropsWithoutRef<P>; the compiler
        // owns the ref, so the style-bearing shape is still P.
        className: computeClassName(props as P),
        style,
        'data-testid': testID,
      },
      children,
    )
  })
  Component.displayName = displayName
  return Component
}
