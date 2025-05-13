import { ThemeProvider as StyledComponentsThemeProvider, createGlobalStyle, css } from 'lib/styled-components'
import { PropsWithChildren, useMemo } from 'react'
import { ThemeColors, darkTheme, lightTheme } from 'theme/colors'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { darkDeprecatedTheme, lightDeprecatedTheme } from 'theme/deprecatedColors'
import { getAccent2, getNeutralContrast } from 'theme/utils'
import { breakpoints } from 'ui/src/theme'

const MEDIA_WIDTHS = {
  deprecated_upToExtraSmall: 500,
  deprecated_upToSmall: 720,
  deprecated_upToMedium: 960,
  deprecated_upToLarge: 1280,
}

const MAX_CONTENT_WIDTH_PX = 1200

const deprecated_mediaWidthTemplates: { [width in keyof typeof MEDIA_WIDTHS]: typeof css } = Object.keys(
  MEDIA_WIDTHS,
).reduce((acc, size) => {
  acc[size] = (a: any, b: any, c: any) => css`
    @media (max-width: ${(MEDIA_WIDTHS as any)[size]}px) {
      ${css(a, b, c)}
    }
  `
  return acc
}, {} as any)

// deprecated - please use the ones in styles.ts file
const transitions = {
  duration: {
    slow: '500ms',
    medium: '250ms',
    fast: '125ms',
  },
  timing: {
    ease: 'ease',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
  },
}

const opacities = {
  hover: 0.6,
  click: 0.4,
  disabled: 0.5,
  enabled: 1,
}

const blurs = {
  light: 'blur(12px)',
}

const fonts = {
  code: 'courier, courier new, serif',
}

const gapValues = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '24px',
  xl: '32px',
}
export type Gap = keyof typeof gapValues

function getSettings(darkMode: boolean) {
  return {
    darkMode,
    grids: gapValues,
    fonts,

    // shadows
    shadow1: '#000',

    // media queries
    deprecated_mediaWidth: deprecated_mediaWidthTemplates,

    mobileBottomBarHeight: 48,
    maxWidth: MAX_CONTENT_WIDTH_PX,

    // deprecated - please use hardcoded exported values instead of
    // adding to the theme object
    breakpoint: breakpoints,
    transition: transitions,
    blur: blurs,
    opacity: opacities,
    text: {
      heading: {
        fontFamily: 'inherit',
        fontWeight: 485,
      },
    },
  }
}

// eslint-disable-next-line import/no-unused-modules -- used in styled.d.ts
export function getTheme(darkMode: boolean, overriddenColors?: Partial<ThemeColors>) {
  const [colors, deprecatedColors] = darkMode ? [darkTheme, darkDeprecatedTheme] : [lightTheme, lightDeprecatedTheme]
  const colorsWithOverrides = applyOverriddenColors(colors, overriddenColors)

  return { ...colorsWithOverrides, ...deprecatedColors, ...getSettings(darkMode) }
}

function applyOverriddenColors(defaultColors: ThemeColors, overriddenColors?: Partial<ThemeColors>) {
  if (!overriddenColors) {
    return defaultColors
  }

  // Remove any undefined values from the object such that no theme values are overridden by undefined
  const definedOverriddenColors = Object.keys(overriddenColors).reduce((acc, curr) => {
    const key = curr as keyof ThemeColors
    if (overriddenColors[key] !== undefined) {
      acc[key] = overriddenColors[key]
    }
    return acc
  }, {} as Partial<ThemeColors>)

  const mergedColors = { ...defaultColors, ...definedOverriddenColors }

  // Since accent2 is derived from accent1 and surface1, it needs to be recalculated if either are overridden
  if ((overriddenColors.accent1 || overriddenColors.surface1) && !overriddenColors.accent2) {
    mergedColors.accent2 = getAccent2(mergedColors.accent1, mergedColors.surface1)
  }
  // neutralContrast should be updated to contrast against accent1 if accent1 is overridden
  if (overriddenColors.accent1 && !overriddenColors.neutralContrast) {
    mergedColors.neutralContrast = getNeutralContrast(mergedColors.accent1)
  }

  return mergedColors
}

export function ThemeProvider({ children, ...overriddenColors }: PropsWithChildren<Partial<ThemeColors>>) {
  const darkMode = useIsDarkMode()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only update when darkMode or overriddenColors' entries change
  const themeObject = useMemo(() => getTheme(darkMode, overriddenColors), [darkMode, JSON.stringify(overriddenColors)])

  // TODO(WEB-7508): set theme for wallet connect modal

  return <StyledComponentsThemeProvider theme={themeObject}>{children}</StyledComponentsThemeProvider>
}

export const ThemedGlobalStyle = createGlobalStyle`
  html {
    color: ${({ theme }) => theme.neutral1};
    background-color: ${({ theme }) => theme.background} !important;
  }

 summary::-webkit-details-marker {
    display:none;
  }

  a {
    color: ${({ theme }) => theme.accent1}; 
  }
`
