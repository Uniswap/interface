// @vitest-environment jsdom
/**
 * Theme-hooks compat parity (INFRA-2952), web legs: renders the `packages/ui`
 * reference hooks and their Mycelium compat twins under both themes and
 * deep-compares the returned values. `useMedia` has its own file
 * (`use-media.test.tsx`) — it must control `matchMedia` before Tamagui loads.
 * Native-leg parity is written but skipped until the native harness lands
 * (INFRA-2353); see `native-parity.test.ts`.
 */
import { act } from '@testing-library/react'
import { useIsDarkMode, useSporeColors } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { opacify, opacifyRaw } from 'ui/src/theme'
import { describe, expect, it } from 'vitest'
// nx-ignore-next-line
import {
  opacify as opacifyCompat,
  opacifyRaw as opacifyRawCompat,
} from '../../../../mycelium/src/theme-hooks-compat/opacify'
// Relative cross-package imports: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import { useDeviceDimensions as useDeviceDimensionsCompat } from '../../../../mycelium/src/theme-hooks-compat/useDeviceDimensions'
// nx-ignore-next-line
import { useIsDarkMode as useIsDarkModeCompat } from '../../../../mycelium/src/theme-hooks-compat/useIsDarkMode'
// nx-ignore-next-line
import { useSporeColors as useSporeColorsCompat } from '../../../../mycelium/src/theme-hooks-compat/useSporeColors'
import type { ThemeName } from '../core/theme'
import { setViewport } from './match-media-env'
import { mountCompatHook, mountTamaguiHook } from './render-hook'

const THEMES: readonly ThemeName[] = ['light', 'dark']

/** The `UseSporeColorsReturn` per-token contract both hook versions expose. */
interface SporeColorLike {
  val: unknown
  variable: unknown
  get: () => unknown
}

interface ProjectedColor {
  val: unknown
  variable: unknown
  resolved: unknown
}

/** Project a colors map onto the declared contract (val, variable, get()). */
function projectColors(colors: unknown): Record<string, ProjectedColor> {
  const source = colors as Record<string, SporeColorLike>
  const out: Record<string, ProjectedColor> = {}
  for (const key of Object.keys(source)) {
    const entry = source[key] as SporeColorLike
    out[key] = { val: entry.val, variable: entry.variable, resolved: entry.get() }
  }
  return out
}

describe.each(THEMES)('useSporeColors parity — %s', (theme) => {
  it('returns the identical token → color map (val, variable, get) as ui/src', () => {
    const tamagui = mountTamaguiHook(() => useSporeColors(), theme)
    const compat = mountCompatHook(() => useSporeColorsCompat(), theme)
    const expected = projectColors(tamagui.current())
    const actual = projectColors(compat.current())
    // Guard against a trivially-empty comparison: the Spore theme is large
    // (every token is exposed both bare and `$`-prefixed).
    expect(Object.keys(expected).length).toBeGreaterThan(250)
    expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort())
    expect(actual).toEqual(expected)
    tamagui.unmount()
    compat.unmount()
  })

  it('exposes each token under both its bare and `$`-prefixed key', () => {
    const compat = mountCompatHook(() => useSporeColorsCompat(), theme)
    const colors = compat.current() as unknown as Record<string, SporeColorLike>
    expect(colors.surface1).toBeDefined()
    expect(colors.$surface1).toBeDefined()
    expect(colors.$surface1.val).toBe(colors.surface1.val)
    compat.unmount()
  })

  it('forcing the opposite theme via the name param flips val but keeps the CSS variable, like ui/src', () => {
    const forced: ThemeName = theme === 'light' ? 'dark' : 'light'
    const tamagui = mountTamaguiHook(() => useSporeColors(forced), theme)
    const compat = mountCompatHook(() => useSporeColorsCompat(forced), theme)
    expect(projectColors(compat.current())).toEqual(projectColors(tamagui.current()))
    tamagui.unmount()
    compat.unmount()
  })
})

it('useSporeColors: the two themes disagree on at least one token value (comparison is not degenerate)', () => {
  const light = mountTamaguiHook(() => useSporeColors(), 'light')
  const dark = mountTamaguiHook(() => useSporeColors(), 'dark')
  const lightColors = light.current() as unknown as Record<string, SporeColorLike>
  const darkColors = dark.current() as unknown as Record<string, SporeColorLike>
  expect(lightColors.surface1.val).not.toEqual(darkColors.surface1.val)
  light.unmount()
  dark.unmount()
})

describe.each(THEMES)('useIsDarkMode parity — %s', (theme) => {
  it('returns the same boolean as ui/src', () => {
    const tamagui = mountTamaguiHook(() => useIsDarkMode(), theme)
    const compat = mountCompatHook(() => useIsDarkModeCompat(), theme)
    expect(tamagui.current()).toBe(theme === 'dark')
    expect(compat.current()).toBe(tamagui.current())
    tamagui.unmount()
    compat.unmount()
  })
})

const VIEWPORTS: ReadonlyArray<[number, number]> = [
  [375, 667],
  [800, 736],
  [1440, 900],
]

describe.each(THEMES)('useDeviceDimensions parity — %s', (theme) => {
  it('reports the same { fullWidth, fullHeight } as ui/src, including across resizes', () => {
    const tamagui = mountTamaguiHook(() => useDeviceDimensions(), theme)
    const compat = mountCompatHook(() => useDeviceDimensionsCompat(), theme)
    for (const [width, height] of VIEWPORTS) {
      act(() => {
        setViewport(width, height)
      })
      expect(tamagui.current()).toEqual({ fullWidth: width, fullHeight: height })
      expect(compat.current()).toEqual(tamagui.current())
    }
    tamagui.unmount()
    compat.unmount()
  })
})

/** Hex (3/6/8 digit), rgb, error paths — the full branch surface of ui/src's opacify. */
const OPACIFY_CASES: ReadonlyArray<[number, string]> = [
  [0, '#FC72FF'],
  [8, '#FC72FF'],
  [10, '#131313'],
  [12.5, '#FC72FF'],
  [50, '#abc'],
  [60, '#FC72FF33'],
  [100, '#FFFFFF'],
  [40, 'rgb(255, 0, 0)'],
  [40, 'rgb(0,0,0)'],
  // Error paths: ui/src warns and returns the input unchanged.
  [50, 'rgba(0, 0, 0, 0.5)'],
  [50, 'red'],
  [50, '#12'],
  [50, '#GGGGGG'],
  [50, 'rgb()'],
  [101, '#FFFFFF'],
  [-1, '#FFFFFF'],
]

describe('opacify parity', () => {
  it.each(OPACIFY_CASES)('opacify(%s, %s) returns the identical output string', (opacity, color) => {
    expect(opacifyCompat(opacity, color)).toBe(opacify(opacity, color))
    expect(opacifyRawCompat(opacity, color)).toBe(opacifyRaw(opacity, color))
  })

  it('produces real output, not passthrough, on the happy path', () => {
    expect(opacifyCompat(8, '#FC72FF')).toBe('#FC72FF14')
    expect(opacifyRawCompat(40, 'rgb(255, 0, 0)')).toBe('rgba(255, 0, 0, 0.40)')
  })
})
