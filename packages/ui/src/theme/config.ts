// until the web app needs all of tamagui, avoid heavy imports there
// biome-ignore lint/style/noRestrictedImports: until the web app needs all of tamagui, avoid heavy imports there
import type { CreateTamaguiProps } from '@tamagui/core'
import { allFonts } from 'ui/src/theme/fonts'
import { media } from 'ui/src/theme/media'
import { shorthands } from 'ui/src/theme/shorthands'
import { themes } from 'ui/src/theme/themes'
import { tokens } from 'ui/src/theme/tokens'

/**
 * Exporting without animations here since we are diverging the drivers between apps
 */

export const configWithoutAnimations = {
  shorthands,
  fonts: allFonts,
  themes,
  tokens,
  media,
  settings: {
    shouldAddPrefersColorThemes: true,
    themeClassNameOnRoot: true,
    disableSSR: true,
    onlyAllowShorthands: true,
    allowedStyleValues: 'somewhat-strict-web',
    autocompleteSpecificTokens: 'except-special',
    fastSchemeChange: true,
  },
} satisfies CreateTamaguiProps

export type TamaguiGroupNames = 'item' | 'card'
