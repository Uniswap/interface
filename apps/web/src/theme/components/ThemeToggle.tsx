import Row from 'components/Row'
import PillMultiToggle from 'components/Toggle/PillMultiToggle'
import { Trans } from 'i18n'
import { atom, useAtom } from 'jotai'
import { atomWithStorage, useAtomValue, useUpdateAtom } from 'jotai/utils'
import styled, { useTheme } from 'lib/styled-components'
import ms from 'ms'
import { useCallback, useEffect, useMemo } from 'react'
import { Moon, Sun } from 'react-feather'
import { ThemedText } from 'theme/components/text'
import { Moon as MoonFilled, Sun as SunFilled } from 'ui/src/components/icons'
import { addMediaQueryListener, removeMediaQueryListener } from 'utils/matchMedia'

const THEME_UPDATE_DELAY = ms(`0.1s`)
const DARKMODE_MEDIA_QUERY = window.matchMedia('(prefers-color-scheme: dark)')

export enum ThemeMode {
  LIGHT = 0,
  DARK,
  AUTO,
}

const OptionPill = styled.div`
  padding: 6px 10px;
  display: flex;
  justify-content: center;
  align-items: center;
`
const CompactOptionPill = styled.div`
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 8px;
`

// Tracks the device theme
const systemThemeAtom = atom<ThemeMode.LIGHT | ThemeMode.DARK>(
  DARKMODE_MEDIA_QUERY.matches ? ThemeMode.DARK : ThemeMode.LIGHT,
)

// Tracks the user's selected theme mode
const themeModeAtom = atomWithStorage<ThemeMode>('interface_color_theme', ThemeMode.AUTO)

export function SystemThemeUpdater() {
  const setSystemTheme = useUpdateAtom(systemThemeAtom)

  const listener = useCallback(
    (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? ThemeMode.DARK : ThemeMode.LIGHT)
    },
    [setSystemTheme],
  )

  useEffect(() => {
    addMediaQueryListener(DARKMODE_MEDIA_QUERY, listener)
    return () => removeMediaQueryListener(DARKMODE_MEDIA_QUERY, listener)
  }, [setSystemTheme, listener])

  return null
}

export function ThemeColorMetaUpdater() {
  const isDark = useIsDarkMode()

  useEffect(() => {
    const meta = document.querySelector('meta[name=theme-color]')
    if (!meta) {
      return
    }

    if (isDark) {
      // this color comes from #background-radial-gradient
      meta.setAttribute('content', 'rgb(19, 19, 19)')
    } else {
      meta.setAttribute('content', '#fff')
    }
  }, [isDark])

  return null
}

export function useIsDarkMode(): boolean {
  const mode = useAtomValue(themeModeAtom)
  const systemTheme = useAtomValue(systemThemeAtom)

  return (mode === ThemeMode.AUTO ? systemTheme : mode) === ThemeMode.DARK
}

export function useDarkModeManager(): [boolean, (mode: ThemeMode) => void] {
  const isDarkMode = useIsDarkMode()
  const setMode = useUpdateAtom(themeModeAtom)

  return useMemo(() => {
    return [isDarkMode, setMode]
  }, [isDarkMode, setMode])
}

const ThemePillMultiToggleContainer = styled.div`
  width: fit;
`

const compactOptions = [
  {
    value: ThemeMode.AUTO,
    display: (
      <CompactOptionPill data-testid="theme-auto">
        <Trans>Auto</Trans>
      </CompactOptionPill>
    ),
  },
  {
    value: ThemeMode.LIGHT,
    display: (
      <CompactOptionPill data-testid="theme-light">
        <SunFilled size="$icon.20" />
      </CompactOptionPill>
    ),
  },
  {
    value: ThemeMode.DARK,
    display: (
      <CompactOptionPill data-testid="theme-dark">
        <MoonFilled size="$icon.20" />
      </CompactOptionPill>
    ),
  },
]

const defaultOptions = [
  {
    value: ThemeMode.AUTO,
    display: (
      <OptionPill data-testid="theme-auto">
        <Trans>Auto</Trans>
      </OptionPill>
    ),
  },
  {
    value: ThemeMode.LIGHT,
    display: (
      <OptionPill data-testid="theme-light">
        <Sun size="20" />
      </OptionPill>
    ),
  },
  {
    value: ThemeMode.DARK,
    display: (
      <OptionPill data-testid="theme-dark">
        <Moon size="20" />
      </OptionPill>
    ),
  },
]

export function ThemeSelector({ disabled, compact = false }: { disabled?: boolean; compact?: boolean }) {
  const theme = useTheme()
  const [mode, setMode] = useAtom(themeModeAtom)
  const switchMode = useCallback(
    (mode: string | number) => {
      // Switch feels less jittery with short delay
      !disabled && setTimeout(() => setMode(mode as ThemeMode), THEME_UPDATE_DELAY)
    },
    [disabled, setMode],
  )

  return (
    <ThemePillMultiToggleContainer>
      <PillMultiToggle
        options={compact ? compactOptions : defaultOptions}
        currentSelected={mode}
        onSelectOption={switchMode}
        activePillColor={theme.accent2}
        activeTextColor={theme.accent1}
      />
    </ThemePillMultiToggleContainer>
  )
}

export default function ThemeToggle({ disabled }: { disabled?: boolean }) {
  return (
    <Row align="center" justify="space-between">
      <Row width="40%">
        <ThemedText.SubHeaderSmall color="primary">
          <Trans i18nKey="themeToggle.theme" />
        </ThemedText.SubHeaderSmall>
      </Row>
      <ThemeSelector disabled={disabled} />
    </Row>
  )
}
