import type { ComponentRef } from 'react'
import type { ScrollView, ScrollViewProps } from 'react-native'

/**
 * Platform-agnostic AnimatedScrollView.
 *
 * - Native: Uses Animated.createAnimatedComponent(ScrollView) from react-native-reanimated
 * - Web: Uses regular ScrollView (no Reanimated)
 *
 * Note: This file only exports types. The actual component is in .native.ts and .web.ts
 */
export type AnimatedScrollViewProps = ScrollViewProps
export type AnimatedScrollViewRef = ComponentRef<typeof ScrollView>

// Re-export the component type for TypeScript
export type { ScrollView as AnimatedScrollView } from 'react-native'
