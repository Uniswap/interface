/**
 * Minimal react-native-gesture-handler stand-in for the button-compat vitest
 * suites. `Pressable` renders as the distinctive `RNGHPressable` host so tests
 * can assert the native leg mounts RNGH's Pressable and not
 * RN's own (legacy CustomButtonFrame.native.tsx explains why: RNGH press
 * hit-testing reads the native view frame, while Tamagui's measure-based press
 * on a plain View collapses the touch target to its content on Android Fabric,
 * leaving the styled padding untappable — RN #51621).
 */
import { createElement, forwardRef, type ComponentType, type ReactNode } from 'react'

type HostProps = Record<string, unknown> & { children?: ReactNode }

function host(type: string): ComponentType<HostProps> {
  const Host = forwardRef<unknown, HostProps>((props, ref) => createElement(type, { ...props, ref }))
  Host.displayName = type
  return Host as unknown as ComponentType<HostProps>
}

export const Pressable = host('RNGHPressable')
export const GestureHandlerRootView = host('GestureHandlerRootView')
