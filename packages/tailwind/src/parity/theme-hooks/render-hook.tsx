/**
 * Hook-rendering side of the theme-hooks parity suite: mounts a hook under the
 * real Tamagui provider (the `packages/ui` reference) or bare (the Mycelium
 * compat side, themed by the `light`/`dark` class on `<html>`, the
 * `@universe/tailwind` variables.css convention) and exposes the latest value
 * the hook rendered.
 */
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { createTamagui, TamaguiProvider } from 'ui/src'
// Deep import is deliberate (Danger warns, non-blocking): `configWithoutAnimations`
// has no `ui/src` barrel export.
import { configWithoutAnimations } from 'ui/src/theme/config'
import type { ThemeName } from '../core/theme'

const config = createTamagui(configWithoutAnimations)

export interface HookHarness<T> {
  /** The value from the hook's most recent render. */
  current: () => T
  unmount: () => void
}

interface ProbeProps<T> {
  useHook: () => T
  capture: (value: T) => void
}

function Probe<T>({ useHook, capture }: ProbeProps<T>): null {
  capture(useHook())
  return null
}

/** Set the compat theme source: the `light`/`dark` class on `<html>`. */
export function setRootTheme(theme: ThemeName): void {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(theme)
}

/** Mount a `packages/ui` hook under the real Tamagui provider. */
export function mountTamaguiHook<T>(useHook: () => T, theme: ThemeName): HookHarness<T> {
  let latest: T | undefined
  const result = render(
    createElement(
      TamaguiProvider,
      { config, defaultTheme: theme },
      createElement(Probe<T>, {
        useHook,
        capture: (value: T) => {
          latest = value
        },
      }),
    ),
  )
  return { current: () => latest as T, unmount: result.unmount }
}

/** Mount a Mycelium compat hook (no provider; themed by the root class). */
export function mountCompatHook<T>(useHook: () => T, theme: ThemeName): HookHarness<T> {
  setRootTheme(theme)
  let latest: T | undefined
  const result = render(
    createElement(Probe<T>, {
      useHook,
      capture: (value: T) => {
        latest = value
      },
    }),
  )
  return { current: () => latest as T, unmount: result.unmount }
}
