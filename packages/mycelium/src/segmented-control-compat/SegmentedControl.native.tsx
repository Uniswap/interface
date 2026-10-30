import type * as React from 'react'
import { cloneElement, useEffect, useState } from 'react'
import type { LayoutRectangle, TextStyle } from 'react-native'
import { Platform, Pressable, Text, View } from 'react-native'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { assert } from 'utilities/src/errors'
import { needsSmallFont } from '../text-compat/needs-small-font'
import { pruneOptionLayouts } from './option-layouts'
import {
  containerClasses,
  getIndicatorTransform,
  getOptionTextColorClass,
  indicatorPillClasses,
  optionClasses,
  ROOT_FRAME_STYLE,
} from './style-classes'
import type { SegmentedControlProps } from './types'
import { MAX_FONT_SIZE_MULTIPLIER, MEDIUM_WEIGHT, optionFontMetrics } from './typography'

// The legacy control animates the roving indicator with the Tamagui `fast`
// preset, which on native is this Reanimated spring
// (packages/ui/src/theme/animations/index.native.ts). INFRA-2967 ports the
// preset curves to a shared module — re-point there once it lands; inlined
// verbatim until then.
const FAST_SPRING = { damping: 75, stiffness: 1000, mass: 1 } as const

// Legacy TabsRovingIndicator zIndex: '$mask' (ui/src zIndexes.mask = 10).
const INDICATOR_Z_INDEX = 10

// Locale is fixed for the app's lifetime; the legacy fonts.ts resolves its
// adjustedSize at module scope the same way.
const SMALL_FONT = needsSmallFont()

// Legacy platformFontFamily('medium'): iOS uses the family name embedded in
// the font file, Android the file name (packages/ui/src/theme/fonts.ts).
const FONT_FAMILY_MEDIUM = Platform.select({ android: 'Basel-Grotesk-Medium', default: 'Basel Grotesk' })

// Native transcription of the legacy AnimatePresence lifecycle around the
// indicator: 'unmounted' until the selected option has a measured layout,
// 'mounted' while it has one, 'exiting' while the exit opacity fade runs after
// the layout disappears (the element stays rendered at its last rect until the
// fade settles, exactly like an AnimatePresence exit).
type IndicatorPhase = 'unmounted' | 'mounted' | 'exiting'

function optionTextStyle(large: boolean): TextStyle {
  const { fontSize, lineHeight } = optionFontMetrics({ large, smallFont: SMALL_FONT })
  return { fontFamily: FONT_FAMILY_MEDIUM, fontSize, lineHeight, fontWeight: MEDIUM_WEIGHT }
}

/**
 * Spore segmented control, for selecting between multiple options — the
 * INFRA-2966 native rebuild of the legacy Tamagui component
 * (packages/ui/src/components/SegmentedControl/SegmentedControl.tsx) on React
 * Native primitives + uniwind classes. Pixel-parity port: sizes, paddings,
 * colors, the 4px container padding, the mobile optical indicator adjustments,
 * and the `fast`-spring indicator animation are all transcribed 1:1.
 *
 * @param options - An array of options to display in the segmented control - must have between 2 and 6 options.
 * @param selectedOption - The value of the currently selected option.
 * @param onSelectOption - Callback function to be called when an option is selected.
 * @param size - The size of the segmented control which affects the height and padding.
 * @param disabled - Whether the segmented control is disabled.
 */
