/**
 * Native leg of `LabeledCheckboxCompat` — React Native `Pressable`/`View`/`Text`
 * on uniwind classNames. Zero new dependencies (see the substrate note in
 * `CheckboxCompat.native.tsx`).
 *
 * Same structure, same shared class tables and the same shared prop resolution
 * as the web leg, so the two cannot drift. Hover is React state and only tracked
 * when `hoverStyle` is passed (legacy `hoverable={!!hoverStyle}`); `hover:`
 * variants do not resolve on native.
 *
 * `onCheckPressed` receives the PRE-TOGGLE state, identically to the web leg
 * and to legacy.
 *
 * A11y: the container is the checkbox. An accessible `Pressable` merges its
 * children into one element, so VoiceOver reads the text (string or element)
 * as its name; giving the inner checkbox a name too would read it twice, and
 * leaving the container without a role (as legacy did) announces a plain group.
 *
 * The string-`text` label is an RN `Text` with the shared typography classes.
 * Legacy's `$short={{ variant: 'buttonLabel4' }}` height-media downgrade is not
 * reproduced — see `LABELED_TEXT_CLASSES` for why (`h-short:` does not exist in
 * the native bundle, so it would be a silent class-map miss).
 */
import * as React from 'react'
import { Pressable, Text, View, type GestureResponderEvent, type ViewStyle } from 'react-native'
import { cn } from '../cn'
import { CheckboxCompat } from './CheckboxCompat'
import {
  LABELED_CONTAINER_CLASSES,
  LABELED_TEXT_CLASSES,
  LABELED_TEXT_WRAPPER_CLASSES,
  labeledRowClassName,
  labeledRowStyle,
} from './compile'
import type { LabeledCheckboxCompatProps } from './props'
import {
  DEFAULT_CHECKBOX_POSITION,
  DEFAULT_CHECKBOX_SIZE,
  DEFAULT_LABELED_GAP,
  DEFAULT_LABELED_PX,
  flattenStyleProp,
  labeledTextShape,
  resolveHoverStyle,
} from './resolve'

export const LabeledCheckboxCompat = React.forwardRef<View, LabeledCheckboxCompatProps>(
  function LabeledCheckboxCompat(props, ref) {
    const {
      checked,
      checkboxPosition = DEFAULT_CHECKBOX_POSITION,
      text,
      variant,
      size = DEFAULT_CHECKBOX_SIZE,
      gap = DEFAULT_LABELED_GAP,
      px = DEFAULT_LABELED_PX,
      py,
      hoverStyle,
      containerStyle,
      onCheckPressed,
      testID,
      className,
    } = props

    const hoverable = hoverStyle !== undefined
    const [hovered, setHovered] = React.useState(false)

    const handlePress = React.useCallback(
      (event: GestureResponderEvent): void => {
        event.preventDefault()
        event.stopPropagation()
        onCheckPressed?.(checked)
      },
      [checked, onCheckPressed],
    )

    const textShape = labeledTextShape(text)
    const label =
      textShape === 'string' ? <Text className={LABELED_TEXT_CLASSES}>{text as string}</Text> : (text ?? null)

    const containerClasses = cn(LABELED_CONTAINER_CLASSES, className)
    const resolvedHoverStyle = resolveHoverStyle(hoverStyle)

    const checkbox = (
      // The row is the checkbox for assistive tech, so the inner one is hidden: TalkBack would otherwise reach
      // it as a second, unnamed checkbox. It still takes touches.
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <CheckboxCompat checked={checked} size={size} variant={variant} onPress={handlePress} />
      </View>
    )

    return (
      <Pressable
        ref={ref}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        className={containerClasses}
        style={[
          flattenStyleProp(containerStyle) as ViewStyle,
          hoverable && hovered ? (resolvedHoverStyle as ViewStyle) : undefined,
        ]}
        testID={testID}
        onHoverIn={hoverable ? () => setHovered(true) : undefined}
        onHoverOut={hoverable ? () => setHovered(false) : undefined}
        onPress={handlePress}
      >
        <View className={labeledRowClassName({ gap, px, py })} style={labeledRowStyle({ gap, px, py })}>
          {checkboxPosition === 'start' ? checkbox : null}
          {textShape !== 'absent' ? <View className={LABELED_TEXT_WRAPPER_CLASSES}>{label}</View> : null}
          {checkboxPosition === 'end' ? checkbox : null}
        </View>
      </Pressable>
    )
  },
)
