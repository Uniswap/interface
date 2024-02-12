import React, { useMemo } from 'react'
import { NativeSafeAreaViewProps } from 'react-native-safe-area-context'
import { Flex, FlexProps, useDeviceInsets } from 'ui/src'

// Used to determine amount of top padding for short screens
export const SHORT_SCREEN_HEADER_HEIGHT_RATIO = 0.88

type ScreenProps = FlexProps &
  // The SafeAreaView from react-native-safe-area-context also supports a `mode` prop which
  //  lets you choose if `edges` are added as margin or padding, but we don’t use that so
  // our Screen component doesn't need to support it
  Omit<NativeSafeAreaViewProps, 'mode'> & { noInsets?: boolean }

function SafeAreaWithInsets({ children, edges, noInsets, ...rest }: ScreenProps): JSX.Element {
  // Safe area insets are wrong (0 when they shouldn't be) when using the <SafeAreaView>
  // component from react-native-safe-area-context, because when the initial screen is
  // outside the viewport (as is the case with a screen slide-in animation on navigation)
  // the safe area insets are calculated based on the initial screen, not the final screen.
  // This is a known issue with react-native-safe-area-context, and the solution is to use
  // the useSafeAreaInsets hook instead. See:
  // https://github.com/th3rdwave/react-native-safe-area-context/issues/114
  const insets = useDeviceInsets() // useDeviceInsets uses useSafeAreaInsets internally

  const safeAreaStyles = useMemo(() => {
    const style: { [key: string]: number } = {}

    if (noInsets) {
      return style
    }

    if (!edges) {
      return {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }
    }
    if (edges?.includes('top')) {
      style.paddingTop = insets.top
    }
    if (edges?.includes('bottom')) {
      style.paddingBottom = insets.bottom
    }
    if (edges?.includes('left')) {
      style.paddingLeft = insets.left
    }
    if (edges?.includes('right')) {
      style.paddingRight = insets.right
    }
    return style
  }, [edges, insets, noInsets])

  return (
    <Flex style={safeAreaStyles} {...rest}>
      {children}
    </Flex>
  )
}

export function Screen({
  backgroundColor = '$surface1',
  children,
  ...rest
}: ScreenProps): JSX.Element {
  return (
    <SafeAreaWithInsets fill backgroundColor={backgroundColor} sentry-label="Screen" {...rest}>
      {children}
    </SafeAreaWithInsets>
  )
}
