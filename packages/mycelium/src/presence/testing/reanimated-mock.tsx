/**
 * react-native-reanimated stand-in for the presence/pager native suites.
 * Unlike the button-compat mock, animation completion is controllable:
 * `withTiming`/`withSpring` callbacks queue in `__pendingAnimationCallbacks`
 * and fire on `__flushAnimationCallbacks()`, so a test can observe the
 * exit-held state and then complete it. Shared values are ref-stable across
 * renders (the lifecycle under test mutates them between commits), and
 * `useAnimatedStyle` evaluates its worklet at render time so assertions can
 * read the style a commit produced.
 *
 * By default `withTiming`/`withSpring` apply their target value synchronously
 * (only completion callbacks are deferred). `__setDeferredAnimationMode(true)`
 * opts a test into deferred targets too: a shared value holds its current
 * value until `__flushAnimationCallbacks()` settles the animation — mirroring
 * the on-device window where a JS-thread `.value` read still returns the
 * pre-animation value before the UI thread ticks a frame. Assigning a new
 * animation (or a plain value) replaces an in-flight deferred one, firing its
 * callback with `finished=false`, like real Reanimated.
 */
import { createElement, forwardRef, useRef, type ComponentType, type ReactNode } from 'react'

type HostProps = Record<string, unknown> & { children?: ReactNode }

function host(type: string): ComponentType<HostProps> {
  const Host = forwardRef<unknown, HostProps>((props, ref) => createElement(type, { ...props, ref }))
  Host.displayName = type
  return Host as unknown as ComponentType<HostProps>
}

type AnimationCallback = (finished?: boolean) => void

export interface RecordedAnimation {
  kind: 'timing' | 'spring' | 'delay'
  toValue: unknown
  config?: unknown
  count?: number
}

export const __recordedAnimations: RecordedAnimation[] = []
const pendingCallbacks: AnimationCallback[] = []
const deferredSettles: Array<(finished: boolean) => void> = []

let deferredMode = false

/** Opt-in per test (reset by `__resetAnimations`): defer animation targets, not just callbacks. */
export function __setDeferredAnimationMode(enabled: boolean): void {
  deferredMode = enabled
}

interface DeferredAnimation {
  __deferred: true
  toValue: unknown
  callback?: AnimationCallback
}

function isDeferredAnimation(candidate: unknown): candidate is DeferredAnimation {
  return typeof candidate === 'object' && candidate !== null && '__deferred' in candidate
}

/** Completes (or cancels, with `finished=false`) every queued animation callback. */
export function __flushAnimationCallbacks(finished = true): void {
  const settles = deferredSettles.splice(0)
  for (const settle of settles) {
    settle(finished)
  }
  const callbacks = pendingCallbacks.splice(0)
  for (const callback of callbacks) {
    callback(finished)
  }
}

export function __pendingAnimationCallbackCount(): number {
  return pendingCallbacks.length
}

export function __resetAnimations(): void {
  __recordedAnimations.length = 0
  pendingCallbacks.length = 0
  deferredSettles.length = 0
  deferredMode = false
}

export function useSharedValue<T>(initial: T): { value: T } {
  const ref = useRef<{ value: T } | null>(null)
  if (ref.current === null) {
    let current = initial
    let inflight: DeferredAnimation | null = null
    ref.current = {
      get value(): T {
        return current
      },
      set value(next: T) {
        // Any new assignment replaces an in-flight deferred animation, whose
        // callback then reports finished=false (real Reanimated semantics).
        if (inflight !== null) {
          const replaced = inflight
          inflight = null
          replaced.callback?.(false)
        }
        if (isDeferredAnimation(next)) {
          const animation = next
          inflight = animation
          deferredSettles.push((finished) => {
            if (inflight !== animation) {
              return
            }
            inflight = null
            if (finished) {
              current = animation.toValue as T
            }
            animation.callback?.(finished)
          })
          return
        }
        current = next
      },
    }
  }
  return ref.current
}

export function useAnimatedStyle<T>(factory: () => T): T {
  return factory()
}

// oxlint-disable-next-line max-params -- mirrors reanimated's withTiming(toValue, config, callback)
export function withTiming<T>(toValue: T, config?: unknown, callback?: AnimationCallback): T {
  __recordedAnimations.push({ kind: 'timing', toValue, config })
  if (deferredMode) {
    return { __deferred: true, toValue, callback } satisfies DeferredAnimation as unknown as T
  }
  if (callback) {
    pendingCallbacks.push(callback)
  }
  return toValue
}

// oxlint-disable-next-line max-params -- mirrors reanimated's withSpring(toValue, config, callback)
export function withSpring<T>(toValue: T, config?: unknown, callback?: AnimationCallback): T {
  __recordedAnimations.push({ kind: 'spring', toValue, config })
  if (deferredMode) {
    return { __deferred: true, toValue, callback } satisfies DeferredAnimation as unknown as T
  }
  if (callback) {
    pendingCallbacks.push(callback)
  }
  return toValue
}

export function withDelay<T>(delay: number, value: T): T {
  __recordedAnimations.push({ kind: 'delay', toValue: value, count: delay })
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

export function createAnimatedComponent<T>(component: T): T {
  return component
}

const Animated = {
  View: host('AnimatedView'),
  Text: host('AnimatedText'),
  createAnimatedComponent,
}

export default Animated
