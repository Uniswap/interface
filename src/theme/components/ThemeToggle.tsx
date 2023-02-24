import { t, Trans } from '@lingui/macro'
import { MouseoverTooltip } from 'components/Tooltip'
import { atom, useAtom } from 'jotai'
import { atomWithStorage, useAtomValue, useUpdateAtom } from 'jotai/utils'
import ms from 'ms.macro'
import { useCallback, useEffect, useMemo } from 'react'
import { Moon, Sun } from 'react-feather'

import { Segment, SegmentedControl } from './SegmentedControl'

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
export const themeModeAtom = atomWithStorage<ThemeMode>('interface_color_theme', ThemeMode.AUTO)

export function SystemThemeUpdater() {
  const setSystemTheme = useUpdateAtom(systemThemeAtom)

  useEffect(() => {
    DARKMODE_MEDIA_QUERY.addEventListener('change', (event) => {
      setSystemTheme(event.matches ? ThemeMode.DARK : ThemeMode.LIGHT)
    })
  }, [setSystemTheme])

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
    <SegmentedControl selected={mode} onSelect={switchMode}>
      <Segment value={ThemeMode.AUTO} testId="theme-auto">
        <Trans>Auto</Trans>
      </Segment>
      <Segment value={ThemeMode.LIGHT} Icon={Sun} testId="theme-lightmode">
        <Trans>Light</Trans>
      </Segment>
      <Segment value={ThemeMode.DARK} Icon={Moon} testId="theme-darkmode">
        <MouseoverTooltip text={t`The theme is defaulted to light mode on this page.`} disableHover={!disabled}>
          <Trans>Dark</Trans>
        </MouseoverTooltip>
      </Segment>
    </SegmentedControl>
  )
}
