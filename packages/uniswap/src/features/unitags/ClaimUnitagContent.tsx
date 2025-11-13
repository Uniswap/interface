import { EventConsumer, EventMapBase } from '@react-navigation/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LayoutChangeEvent } from 'react-native'
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { AnimatePresence, Button, Flex, FlexProps, Input, Text, TouchableArea } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { fonts, imageSizes, spacing } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { getUnitagFormatError, useCanClaimUnitagName } from 'uniswap/src/features/unitags/hooks/useCanClaimUnitagName'
import { UnitagInfoModal } from 'uniswap/src/features/unitags/UnitagInfoModal'
import { UnitagName } from 'uniswap/src/features/unitags/UnitagName'
import { getYourNameString } from 'uniswap/src/features/unitags/utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import {
  OnboardingScreens,
  SharedUnitagScreenParams,
  UnitagEntryPoint,
  UnitagScreens,
} from 'uniswap/src/types/screens/mobile'
import { shortenAddress } from 'utilities/src/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp, isWebPlatform } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useDebounce } from 'utilities/src/time/timing'

const VERIFICATION_DEBOUNCE_MS = 700
const MAX_UNITAG_CHAR_LENGTH = 20

const MAX_INPUT_FONT_SIZE = 36
const MIN_INPUT_FONT_SIZE = 22
const MAX_CHAR_PIXEL_WIDTH = 20
const SLIDE_IN_AMOUNT = isWebPlatform ? 0 : 40

// Used in dynamic font size width calculation to ignore `.` characters
const UNITAG_SUFFIX_CHARS_ONLY = UNITAG_SUFFIX.replaceAll('.', '')

// Accounts for height of image, gap between image and name, and spacing from top of titles
const UNITAG_NAME_ANIMATE_DISTANCE_Y = imageSizes.image100 + spacing.spacing48 + spacing.spacing24

export type ClaimUnitagContentProps = {
  unitagAddress?: string
  entryPoint: UnitagEntryPoint
  animateY?: boolean
  navigationEventConsumer?: EventConsumer<EventMapBase>
  onNavigateContinue?: (params: SharedUnitagScreenParams[UnitagScreens.ChooseProfilePicture]) => void
  onComplete?: (unitag: string) => void
}