export function SegmentedControl<T extends string = string>({
  options,
  selectedOption,
  onSelectOption,
  onHoverOption,
  size = 'default',
  disabled,
  fullWidth,
  variableOptionWidths,
  outlined = true,
  gap,
}: SegmentedControlProps<T>): React.JSX.Element {
  assert(options.length >= 2 && options.length <= 6, 'Segmented control must have between 2 and 6 options, inclusive.')

  // Layout of each option relative to the container (RN onLayout), keyed by
  // option value — the native equivalent of Tamagui Tabs' TabLayout.
  const [optionLayouts, setOptionLayouts] = useState<Partial<Record<T, LayoutRectangle>>>({})
  // Keyed by option value, not index: legacy hover is per-option (the text
  // color follows the hovered option and the indicator fill is an element
  // hoverStyle), so the highlight must stay with the option — an index would
  // silently point at a different option when `options` changes under a
  // stationary pointer.
  const [hoveredValue, setHoveredValue] = useState<T | undefined>(undefined)
  // The indicator overlay sits above the selected option and intercepts the
  // pointer, so its hover highlight is tracked on the pill itself — the
  // native equivalent of the legacy TabsRovingIndicator's own hoverStyle.
  const [indicatorHovered, setIndicatorHovered] = useState(false)
  // Mirrors the legacy AnimatePresence lifecycle: the indicator mounts (fading
  // in from opacity 0) once the selected option has reported a layout, and
  // fades back out and unmounts when that layout goes away.
  const [indicatorPhase, setIndicatorPhase] = useState<IndicatorPhase>('unmounted')

  // Drop layouts for option values that are no longer rendered, so the map
  // doesn't accumulate stale rects as `options` changes over time — and clear
  // the hover highlight if the hovered option was removed, so a later
  // re-added option with the same value can't render pre-hovered.
  useEffect(() => {
    setOptionLayouts((prev) => pruneOptionLayouts({ layouts: prev, options }))
    setHoveredValue((prev) =>
      prev !== undefined && !options.some((option) => option.value === prev) ? undefined : prev,
    )
  }, [options])

  const isLargeSize = size === 'large'
  const activeAt = optionLayouts[selectedOption]

  const indicatorX = useSharedValue(0)
  const indicatorY = useSharedValue(0)
  const indicatorWidth = useSharedValue(0)
  const indicatorHeight = useSharedValue(0)
  const indicatorOpacity = useSharedValue(0)

  useEffect(() => {
    if (!activeAt) {
      if (indicatorPhase === 'mounted') {
        // The selected option lost its measured layout: legacy AnimatePresence
        // keeps the indicator rendered at its last rect and runs the exit
        // animation — exitStyle {opacity: 0} with the same fast spring — then
        // removes it once the spring settles. The unmount also drops the
        // pill's hover highlight: the pill disappears without ever firing
        // onHoverOut, and a surviving indicatorHovered would make a later
        // remount render the hovered fill with no pointer over it (legacy
        // AnimatePresence discards the element's hover state the same way).
        setIndicatorPhase('exiting')
        indicatorOpacity.value = withSpring(0, FAST_SPRING, (finished) => {
          if (finished) {
            runOnJS(setIndicatorPhase)('unmounted')
            runOnJS(setIndicatorHovered)(false)
          }
        })
      }
      return
    }
    const { translateX, translateY } = getIndicatorTransform({ x: activeAt.x, y: activeAt.y, large: isLargeSize })
    if (indicatorPhase === 'unmounted') {
      // First selection (or a re-mount after a completed exit fade): mount at
      // the target rect (legacy mounts the indicator at position) and fade in
      // via enterStyle {opacity: 0} + the fast spring.
      indicatorX.value = translateX
      indicatorY.value = translateY
      indicatorWidth.value = activeAt.width
      indicatorHeight.value = activeAt.height
      indicatorOpacity.value = 0
      indicatorOpacity.value = withSpring(1, FAST_SPRING)
      setIndicatorPhase('mounted')
    } else {
      // Subsequent selections/relayouts: spring position and size, like the
      // legacy `animation: 'fast'` on x/y/width/height.
      indicatorX.value = withSpring(translateX, FAST_SPRING)
      indicatorY.value = withSpring(translateY, FAST_SPRING)
      indicatorWidth.value = withSpring(activeAt.width, FAST_SPRING)
      indicatorHeight.value = withSpring(activeAt.height, FAST_SPRING)
      if (indicatorPhase === 'exiting') {
        // A layout reappeared mid-exit: AnimatePresence re-enters the same
        // element, so cancel the fade-out by springing opacity back to 1.
        indicatorOpacity.value = withSpring(1, FAST_SPRING)
        setIndicatorPhase('mounted')
      }
    }
  }, [activeAt, indicatorHeight, indicatorOpacity, indicatorPhase, indicatorWidth, indicatorX, indicatorY, isLargeSize])

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    width: indicatorWidth.value,
    height: indicatorHeight.value,
    opacity: indicatorOpacity.value,
    transform: [{ translateX: indicatorX.value }, { translateY: indicatorY.value }],
  }))

  // Legacy guards selection twice — in Tabs' onValueChange (keyboard path) and
  // in the per-option onPress — because Tamagui has two activation paths. The
  // rebuild's only activation path is onPress, so each option's disabled state
  // is derived once per render in the options map and threaded through here
  // instead of being re-derived on every press.
  const selectOption = ({ value, optionDisabled }: { value: T; optionDisabled: boolean }): void => {
    if (optionDisabled) {
      return
    }
    onSelectOption(value)
  }

  return (
    // Mirrors the legacy unstyled <Tabs> root wrapper, including its invisible
    // always-allocated 1px border (see ROOT_FRAME_STYLE) — part of the
    // control's layout footprint, so siblings don't shift on a drop-in swap.
    // Inline style, not border classes: see ROOT_FRAME_STYLE for why classes
    // can paint this frame black on device.
    <View style={ROOT_FRAME_STYLE}>
      <View className={containerClasses({ size, outlined, fullWidth, gap })}>
        {options.map((option) => {
          const { value, display, displayText, wrapper, href } = option

          // Derived once per option per render; every consumer below (props,
          // text color, the selectOption guard) threads this value.
          const itemDisabled = Boolean(disabled || option.disabled)

          const optionElement = (
            <Pressable
              key={value}
              accessibilityRole={!itemDisabled && href ? 'link' : 'button'}
              accessibilityState={{ selected: selectedOption === value, disabled: itemDisabled || undefined }}
              className={optionClasses({
                size,
                fullWidth: fullWidth && !variableOptionWidths,
                variableOptionWidths: fullWidth && variableOptionWidths,
              })}
              disabled={itemDisabled}
              onLayout={(event) => {
                // RN recycles the synthetic event after this handler returns
                // (nativeEvent becomes null), and React defers state-updater
                // callbacks to the render flush — so the layout must be read
                // synchronously here, never inside the updater.
                const layout = event.nativeEvent.layout
                setOptionLayouts((prev) => ({ ...prev, [value]: layout }))
              }}
              // Hover only fires on pointer-capable devices (e.g. iPad
              // trackpad); the legacy onMouseEnter/onMouseLeave pair is
              // likewise inert on touch.
              onHoverIn={() => {
                // Legacy renders disabled options as <button disabled>, which
                // suppresses mouse events — so disabled options never hover.
                if (itemDisabled) {
                  return
                }
                setHoveredValue(value)
                onHoverOption?.(value)
              }}
              onHoverOut={() => setHoveredValue(undefined)}
              onPress={(e) => {
                if (href && 'preventDefault' in e) {
                  e.preventDefault()
                }
                selectOption({ value, optionDisabled: itemDisabled })
              }}
            >
              {display ?? (
                <Text
                  className={getOptionTextColorClass({
                    active: selectedOption === value,
                    hovered: hoveredValue === value,
                    disabled: itemDisabled,
                  })}
                  maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                  style={optionTextStyle(isLargeSize)}
                >
                  {displayText ?? value}
                </Text>
              )}
            </Pressable>
          )

          if (wrapper) {
            // To avoid perf issues, we expect the callsite to pass an instance of a component,
            // not a functional component. As a result we can't render it with typical JSX and need
            // to clone it here. (Carried over from the legacy component.) The clone gets the
            // option's key so React reconciles wrapped entries by value, not position.
            return cloneElement(wrapper, {
              key: value,
              children: optionElement,
            })
          }
          return optionElement
        })}
        {indicatorPhase !== 'unmounted' && (
          // Structural twin of the legacy TabsRovingIndicator: an absolutely
          // positioned last child with no insets (Yoga places it at the
          // content start, vertically centered by items-center — the same
          // static position the legacy transform offsets from), translated by
          // the measured tab layout. It deliberately keeps default pointer
          // handling so a tap on the selected option lands on the indicator,
          // exactly like the legacy overlay — and, exactly like the legacy
          // hoverStyle, the pill therefore tracks its own hover instead of
          // relying on the covered option's (unreachable) hover events. While
          // 'exiting' it stays rendered at its last rect for the fade-out,
          // like an AnimatePresence exit.
          <Animated.View
            style={[{ position: 'absolute', zIndex: INDICATOR_Z_INDEX }, indicatorAnimatedStyle]}
            testID="segmented-control-indicator"
          >
            <Pressable
              accessible={false}
              className={indicatorPillClasses({ hovered: indicatorHovered })}
              onHoverIn={() => setIndicatorHovered(true)}
              onHoverOut={() => setIndicatorHovered(false)}
            />
          </Animated.View>
        )}
      </View>
    </View>
  )
}
