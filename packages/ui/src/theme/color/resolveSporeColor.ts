import { isProdEnv } from '@universe/environment'
import { type UseSporeColorsReturn } from '@universe/mycelium/theme-hooks-compat'
import { logger } from 'utilities/src/logger/logger'

// Cached lazily on first resolve (not at module load, when env vars may not be
// hydrated yet): the env lookup isn't cheap and this runs per themed render.
// Non-prod rather than dev-only so staging QA surfaces bad tokens too.
let warnOnUnknownToken: boolean | undefined

/**
 * Resolves a color prop the way Tamagui resolved style colors: a `$`-prefixed
 * spore token maps through the provided theme; anything else (already-resolved
 * `.val` colors, raw CSS colors) passes through verbatim.
 *
 * An unknown `$`-token also passes through verbatim (matching Tamagui's
 * lenient handling) and logs a non-prod warning.
 */
export function resolveSporeColor(colors: UseSporeColorsReturn, value: string): string {
  if (value.startsWith('$')) {
    const token = value.slice(1)
    if (token in colors) {
      return colors[token as keyof UseSporeColorsReturn].val
    }
    warnOnUnknownToken ??= !isProdEnv()
    if (warnOnUnknownToken) {
      logger.warn('color/resolveSporeColor', 'resolveSporeColor', `Unknown spore color token: ${value}`)
    }
  }
  return value
}
