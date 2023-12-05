import { LinearGradient } from 'expo-linear-gradient'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StatusBar, StyleSheet } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { Favorite } from 'src/components/icons/Favorite'
import { useUniconColors } from 'src/components/unicons/utils'
import { ProfileContextMenu } from 'src/features/externalProfile/ProfileContextMenu'
import { useToggleWatchedWalletCallback } from 'src/features/favorites/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { AnimatedFlex, Flex, Icons, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'
import { useENSAvatar } from 'wallet/src/features/ens/api'
import { selectWatchedAddressSet } from 'wallet/src/features/favorites/selectors'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { passesContrast, useExtractedColors } from 'wallet/src/utils/colors'

const HEADER_GRADIENT_HEIGHT = 144
const HEADER_ICON_SIZE = 72

interface ProfileHeaderProps {
  address: Address
}

export const ProfileHeader = memo(function ProfileHeader({
  address,
}: ProfileHeaderProps): JSX.Element {
  const colors = useSporeColors()
  const dispatch = useAppDispatch()
  const isDarkMode = useIsDarkMode()
  const isFavorited = useAppSelector(selectWatchedAddressSet).has(address)

  // ENS avatar and avatar colors
  const { data: avatar, loading } = useENSAvatar(address)
  const { colors: avatarColors } = useExtractedColors(avatar)
  const hasAvatar = !!avatar && !loading

  // Unicon colors
  const { gradientStart: uniconGradientStart, gradientEnd: uniconGradientEnd } =
    useUniconColors(address)

  // Wait for avatar, then render avatar extracted colors or unicon colors if no avatar
  const fixedGradientColors = useMemo(() => {
    if (loading || (hasAvatar && !avatarColors)) {
      return [colors.surface1.val, colors.surface1.val]
    }
    if (hasAvatar && avatarColors && avatarColors.base) {
      return [avatarColors.base, avatarColors.base]
    }
    return [uniconGradientStart, uniconGradientEnd]
  }, [avatarColors, hasAvatar, loading, colors.surface1, uniconGradientEnd, uniconGradientStart])

  const onPressFavorite = useToggleWatchedWalletCallback(address)

  const initialSendState = useMemo(() => {
    return {
      recipient: address,
      exactAmountToken: '',
      exactAmountFiat: '',
      exactCurrencyField: CurrencyField.INPUT,
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: null,
    }
  }, [address])

  const onPressSend = useCallback(() => {
    dispatch(
      openModal({
        name: ModalName.Send,
        ...{ initialState: initialSendState },
      })
    )
  }, [dispatch, initialSendState])

  const { t } = useTranslation()

  const showLightStatusBar = passesContrast('white', uniconGradientStart, 2)

  return (
    <Flex bg="$surface1" gap="$spacing16" pt="$spacing60" px="$spacing24">
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={showLightStatusBar ? 'light-content' : 'dark-content'}
      />
      {/* fixed gradient */}
      <AnimatedFlex
        bottom={0}
        entering={FadeIn}
        height={HEADER_GRADIENT_HEIGHT}
        left={0}
        position="absolute"
        right={0}
        top={0}>
        <LinearGradient
          colors={fixedGradientColors}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {hasAvatar && avatarColors?.primary ? <HeaderRadial color={avatarColors.primary} /> : null}
      </AnimatedFlex>

      {/* header row */}
      <Flex row alignItems="center" justifyContent="space-between" mx="$spacing4">
        <Flex height={iconSizes.icon16} width={iconSizes.icon16}>
          <BackButton color="$sporeWhite" size={iconSizes.icon24} />
        </Flex>
        <ProfileContextMenu address={address} />
      </Flex>

      {/* button content */}
      <Flex row alignItems="flex-start" justifyContent="space-between">
        <AddressDisplay
          showCopy
          showIconBackground
          address={address}
          captionVariant="body2"
          contentAlign="flex-start"
          direction="column"
          size={HEADER_ICON_SIZE}
          textAlign="flex-start"
          variant="heading3"
        />
        <Flex position="absolute" right={0}>
          <Flex centered row gap="$spacing8" mt="$spacing12">
            <TouchableArea
              hapticFeedback
              activeOpacity={1}
              backgroundColor="$surface1"
              borderColor="$surface3"
              borderRadius="$rounded20"
              borderWidth={1}
              height={46}
              p="$spacing12"
              shadowColor={isDarkMode ? '$surface2' : '$neutral3'}
              style={styles.buttonShadow}
              testID={ElementName.Favorite}
              onPress={onPressFavorite}>
              <Favorite isFavorited={isFavorited} size={iconSizes.icon20} />
            </TouchableArea>
            <TouchableArea
              hapticFeedback
              activeOpacity={1}
              backgroundColor="$surface1"
              borderColor="$surface3"
              borderRadius="$rounded20"
              borderWidth={1}
              height={46}
              justifyContent="center"
              px="$spacing12"
              shadowColor={isDarkMode ? '$surface2' : '$neutral3'}
              style={styles.buttonShadow}
              testID={ElementName.Send}
              onPress={onPressSend}>
              <Flex row alignItems="center" gap="$spacing8">
                <Icons.SendAction color="$neutral2" size="$icon.20" />
                <Text
                  allowFontScaling={true}
                  color="$neutral2"
                  maxFontSizeMultiplier={1.2}
                  variant="buttonLabel2">
                  {t('Send')}
                </Text>
              </Flex>
            </TouchableArea>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
})

export const HeaderRadial = memo(function HeaderRadial({ color }: { color: string }): JSX.Element {
  return (
    <Svg height="100%" width="100%">
      <Defs>
        <RadialGradient cy="-0.1" id="background" rx="0.8" ry="1.1">
          <Stop offset="0" stopColor={color} stopOpacity="0.6" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect fill="url(#background)" height="100%" opacity={0.6} width="100%" x="0" y="0" />
    </Svg>
  )
})

const styles = StyleSheet.create({
  buttonShadow: {
    elevation: 2,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
})
