import { PropsWithChildren, useEffect, useMemo } from 'react'
import { breakpoints } from 'ui/src/theme'
import { useSelectedColorScheme } from 'uniswap/src/features/appearance/hooks'
import { createGlobalStyle, ThemeProvider as StyledComponentsThemeProvider } from '~/lib/deprecated-styled'
import { darkTheme, lightTheme, ThemeColors } from '~/theme/colors'
import { getAccent2, getNeutralContrast } from '~/theme/utils'

export const MAX_CONTENT_WIDTH_PX = 1200

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

function getSettings(darkMode: boolean) {
  return {
    darkMode,
    fonts,

    // shadows
    shadow1: '#000',

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

export function getTheme(darkMode: boolean, overriddenColors?: Partial<ThemeColors>) {
  const colors = darkMode ? darkTheme : lightTheme
  const colorsWithOverrides = applyOverriddenColors(colors, overriddenColors)

  return { ...colorsWithOverrides, ...getSettings(darkMode) }
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
  const darkMode = useSelectedColorScheme() === 'dark'
  // oxlint-disable-next-line react/exhaustive-deps -- Only update when darkMode or overriddenColors' entries change
  const themeObject = useMemo(() => getTheme(darkMode, overriddenColors), [darkMode, JSON.stringify(overriddenColors)])

  // Mirror the active color scheme onto the <html> `.dark` class so Tailwind v4
  // `dark:` variants and @universe/tailwind dark tokens activate in sync with
  // the Tamagui/styled-components theme (which are React-context-only).
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

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
