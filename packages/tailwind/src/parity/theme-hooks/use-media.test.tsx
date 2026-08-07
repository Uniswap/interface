// @vitest-environment jsdom
/**
 * `useMedia` parity (INFRA-2952), web leg: both hook versions render under the
 * same evaluating `matchMedia` environment and must report identical
 * breakpoint booleans across viewports, under both themes.
 *
 * Tamagui captures `globalThis.matchMedia` at module-load time, so the
 * evaluator is installed first and everything Tamagui-flavored arrives via
 * dynamic import below — do not add static imports of `ui/src`,
 * `./render-hook`, or the compat hook to this file.
 */
import { act } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ThemeName } from '../core/theme'
import { installMatchMediaEvaluator, setViewport } from './match-media-env'

installMatchMediaEvaluator()

const { mountCompatHook, mountTamaguiHook } = await import('./render-hook')
const { useMedia } = await import('ui/src')
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
const { useMedia: useMediaCompat } = await import('../../../../mycelium/src/theme-hooks-compat/useMedia')

const THEMES: readonly ThemeName[] = ['light', 'dark']

/**
 * Breakpoint boundaries mirror ui/src/theme/breakpoints.ts (widths 360…1536,
 * heights 736…960); every query is a max-*, so boundary values are inclusive.
 * Scenarios cross each width breakpoint and each height breakpoint at least
 * once, including exact-boundary viewports.
 */
const SCENARIOS: ReadonlyArray<[number, number]> = [
  [320, 600],
  [360, 736],
  [380, 700],
  [450, 737],
  [500, 750],
  [640, 800],
  [768, 900],
  [1024, 960],
  [1280, 961],
  [1536, 736],
  [1920, 1200],
]

function snapshot(media: unknown): Record<string, boolean> {
  const source = media as Record<string, boolean>
  const out: Record<string, boolean> = {}
  for (const key of Object.keys(source)) {
    out[key] = source[key] === true
  }
  return out
}

describe.each(THEMES)('useMedia parity — %s', (theme) => {
  it('reports identical breakpoint booleans across viewports', () => {
    // Materialize the booleans during render (spread-in-render is how
    // components consume the hook, and it registers every key with Tamagui's
    // touched-key re-render tracking).
    const tamagui = mountTamaguiHook(() => snapshot(useMedia()), theme)
    const compat = mountCompatHook(() => snapshot(useMediaCompat()), theme)
    for (const [width, height] of SCENARIOS) {
      act(() => {
        setViewport(width, height)
      })
      const expected = tamagui.current()
      const actual = compat.current()
      expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort())
      expect(actual, `viewport ${width}x${height}`).toEqual(expected)
    }
    tamagui.unmount()
    compat.unmount()
  })

  it('actually evaluates queries — extremes are all-true and all-false, not stuck', () => {
    const tamagui = mountTamaguiHook(() => snapshot(useMedia()), theme)
    act(() => {
      setViewport(320, 600)
    })
    const allTrue = tamagui.current()
    expect(Object.keys(allTrue).length).toBeGreaterThanOrEqual(11)
    expect(new Set(Object.values(allTrue))).toEqual(new Set([true]))
    act(() => {
      setViewport(1920, 1200)
    })
    const allFalse = tamagui.current()
    expect(new Set(Object.values(allFalse))).toEqual(new Set([false]))
    tamagui.unmount()
  })
})
