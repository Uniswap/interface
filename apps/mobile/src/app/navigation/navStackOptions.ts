import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { StackNavigationOptions } from '@react-navigation/stack'

export const navNativeStackOptions = {
  noHeader: { headerShown: false },
  presentationModal: { presentation: 'modal' },
  presentationBottomSheet: {
    presentation: 'containedTransparentModal',
    animation: 'none',
    animationDuration: 0,
    contentStyle: { backgroundColor: 'transparent' },
  },
  independentBsm: {
    fullScreenGestureEnabled: true,
    gestureEnabled: true,
    headerShown: false,
    animation: 'slide_from_right',
  },
} as const satisfies Record<string, NativeStackNavigationOptions>

export const navStackOptions = {
  noHeader: { headerShown: false },
} as const satisfies Record<string, StackNavigationOptions>
