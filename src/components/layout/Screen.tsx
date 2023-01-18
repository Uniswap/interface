import { BackgroundColorShorthandProps, createBox } from '@shopify/restyle'
import React, { useMemo } from 'react'
import { View } from 'react-native'
import { NativeSafeAreaViewProps, useSafeAreaInsets } from 'react-native-safe-area-context'
import { BoxProps } from 'src/components/layout/Box'
import { Theme } from 'src/styles/theme'

const SafeAreaBox = createBox<Theme>(View)

type ScreenProps = BackgroundColorShorthandProps<Theme> &
  // The SafeAreaView from react-native-safe-area-context also supports a `mode` prop which
  //  lets you choose if `edges` are added as margin or padding, but we don’t use that so
  // our Screen component doesn't need to support it
  Omit<NativeSafeAreaViewProps, 'mode'> &
  BoxProps

function SafeAreaWithInsets({ children, edges, ...rest }: ScreenProps): JSX.Element {
  // Safe area insets are wrong (0 when they shouldn't be) when using the <SafeAreaView>
  // component from react-native-safe-area-context, because when the initial screen is
  // outside the viewport (as is the case with a screen slide-in animation on navigation)
  // the safe area insets are calculated based on the initial screen, not the final screen.
  // This is a known issue with react-native-safe-area-context, and the solution is to use
  // the useSafeAreaInsets hook instead. See:
  // https://github.com/th3rdwave/react-native-safe-area-context/issues/114
  const insets = useSafeAreaInsets()

  const safeAreaStyles = useMemo(() => {
    const style: { [key: string]: number } = {}
    // Default to all edges, use empty array for no edges.
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
  }, [edges, insets])

  return (
    <SafeAreaBox style={safeAreaStyles} {...rest}>
      {children}
    </SafeAreaBox>
  )
}

export function Screen({ bg = 'background0', children, ...rest }: ScreenProps): JSX.Element {
  return (
    <SafeAreaWithInsets bg={bg} flex={1} {...rest}>
      {children}
    </SafeAreaWithInsets>
  )
}
