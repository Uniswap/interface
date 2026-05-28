import type { DependencyList } from 'react'
import type { ViewStyle } from 'react-native'

/**
 * Platform-agnostic Reanimated hooks.
 *
 * - Native: Re-exports from react-native-reanimated (useReanimatedHooks.native.ts)
 * - Web: Provides simplified implementations (useReanimatedHooks.web.ts)
 *
 * Note: These are simplified wrappers. For complex animations that heavily
 * depend on Reanimated worklets, consider using platform-specific files.
 */

/**
 * Shared value type that works across platforms.
 * On native, this is Reanimated's SharedValue.
 * On web, this is a simple object with a .value property.
 */
export interface SharedValue<T> {
  value: T
}

/**
 * Creates a shared value that can be used for animations.
 */
export function useSharedValue<T>(_initialValue: T): SharedValue<T> {
  throw new Error('useSharedValue: Implemented in .native.ts and .web.ts')
}

/**
 * Creates an animated style based on shared values.
 */
export function useAnimatedStyle<T extends ViewStyle>(_updater: () => T, _deps?: DependencyList): T {
  throw new Error('useAnimatedStyle: Implemented in .native.ts and .web.ts')
}