export function ClaimUnitagContent({
  unitagAddress,
  entryPoint,
  animateY = true,
  navigationEventConsumer,
  onNavigateContinue,
  onComplete,
}: ClaimUnitagContentProps): JSX.Element {
  const { t } = useTranslation()
  const textInputRef = useRef<Input>(null)

  const inputPlaceholder = getYourNameString(t('unitags.claim.username.default'))

  const [showInfoModal, setShowInfoModal] = useState(false)

  const [showTextInputView, setShowTextInputView] = useState(true)
  const [unitagInputValue, setUnitagInputValue] = useState<string | undefined>(undefined)
  const [isUnitagAvailable, setIsUnitagAvailable] = useState(false)
  const [unitagAvailableError, setUnitagAvailableError] = useState<string>()
  const [showVerificationLoading, setShowVerificationLoading] = useState(false)

  const [unitagNameinputMinWidth, setUnitagNameInputMinWidth] = useState<number | undefined>(undefined)
  const [addressError, setAddressError] = useState<string>()

  const addressViewOpacity = useSharedValue(1)
  const unitagInputContainerTranslateY = useSharedValue(0)
  const addressViewAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: addressViewOpacity.value,
    }
  }, [addressViewOpacity])

  const debouncedInputValue = useDebounce(unitagInputValue, VERIFICATION_DEBOUNCE_MS)
  const { error: canClaimUnitagNameError, loading: isCheckingUnitag } = useCanClaimUnitagName(
    debouncedInputValue || undefined, // set to undefined if the input is empty to clear the error
  )

  const { onLayout, fontSize, onSetFontSize } = useDynamicFontSizing({
    maxCharWidthAtMaxFontSize: MAX_CHAR_PIXEL_WIDTH,
    maxFontSize: MAX_INPUT_FONT_SIZE,
    minFontSize: MIN_INPUT_FONT_SIZE,
  })

  const focusUnitagTextInput = useCallback((): void | null => {
    textInputRef.current?.focus()
  }, [])

  const handleHideInfoModal = useCallback(() => {
    setShowInfoModal(false)
  }, [])

  useEffect(() => {
    return navigationEventConsumer?.addListener('transitionEnd', focusUnitagTextInput)
  }, [navigationEventConsumer, focusUnitagTextInput])

  useEffect(() => {
    const unsubscribe = navigationEventConsumer?.addListener('focus', () => {
      // When returning back to this screen, handle animating the Unitag logo out and text input in
      if (showTextInputView) {
        return
      }

      unitagInputContainerTranslateY.value = withTiming(
        unitagInputContainerTranslateY.value - UNITAG_NAME_ANIMATE_DISTANCE_Y,
        {
          duration: ONE_SECOND_MS / 2,
        },
      )
      setTimeout(() => {
        setShowTextInputView(true)
        addressViewOpacity.value = withTiming(1, { duration: ONE_SECOND_MS / 2 })
        focusUnitagTextInput()
      }, ONE_SECOND_MS)
    })

    return unsubscribe
  }, [navigationEventConsumer, showTextInputView, focusUnitagTextInput])

  const onChangeTextInput = useCallback(
    (text: string): void => {
      if (text.length === 0) {
        onSetFontSize(inputPlaceholder + UNITAG_SUFFIX_CHARS_ONLY)
      } else {
        onSetFontSize(text + UNITAG_SUFFIX_CHARS_ONLY)
      }

      setIsUnitagAvailable(false)
      setShowVerificationLoading(false)
      setUnitagAvailableError(undefined)

      if (text.length > MAX_UNITAG_CHAR_LENGTH) {
        setUnitagAvailableError(getUnitagFormatError(text, t))
        return
      }

      setUnitagInputValue(text.trim())
    },
    [inputPlaceholder, onSetFontSize, t],
  )

  const onPressAddressTooltip = useCallback((): void => {
    dismissNativeKeyboard()
    setShowInfoModal(true)
  }, [])

  const navigateWithAnimation = useCallback(
    (unitag: string) => {
      // Log claim display and action taken
      sendAnalyticsEvent(UnitagEventName.UnitagClaimAvailabilityDisplayed, {
        result: 'available',
      })
      sendAnalyticsEvent(UnitagEventName.UnitagOnboardingActionTaken, { action: 'select' })

      // Animate the Unitag logo in and text input out
      setShowTextInputView(false)

      const initialDelay = ONE_SECOND_MS
      const translateYDuration = ONE_SECOND_MS / 2

      addressViewOpacity.value = withTiming(0, { duration: ONE_SECOND_MS / 2 })
      // Intentionally delay 1s to allow enter/exit animations to finish
      unitagInputContainerTranslateY.value = withDelay(
        initialDelay,
        withTiming(unitagInputContainerTranslateY.value + UNITAG_NAME_ANIMATE_DISTANCE_Y, {
          duration: translateYDuration,
        }),
      )
      // Navigate to ChooseProfilePicture screen after initial delay + translation to allow animations to finish
      setTimeout(() => {
        onComplete?.(unitag)
        if (unitagAddress && onNavigateContinue) {
          onNavigateContinue({ unitag, entryPoint, address: unitagAddress, unitagFontSize: fontSize })
        }
      }, initialDelay + translateYDuration)
    },
    [onComplete, onNavigateContinue, entryPoint, unitagAddress, fontSize],
  )

  useEffect(() => {
    if (!!debouncedInputValue && !isCheckingUnitag) {
      // If unitagError or addressError is defined, it's rendered in UI
      if (entryPoint === OnboardingScreens.Landing && !unitagAddress) {
        const err = new Error('unitagAddress should always be defined')
        logger.error(err, {
          tags: { file: 'ClaimUnitagScreen', function: 'navigateWithAnimation' },
        })
        setAddressError(t('unitags.claim.error.default'))
        setIsUnitagAvailable(false)
        return
      } else if (!canClaimUnitagNameError) {
        setIsUnitagAvailable(true)
      } else {
        sendAnalyticsEvent(UnitagEventName.UnitagClaimAvailabilityDisplayed, {
          result: 'unavailable',
        })
        setIsUnitagAvailable(false)
        setUnitagAvailableError(canClaimUnitagNameError)
      }
    }
  }, [canClaimUnitagNameError, debouncedInputValue, isCheckingUnitag, entryPoint, unitagAddress, t])

  const shouldBlockContinue = (entryPoint === OnboardingScreens.Landing && !unitagAddress) || !unitagInputValue

  const onPressContinue = useEvent((): void => {
    if (isCheckingUnitag) {
      setShowVerificationLoading(true)
      return
    }

    if (unitagInputValue && isUnitagAvailable) {
      navigateWithAnimation(unitagInputValue)
    }
  })

  const webStyling: FlexProps = isWebPlatform
    ? {
        backgroundColor: '$surface1',
        borderRadius: '$rounded20',
        borderWidth: 1,
        borderColor: '$surface3',
        py: '$spacing12',
        px: '$spacing20',
        mb: '$spacing20',
        width: '100%',
        justifyContent: 'space-between',
      }
    : {}

  const getInitialUnitagNameInputWidth = (event: LayoutChangeEvent): void => {
    if (unitagNameinputMinWidth) {
      return
    }

    // Fix from WALL-4822 for Android
    // Sets input minWidth to initial input width + 1 point. Initial width is not sufficient after clearing the input.
    setUnitagNameInputMinWidth(event.nativeEvent.layout.width + 1)
  }

  return (
    <>
      <Flex
        centered
        gap="$spacing12"
        mt="$spacing24"
        onLayout={(event): void => {
          onLayout(event)
        }}
      >
        {/* Fixed text that animates in when TextInput is animated out */}
        <AnimatedFlex
          centered
          width="100%"
          height={fonts.heading2.lineHeight}
          style={{ transform: [{ translateY: animateY ? unitagInputContainerTranslateY : 0 }] }}
        >
          {!showTextInputView && (
            <Flex position="absolute">
              <UnitagName animateText animateIcon textProps={{ fontSize }} name={unitagInputValue} opacity={1} />
            </Flex>
          )}
          <AnimatePresence>
            {showTextInputView && (
              <Flex
                key="input-container"
                row
                animation="quick"
                enterStyle={{ opacity: 0, x: SLIDE_IN_AMOUNT }}
                exitStyle={{ opacity: 0, x: SLIDE_IN_AMOUNT }}
                gap="$none"
                {...webStyling}
              >
                <TextInput
                  ref={textInputRef}
                  autoFocus={!isMobileApp}
                  blurOnSubmit={!isWebPlatform}
                  autoCapitalize="none"
                  autoCorrect={false}
                  borderWidth="$none"
                  borderRadius={isWebPlatform ? 0 : undefined}
                  fontFamily="$heading"
                  fontSize={isWebPlatform ? fonts.subheading1.fontSize : fontSize}
                  fontWeight="$book"
                  numberOfLines={1}
                  p="$none"
                  placeholder={inputPlaceholder}
                  placeholderTextColor="$neutral3"
                  returnKeyType="done"
                  testID={TestID.WalletNameInput}
                  textAlign="left"
                  value={unitagInputValue}
                  width={isWebPlatform ? '100%' : undefined}
                  minWidth={unitagNameinputMinWidth}
                  allowFontScaling={false}
                  maxFontSizeMultiplier={1}
                  onChangeText={onChangeTextInput}
                  onSubmitEditing={onPressContinue}
                  onLayout={getInitialUnitagNameInputWidth}
                />
                <Flex
                  animation="lazy"
                  enterStyle={{ opacity: 0, x: SLIDE_IN_AMOUNT }}
                  exitStyle={{ opacity: 0, x: SLIDE_IN_AMOUNT }}
                >
                  {/* This is a workaround for aligning a unitag suffix with a unitag name.*/}
                  {/* Some devices render text inside text input and text component vertically shifted.*/}
                  <TextInput
                    editable={false}
                    borderWidth="$none"
                    borderRadius={isWebPlatform ? 0 : undefined}
                    fontFamily="$heading"
                    fontSize={isWebPlatform ? fonts.subheading1.fontSize : fontSize}
                    fontWeight="$book"
                    numberOfLines={1}
                    p="$none"
                    placeholderTextColor="$neutral3"
                    textAlign="left"
                    value={UNITAG_SUFFIX}
                    allowFontScaling={false}
                    maxFontSizeMultiplier={1}
                  />
                </Flex>
              </Flex>
            )}
          </AnimatePresence>
        </AnimatedFlex>
        {unitagAddress && (
          <AnimatedFlex
            row
            alignItems="center"
            gap="$spacing8"
            style={addressViewAnimatedStyle}
            onPress={onPressAddressTooltip}
          >
            <Text color="$neutral2" variant="subheading2">
              {shortenAddress({ address: unitagAddress })}
            </Text>
            <TouchableArea onPress={onPressAddressTooltip}>
              <InfoCircleFilled color="$neutral3" size="$icon.20" />
            </TouchableArea>
          </AnimatedFlex>
        )}

        <AvailabilityStatus
          unitagAvailableError={unitagAvailableError}
          addressError={addressError}
          isUnitagAvailable={isUnitagAvailable}
          showTextInputView={showTextInputView}
          mt="$spacing4"
          mb={unitagAddress ? undefined : '$spacing20'}
        />
      </Flex>
      {/* Wrap button in a TouchableArea to add onPress capabilities when the button is disabled. */}
      <TouchableArea disabledStyle={{ cursor: 'default' }} disabled={shouldBlockContinue} onPress={onPressContinue}>
        <Flex row justifyContent="flex-end">
          <Button
            size="large"
            variant="branded"
            isDisabled={shouldBlockContinue || !isUnitagAvailable}
            testID={TestID.Continue}
            loading={showVerificationLoading && isCheckingUnitag} // the validation happens really quickly so only show a loading spinner when the user explicitly tries to continue and we're still checking availability
            onPress={onPressContinue}
          >
            {t('common.button.continue')}
          </Button>
        </Flex>
      </TouchableArea>
      <UnitagInfoModal isOpen={showInfoModal} unitagAddress={unitagAddress} onClose={handleHideInfoModal} />
    </>
  )
}

const animationProps: FlexProps = {
  animation: 'quick',
  enterStyle: { opacity: 0, y: 10 },
}

function AvailabilityStatus({
  unitagAvailableError,
  addressError,
  isUnitagAvailable,
  showTextInputView,
  ...rest
}: {
  unitagAvailableError: string | undefined
  addressError: string | undefined
  isUnitagAvailable: boolean
  showTextInputView: boolean
} & FlexProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex row gap="$spacing8" minHeight={fonts.body2.lineHeight} {...rest}>
      <AnimatePresence>
        {unitagAvailableError || addressError ? (
          <Flex key="error" {...animationProps}>
            <Text key="error" color="$statusCritical" textAlign="center" variant="body2">
              {unitagAvailableError || addressError}
            </Text>
          </Flex>
        ) : isUnitagAvailable && showTextInputView ? (
          <Flex key="available" row alignItems="center" gap="$spacing4" {...animationProps}>
            <CheckmarkCircle color="$accent1" size="$icon.16" />
            <Text textAlign="center" variant="body2">
              {t('unitags.claim.available')}
            </Text>
          </Flex>
        ) : null}
      </AnimatePresence>
    </Flex>
  )
}
