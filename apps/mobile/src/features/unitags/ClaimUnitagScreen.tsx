import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ADDRESS_ZERO } from '@uniswap/v3-sdk'
import { default as React, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Keyboard } from 'react-native'
import { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { navigate } from 'src/app/navigation/rootNavigation'
import { UnitagStackParamList } from 'src/app/navigation/types'
import Trace from 'src/components/Trace/Trace'
import { SafeKeyboardOnboardingScreen } from 'src/features/onboarding/SafeKeyboardOnboardingScreen'
import { UnitagName } from 'src/features/unitags/UnitagName'
import { OnboardingScreens, Screens, UnitagScreens } from 'src/screens/Screens'
import { useAddBackButton } from 'src/utils/useAddBackButton'
import {
  AnimatePresence,
  AnimatedFlex,
  Button,
  Flex,
  Icons,
  Image,
  Text,
  TouchableArea,
  useSporeColors,
} from 'ui/src'
import { ENS_LOGO } from 'ui/src/assets'
import InfoCircle from 'ui/src/assets/icons/info-circle.svg'
import { fonts, iconSizes, imageSizes, spacing } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { TextInput } from 'wallet/src/components/input/TextInput'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'wallet/src/components/text/LearnMoreLink'
import { Pill } from 'wallet/src/components/text/Pill'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { UNITAG_SUFFIX, UNITAG_SUFFIX_NO_LEADING_DOT } from 'wallet/src/features/unitags/constants'
import { useCanClaimUnitagName } from 'wallet/src/features/unitags/hooks'
import { usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { ElementName, ModalName, UnitagEventName } from 'wallet/src/telemetry/constants'
import { shortenAddress } from 'wallet/src/utils/addresses'
import { useDynamicFontSizing } from 'wallet/src/utils/useDynamicFontSizing'

const MAX_UNITAG_CHAR_LENGTH = 20

const MAX_INPUT_FONT_SIZE = 36
const MIN_INPUT_FONT_SIZE = 22
const MAX_CHAR_PIXEL_WIDTH = 20

const FIXED_INFO_PILL_WIDTH = 128

// Used in dynamic font size width calculation to ignore `.` characters
const UNITAG_SUFFIX_CHARS_ONLY = UNITAG_SUFFIX.replaceAll('.', '')

// Accounts for height of image, gap between image and name, and spacing from top of titles
const UNITAG_NAME_ANIMATE_DISTANCE_Y = imageSizes.image100 + spacing.spacing48 + spacing.spacing24

type Props = NativeStackScreenProps<UnitagStackParamList, UnitagScreens.ClaimUnitag>

export function ClaimUnitagScreen({ navigation, route }: Props): JSX.Element {
  const { entryPoint, address } = route.params

  useAddBackButton(navigation)
  const { t } = useTranslation()
  const colors = useSporeColors()

  const inputPlaceholder = t('yourname')

  // In onboarding flow, delete pending accounts and create account actions happen right before navigation
  // So pendingAccountAddress must be fetched in this component and can't be passed in params
  const pendingAccountAddress = Object.values(usePendingAccounts())?.[0]?.address
  const unitagAddress = address || pendingAccountAddress

  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showClaimPeriodInfoModal, setShowClaimPeriodInfoModal] = useState(false)

  const [showTextInputView, setShowTextInputView] = useState(true)
  const [unitagInputValue, setUnitagInputValue] = useState<string | undefined>(undefined)
  const [isCheckingUnitag, setIsCheckingUnitag] = useState(false)
  const [shouldBlockContinue, setShouldBlockContinue] = useState(false)
  const [unitagToCheck, setUnitagToCheck] = useState<string | undefined>(undefined)

  const addressViewOpacity = useSharedValue(1)
  const unitagInputContainerTranslateY = useSharedValue(0)
  const addressViewAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: addressViewOpacity.value,
    }
  })

  const {
    error: canClaimUnitagNameError,
    loading: loadingUnitagErrorCheck,
    requiresENSMatch,
  } = useCanClaimUnitagName(unitagAddress, unitagToCheck)

  const { onLayout, fontSize, onSetFontSize } = useDynamicFontSizing(
    MAX_CHAR_PIXEL_WIDTH,
    MAX_INPUT_FONT_SIZE,
    MIN_INPUT_FONT_SIZE
  )

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
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
        }
      )
      setTimeout(() => {
        setShowTextInputView(true)
        addressViewOpacity.value = withTiming(1, { duration: ONE_SECOND_MS / 2 })
      }, ONE_SECOND_MS)
    })

    return unsubscribe
  }, [
    navigation,
    showTextInputView,
    setShowTextInputView,
    addressViewOpacity,
    unitagInputContainerTranslateY,
  ])

  const onChangeTextInput = useCallback(
    (text: string): void => {
      setShouldBlockContinue(false)

      if (text.length > MAX_UNITAG_CHAR_LENGTH) {
        return
      }

      if (text.length === 0) {
        onSetFontSize(inputPlaceholder + UNITAG_SUFFIX_CHARS_ONLY)
      } else {
        onSetFontSize(text + UNITAG_SUFFIX_CHARS_ONLY)
      }

      setUnitagInputValue(text?.trim().toLowerCase())
    },
    [inputPlaceholder, onSetFontSize]
  )

  const onPressAddressTooltip = (): void => {
    Keyboard.dismiss()
    setShowInfoModal(true)
  }

  const onPressMaybeLater = (): void => {
    sendWalletAnalyticsEvent(UnitagEventName.UnitagOnboardingActionTaken, { action: 'later' })
    // Navigate to next screen if in onboarding
    navigate(Screens.OnboardingStack, {
      screen: OnboardingScreens.WelcomeWallet,
      params: {
        importType: ImportType.CreateNew,
        entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
      },
    })
  }

  const navigateWithAnimation = useCallback(
    (unitag: string) => {
      if (!unitagAddress) {
        const err = new Error('unitagAddress should always be defined')
        logger.error(err, {
          tags: { file: 'ClaimUnitagScreen', function: 'navigateWithAnimation' },
        })
        throw err
      }

      // Log claim display and action taken
      sendWalletAnalyticsEvent(UnitagEventName.UnitagClaimAvailabilityDisplayed, {
        result: 'available',
      })
      sendWalletAnalyticsEvent(UnitagEventName.UnitagOnboardingActionTaken, { action: 'select' })

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
        })
      )
      // Navigate to ChooseProfilePicture screen after initial delay + translation to allow animations to finish
      setTimeout(() => {
        navigate(
          entryPoint === OnboardingScreens.Landing ? Screens.OnboardingStack : Screens.UnitagStack,
          {
            screen: UnitagScreens.ChooseProfilePicture,
            params: { unitag, entryPoint, address: unitagAddress, unitagFontSize: fontSize },
          }
        )
      }, initialDelay + translateYDuration)
    },
    [addressViewOpacity, entryPoint, unitagAddress, unitagInputContainerTranslateY, fontSize]
  )

  // Handle when useUnitagError completes loading and returns a result after onPressContinue is called
  useEffect(() => {
    if (isCheckingUnitag && !!unitagToCheck && !loadingUnitagErrorCheck) {
      setIsCheckingUnitag(false)
      // If unitagError is defined, it's rendered in UI
      if (!canClaimUnitagNameError) {
        navigateWithAnimation(unitagToCheck)
      } else {
        sendWalletAnalyticsEvent(UnitagEventName.UnitagClaimAvailabilityDisplayed, {
          result: requiresENSMatch ? 'restricted' : 'unavailable',
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
    requiresENSMatch,
  ])

  const onPressContinue = (): void => {
    if (unitagInputValue !== unitagToCheck) {
      setIsCheckingUnitag(true)
      setUnitagToCheck(unitagInputValue)
    }
  }

  const onPressClaimPeriodLearnMore = (): void => {
    Keyboard.dismiss()
    setShowClaimPeriodInfoModal(true)
  }

  const title = entryPoint === Screens.Home ? t('Claim your username') : t('Choose your username')

  return (
    <SafeKeyboardOnboardingScreen
      subtitle={t('This is your unique name that anyone can send crypto to.')}
      title={title}>
      <Flex
        centered
        gap="$spacing16"
        onLayout={(event): void => {
          onLayout(event)
          onSetFontSize(inputPlaceholder + UNITAG_SUFFIX_CHARS_ONLY)
        }}>
        {/* Fixed text that animates in when TextInput is animated out */}
        <AnimatedFlex
          centered
          height={fonts.heading2.lineHeight}
          style={{ transform: [{ translateY: unitagInputContainerTranslateY }] }}>
          {!showTextInputView && (
            <Flex position="absolute">
              <UnitagName
                animateIcon
                fontSize={fontSize}
                name={unitagInputValue}
                opacity={showTextInputView ? 0 : 1}
              />
            </Flex>
          )}
          <AnimatePresence>
            {showTextInputView && (
              <Flex
                key="input-container"
                row
                animation="quick"
                enterStyle={{ opacity: 0, x: 40 }}
                exitStyle={{ opacity: 0, x: 40 }}
                gap="$none">
                <TextInput
                  autoFocus
                  blurOnSubmit
                  autoCapitalize="none"
                  autoCorrect={false}
                  borderWidth={0}
                  fontFamily="$heading"
                  fontSize={fontSize}
                  fontWeight="$large"
                  numberOfLines={1}
                  p="$none"
                  placeholder={inputPlaceholder}
                  placeholderTextColor="$neutral3"
                  returnKeyType="done"
                  textAlign="left"
                  value={unitagInputValue}
                  onChangeText={onChangeTextInput}
                />
                <Text
                  key={UNITAG_SUFFIX}
                  animation="lazy"
                  color="$neutral1"
                  enterStyle={{ opacity: 0, x: 40 }}
                  exitStyle={{ opacity: 0, x: 40 }}
                  fontFamily="$heading"
                  fontSize={fontSize}
                  fontWeight={fonts.heading2.fontWeight}
                  lineHeight={fonts.heading2.lineHeight}>
                  {UNITAG_SUFFIX}
                </Text>
              </Flex>
            )}
          </AnimatePresence>
        </AnimatedFlex>
        <AnimatedFlex
          row
          alignItems="center"
          gap="$spacing8"
          style={addressViewAnimatedStyle}
          onPress={onPressAddressTooltip}>
          <Text color="$neutral2" variant="subheading2">
            {shortenAddress(unitagAddress ?? ADDRESS_ZERO)}
          </Text>
          <TouchableArea
            onPress={(): void => {
              Keyboard.dismiss()
              setShowInfoModal(true)
            }}>
            <InfoCircle color={colors.neutral2.get()} height={20} width={20} />
          </TouchableArea>
        </AnimatedFlex>
        {canClaimUnitagNameError && unitagToCheck === unitagInputValue && (
          <Flex row gap="$spacing8">
            <Text
              color={requiresENSMatch ? '$neutral2' : '$statusCritical'}
              textAlign="center"
              variant="body2">
              {canClaimUnitagNameError} {requiresENSMatch && t('Learn more about our')}{' '}
              {requiresENSMatch && (
                <Text color="$DEP_blue300" onPress={onPressClaimPeriodLearnMore}>
                  {t('claim period')}
                </Text>
              )}
              {requiresENSMatch && '.'}
            </Text>
          </Flex>
        )}
      </Flex>
      <Flex gap="$spacing24" justifyContent="flex-end">
        {entryPoint === OnboardingScreens.Landing && (
          <Trace logPress element={ElementName.Skip}>
            <TouchableArea onPress={onPressMaybeLater}>
              <Text color="$accent1" textAlign="center" variant="buttonLabel2">
                {t('Maybe later')}
              </Text>
            </TouchableArea>
          </Trace>
        )}
        <Button
          disabled={!unitagInputValue || isCheckingUnitag || shouldBlockContinue}
          size="medium"
          theme="primary"
          onPress={onPressContinue}>
          {isCheckingUnitag ? (
            <Flex height={fonts.buttonLabel1.lineHeight}>
              <ActivityIndicator color={colors.sporeWhite.val} />
            </Flex>
          ) : (
            t('Continue')
          )}
        </Button>
      </Flex>
      {showInfoModal && (
        <InfoModal unitagAddress={unitagAddress} onClose={(): void => setShowInfoModal(false)} />
      )}
      {showClaimPeriodInfoModal && (
        <ClaimPeriodInfoModal
          username={unitagToCheck ?? ''}
          onClose={(): void => setShowClaimPeriodInfoModal(false)}
        />
      )}
    </SafeKeyboardOnboardingScreen>
  )
}

const InfoModal = ({
  unitagAddress,
  onClose,
}: {
  unitagAddress: string | undefined
  onClose: () => void
}): JSX.Element => {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const usernamePlaceholder = t('yourname')

  return (
    <WarningModal
      backgroundIconColor={colors.surface1.get()}
      caption={t(
        `Usernames transform complex 0x addresses into readable names. By claiming a {{unitagSuffix}} username, you can easily send and receive crypto and build out a public web3 profile.`,
        { unitagSuffix: UNITAG_SUFFIX_NO_LEADING_DOT }
      )}
      closeText={t('Close')}
      icon={
        <Flex centered row gap="$spacing4">
          <Pill
            customBackgroundColor={colors.surface1.val}
            foregroundColor={colors.neutral2.val}
            label={shortenAddress(unitagAddress ?? ADDRESS_ZERO)}
            px="$spacing12"
            shadowColor="$neutral3"
            shadowOpacity={0.4}
            shadowRadius="$spacing4"
            textVariant="buttonLabel4"
            width={FIXED_INFO_PILL_WIDTH}
          />
          <Flex p="$spacing2" shadowColor="$accent1" shadowOpacity={1} shadowRadius="$spacing16">
            <Icons.LinkHorizontalAlt color={colors.neutral3.get()} size={iconSizes.icon24} />
          </Flex>
          <Pill
            customBackgroundColor={colors.surface1.val}
            foregroundColor={colors.accent1.val}
            px="$spacing12"
            shadowColor="$neutral3"
            shadowOpacity={0.4}
            shadowRadius="$spacing4">
            <Text color="$accent1" variant="buttonLabel4">
              {usernamePlaceholder}
              <Text color="$neutral2" variant="buttonLabel4">
                {UNITAG_SUFFIX}
              </Text>
            </Text>
          </Pill>
        </Flex>
      }
      modalName={ModalName.TooltipContent}
      title={t('A simplified address')}
      onClose={onClose}
    />
  )
}

const ClaimPeriodInfoModal = ({
  onClose,
  username,
}: {
  onClose: () => void
  username: string
}): JSX.Element => {
  const colors = useSporeColors()
  const { t } = useTranslation()

  return (
    <WarningModal
      backgroundIconColor={colors.surface1.get()}
      caption={t(
        `For a limited time, the username {{username}} is reserved. Import the wallet that owns {{username}}.eth ENS to claim this username or try again after the claim period.`,
        { username }
      )}
      closeText={t('Close')}
      icon={
        <Image
          height={imageSizes.image48}
          resizeMode="contain"
          source={ENS_LOGO}
          width={imageSizes.image48}
        />
      }
      modalName={ModalName.ENSClaimPeriod}
      title={t('ENS claim period')}
      onClose={onClose}>
      <LearnMoreLink url={uniswapUrls.helpArticleUrls.unitagClaimPeriod} />
    </WarningModal>
  )
}
