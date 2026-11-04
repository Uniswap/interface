/**
 * Minimal react-native / gesture-handler / reanimated stand-ins for the
 * button-compat vitest suites (jsdom env — no Metro). Host components render
 * as plain host elements so react-test-renderer can walk them, and the module
 * -scope side effects the native leg performs (`Platform.select`,
 * `UIManager.setLayoutAnimationEnabledExperimental`,
 * `Animated.createAnimatedComponent`) all resolve.
 *
 * Test files alias the real modules via
 * `vi.mock('react-native', () => import('./testing/native-mocks'))` etc.
 * It only supports export-parity and structural assertions, not native
 * rendering fidelity.
 */
import { createElement, forwardRef, type ComponentType, type ReactNode } from 'react'

type HostProps = Record<string, unknown> & { children?: ReactNode }

export function host(type: string): ComponentType<HostProps> {
  const Host = forwardRef<unknown, HostProps>((props, ref) => createElement(type, { ...props, ref }))
  Host.displayName = type
  return Host as unknown as ComponentType<HostProps>
}

/* --------------------------------- react-native -------------------------------- */

export const View = host('View')
export const Text = host('Text')
export const Pressable = host('Pressable')

export const Platform = {
  OS: 'ios' as const,
  select: <T,>(spec: { android?: T; ios?: T; default?: T }): T | undefined => spec.ios ?? spec.default,
}

export const I18nManager = { isRTL: false, allowRTL: (): void => {}, forceRTL: (): void => {} }

/** Records every configureNext call so tests can assert the loading LayoutAnimation. */
export const layoutAnimationCalls: unknown[] = []

export const LayoutAnimation = {
  Presets: {
    easeInEaseOut: { duration: 300, create: { type: 'easeInEaseOut' }, update: { type: 'easeInEaseOut' } },
    linear: { duration: 200 },
    spring: { duration: 700 },
  },
  configureNext: (config: unknown): void => {
    layoutAnimationCalls.push(config)
  },
}

export const UIManager: { setLayoutAnimationEnabledExperimental?: (enabled: boolean) => void } = {
  setLayoutAnimationEnabledExperimental: (): void => {},
}

export const StyleSheet = {
  create: <T,>(styles: T): T => styles,
  flatten: (style: unknown): unknown => style,
}
