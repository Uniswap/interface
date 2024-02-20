import React from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleProp, ViewStyle } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { Screens } from 'src/screens/Screens'
import {
  Flex,
  Image,
  Text,
  TouchableArea,
  useDeviceDimensions,
  useIsDarkMode,
  useSporeColors,
} from 'ui/src'
import { UNITAGS_BANNER_VERTICAL_DARK, UNITAGS_BANNER_VERTICAL_LIGHT } from 'ui/src/assets'
import { borderRadii, iconSizes, spacing } from 'ui/src/theme'
import { setHasSkippedUnitagPrompt } from 'wallet/src/features/behaviorHistory/slice'
import { UNITAG_SUFFIX_NO_LEADING_DOT } from 'wallet/src/features/unitags/constants'
import { sendWalletAnalyticsEvent } from 'wallet/src/telemetry'
import { ElementName, ModalName, UnitagEventName } from 'wallet/src/telemetry/constants'

const IMAGE_ASPECT_RATIO = 0.42
const IMAGE_SCREEN_WIDTH_PROPORTION = 0.18
const COMPACT_IMAGE_SCREEN_WIDTH_PROPORTION = 0.15

export function UnitagBanner({
  address,
  compact,
  entryPoint,
}: {
  address: Address
  compact?: boolean
  entryPoint: Screens.Home | Screens.Settings
}): JSX.Element {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { fullWidth } = useDeviceDimensions()
  const isDarkMode = useIsDarkMode()
  const colors = useSporeColors()
  const imageWidth = compact
    ? COMPACT_IMAGE_SCREEN_WIDTH_PROPORTION * fullWidth
    : IMAGE_SCREEN_WIDTH_PROPORTION * fullWidth
  const imageHeight = imageWidth / IMAGE_ASPECT_RATIO
  const analyticsEntryPoint = entryPoint === Screens.Home ? 'home' : 'settings'

  const onPressClaimNow = (): void => {
    Keyboard.dismiss()
    sendWalletAnalyticsEvent(UnitagEventName.UnitagBannerActionTaken, {
      action: 'claim',
      entryPoint: analyticsEntryPoint,
    })
    dispatch(openModal({ name: ModalName.UnitagsIntro, initialState: { address, entryPoint } }))
  }

  const onPressMaybeLater = (): void => {
    sendWalletAnalyticsEvent(UnitagEventName.UnitagBannerActionTaken, {
      action: 'dismiss',
      entryPoint: analyticsEntryPoint,
    })
    dispatch(setHasSkippedUnitagPrompt(true))
  }

  const baseButtonStyle: StyleProp<ViewStyle> = {
    backgroundColor: colors.accent1.get(),
    borderRadius: borderRadii.rounded20,
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
      backgroundColor={compact ? '$surface2' : '$background'}
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth={compact ? undefined : '$spacing1'}
      mt="$spacing12"
      overflow="hidden"
      pl="$spacing16"
      py="$spacing16"
      shadowColor="$neutral3"
      shadowOpacity={0.4}
      shadowRadius="$spacing4">
      {compact ? (
        <Flex
          fill
          row
          $short={{ mr: '$spacing32' }}
          justifyContent="space-between"
          onPress={onPressClaimNow}>
          <Text color="$neutral2" variant="subheading2">
            <Text color="$accent1" variant="buttonLabel3">
              {t('Claim your {{unitagSuffix}} username', {
                unitagSuffix: UNITAG_SUFFIX_NO_LEADING_DOT,
              })}
            </Text>
            {t(' and build out your customizable profile.')}
          </Text>
        </Flex>
      ) : (
        <Flex fill gap="$spacing16" justifyContent="space-between">
          <Flex gap="$spacing4">
            <Text variant="subheading2">
              {t('Claim your {{unitagSuffix}} username', {
                unitagSuffix: UNITAG_SUFFIX_NO_LEADING_DOT,
              })}
            </Text>
            <Text color="$neutral2" variant="body3">
              {t('Build a personalized web3 profile and easily share your address with friends.')}
            </Text>
          </Flex>
          <Flex row gap="$spacing2">
            {/* TODO: replace with Button when it's extensible enough to accommodate designs */}
            <TouchableArea
              style={{
                ...baseButtonStyle,
                backgroundColor: colors.accent1.get(),
              }}
              testID={ElementName.Confirm}
              onPress={onPressClaimNow}>
              <Text color="white" variant="buttonLabel4">
                {t('Claim now')}
              </Text>
            </TouchableArea>
            <TouchableArea
              style={{
                ...baseButtonStyle,
                backgroundColor: colors.transparent.get(),
              }}
              testID={ElementName.Cancel}
              onPress={onPressMaybeLater}>
              <Text color="$neutral3" variant="buttonLabel4">
                {t('Maybe later')}
              </Text>
            </TouchableArea>
          </Flex>
        </Flex>
      )}
      <Flex mr={compact ? -(imageWidth / 6) : -(imageWidth / 12)} width={imageWidth}>
        <Image
          alignSelf="center"
          position="absolute"
          resizeMode="cover"
          source={{
            width: imageWidth,
            height: imageHeight,
            uri: isDarkMode ? UNITAGS_BANNER_VERTICAL_DARK : UNITAGS_BANNER_VERTICAL_LIGHT,
          }}
          top={compact ? -(imageHeight * 0.19) : -(imageHeight * 0.22)}
        />
      </Flex>
    </Flex>
  )
}
