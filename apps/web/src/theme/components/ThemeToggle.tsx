import { atom, useAtom } from 'jotai'
import { atomWithStorage, useAtomValue, useUpdateAtom } from 'jotai/utils'
import ms from 'ms'
import { useCallback, useEffect, useMemo } from 'react'
import { Moon, Sun } from 'react-feather'
import { Flex, SegmentedControl, Text, styled, useSporeColors } from 'ui/src'
import { Moon as MoonFilled } from 'ui/src/components/icons/Moon'
import { Sun as SunFilled } from 'ui/src/components/icons/Sun'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { addMediaQueryListener, removeMediaQueryListener } from 'utils/matchMedia'

const THEME_UPDATE_DELAY = ms(`0.1s`)
const DARKMODE_MEDIA_QUERY = window.matchMedia('(prefers-color-scheme: dark)')

export enum ThemeMode {
  LIGHT = 'Light',
  DARK = 'Dark',
  AUTO = 'Auto',
}

const OptionPill = styled(Flex, {
  py: '$padding6',
  px: '$padding10',
  row: true,
  justifyContent: 'center',
  alignItems: 'center',
})

const CompactOptionPill = styled(Flex, {
  px: '$padding8',
  height: '$spacing28',
  justifyContent: 'center',
  alignItems: 'center',
})

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

export function ThemeSelector({ disabled, compact = false }: { disabled?: boolean; compact?: boolean }) {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const [mode, setMode] = useAtom(themeModeAtom)
  const switchMode = useCallback(
    (mode: string | number) => {
      // Switch feels less jittery with short delay
      !disabled && setTimeout(() => setMode(mode as ThemeMode), THEME_UPDATE_DELAY)
    },
    [disabled, setMode],
  )

  const compactOptions = [
    {
      value: ThemeMode.AUTO,
      display: (
        <CompactOptionPill data-testid="theme-auto">
          <Text variant="buttonLabel3">{t('settings.setting.appearance.option.auto')}</Text>
        </CompactOptionPill>
      ),
    },
    {
      value: ThemeMode.LIGHT,
      display: (
        <CompactOptionPill data-testid="theme-light">
          <SunFilled size="$icon.20" color={colors.neutral1.get()} />
        </CompactOptionPill>
      ),
    },
    {
      value: ThemeMode.DARK,
      display: (
        <CompactOptionPill data-testid="theme-dark">
          <MoonFilled size="$icon.20" color={colors.neutral1.get()} />
        </CompactOptionPill>
      ),
    },
  ]

  const defaultOptions = [
    {
      value: ThemeMode.AUTO,
      display: (
        <OptionPill data-testid="theme-auto">
          <Text variant="buttonLabel3">{t('settings.setting.appearance.option.auto')}</Text>
        </OptionPill>
      ),
    },
    {
      value: ThemeMode.LIGHT,
      display: (
        <OptionPill data-testid="theme-light">
          <Sun size="20" color={colors.neutral1.val} />
        </OptionPill>
      ),
    },
    {
      value: ThemeMode.DARK,
      display: (
        <OptionPill data-testid="theme-dark">
          <Moon size="20" color={colors.neutral1.val} />
        </OptionPill>
      ),
    },
  ]

  return (
    <Flex width="fit">
      <SegmentedControl
        key={mode} // force re-render when mode changes to avoid visual glitch
        options={compact ? compactOptions : defaultOptions}
        selectedOption={mode}
        onSelectOption={switchMode}
        size="large"
      />
    </Flex>
  )
}

export default function ThemeToggle({ disabled }: { disabled?: boolean }) {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex row width="40%">
        <Text variant="body3" color="$neutral1">
          <Trans i18nKey="themeToggle.theme" />
        </Text>
      </Flex>
      <ThemeSelector disabled={disabled} />
    </Flex>
  )
}
