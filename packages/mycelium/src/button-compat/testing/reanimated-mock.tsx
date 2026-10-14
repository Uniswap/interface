/**
 * Minimal react-native-reanimated stand-in for the button-compat vitest
 * suites. `createAnimatedComponent` is a passthrough (so the RNGH Pressable
 * stays the rendered host, which the DOM-leak assertion depends on) and the
 * animation builders record their calls so tests can assert that press uses
 * the Spore `fast` spring and the spinner the hand-written 0.83 bezier.
 */
import { createElement, forwardRef, type ComponentType, type ReactNode } from 'react'

type HostProps = Record<string, unknown> & { children?: ReactNode }

function host(type: string): ComponentType<HostProps> {
  const Host = forwardRef<unknown, HostProps>((props, ref) => createElement(type, { ...props, ref }))
  Host.displayName = type
  return Host as unknown as ComponentType<HostProps>
}

export interface RecordedAnimation {
  kind: 'timing' | 'spring' | 'repeat' | 'delay'
  toValue?: unknown
  config?: unknown
  count?: number
}

export const recordedAnimations: RecordedAnimation[] = []

export function createAnimatedComponent<T>(component: T): T {
  return component
}

export function useSharedValue<T>(value: T): { value: T } {
  return { value }
}

export function useAnimatedStyle(factory: () => Record<string, unknown>): Record<string, unknown> {
  return factory()
}

export function withTiming<T>(toValue: T, config?: unknown): T {
  recordedAnimations.push({ kind: 'timing', toValue, config })
  return toValue
}

export function withSpring<T>(toValue: T, config?: unknown): T {
  recordedAnimations.push({ kind: 'spring', toValue, config })
  return toValue
}

export function withDelay<T>(delay: number, value: T): T {
  recordedAnimations.push({ kind: 'delay', toValue: value, count: delay })
  return value
}

export function withRepeat<T>(value: T, count?: number): T {
  recordedAnimations.push({ kind: 'repeat', toValue: value, count })
  return value
}

export function cancelAnimation(): void {}

export function runOnJS<T extends (...args: never[]) => unknown>(fn: T): T {
  return fn
}

/** Mirrors reanimated's `ReduceMotion` enum so worklet configs can read `.System`. */
export const ReduceMotion = {
  System: 'system',
  Always: 'always',
  Never: 'never',
} as const

export const Easing = {
  linear: (t: number): number => t,
  quad: (t: number): number => t,
  // oxlint-disable-next-line max-params -- mirrors reanimated's Easing.bezier(x1, y1, x2, y2)
  bezier(x1: number, y1: number, x2: number, y2: number): { __bezier: number[] } {
    return { __bezier: [x1, y1, x2, y2] }
  },
  inOut: (fn: (t: number) => number): ((t: number) => number) => fn,
  in: (fn: (t: number) => number): ((t: number) => number) => fn,
  out: (fn: (t: number) => number): ((t: number) => number) => fn,
}

const Animated = {
  View: host('AnimatedView'),
  Text: host('AnimatedText'),
  createAnimatedComponent,
}

export default Animated
