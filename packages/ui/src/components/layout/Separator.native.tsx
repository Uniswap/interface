/**
 * Native leg of Separator: a React Native `View`. The only place Separator
 * imports react-native at runtime.
 */
import { useSporeColors } from '@universe/mycelium'
import { useSyncExternalStore } from 'react'
import { Dimensions, View, type ViewStyle } from 'react-native'
import type { SeparatorProps } from 'ui/src/components/layout/Separator'
import { buildSeparatorPropStyle, getFalse, subscribeNoop } from 'ui/src/components/layout/separatorStyles'
import { breakpoints } from 'ui/src/theme'

export type { SeparatorProps } from 'ui/src/components/layout/Separator'

/**
 * The legacy Tamagui frame declared `flexShrink: 0` then `flex: 1`, and the two style
 * engines resolved that clash differently: Yoga gives explicit flexShrink precedence
 * over the shorthand (grow 1 / shrink 0 / basis 0), while Tamagui's web expansion of
 * `flex: 1` clobbered the earlier flexShrink (grow 1 / shrink 1 / basis auto — see the
 * web leg). Mirror each platform's resolved result explicitly so rendering is unchanged.
 */
const NATIVE_FLEX_FRAME: ViewStyle = { flexGrow: 1, flexShrink: 0, flexBasis: 0 }

function subscribeToDimensions(onChange: () => void): () => void {
  const subscription = Dimensions.addEventListener('change', onChange)
  return () => subscription.remove()
}

function getWindowIsMd(): boolean {
  return Dimensions.get('window').width <= breakpoints.md
}

/** Dimension-driven `$md`, mirroring @tamagui/react-native-media-driver's maxWidth evaluation. */
function useIsMdBreakpoint(hasMediaOverride: boolean): boolean {
  return useSyncExternalStore(
    hasMediaOverride ? subscribeToDimensions : subscribeNoop,
    hasMediaOverride ? getWindowIsMd : getFalse,
    getFalse,
  )
}

/**
 * Thin divider line, horizontal by default, `vertical` to flip.
 * Hand-rolled off Tamagui — a plain React Native `View`.
 */
export function Separator({
  vertical,
  my,
  mx,
  mt,
  mb,
  width,
  backgroundColor,
  borderColor,
  borderBottomWidth,
  position,
  top,
  left,
  right,
  $md,
  testID,
  style,
  children,
}: SeparatorProps): JSX.Element {
  const colors = useSporeColors()
  const isMd = useIsMdBreakpoint($md !== undefined)

  const propStyle = buildSeparatorPropStyle(
    { my, mx, mt, mb, width, backgroundColor, borderColor, borderBottomWidth, position, top, left, right },
    colors,
  )

  const mediaStyle = isMd && $md !== undefined ? $md : undefined

  const nativeStyle: ViewStyle = {
    borderColor: colors.surface3.val,
    borderWidth: 0,
    ...NATIVE_FLEX_FRAME,
    ...(vertical
      ? {
          // `translateY(0px)` mirrors the legacy vertical variant's `y: 0`, preserving any
          // stacking-context side effect.
          transform: [{ translateY: 0 }],
          width: 0,
          maxWidth: 0,
          borderBottomWidth: 0,
          borderRightWidth: 0.25,
        }
      : { height: 0, maxHeight: 0, borderBottomWidth: 1 }),
    ...propStyle,
  }

  // mediaStyle last so the `$md` override wins over pass-through `style`, matching the web leg.
  return (
    <View style={[nativeStyle, style, mediaStyle]} testID={testID}>
      {children}
    </View>
  )
}

Separator.displayName = 'Separator'
