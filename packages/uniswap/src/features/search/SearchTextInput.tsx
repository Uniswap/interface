import { isAndroid, isWebPlatform } from '@universe/environment'
import {
  type FlexCompatProps as FlexProps,
  Flex,
  Input,
  InputProps,
  Text,
  TouchableArea,
  type ColorTokens,
} from '@universe/mycelium'
import { useDeviceDimensions } from '@universe/mycelium/theme-hooks-compat'
import { fonts, iconSizes, spacing } from '@universe/mycelium/tokens'
import { withSporeCurve } from '@universe/tailwind/animations/reanimated'
import { TestID } from '@universe/test'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import { forwardRef, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LayoutChangeEvent, TextInput as NativeTextInput } from 'react-native'
import type { EntryExitAnimationFunction } from 'react-native-reanimated'
import { useAnimatedStyle } from 'react-native-reanimated'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { Search } from 'ui/src/components/icons/Search'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { SHADOW_OFFSET_SMALL } from 'uniswap/src/components/BaseCard/BaseCard'
import { ViewGestureHandler } from 'uniswap/src/components/ViewGestureHandler/ViewGestureHandler'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useComposedRefs } from 'utilities/src/react/composeRefs'
import { useEvent } from 'utilities/src/react/hooks'

const DEFAULT_MIN_HEIGHT = 48
const CANCEL_CHEVRON_X_OFFSET = -6
// `showShadow` has no caller passing `true` today, so this is unexercised; `elevationAndroid`
// (Tamagui's Android elevation prop) is dropped because it has no mycelium FlexCompat equivalent.
const SHADOW_PROPS = {
  shadowColor: '$shadowColor',
  shadowOffset: SHADOW_OFFSET_SMALL,
  shadowOpacity: 0.25,
  shadowRadius: 6,
  '$theme-dark': {
    shadowColor: '$black',
  },
} satisfies Partial<FlexProps>

export const springConfig = {
  stiffness: 1000,
  damping: 500,
  mass: 3,
  overshootClamping: true,
}

export enum CancelBehaviorType {
  CancelButton = 'CancelButton',
  BackChevron = 'BackChevron',
}

export type SearchTextInputProps = InputProps & {
  onCancel?: () => void
  onClose?: () => void
  endAdornment?: JSX.Element | null
  showShadow?: boolean
  py?: FlexProps['py']
  px?: FlexProps['px']
  mx?: FlexProps['mx']
  my?: FlexProps['my']
  hideIcon?: boolean
  minHeight?: number
  cancelBehaviorType?: CancelBehaviorType
  backgroundColor?: ColorTokens | 'transparent'
  borderColor?: ColorTokens
  borderWidth?: FlexProps['borderWidth']
}

// Reanimated leg (native) of the legacy Tamagui 'quick' close-button presence swap (enterStyle/
// exitStyle opacity 0, scale 0). On web, `enterStyle`/`exitStyle` below (gated to web only) drive
// the same look.
const CLOSE_BUTTON_ENTER_EXIT_STYLE = { opacity: 0, scale: 0 }
const closeButtonEntering: EntryExitAnimationFunction = () => {
  'worklet'
  return {
    initialValues: { opacity: 0, transform: [{ scale: 0 }] },
    animations: {
      opacity: withSporeCurve('quick', 1),
      transform: [{ scale: withSporeCurve('quick', 1) }],
    },
  }
}

const closeButtonExiting: EntryExitAnimationFunction = () => {
  'worklet'
  return {
    initialValues: { opacity: 1, transform: [{ scale: 1 }] },
    animations: {
      opacity: withSporeCurve('quick', 0),
      transform: [{ scale: withSporeCurve('quick', 0) }],
    },
  }
}

