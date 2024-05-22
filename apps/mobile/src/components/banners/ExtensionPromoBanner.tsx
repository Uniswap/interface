import { useTranslation } from 'react-i18next'
import { Keyboard, StyleProp, ViewStyle } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import {
  Flex,
  Image,
  Text,
  TouchableArea,
  useDeviceDimensions,
  useIsDarkMode,
  useIsShortMobileDevice,
  useSporeColors,
} from 'ui/src'
import { EXTENSION_PROMO_BANNER_DARK, EXTENSION_PROMO_BANNER_LIGHT } from 'ui/src/assets'
import { borderRadii, iconSizes, spacing } from 'ui/src/theme'
import {
  ExtensionOnboardingState,
  setExtensionOnboardingState,
} from 'wallet/src/features/behaviorHistory/slice'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { ExtensionOnboardingEventName } from 'wallet/src/telemetry/constants'

const IMAGE_ASPECT_RATIO = 0.69
const IMAGE_SCREEN_WIDTH_PROPORTION = 0.3

export function ExtensionPromoBanner({
  onShowExtensionPromoModal,
}: {
  onShowExtensionPromoModal: () => void
}): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { fullWidth } = useDeviceDimensions()
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const isShortDevice = useIsShortMobileDevice()

  const imageWidth = IMAGE_SCREEN_WIDTH_PROPORTION * fullWidth
  const imageHeight = imageWidth / IMAGE_ASPECT_RATIO

  const onPressClaimNow = (): void => {
    Keyboard.dismiss()
    sendWalletAnalyticsEvent(ExtensionOnboardingEventName.PromoBannerActionTaken, {
      action: 'join',
    })
    onShowExtensionPromoModal()
  }

  const onPressMaybeLater = (): void => {
    sendWalletAnalyticsEvent(ExtensionOnboardingEventName.PromoBannerActionTaken, {
      action: 'dismiss',
    })
    dispatch(setExtensionOnboardingState(ExtensionOnboardingState.Completed))
  }

  const baseButtonStyle: StyleProp<ViewStyle> = {
    borderRadius: borderRadii.rounded12,
    justifyContent: 'center',
    height: iconSizes.icon36,
    paddingVertical: spacing.spacing8,
    paddingHorizontal: spacing.spacing12,
  }

  return (
    <Flex
      grow
      row
      alignContent="space-between"
      backgroundColor="$background"
      borderColor="$surface3"
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      mt="$spacing4"
      overflow="hidden"
      pl="$spacing16"
      shadowColor="$neutral3"
      shadowOpacity={0.4}
      shadowRadius="$spacing4">
      <Flex fill gap="$spacing16" justifyContent="space-between" mr="$spacing12" py="$spacing16">
        <Flex gap="$spacing4">
          <Text color="$neutral1" variant="subheading1">
            {t('home.banner.extension.title')}
          </Text>
          {!isShortDevice && (
            <Text color="$neutral2" variant="body3">
              {t('home.banner.extension.message')}
            </Text>
          )}
        </Flex>
        <Flex grow row gap="$spacing8">
          <TouchableArea
            flexGrow={1}
            style={{
              ...baseButtonStyle,
              backgroundColor: colors.neutral1.get(),
            }}
            onPress={onPressClaimNow}>
            <Text color={isDarkMode ? 'black' : 'white'} textAlign="center" variant="buttonLabel4">
              {t('home.banner.extension.confirm')}
            </Text>
          </TouchableArea>
          <TouchableArea
            flexGrow={1}
            style={{
              ...baseButtonStyle,
              backgroundColor: colors.transparent.get(),
            }}
            onPress={onPressMaybeLater}>
            <Text color="$neutral2" textAlign="center" variant="buttonLabel4">
              {t('common.button.later')}
            </Text>
          </TouchableArea>
        </Flex>
      </Flex>
      <Flex width={imageWidth}>
        <Image
          position="absolute"
          resizeMode="contain"
          right={-4}
          source={{
            width: imageWidth,
            height: imageHeight,
            uri: isDarkMode ? EXTENSION_PROMO_BANNER_DARK : EXTENSION_PROMO_BANNER_LIGHT,
          }}
          top={-2}
        />
      </Flex>
    </Flex>
  )
}
