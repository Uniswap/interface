/**
 * Prop-resolution helpers shared by Separator's platform legs
 * (Separator.web.tsx / Separator.native.tsx). Platform-neutral: react-native
 * appears in type position only, so the web bundle stays RN-free.
 */
import { type UseSporeColorsReturn } from '@universe/mycelium/theme-hooks-compat'
import type { DimensionValue, ViewStyle } from 'react-native'
import { gap, padding, spacing } from 'ui/src/theme'

export const spacingTokens = { ...spacing, ...padding, ...gap }

export type SpacingTokenValue = `$${keyof typeof spacingTokens}` | number
export type ColorTokenValue = `$${string & keyof UseSporeColorsReturn}`
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
  return token === undefined ? undefined : String(colors[token.slice(1) as keyof UseSporeColorsReturn].val)
}

/** The style-shaped props both legs resolve identically (margins, colors, positioning). */
export type SeparatorStyleProps = {
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

export function buildSeparatorPropStyle(props: SeparatorStyleProps, colors: UseSporeColorsReturn): ViewStyle {
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
