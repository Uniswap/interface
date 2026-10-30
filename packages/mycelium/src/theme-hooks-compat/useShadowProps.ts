import { isWebApp } from '@universe/environment'
import { useMemo } from 'react'
import type { FlexCompatProps } from '../flex-compat/props'
import { opacify } from './opacify'
import { DARK_THEME_COLORS } from './theme-colors.generated'
import { useIsDarkMode } from './useIsDarkMode'

/** Compat equivalent of the legacy `Pick<FlexProps, …>` shadow surface. */
// `$platform-web` narrowed to what the hooks return, so the result also spreads onto CSSProperties-typed slots.
export type ShadowProps = Pick<FlexCompatProps, 'shadowColor' | 'shadowOffset' | 'shadowRadius'> & {
  '$platform-web'?: { boxShadow?: string }
}

/*
 * Compat twins of `ui/src/theme/shadows.ts` (same names, keys, and values;
 * pinned by packages/tailwind/src/parity/theme-hooks/shadow-props.test.tsx).
 *
 * CAVEAT — deliberately a single file branching on RUNTIME `isWebApp`, not a
 * `.web`/`.native` platform split: the extension resolves `.web` files but
 * `isWebApp` is false there (appId check), so it must get the RN-shadow branch
 * where `$platform-web` is undefined. A platform split would hand it the
 * `boxShadow` branch instead. Spread the whole result; don't cherry-pick
 * `$platform-web`.
 */

// TODO WALL-3699 replace with spore shadow support
export function useShadowPropsShort(): ShadowProps {
  const isDarkMode = useIsDarkMode()

  return useMemo(
    () =>
      isWebApp
        ? {
            '$platform-web': {
              boxShadow: isDarkMode
                ? `0px 1px 3px 0px ${opacify(12, DARK_THEME_COLORS.black)}, 0px 1px 2px 0px ${opacify(24, DARK_THEME_COLORS.black)}`
                : `0px 1px 6px 2px ${opacify(3, DARK_THEME_COLORS.black)}, 0px 1px 2px 0px ${opacify(2, DARK_THEME_COLORS.black)}`,
            },
          }
        : {
            // The legacy literals separate with U+00A0 (no-break space), not
            // ASCII space — reproduced via escapes to keep parity byte-exact.
            shadowColor: isDarkMode ? 'rgba(0,\u00A00,\u00A00,\u00A00.24)' : 'rgba(0,\u00A00,\u00A00,\u00A00.02)',
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 6,
          },
    [isDarkMode],
  )
}

export function useShadowPropsMedium(): ShadowProps {
  const isDarkMode = useIsDarkMode()

  // CAVEAT: BOTH themes deliberately source the DARK palette's surface1 (legacy `colorsDark.surface1`) — not a copy/paste slip.
  return useMemo(
    () =>
      isWebApp
        ? {
            '$platform-web': {
              boxShadow: isDarkMode
                ? `0px 10px 15px -3px ${opacify(54, DARK_THEME_COLORS.surface1)}, 0px 4px 6px -2px ${opacify(40, DARK_THEME_COLORS.surface1)}`
                : `0px 6px 12px -3px ${opacify(4, DARK_THEME_COLORS.surface1)}, 0px 2px 5px -2px ${opacify(3, DARK_THEME_COLORS.surface1)}`,
            },
          }
        : {
            shadowColor: opacify(4, DARK_THEME_COLORS.surface1),
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 12,
          },
    [isDarkMode],
  )
}
