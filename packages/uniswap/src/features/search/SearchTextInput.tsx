import { forwardRef, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  TextInput as NativeTextInput,
  TextInputFocusEventData,
} from 'react-native'
import { AnimatePresence, Flex, Input, InputProps, SpaceTokens, Text, TouchableArea, useComposedRefs } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { Search } from 'ui/src/components/icons/Search'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { SHADOW_OFFSET_SMALL } from 'uniswap/src/components/BaseCard/BaseCard'
import { ViewGestureHandler } from 'uniswap/src/components/ViewGestureHandler/ViewGestureHandler'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { isAndroid } from 'utilities/src/platform'

const DEFAULT_MIN_HEIGHT = 48
const CANCEL_CHEVRON_X_OFFSET = -6

export const springConfig = {
  stiffness: 1000,
  damping: 500,
  mass: 3,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
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
  py?: SpaceTokens
  px?: SpaceTokens
  mx?: SpaceTokens
  my?: SpaceTokens
  hideIcon?: boolean
  minHeight?: number
  cancelBehaviorType?: CancelBehaviorType
}

export const SearchTextInput = forwardRef<NativeTextInput, SearchTextInputProps>(
  // eslint-disable-next-line complexity
  function _SearchTextInput(props, ref) {
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

    const onCancelButtonLayout = useCallback((event: LayoutChangeEvent) => {
      setCancelButtonWidth(event.nativeEvent.layout.width)
    }, [])

    const onPressCancel = (): void => {
      inputRef.current?.clear()
      setIsFocus(false)
      dismissNativeKeyboard()
      sendAnalyticsEvent(WalletEventName.ExploreSearchCancel, { query: value || '' })
      onChangeText?.('')
      onCancel?.()
    }

    const onTextInputFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>): void => {
      onFocus?.(e)
      setIsFocus(true)
    }

    const onChangeTextInput = useCallback(
      (text: string) => {
        onChangeText?.(text)
      },
      [onChangeText],
    )

    const animationDirection = cancelBehaviorType === CancelBehaviorType.BackChevron ? 'marginLeft' : 'marginRight'

    return (
      <Flex row shrink alignItems="center" mx={mx}>
        {showBackChevron && (
          <Flex
            animation="200ms"
            left={0}
            opacity={isFocus ? 1 : 0}
            pointerEvents={isFocus ? 'auto' : 'none'}
            position="absolute"
            scale={isFocus ? 1 : 0}
            testID={TestID.Back}
            x={CANCEL_CHEVRON_X_OFFSET}
          >
            <TouchableArea hitSlop={16} onPress={onPressCancel}>
              <RotatableChevron color="$neutral1" direction="left" height={iconSizes.icon20} width={iconSizes.icon20} />
            </TouchableArea>
          </Flex>
        )}
        <Flex
          fill
          grow
          row
          alignItems="center"
          animateOnly={[animationDirection]}
          animation="quick"
          backgroundColor={backgroundColor}
          borderRadius="$roundedFull"
          gap="$spacing8"
          minHeight={minHeight}
          ml={showBackChevron && isFocus ? cancelChevronWidth + spacing.spacing8 + spacing.spacing2 : 0}
          mr={showCancelButton && isFocus ? cancelButtonWidth + spacing.spacing12 : 0}
          my={my}
          px={px}
          py={py}
          {...(showShadow && {
            shadowColor: '$shadowColor',
            shadowOffset: SHADOW_OFFSET_SMALL,
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 6,
            '$theme-dark': {
              shadowColor: '$black',
            },
          })}
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
                height="100%"
                maxFontSizeMultiplier={fonts.body1.maxFontSizeMultiplier}
                outlineColor="transparent"
                outlineWidth={0}
                p="$none"
                placeholder={placeholder}
                placeholderTextColor="$neutral2"
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
                width="100%"
                // fix Android TextInput issue when the width is changed
                // (the placeholder text was wrapping in 2 lines when the width was changed)
                {...(isAndroid && {
                  width: value ? undefined : 9999,
                })}
                onChangeText={onChangeTextInput}
                onFocus={onTextInputFocus}
                onSubmitEditing={dismissNativeKeyboard}
                onKeyPress={onKeyPress}
              />
            </ViewGestureHandler>
          </Flex>

          <AnimatePresence>{endAdornment ? <Flex animation="quick">{endAdornment}</Flex> : null}</AnimatePresence>
          <AnimatePresence>
            {showCloseButton && (
              <TouchableArea
                animation="quick"
                backgroundColor={backgroundColor}
                enterStyle={{ opacity: 0, scale: 0 }}
                exitStyle={{ opacity: 0, scale: 0 }}
                onPress={onClose}
              >
                <RotatableChevron color="$neutral3" direction="up" height={iconSizes.icon20} width={iconSizes.icon20} />
              </TouchableArea>
            )}
          </AnimatePresence>
        </Flex>
        {showCancelButton && (
          <Flex
            animation="200ms"
            opacity={isFocus ? 1 : 0}
            pointerEvents={isFocus ? 'auto' : 'none'}
            position="absolute"
            right={0}
            scale={isFocus ? 1 : 0}
            x={isFocus ? 0 : dimensions.fullWidth}
            onLayout={onCancelButtonLayout}
          >
            <TouchableArea hitSlop={16} onPress={onPressCancel}>
              <Text variant="buttonLabel2">{t('common.button.cancel')}</Text>
            </TouchableArea>
          </Flex>
        )}
      </Flex>
    )
  },
)
