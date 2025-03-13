import { EventConsumer, EventMapBase } from '@react-navigation/core'
import { ADDRESS_ZERO } from '@uniswap/v3-sdk'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent } from 'react-native'
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { AnimatePresence, Button, Flex, FlexProps, Input, Text, TouchableArea, useSporeColors } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDynamicFontSizing } from 'ui/src/hooks/useDynamicFontSizing'
import { fonts, imageSizes, spacing } from 'ui/src/theme'
import { TextInput } from 'uniswap/src/components/input/TextInput'
import { UnitagEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import {
  OnboardingScreens,
  SharedUnitagScreenParams,
  UnitagEntryPoint,
  UnitagScreens,
} from 'uniswap/src/types/screens/mobile'
import { shortenAddress } from 'utilities/src/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { logger } from 'utilities/src/logger/logger'
import { isExtension, isMobileApp } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { UnitagInfoModal } from 'wallet/src/features/unitags/UnitagInfoModal'
import { UnitagName } from 'wallet/src/features/unitags/UnitagName'
import { useCanClaimUnitagName } from 'wallet/src/features/unitags/hooks'
import { getYourNameString } from 'wallet/src/features/unitags/utils'

const MAX_UNITAG_CHAR_LENGTH = 20

const MAX_INPUT_FONT_SIZE = 36
const MIN_INPUT_FONT_SIZE = 22
const MAX_CHAR_PIXEL_WIDTH = 20
const SLIDE_IN_AMOUNT = isExtension ? 0 : 40

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
  const colors = useSporeColors()
  const textInputRef = useRef<Input>(null)

  const inputPlaceholder = getYourNameString(t('unitags.claim.username.default'))

  const [showInfoModal, setShowInfoModal] = useState(false)

  const [showTextInputView, setShowTextInputView] = useState(true)
  const [unitagInputValue, setUnitagInputValue] = useState<string | undefined>(undefined)
  const [isCheckingUnitag, setIsCheckingUnitag] = useState(false)
  const [shouldBlockContinue, setShouldBlockContinue] = useState(false)
  const [unitagToCheck, setUnitagToCheck] = useState<string | undefined>(undefined)
  const [unitagNameinputMinWidth, setUnitagNameInputMinWidth] = useState<number | undefined>(undefined)
  const [addressError, setAddressError] = useState<string>()

  const addressViewOpacity = useSharedValue(1)
  const unitagInputContainerTranslateY = useSharedValue(0)
  const addressViewAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: addressViewOpacity.value,
    }
  }, [addressViewOpacity])

  const { error: canClaimUnitagNameError, loading: loadingUnitagErrorCheck } = useCanClaimUnitagName(unitagToCheck)

  const { onLayout, fontSize, onSetFontSize } = useDynamicFontSizing(
    MAX_CHAR_PIXEL_WIDTH,
    MAX_INPUT_FONT_SIZE,
    MIN_INPUT_FONT_SIZE,
  )

  const focusUniTagTextInput = (): void | null => textInputRef.current && textInputRef.current.focus()

  useEffect(() => {
    return navigationEventConsumer?.addListener('transitionEnd', () => {
      focusUniTagTextInput()
    })
  }, [navigationEventConsumer])

  useEffect(() => {
    const unsubscribe = navigationEventConsumer?.addListener('focus', () => {
      // Reset the Unitag to check
      setUnitagToCheck(undefined)

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
        focusUniTagTextInput()
      }, ONE_SECOND_MS)
    })

    return unsubscribe
  }, [
    navigationEventConsumer,
    showTextInputView,
    setShowTextInputView,
    addressViewOpacity,
    unitagInputContainerTranslateY,
  ])

  const onChangeTextInput = useCallback(
    (text: string): void => {
      setShouldBlockContinue(false)
      setUnitagToCheck(undefined)

      if (text.length > MAX_UNITAG_CHAR_LENGTH) {
        return
      }

      if (text.length === 0) {
        onSetFontSize(inputPlaceholder + UNITAG_SUFFIX_CHARS_ONLY)
      } else {
        onSetFontSize(text + UNITAG_SUFFIX_CHARS_ONLY)
      }

      setUnitagInputValue(text?.trim())
    },
    [inputPlaceholder, onSetFontSize],
  )

  const onPressAddressTooltip = (): void => {
    dismissNativeKeyboard()
    setShowInfoModal(true)
  }

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
    [
      onComplete,
      onNavigateContinue,
      addressViewOpacity,
      entryPoint,
      unitagAddress,
      unitagInputContainerTranslateY,
      fontSize,
    ],
  )

  // Handle when useUnitagError completes loading and returns a result after onPressContinue is called
  useEffect(() => {
    if (isCheckingUnitag && !!unitagToCheck && !loadingUnitagErrorCheck) {
      setIsCheckingUnitag(false)
      // If unitagError or addressError is defined, it's rendered in UI
      if (entryPoint === OnboardingScreens.Landing && !unitagAddress) {
        const err = new Error('unitagAddress should always be defined')
        logger.error(err, {
          tags: { file: 'ClaimUnitagScreen', function: 'navigateWithAnimation' },
        })
        setAddressError(t('unitags.claim.error.default'))
        setShouldBlockContinue(true)
        return
      } else if (!canClaimUnitagNameError) {
        navigateWithAnimation(unitagToCheck)
      } else {
        sendAnalyticsEvent(UnitagEventName.UnitagClaimAvailabilityDisplayed, {
          result: 'unavailable',
        })
        setShouldBlockContinue(true)
      }
    }
  }, [
    canClaimUnitagNameError,
    loadingUnitagErrorCheck,
    unitagToCheck,
    isCheckingUnitag,
    navigateWithAnimation,
    entryPoint,
    unitagAddress,
    t,
  ])

  const onPressContinue = (): void => {
    if (unitagInputValue !== unitagToCheck) {
      setIsCheckingUnitag(true)
      setUnitagToCheck(unitagInputValue)
    }
  }

  const extensionStyling: FlexProps = isExtension
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
    // Sets input minWidth to initial input width + 1 point. Initial width is not sufficent after clearing the input.
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
          onSetFontSize(inputPlaceholder + UNITAG_SUFFIX_CHARS_ONLY)
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
              <UnitagName animateIcon fontSize={fontSize} name={unitagInputValue} opacity={showTextInputView ? 0 : 1} />
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
                {...extensionStyling}
              >
                <TextInput
                  ref={textInputRef}
                  autoFocus={!isMobileApp}
                  blurOnSubmit={!isExtension}
                  autoCapitalize="none"
                  autoCorrect={false}
                  borderWidth="$none"
                  borderRadius={isExtension ? 0 : undefined}
                  fontFamily="$heading"
                  fontSize={isExtension ? fonts.subheading1.fontSize : fontSize}
                  fontWeight="$book"
                  numberOfLines={1}
                  p="$none"
                  placeholder={inputPlaceholder}
                  placeholderTextColor="$neutral3"
                  returnKeyType="done"
                  testID={TestID.WalletNameInput}
                  textAlign="left"
                  value={unitagInputValue}
                  width={isExtension ? '100%' : undefined}
                  minWidth={unitagNameinputMinWidth}
                  onChangeText={onChangeTextInput}
                  onSubmitEditing={onPressContinue}
                  onLayout={getInitialUnitagNameInputWidth}
                />
                <Text
                  key={UNITAG_SUFFIX}
                  animation="lazy"
                  color="$neutral1"
                  enterStyle={{ opacity: 0, x: SLIDE_IN_AMOUNT }}
                  exitStyle={{ opacity: 0, x: SLIDE_IN_AMOUNT }}
                  fontFamily="$heading"
                  fontSize={isExtension ? fonts.subheading1.fontSize : fontSize}
                  fontWeight="$book"
                  lineHeight={fonts.heading2.lineHeight}
                >
                  {UNITAG_SUFFIX}
                </Text>
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
              {shortenAddress(unitagAddress ?? ADDRESS_ZERO)}
            </Text>
            <TouchableArea
              onPress={(): void => {
                dismissNativeKeyboard()
                setShowInfoModal(true)
              }}
            >
              <InfoCircleFilled color={colors.neutral3.get()} size="$icon.20" />
            </TouchableArea>
          </AnimatedFlex>
        )}

        <Flex row gap="$spacing8" minHeight={fonts.body2.lineHeight} mt={unitagAddress ? undefined : '$spacing24'}>
          <Text color="$statusCritical" textAlign="center" variant="body2">
            {canClaimUnitagNameError || addressError}
          </Text>
        </Flex>
      </Flex>
      <Flex row justifyContent="flex-end">
        <Button
          size={entryPoint === OnboardingScreens.Landing ? 'large' : 'medium'}
          variant="branded"
          isDisabled={
            (entryPoint === OnboardingScreens.Landing && !unitagAddress) ||
            !unitagInputValue ||
            isCheckingUnitag ||
            shouldBlockContinue
          }
          testID={TestID.Continue}
          loading={isCheckingUnitag}
          onPress={onPressContinue}
        >
          {t('common.button.continue')}
        </Button>
      </Flex>
      <UnitagInfoModal
        isOpen={showInfoModal}
        unitagAddress={unitagAddress}
        onClose={(): void => setShowInfoModal(false)}
      />
    </>
  )
}
