/**
 * Tamagui-free runtime hooks for the icon factory: media-query matching and group-hover
 * subscription, replacing the parts of `usePropsAndStyle` that were state-driven, plus the
 * color resolution the composite wrappers share.
 */
import { isWebPlatform } from '@universe/environment'
import { useSporeColors } from '@universe/mycelium'
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { Dimensions } from 'react-native'
import { resolveIconColor } from 'ui/src/components/factories/iconTokens'
import type {
  IconColorValue,
  IconDynamicColor,
  IconMediaProps,
  IconOverrideStyle,
} from 'ui/src/components/factories/iconTypes'
import { breakpoints, heightBreakpoints } from 'ui/src/theme/breakpoints'

interface MediaSpec {
  key: keyof IconMediaProps
  maxWidth?: number
  maxHeight?: number
}

// Same keys and "least strong to most" order as ui/src/theme/media.ts — later entries override earlier ones
const MEDIA_SPECS: MediaSpec[] = [
  { key: '$xxxl', maxWidth: breakpoints.xxxl },
  { key: '$xxl', maxWidth: breakpoints.xxl },
  { key: '$xl', maxWidth: breakpoints.xl },
  { key: '$lg', maxWidth: breakpoints.lg },
  { key: '$md', maxWidth: breakpoints.md },
  { key: '$sm', maxWidth: breakpoints.sm },
  { key: '$xs', maxWidth: breakpoints.xs },
  { key: '$xxs', maxWidth: breakpoints.xxs },
  { key: '$short', maxHeight: heightBreakpoints.short },
  { key: '$midHeight', maxHeight: heightBreakpoints.midHeight },
  { key: '$lgHeight', maxHeight: heightBreakpoints.lgHeight },
]

/**
 * Evaluate the icon's `$media` style props against the window dimensions (max-width/max-height,
 * desktop-first — same semantics as ui/src/theme/media.ts). Subscribes to dimension changes only
 * when media props are actually present, so plain icons pay nothing.
 */
function getWindowSizeSnapshot(): string {
  const { width, height } = Dimensions.get('window')
  return `${width}x${height}`
}

export function useActiveMediaStyles(props: Record<string, unknown>): IconOverrideStyle[] {
  const usedSpecs = MEDIA_SPECS.filter((spec) => props[spec.key] !== undefined && props[spec.key] !== null)
  const hasMediaProps = usedSpecs.length > 0

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!hasMediaProps) {
        return () => undefined
      }
      const subscription = Dimensions.addEventListener('change', onStoreChange)
      return () => subscription.remove()
    },
    [hasMediaProps],
  )
  const windowSize = useSyncExternalStore(subscribe, getWindowSizeSnapshot, getWindowSizeSnapshot)

  if (!hasMediaProps) {
    return []
  }
  const [width = 0, height = 0] = windowSize.split('x').map(Number)
  return usedSpecs
    .filter((spec) => (spec.maxWidth !== undefined ? width <= spec.maxWidth : height <= (spec.maxHeight ?? 0)))
    .map((spec) => props[spec.key] as IconOverrideStyle)
}

export type GroupName = 'any' | 'item' | 'card'

/**
 * Web replacement for the Tamagui group-pseudo subscription (`$group-hover` / `$group-item-hover`):
 * the icon listens for hover on the nearest group anchor via the DOM instead of Tamagui's
 * GroupContext. During the Tamagui → mycelium transition this hook is the bridge in both
 * directions, so each lookup matches both marker systems: Tamagui containers render a
 * `t_group_<name>` class, converted mycelium containers render the Tailwind `group` /
 * `group/<name>` class. Native has no hover, matching the old behavior. Removal conditions:
 * drop the `.t_group_*` legs when the last Tamagui group anchor above a generated icon converts;
 * drop the hook entirely when generated icons leave ui/src.
 */
export function useGroupHover(args: {
  domNodeRef: React.RefObject<Element | null>
  hasAnyGroupStyle: boolean
  hasItemGroupStyle: boolean
  hasCardGroupStyle: boolean
}): Record<GroupName, boolean> {
  const { domNodeRef, hasAnyGroupStyle, hasItemGroupStyle, hasCardGroupStyle } = args
  const [hovered, setHovered] = useState<Record<GroupName, boolean>>({ any: false, item: false, card: false })

  useEffect(() => {
    if (!isWebPlatform) {
      return undefined
    }
    const node = domNodeRef.current
    if (!node || typeof node.closest !== 'function') {
      return undefined
    }

    const cleanups: Array<() => void> = []
    const attach = (target: Element, name: GroupName): void => {
      const onEnter = (): void => setHovered((state) => (state[name] ? state : { ...state, [name]: true }))
      const onLeave = (): void => setHovered((state) => (state[name] ? { ...state, [name]: false } : state))
      target.addEventListener('mouseenter', onEnter)
      target.addEventListener('mouseleave', onLeave)
      cleanups.push(() => {
        target.removeEventListener('mouseenter', onEnter)
        target.removeEventListener('mouseleave', onLeave)
      })
    }

    if (hasAnyGroupStyle) {
      // Tamagui rewrites a nameless `$group-hover` to `$group-true-hover` (getSplitStyles), so it
      // binds the nearest `group={true}` container specifically — never a named group like `item`.
      // `.group` is the mycelium equivalent (unnamed anchors emit the literal `group` class).
      const target = node.closest('.t_group_true, .group')
      if (target) {
        attach(target, 'any')
      }
    }
    if (hasItemGroupStyle) {
      const target = node.closest('.t_group_item, .group\\/item')
      if (target) {
        attach(target, 'item')
      }
    }
    if (hasCardGroupStyle) {
      const target = node.closest('.t_group_card, .group\\/card')
      if (target) {
        attach(target, 'card')
      }
    }
    return () => cleanups.forEach((cleanup) => cleanup())
  }, [domNodeRef, hasAnyGroupStyle, hasItemGroupStyle, hasCardGroupStyle])

  return hovered
}

/** react-native-svg's web components expose the rendered SVG element on `elementRef`; jsdom mocks forward the node directly. */
export function toDomElement(instance: unknown): Element | null {
  if (instance == null || typeof Element === 'undefined') {
    return null
  }
  if (instance instanceof Element) {
    return instance
  }
  const element = (instance as { elementRef?: { current?: unknown } }).elementRef?.current
  return element instanceof Element ? element : null
}

/**
 * Structurally `IconProps['color']`, spelled without importing createIcon, which imports this
 * module. `IconColorValue` is `IconColorToken | (string & {})`, so this is that union exactly.
 */
type ResolvableIconColor = IconColorValue | IconDynamicColor | null | undefined

/**
 * Resolves a wrapper's `color` prop to a literal before it hands it to a glyph.
 *
 * A literal is what has to leave the wrapper: react-native-web and React Native both discard
 * `var(--token)` as an invalid color and would leave the glyph unpainted. That is the defect
 * `packages/uniswap`'s snapshots caught, and it spread by the resolver idiom being copied from
 * one wrapper into the next, so it lives here once rather than at each call site.
 *
 * Unmemoized on purpose: `resolveIconColor` is two map lookups, so a `useMemo` keyed on the theme
 * map would buy nothing while tying each call site's theme-flip correctness to that map's
 * identity changing per theme.
 */
export function useResolvedIconColor(color: ResolvableIconColor): ResolvableIconColor {
  const colors = useSporeColors()
  return resolveIconColor(color, colors) as ResolvableIconColor
}
