import { Trans } from '@lingui/macro'
import Row from 'components/Row'
import { atom, useAtom } from 'jotai'
import { atomWithStorage, useAtomValue, useUpdateAtom } from 'jotai/utils'
import ms from 'ms.macro'
import { useCallback, useEffect, useMemo } from 'react'
import { Moon, Sun } from 'react-feather'
import { addMediaQueryListener, removeMediaQueryListener } from 'utils/matchMedia'

import { Segment, SegmentedControl } from './SegmentedControl'
import { ThemedText } from './text'

const THEME_UPDATE_DELAY = ms`0.1s`
const DARKMODE_MEDIA_QUERY = window.matchMedia('(prefers-color-scheme: dark)')

export enum ThemeMode {
  LIGHT,
  DARK,
  AUTO,
}

// Tracks the device theme
const systemThemeAtom = atom<ThemeMode.LIGHT | ThemeMode.DARK>(
  DARKMODE_MEDIA_QUERY.matches ? ThemeMode.DARK : ThemeMode.LIGHT
)

// Tracks the user's selected theme mode
const themeModeAtom = atomWithStorage<ThemeMode>('interface_color_theme', ThemeMode.AUTO)

export function SystemThemeUpdater() {
  const setSystemTheme = useUpdateAtom(systemThemeAtom)

  const listener = useCallback(
    (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? ThemeMode.DARK : ThemeMode.LIGHT)
    },
    [setSystemTheme]
  )

  useEffect(() => {
    addMediaQueryListener(DARKMODE_MEDIA_QUERY, listener)
    return () => removeMediaQueryListener(DARKMODE_MEDIA_QUERY, listener)
  }, [setSystemTheme, listener])

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

export default function ThemeToggle({ disabled }: { disabled?: boolean }) {
  const [mode, setMode] = useAtom(themeModeAtom)
  const switchMode = useCallback(
    (mode: ThemeMode) => {
      // Switch feels less jittery with short delay
      !disabled && setTimeout(() => setMode(mode), THEME_UPDATE_DELAY)
    },
    [disabled, setMode]
  )

  return (
    <Row align="center">
      <Row width="40%">
        <ThemedText.SubHeaderSmall color="primary">
          <Trans>Theme</Trans>
        </ThemedText.SubHeaderSmall>
      </Row>
      <Row flexGrow={1} justify="flex-end" width="60%">
        <SegmentedControl selected={mode} onSelect={switchMode}>
          <Segment value={ThemeMode.AUTO} testId="theme-auto">
            <Trans>Auto</Trans>
          </Segment>
          <Segment value={ThemeMode.LIGHT} Icon={Sun} testId="theme-lightmode" />
          <Segment value={ThemeMode.DARK} Icon={Moon} testId="theme-darkmode" />
        </SegmentedControl>
      </Row>
    </Row>
  )
}
