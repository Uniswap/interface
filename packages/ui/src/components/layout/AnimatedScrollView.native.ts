import { ScrollView } from 'react-native'
import Animated from 'react-native-reanimated'

/**
 * Native implementation - uses Reanimated's animated ScrollView.
 */
export const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView)