// Explicit return type: the inferred type otherwise needs to print mycelium's internal
// (unexported) BreakpointOverride/ColorTokenValue types, which TS rejects as non-portable (TS2883).
export const SearchTextInput: ForwardRefExoticComponent<SearchTextInputProps & RefAttributes<NativeTextInput>> =
  forwardRef<NativeTextInput, SearchTextInputProps>(
    // oxlint-disable-next-line complexity
    function SearchTextInputInner(props, ref) {
      const dimensions = useDeviceDimensions()
      const { t } = useTranslation()
      const {
        autoFocus,
        backgroundColor = '$surface2',
        endAdornment,
        onCancel,
        onClose,
        onChangeText,
        onFocus,
        onKeyPress,
        placeholder,
        py = '$spacing12',
        px = '$spacing16',
        mx,
        my,
        showShadow,
        value,
        hideIcon,
        minHeight = DEFAULT_MIN_HEIGHT,
        cancelBehaviorType = CancelBehaviorType.CancelButton,
        keyboardType = 'default',
        inputMode: inputModeProp,
        placeholderTextColor = '$neutral2',
        borderColor = '$surface5',
        borderWidth = '$spacing1',
      } = props

      const inputMode = inputModeProp ?? 'text'

      const inputRef = useRef<Input>(null)
      const combinedRef = useComposedRefs<Input>(inputRef, ref)
      const showCloseButton = !!onClose
      const [isFocus, setIsFocus] = useState(false)

      const showCancelButton = !!onCancel && cancelBehaviorType === CancelBehaviorType.CancelButton
      const [cancelButtonWidth, setCancelButtonWidth] = useState(showCancelButton ? 40 : 0)

      const showBackChevron = !!onCancel && cancelBehaviorType === CancelBehaviorType.BackChevron
      const cancelChevronWidth = showBackChevron ? iconSizes.icon20 + CANCEL_CHEVRON_X_OFFSET : 0

      const onCancelButtonLayout = useEvent((event: LayoutChangeEvent) => {
        setCancelButtonWidth(event.nativeEvent.layout.width)
      })

      const onPressCancel = useEvent((): void => {
        inputRef.current?.clear()
        setIsFocus(false)
        dismissNativeKeyboard()
        sendAnalyticsEvent(WalletEventName.ExploreSearchCancel, { query: value || '' })
        onChangeText?.('')
        onCancel?.()
      })

      const onTextInputFocus = useEvent((e: Parameters<NonNullable<InputProps['onFocus']>>[0]): void => {
        onFocus?.(e)
        setIsFocus(true)
      })

      // Reanimated leg (native) of the legacy Tamagui 'quick' margin transition (animateOnly
      // restricted the tween to whichever side this instance's cancelBehaviorType drives; the other
      // side is always 0 in that mode, so tracking both sides costs nothing and behaves identically).
      // withSporeCurve is native-only (see its docstring), so on web this style is never applied —
      // the isWebPlatform branch below restores the literal Tamagui props/animation instead.
      const targetMarginLeft = showBackChevron && isFocus ? cancelChevronWidth + spacing.spacing8 + spacing.spacing2 : 0
      const targetMarginRight = showCancelButton && isFocus ? cancelButtonWidth + spacing.spacing12 : 0
      const marginAnimatedStyle = useAnimatedStyle(
        () => ({
          marginLeft: withSporeCurve('quick', targetMarginLeft),
          marginRight: withSporeCurve('quick', targetMarginRight),
        }),
        [targetMarginLeft, targetMarginRight],
      )
      // Kebab-case: animateOnly entries splice verbatim into the CSS `transition` shorthand.
      const marginAnimateOnly = cancelBehaviorType === CancelBehaviorType.BackChevron ? 'margin-left' : 'margin-right'

      // Reanimated leg (native) of the legacy Tamagui '200ms' cancel-button slide-fade, tracked
      // continuously as isFocus toggles (always mounted while showCancelButton, never a mount/
      // unmount fade). `cancelButtonTargetVisible` drives both opacity and scale identically.
      const cancelButtonTargetVisible = isFocus ? 1 : 0
      const cancelButtonTargetX = isFocus ? 0 : dimensions.fullWidth
      const cancelButtonAnimatedStyle = useAnimatedStyle(
        () => ({
          opacity: withSporeCurve('200ms', cancelButtonTargetVisible),
          transform: [
            { scale: withSporeCurve('200ms', cancelButtonTargetVisible) },
            { translateX: withSporeCurve('200ms', cancelButtonTargetX) },
          ],
        }),
        [cancelButtonTargetVisible, cancelButtonTargetX],
      )

      return (
        <Flex row shrink alignItems="center" mx={mx}>
          {showBackChevron && (
            <Flex
              left={0}
              opacity={isFocus ? 1 : 0}
              pointerEvents={isFocus ? 'auto' : 'none'}
              position="absolute"
              scale={isFocus ? 1 : 0}
              testID={TestID.Back}
              x={CANCEL_CHEVRON_X_OFFSET}
            >
              <TouchableArea hitSlop={16} onPress={onPressCancel}>
                <RotatableChevron color="$neutral1" direction="left" size="$icon.20" />
              </TouchableArea>
            </Flex>
          )}
          <AnimatedFlex
            fill
            grow
            style={isWebPlatform ? undefined : marginAnimatedStyle}
            {...(isWebPlatform && {
              animation: 'quick' as const,
              animateOnly: [marginAnimateOnly],
              ml: targetMarginLeft,
              mr: targetMarginRight,
            })}
            my={my}
            minHeight={minHeight}
          >
            <Flex
              fill
              grow
              row
              alignItems="center"
              backgroundColor={backgroundColor as ColorTokens}
              borderRadius="$rounded16"
              gap="$spacing8"
              px={px}
              py={py}
              borderColor={borderColor}
              borderWidth={borderWidth}
              {...(showShadow && SHADOW_PROPS)}
            >
              {!hideIcon && (
                <Flex py="$spacing4">
                  <Search color="$neutral2" size="$icon.20" />
                </Flex>
              )}

              <Flex grow alignSelf="stretch" mr="$spacing8" overflow="hidden">
                <ViewGestureHandler>
                  <Input
                    ref={combinedRef}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus={autoFocus}
                    backgroundColor="$transparent"
                    borderWidth="$none"
                    fontFamily="$body"
                    fontWeight="$book"
                    fontSize={props.fontSize ?? fonts.body1.fontSize}
                    // Web pins lineHeight to avoid clipping; native leaves it unset — pinning it shrinks
                    // the line box so iOS top-anchors the glyph, riding the text/placeholder high.
                    lineHeight={isWebPlatform ? (props.lineHeight ?? fonts.body1.fontSize) : props.lineHeight}
                    height="100%"
                    maxFontSizeMultiplier={props.maxFontSizeMultiplier ?? fonts.body1.maxFontSizeMultiplier}
                    outlineColor="transparent"
                    outlineWidth={0}
                    p="$none"
                    placeholder={placeholder}
                    placeholderTextColor={placeholderTextColor}
                    position="absolute"
                    returnKeyType="done"
                    testID={TestID.ExploreSearchInput}
                    textContentType="none"
                    keyboardType={keyboardType}
                    inputMode={inputMode}
                    top={0}
                    // avoid turning into a controlled input if not wanting to
                    {...(typeof value !== 'undefined' && {
                      value,
                    })}
                    // web and iOS need this to avoid platform specific issues
                    // fix Android TextInput issue when the width is changed
                    // (the placeholder text was wrapping in 2 lines when the width was changed)
                    width={!isAndroid ? '100%' : value ? undefined : 9999}
                    onChangeText={onChangeText}
                    onFocus={onTextInputFocus}
                    onSubmitEditing={dismissNativeKeyboard}
                    onKeyPress={onKeyPress}
                  />
                </ViewGestureHandler>
              </Flex>

              {/* No enterStyle/exitStyle on the legacy node (nor here), so this was and stays inert:
                  no mount/unmount transition, on either platform. */}
              {endAdornment && <Flex>{endAdornment}</Flex>}
              {showCloseButton && (
                <AnimatedFlex
                  entering={closeButtonEntering}
                  exiting={closeButtonExiting}
                  {...(isWebPlatform && {
                    animation: 'quick' as const,
                    animateOnly: ['opacity', 'transform'],
                    enterStyle: CLOSE_BUTTON_ENTER_EXIT_STYLE,
                    exitStyle: CLOSE_BUTTON_ENTER_EXIT_STYLE,
                  })}
                >
                  <TouchableArea backgroundColor={backgroundColor as ColorTokens} onPress={onClose}>
                    <RotatableChevron color="$neutral3" direction="up" size="$icon.20" />
                  </TouchableArea>
                </AnimatedFlex>
              )}
            </Flex>
          </AnimatedFlex>
          {showCancelButton && (
            <AnimatedFlex
              pointerEvents={isFocus ? 'auto' : 'none'}
              position="absolute"
              right={0}
              style={isWebPlatform ? undefined : cancelButtonAnimatedStyle}
              {...(isWebPlatform && {
                animation: '200ms' as const,
                animateOnly: ['opacity', 'transform'],
                opacity: cancelButtonTargetVisible,
                scale: cancelButtonTargetVisible,
                x: cancelButtonTargetX,
              })}
              onLayout={onCancelButtonLayout}
            >
              <TouchableArea hitSlop={16} onPress={onPressCancel}>
                <Text variant="buttonLabel2">{t('common.button.cancel')}</Text>
              </TouchableArea>
            </AnimatedFlex>
          )}
        </Flex>
      )
    },
  )
