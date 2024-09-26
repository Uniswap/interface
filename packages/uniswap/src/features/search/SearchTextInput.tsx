import { forwardRef, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
// eslint-disable-next-line no-restricted-imports
import type {
  LayoutChangeEvent,
  NativeSyntheticEvent,
  TextInput as NativeTextInput,
  TextInputFocusEventData,
} from 'react-native'
import {
  AnimatePresence,
  Button,
  Flex,
  Input,
  InputProps,
  SpaceTokens,
  Text,
  TouchableArea,
  isWeb,
  useComposedRefs,
} from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { Search } from 'ui/src/components/icons/Search'
import { X } from 'ui/src/components/icons/X'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { SHADOW_OFFSET_SMALL } from 'uniswap/src/components/BaseCard/BaseCard'
import { ViewGestureHandler } from 'uniswap/src/components/ViewGestureHandler/ViewGestureHandler'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { isAndroid, isIOS } from 'utilities/src/platform'

const DEFAULT_MIN_HEIGHT = 48

export const springConfig = {
  stiffness: 1000,
  damping: 500,
  mass: 3,
  overshootClamping: true,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
}

export type SearchTextInputProps = InputProps & {
  onCancel?: () => void
  onClose?: () => void
  clearIcon?: JSX.Element
  disableClearable?: boolean
  endAdornment?: JSX.Element | null
  showShadow?: boolean
  py?: SpaceTokens
  px?: SpaceTokens
  hideIcon?: boolean
  minHeight?: number
}

export const SearchTextInput = forwardRef<NativeTextInput, SearchTextInputProps>(
  // eslint-disable-next-line complexity
  function _SearchTextInput(props, ref) {
    const dimensions = useDeviceDimensions()
    const { t } = useTranslation()
    const {
      autoFocus,
      backgroundColor = '$surface2',
      clearIcon,
      disableClearable = isWeb,
      endAdornment,
      onCancel,
      onClose,
      onChangeText,
      onFocus,
      placeholder,
      py = '$spacing12',
      px = '$spacing16',
      showShadow,
      value,
      hideIcon,
      minHeight = DEFAULT_MIN_HEIGHT,
    } = props

    const inputRef = useRef<Input>(null)
    const combinedRef = useComposedRefs<Input>(inputRef, ref)
    const showCancelButton = !!onCancel
    const showCloseButton = !!onClose
    const [isFocus, setIsFocus] = useState(false)
    const [cancelButtonWidth, setCancelButtonWidth] = useState(showCancelButton ? 40 : 0)
    const [showClearButton, setShowClearButton] = useState(value && value.length > 0 && !disableClearable)

    const onPressCancel = (): void => {
      inputRef.current?.clear()
      setIsFocus(false)
      setShowClearButton(false)
      dismissNativeKeyboard()
      sendAnalyticsEvent(WalletEventName.ExploreSearchCancel, { query: value || '' })
      onChangeText?.('')
      onCancel?.()
    }

    const onCancelButtonLayout = useCallback((event: LayoutChangeEvent) => {
      setCancelButtonWidth(event.nativeEvent.layout.width)
    }, [])

    const onClear = (): void => {
      inputRef.current?.clear()
      onChangeText?.('')
      setShowClearButton(false)
    }

    const onTextInputFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>): void => {
      onFocus?.(e)
      setIsFocus(true)
    }

    const onChangeTextInput = useCallback(
      (text: string) => {
        onChangeText?.(text)
        setShowClearButton(text.length > 0 && !disableClearable)
      },
      [disableClearable, onChangeText],
    )

    return (
      <Flex row shrink alignItems="center">
        <Flex
          fill
          grow
          row
          alignItems="center"
          animateOnly={['marginRight']}
          animation="quick"
          backgroundColor={backgroundColor}
          borderRadius="$roundedFull"
          gap="$spacing8"
          minHeight={minHeight}
          mr={showCancelButton && isFocus ? cancelButtonWidth + spacing.spacing12 : 0}
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
                borderWidth={0}
                fontFamily="$body"
                fontWeight="$book"
                height="100%"
                maxFontSizeMultiplier={fonts.body1.maxFontSizeMultiplier}
                outlineColor="transparent"
                outlineWidth={0}
                p="$none"
                placeholder={placeholder}
                placeholderTextColor="$neutral3"
                position="absolute"
                returnKeyType="done"
                testID={TestID.ExploreSearchInput}
                textContentType="none"
                top={0}
                // fix horizontal text wobble on iOS
                {...(isIOS && {
                  width: '100%',
                })}
                // avoid turning into a controlled input if not wanting to
                {...(typeof value !== 'undefined' && {
                  value,
                })}
                // fix Android TextInput issue when the width is changed
                // (the placeholder text was wrapping in 2 lines when the width was changed)
                {...(isAndroid && {
                  width: value ? undefined : 9999,
                })}
                width="100%"
                onChangeText={onChangeTextInput}
                onFocus={onTextInputFocus}
                onSubmitEditing={dismissNativeKeyboard}
              />
            </ViewGestureHandler>
          </Flex>

          <AnimatePresence>
            {showClearButton ? (
              <Button
                // TODO(MOB-3059): tamagui should fix this internally and then we can remove animateOnly
                animateOnly={['transform', 'opacity']}
                animation="quick"
                backgroundColor="$surface3"
                borderRadius="$roundedFull"
                enterStyle={{ opacity: 0, scale: 0 }}
                exitStyle={{ opacity: 0, scale: 0 }}
                icon={clearIcon ?? <X color="$neutral3" size="$icon.16" />}
                p="$spacing4"
                theme="secondary"
                onPress={onClear}
              />
            ) : endAdornment ? (
              <Flex
                animation="quick"
                opacity={isFocus && showClearButton ? 0 : 1}
                scale={isFocus && showClearButton ? 0 : 1}
              >
                {endAdornment}
              </Flex>
            ) : null}
          </AnimatePresence>
          <AnimatePresence>
            {showCloseButton && (
              <Button
                animation="quick"
                backgroundColor={backgroundColor}
                enterStyle={{ opacity: 0, scale: 0 }}
                exitStyle={{ opacity: 0, scale: 0 }}
                icon={
                  <RotatableChevron
                    color="$neutral3"
                    direction="up"
                    height={iconSizes.icon20}
                    width={iconSizes.icon20}
                  />
                }
                p="$none"
                theme="secondary"
                onPress={onClose}
              />
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
