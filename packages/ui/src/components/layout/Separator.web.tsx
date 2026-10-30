/**
 * Web leg of Separator: a plain `div` carrying the exact declaration set the
 * legacy Tamagui `styled(Stack)` cascade emitted, inline styles only. No
 * react-native imports — not even in type position.
 */
import { useSporeColors } from '@universe/mycelium'
import { type CSSProperties, useSyncExternalStore } from 'react'
import type { SeparatorProps } from 'ui/src/components/layout/Separator'
import {
  buildSeparatorPropStyle,
  getFalse,
  spacingTokens,
  subscribeNoop,
} from 'ui/src/components/layout/separatorStyles'
import { breakpoints } from 'ui/src/theme'

export type { SeparatorProps } from 'ui/src/components/layout/Separator'

/**
 * `style` narrowed from the shared type's StyleProp<ViewStyle> to CSSProperties:
 * this leg spreads it into a DOM div, where RN-only shorthands (marginHorizontal,
 * paddingVertical, transform arrays) would typecheck but silently no-op — narrowing
 * turns them into compile errors for code typed against this leg. Suffix-less
 * imports still typecheck against the base stub's shared type; Tamagui
 * styled(Separator, ...) wrappers inject `style` at runtime, untyped.
 */
export type SeparatorWebProps = Omit<SeparatorProps, 'style'> & {
  style?: CSSProperties
}

// Runtime defense for the styled(Separator, ...) pass-through: Tamagui wrappers deliver a
// flat object, but composed styles can arrive as arrays (RN StyleSheet.flatten semantics;
// registered-stylesheet ids never appear on web).
function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    const merged: Record<string, unknown> = {}
    for (const entry of style) {
      Object.assign(merged, flattenStyle(entry))
    }
    return merged
  }
  return typeof style === 'object' && style !== null ? (style as Record<string, unknown>) : {}
}

// Tamagui styled(Separator, ...) wrappers (OffchainActivityModal's divider) deliver their
// resolved spacing as `var(--t-space-<token>)` strings on web. Resolve them back to token
// pixels at this boundary so the value survives every style pipeline (jsdom drops var()
// values it cannot validate). Remove when the last styled(Separator) call site is off Tamagui.
function resolveTamaguiSpaceVars(style: CSSProperties | undefined): CSSProperties | undefined {
  // No `=== null` arm: the declared type has no null overlap (oxlint no-unnecessary-condition).
  // A runtime null from an untyped Tamagui styled() wrapper is still handled by flattenStyle returning {}.
  if (style === undefined) {
    return undefined
  }
  const flat = flattenStyle(style)
  const resolved: Record<string, unknown> = { ...flat }
  for (const [key, value] of Object.entries(flat)) {
    if (typeof value !== 'string') {
      continue
    }
    const match = /^var\(--t-space-([A-Za-z0-9]+)\)$/.exec(value)
    const token = match?.[1]
    if (token !== undefined && token in spacingTokens) {
      resolved[key] = spacingTokens[token as keyof typeof spacingTokens]
    }
  }
  return resolved as CSSProperties
}

/**
 * Everything the legacy `styled(Stack)` Separator emitted onto its web element —
 * the Tamagui Stack frame defaults plus the Separator's own declarations, in
 * cascade-resolved form. Kept as an exact transcription: downstream parity suites
 * (packages/tailwind menu-separator) pin this declaration set byte-for-byte.
 * The legacy frame's `flexShrink: 0` vs `flex: 1` clash resolved on web to
 * grow 1 / shrink 1 / basis auto (Tamagui's `flex: 1` expansion clobbered the
 * earlier flexShrink); the native leg mirrors Yoga's different resolution.
 */
const WEB_BASE: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  flexDirection: 'column',
  flexBasis: 'auto',
  boxSizing: 'border-box',
  position: 'relative',
  minHeight: 0,
  minWidth: 0,
  flexGrow: 1,
  flexShrink: 1,
  borderTopStyle: 'solid',
  borderRightStyle: 'solid',
  borderBottomStyle: 'solid',
  borderLeftStyle: 'solid',
  borderTopWidth: 0,
  borderRightWidth: 0,
  borderLeftWidth: 0,
}

// TODO(INFRA-3318): remove the `$md` breakpoint observer once apps/web CategoryStatsRow no
// longer needs it (the sole `$md` consumer), or once packages/ui gains a scanned stylesheet
// that can express media queries in CSS instead of JS.
const MD_QUERY = `(max-width: ${breakpoints.md}px)`

// Guarded so environments without a declared window or without matchMedia (server render,
// partial jsdom stubs) fall back to the non-matching state instead of throwing.
function subscribeToMdQuery(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }
  const query = window.matchMedia(MD_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function getMdQueryMatches(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(MD_QUERY).matches
}

/** The exact media query Tamagui compiled `$md` to, so the breakpoint boundary is identical. */
function useIsMdBreakpoint(hasMediaOverride: boolean): boolean {
  return useSyncExternalStore(
    hasMediaOverride ? subscribeToMdQuery : subscribeNoop,
    hasMediaOverride ? getMdQueryMatches : getFalse,
    getFalse,
  )
}

/**
 * Thin divider line, horizontal by default, `vertical` to flip.
 * Hand-rolled off Tamagui — inline styles only, mirroring the legacy Tamagui
 * cascade output exactly.
 */
export function Separator({
  vertical,
  my,
  mx,
  mt,
  mb,
  width,
  backgroundColor,
  borderColor,
  borderBottomWidth,
  position,
  top,
  left,
  right,
  $md,
  testID,
  'data-testid': dataTestId,
  style,
  children,
}: SeparatorWebProps): JSX.Element {
  const colors = useSporeColors()
  const isMd = useIsMdBreakpoint($md !== undefined)

  const propStyle = buildSeparatorPropStyle(
    { my, mx, mt, mb, width, backgroundColor, borderColor, borderBottomWidth, position, top, left, right },
    colors,
  )

  const mediaStyle = isMd && $md !== undefined ? $md : undefined

  const webStyle: CSSProperties = {
    ...WEB_BASE,
    borderTopColor: colors.surface3.val,
    borderRightColor: colors.surface3.val,
    borderBottomColor: colors.surface3.val,
    borderLeftColor: colors.surface3.val,
    ...(vertical
      ? {
          // `translateY(0px)` mirrors the legacy vertical variant's `y: 0`, preserving any
          // stacking-context side effect.
          transform: 'translateY(0px)',
          height: 'initial',
          maxHeight: 'initial',
          width: 0,
          maxWidth: 0,
          borderBottomWidth: 0,
          borderRightWidth: 0.25,
        }
      : { height: 0, maxHeight: 0, borderBottomWidth: 1 }),
    ...(propStyle as CSSProperties),
    ...resolveTamaguiSpaceVars(style),
    ...(mediaStyle as CSSProperties),
  }
  return (
    // oxlint-disable-next-line react/forbid-elements -- deliberately Tamagui-free: Flex is a Tamagui primitive, and this rebuild must emit exactly the legacy cascade output via inline styles (INFRA-3318)
    <div data-testid={dataTestId ?? testID} style={webStyle}>
      {children}
    </div>
  )
}

Separator.displayName = 'Separator'
