/**
 * Color-value validation helpers ported from the legacy theme utilities
 * (`ui/src/theme/tokens.ts`), so converted call sites keep their dev-time
 * guard against passing a non-color string (a chain/token color fetched at
 * runtime) into a color prop (INFRA-3601).
 *
 * This module is the shared mycelium home for spore color validators —
 * INFRA-3601's `validColor` alongside INFRA-3545's `getIsValidSporeColor` —
 * colocated with the compat color maps (`./color-tokens`). Membership checks
 * run against the generated theme color names, which mirror exactly the set
 * the legacy validator accepts (the palette colors plus the light-theme
 * keys); the parity test beside this file enumerates that set against
 * independent literals.
 */
import { isProdEnv } from '@universe/environment'
import { THEME_COLOR_NAMES } from '../theme-hooks-compat/theme-colors'
import type { ColorValue } from './props'
import type { SporeColorToken } from './tokens'

const SPORE_COLOR_NAME_SET: ReadonlySet<string> = new Set(THEME_COLOR_NAMES)

/**
 * Whether a string is a `$`-prefixed spore color token (`$neutral1`,
 * `$pinkVibrant`, …). Same contract as the legacy `getIsValidSporeColor`
 * (`ui/src/theme/tokens.ts`): un-prefixed names, raw CSS colors, and unknown
 * `$` tokens are all rejected.
 */
export function getIsValidSporeColor(value: string): boolean {
  return value[0] === '$' && SPORE_COLOR_NAME_SET.has(value.slice(1))
}

/** The legacy input family: a color value, or the falsy values legacy accepted. */
type MaybeColorValue = ColorValue | undefined | null

const getIsTokenFormat = (value: string): boolean => {
  return value[0] === '$'
}

/**
 * The legacy rough check, ported faithfully: `$`-prefixed token strings are
 * accepted as-is (the render-side compat token resolution is the real gate),
 * and anything else must look like a CSS color — hex, a color function, or a
 * CSS variable reference.
 */
const validateColorValue = (value: MaybeColorValue): { isValid: boolean; error?: Error } => {
  if (typeof value === 'string' && !getIsTokenFormat(value)) {
    if (
      value[0] !== '#' &&
      !value.startsWith('rgb(') &&
      !value.startsWith('rgba(') &&
      !value.startsWith('hsl(') &&
      !value.startsWith('hsla(') &&
      !value.startsWith('var(')
    ) {
      return {
        isValid: false,
        error: new Error(
          `Invalid color value: ${value} this helper just does a rough check so if this error is wrong you can update this check!`,
        ),
      }
    }
  }

  return {
    isValid: true,
    error: undefined,
  }
}

/**
 * Passes a runtime color value through to a color prop, throwing outside
 * production when the value cannot be a color (the legacy `validColor`
 * contract). Falsy values return `undefined`, exactly like legacy.
 *
 * The return is token-TYPED with the value passed through unchanged — the
 * legacy contract's own cast, kept so results stay assignable to legacy AND
 * compat color props while a file's other imports are mid-conversion.
 */
export const validColor = (value: MaybeColorValue): SporeColorToken | undefined => {
  if (!isProdEnv()) {
    const { isValid, error } = validateColorValue(value)

    if (!isValid && error) {
      throw error
    }
  }

  if (!value) {
    return undefined
  }

  return value as SporeColorToken
}
