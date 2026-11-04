/**
 * The `Separator` compat prop contract and prop-resolution helpers, shared by
 * the platform legs (SeparatorCompat.web.tsx / SeparatorCompat.native.tsx) —
 * transcribed from the Tamagui-free `ui/src` Separator it replaced and
 * re-sourced onto mycelium internals. Platform-neutral: react-native appears in type
 * position only, so the web bundle stays RN-free.
 */
import type { ReactNode } from 'react'
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native'
import type { ThemeColorName } from '../theme-hooks-compat/tokens'
import type { UseSporeColorsReturn } from '../theme-hooks-compat/useSporeColors'
import { spacing } from '../tokens'

/**
 * ui/src/theme/spacing.ts `padding`/`gap` families, derived from the shared
 * spacing values (never copied literals) exactly like the legacy module.
 */
const paddingTokens = {
  padding6: spacing.spacing6,
  padding8: spacing.spacing8,
  padding12: spacing.spacing12,
  padding16: spacing.spacing16,
  padding20: spacing.spacing20,
  padding24: spacing.spacing24,
  padding36: spacing.spacing36,
}

const gapTokens = {
  gap2: spacing.spacing2,
  gap4: spacing.spacing4,
  gap8: spacing.spacing8,
  gap12: spacing.spacing12,
  gap16: spacing.spacing16,
  gap20: spacing.spacing20,
  gap24: spacing.spacing24,
  gap32: spacing.spacing32,
  gap36: spacing.spacing36,
}

export const spacingTokens = { ...spacing, ...paddingTokens, ...gapTokens }

export type SpacingTokenValue = `$${keyof typeof spacingTokens}` | number
export type ColorTokenValue = `$${ThemeColorName}`
export type InsetValue = DimensionValue | string

export function resolveSpacing(value: SpacingTokenValue | undefined): number | undefined {
  if (typeof value !== 'string') {
    return value
  }
  return spacingTokens[value.slice(1) as keyof typeof spacingTokens]
}

// Tamagui coerced numeric-string positions (e.g. left="0") to px on web; mirror that so
// the same call sites resolve to identical layout on both style engines.
export function resolveInset(value: InsetValue | undefined): DimensionValue | undefined {
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return value as DimensionValue | undefined
}

export function resolveColor(colors: UseSporeColorsReturn, token: ColorTokenValue | undefined): string | undefined {
  return token === undefined ? undefined : String(colors[token.slice(1) as ThemeColorName].val)
}

/** The style-shaped props both legs resolve identically (margins, colors, positioning). */
export type SeparatorCompatStyleProps = {
  my?: SpacingTokenValue
  mx?: SpacingTokenValue
  mt?: SpacingTokenValue
  mb?: SpacingTokenValue
  width?: DimensionValue
  backgroundColor?: ColorTokenValue
  borderColor?: ColorTokenValue
  borderBottomWidth?: number
  position?: ViewStyle['position']
  top?: InsetValue
  left?: InsetValue
  right?: InsetValue
}

export type SeparatorCompatProps = SeparatorCompatStyleProps & {
  vertical?: boolean
  /**
   * Style overrides applied at or below the `$md` breakpoint (max-width 640px),
   * matching the legacy Tamagui media prop's boundary behavior.
   */
  $md?: { display?: 'none' | 'flex' }
  testID?: string
  /** Tamagui `styled(Separator, ...)` wrappers forward testID as data-testid on web. */
  'data-testid'?: string
  style?: StyleProp<ViewStyle>
  children?: ReactNode
}

export function buildSeparatorPropStyle(props: SeparatorCompatStyleProps, colors: UseSporeColorsReturn): ViewStyle {
  const { my, mx, mt, mb, width, backgroundColor, borderColor, borderBottomWidth, position, top, left, right } = props
  return {
    ...(my !== undefined && { marginTop: resolveSpacing(my), marginBottom: resolveSpacing(my) }),
    ...(mx !== undefined && { marginLeft: resolveSpacing(mx), marginRight: resolveSpacing(mx) }),
    ...(mt !== undefined && { marginTop: resolveSpacing(mt) }),
    ...(mb !== undefined && { marginBottom: resolveSpacing(mb) }),
    ...(width !== undefined && { width }),
    ...(backgroundColor !== undefined && { backgroundColor: resolveColor(colors, backgroundColor) }),
    ...(borderColor !== undefined && {
      borderTopColor: resolveColor(colors, borderColor),
      borderRightColor: resolveColor(colors, borderColor),
      borderBottomColor: resolveColor(colors, borderColor),
      borderLeftColor: resolveColor(colors, borderColor),
    }),
    ...(borderBottomWidth !== undefined && { borderBottomWidth }),
    ...(position !== undefined && { position }),
    ...(top !== undefined && { top: resolveInset(top) }),
    ...(left !== undefined && { left: resolveInset(left) }),
    ...(right !== undefined && { right: resolveInset(right) }),
  }
}

// Inert store used when no `$md` override is passed (nearly every call site): the breakpoint
// can never affect rendering, so no MediaQueryList/Dimensions listener is ever constructed.
// Hook order stays unconditional — only the store callbacks swap.
export function subscribeNoop(): () => void {
  return () => {}
}

export function getFalse(): boolean {
  return false
}
