import { isWebPlatform } from '@universe/environment'
/**
 * Style/interaction assembly shared by both Input platform legs (INFRA-3318): resolves the
 * legacy Tamagui cascade (default frame → style props → $platform-web → RN `style` →
 * $md/$sm → groupHover/hover/focus/focusVisible) against the live theme and owns the
 * interactive visual state the legs feed from their platform events.
 */
import { useSporeColors } from '@universe/mycelium'
import { useState } from 'react'
import type { TextInputProps as RNTextInputProps, TextStyle } from 'react-native'
import { useIsMdBreakpoint, useIsSmBreakpoint } from 'ui/src/components/input/inputRuntime'
import {
  defaultFrame,
  omitStyleProps,
  pickStyleProps,
  resolveColor,
  resolveStyleProps,
  resolveTamaguiSpaceVars,
} from 'ui/src/components/input/inputStyleResolution'
import type { InputForwardProps, InputProps } from 'ui/src/components/input/types'

export type InputVisualState = {
  /** RN prop surface left for the platform element after the style layer is consumed. */
  forwardProps: InputForwardProps
  resolvedStyle: Record<string, unknown>
  isEditable: boolean
  placeholderColor: string | undefined
  selectionColor: string | undefined
  hasGroupHover: boolean
  testID: string | undefined
  dataTestId: string | undefined
  onFocus: RNTextInputProps['onFocus']
  onBlur: RNTextInputProps['onBlur']
  setFocused: (value: boolean) => void
  setFocusVisible: (value: boolean) => void
  setHovered: (value: boolean) => void
  setGroupHovered: (value: boolean) => void
}

export function useInputVisualState(props: InputProps): InputVisualState {
  const {
    unstyled = false,
    focusStyle,
    hoverStyle,
    focusVisibleStyle,
    groupHoverStyle,
    '$platform-web': platformWebStyle,
    $sm,
    $md,
    style,
    disabled,
    editable,
    placeholderTextColor,
    selectionColor,
    testID,
    'data-testid': dataTestId,
    onFocus,
    onBlur,
    ...restProps
  } = props

  const colors = useSporeColors()
  const isSm = useIsSmBreakpoint()
  const isMd = useIsMdBreakpoint()

  const [focused, setFocused] = useState(false)
  const [focusVisible, setFocusVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [groupHovered, setGroupHovered] = useState(false)

  const styleProps = pickStyleProps(restProps as Record<string, unknown>)

  const smOverride = isSm ? $sm : undefined
  const mdOverride = isMd ? $md : undefined

  const resolvedStyle: Record<string, unknown> = {
    ...(unstyled ? {} : resolveStyleProps(colors, defaultFrame(colors))),
    ...resolveStyleProps(colors, styleProps),
    // $platform-web goes through the resolvers too, so tokens/shorthands never emit invalid CSS.
    ...(isWebPlatform ? resolveTamaguiSpaceVars(colors, platformWebStyle as TextStyle) : undefined),
    // Base layer ends with the RN `style` prop (how styled() wrappers deliver their config);
    // interactive/breakpoint layers spread after it, matching legacy :focus/:hover/@media specificity.
    ...resolveTamaguiSpaceVars(colors, style),
    // $md before $sm: the narrower breakpoint is the stronger override (ui/src/theme/media.ts order)
    ...(mdOverride !== undefined ? resolveStyleProps(colors, pickStyleProps(mdOverride)) : undefined),
    ...(mdOverride !== undefined && isWebPlatform
      ? resolveTamaguiSpaceVars(colors, mdOverride['$platform-web'] as TextStyle)
      : undefined),
    ...(smOverride !== undefined ? resolveStyleProps(colors, pickStyleProps(smOverride)) : undefined),
    ...(smOverride !== undefined && isWebPlatform
      ? resolveTamaguiSpaceVars(colors, smOverride['$platform-web'] as TextStyle)
      : undefined),
    ...(groupHovered && groupHoverStyle !== undefined ? resolveStyleProps(colors, groupHoverStyle) : undefined),
    ...(hovered && hoverStyle !== undefined ? resolveStyleProps(colors, hoverStyle) : undefined),
    ...(focused && focusStyle !== undefined ? resolveStyleProps(colors, focusStyle) : undefined),
    ...(focusVisible && focusVisibleStyle !== undefined ? resolveStyleProps(colors, focusVisibleStyle) : undefined),
  }

  return {
    // Style-surface keys were already resolved into resolvedStyle — they must not reach the
    // platform element as unknown props/attributes.
    forwardProps: omitStyleProps(restProps as Record<string, unknown>) as InputForwardProps,
    resolvedStyle,
    isEditable: editable !== false && disabled !== true,
    placeholderColor: resolveColor(colors, placeholderTextColor),
    selectionColor: resolveColor(colors, selectionColor),
    hasGroupHover: groupHoverStyle !== undefined,
    testID,
    dataTestId: dataTestId ?? testID,
    onFocus,
    onBlur,
    setFocused,
    setFocusVisible,
    setHovered,
    setGroupHovered,
  }
}
