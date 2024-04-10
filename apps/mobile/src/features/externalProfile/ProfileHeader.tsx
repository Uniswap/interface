import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StatusBar, StyleSheet } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import Svg, { ClipPath, Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { BackButton } from 'src/components/buttons/BackButton'
import { Favorite } from 'src/components/icons/Favorite'
import { LongText } from 'src/components/text/LongText'
import { ProfileContextMenu } from 'src/features/externalProfile/ProfileContextMenu'
import { useToggleWatchedWalletCallback } from 'src/features/favorites/hooks'
import { openModal } from 'src/features/modals/modalSlice'
import {
  AnimatedFlex,
  Flex,
  Icons,
  Image,
  LinearGradient,
  ScrollView,
  Text,
  TouchableArea,
  getUniconV2Colors,
  useIsDarkMode,
  useSporeColors,
  useUniconColors,
} from 'ui/src'
import { ENS_LOGO } from 'ui/src/assets'
import { iconSizes, imageSizes } from 'ui/src/theme'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { useENSDescription, useENSName, useENSTwitterUsername } from 'wallet/src/features/ens/api'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { selectWatchedAddressSet } from 'wallet/src/features/favorites/selectors'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { useAvatar, useDisplayName } from 'wallet/src/features/wallet/hooks'
import { DisplayNameType } from 'wallet/src/features/wallet/types'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'
import { useExtractedColors } from 'wallet/src/utils/colors'
import { openUri } from 'wallet/src/utils/linking'

const HEADER_GRADIENT_HEIGHT = 144
const HEADER_ICON_SIZE = 72

interface ProfileHeaderProps {
  address: Address
}

const HEADER_SOLID_COLOR_OPACITY = 0.1

export const solidHeaderProps = {
  minOpacity: HEADER_SOLID_COLOR_OPACITY,
  maxOpacity: HEADER_SOLID_COLOR_OPACITY,
}

export const ProfileHeader = memo(function ProfileHeader({
  address,
}: ProfileHeaderProps): JSX.Element {
  const colors = useSporeColors()
  const dispatch = useAppDispatch()
  const isDarkMode = useIsDarkMode()
  const isFavorited = useAppSelector(selectWatchedAddressSet).has(address)

  const displayName = useDisplayName(address, { includeUnitagSuffix: true })

  // Note that if a user has a Unitag AND ENS, this prioritizes the Unitag's metadata over the ENS metadata
  const nameToFetchENSMetadata =
    (displayName?.type === DisplayNameType.ENS || displayName?.type === DisplayNameType.Unitag) &&
    displayName?.name
      ? displayName.name
      : undefined

  // ENS avatar and avatar colors
  const { avatar, loading: avatarLoading } = useAvatar(address)
  const { data: primaryENSName } = useENSName(address)
  const { data: twitter } = useENSTwitterUsername(nameToFetchENSMetadata)
  const { data: bio } = useENSDescription(nameToFetchENSMetadata)
  const showENSName = primaryENSName && primaryENSName !== displayName?.name

  const { colors: avatarColors } = useExtractedColors(avatar)
  const isUniconsV2Enabled = useFeatureFlag(FEATURE_FLAGS.UniconsV2)

  const hasAvatar = !!avatar && !avatarLoading

  // Unicon colors
  const { gradientStart: uniconGradientStart, gradientEnd: uniconGradientEnd } =
    useUniconColors(address)

  // UniconV2 colors
  const { color } = getUniconV2Colors(address)

  // Wait for avatar, then render avatar extracted colors or unicon colors if no avatar
  const fixedGradientColors: [string, string] = useMemo(() => {
    if (avatarLoading || (hasAvatar && !avatarColors)) {
      return [colors.surface1.val, colors.surface1.val]
    }
    if (hasAvatar && avatarColors && avatarColors.base) {
      return [avatarColors.base, avatarColors.base]
    }
    return [
      isUniconsV2Enabled ? color : uniconGradientStart,
      isUniconsV2Enabled ? color : uniconGradientEnd,
    ]
  }, [
    avatarColors,
    hasAvatar,
    avatarLoading,
    colors.surface1,
    uniconGradientEnd,
    uniconGradientStart,
    color,
    isUniconsV2Enabled,
  ])

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

  const onPressTwitter = useCallback(async () => {
    if (twitter) {
      await openUri(`https://twitter.com/${twitter}`)
    }
  }, [twitter])

  const { t } = useTranslation()

  return (
    <Flex backgroundColor="$surface1" gap="$spacing16" pt="$spacing60">
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      {/* fixed gradient at 0.2 opacity overlaid on surface1 */}
      <AnimatedFlex
        bottom={0}
        entering={FadeIn}
        height={HEADER_GRADIENT_HEIGHT}
        left={0}
        position="absolute"
        right={0}
        top={0}>
        <Flex
          backgroundColor="$surface1"
          bottom={0}
          left={0}
          position="absolute"
          right={0}
          top={0}
        />
        <Flex grow opacity={0.2}>
          <LinearGradient
            colors={fixedGradientColors}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Flex>
        {hasAvatar && avatarColors?.primary ? (
          <HeaderRadial color={avatarColors.primary} {...solidHeaderProps} />
        ) : (
          <HeaderRadial
            color={isUniconsV2Enabled ? color : uniconGradientStart}
            {...solidHeaderProps}
          />
        )}
      </AnimatedFlex>

      {/* header row */}
      <Flex row alignItems="center" justifyContent="space-between" mx="$spacing4" px="$spacing24">
        <Flex centered backgroundColor="$surface3" borderRadius="$roundedFull" p="$spacing4">
          <BackButton color="$sporeWhite" size={iconSizes.icon24} />
        </Flex>
        <ProfileContextMenu address={address} />
      </Flex>

      {/* button content */}
      <Flex row alignItems="flex-start" justifyContent="space-between">
        <Flex gap="$spacing8">
          <Flex gap="$spacing8" px="$spacing24">
            <AddressDisplay
              showCopy
              showIconBackground
              showIconBorder
              address={address}
              captionTextColor="$neutral3"
              captionVariant="body3"
              contentAlign="flex-start"
              direction="column"
              size={HEADER_ICON_SIZE}
              textAlign="flex-start"
              variant="heading3"
            />
            {bio ? (
              <LongText color={colors.neutral2.val} initialDisplayedLines={2} text={bio} />
            ) : null}
          </Flex>
          {(twitter || showENSName) && (
            <ScrollView
              horizontal
              contentContainerStyle={{ px: '$spacing24' }}
              showsHorizontalScrollIndicator={false}>
              <Flex row gap="$spacing16">
                {twitter ? (
                  <TouchableArea onPress={onPressTwitter}>
                    <Flex centered row gap="$spacing4">
                      <Icons.XTwitter color={colors.neutral1.val} size={iconSizes.icon16} />
                      <Text color="$neutral1" variant="buttonLabel3">
                        {twitter}
                      </Text>
                    </Flex>
                  </TouchableArea>
                ) : null}
                {showENSName ? (
                  <Flex centered row gap="$spacing4">
                    <Image
                      height={imageSizes.image16}
                      resizeMode="contain"
                      source={ENS_LOGO}
                      width={imageSizes.image16}
                    />
                    <Text color="$blue400" variant="buttonLabel3">
                      {primaryENSName}
                    </Text>
                  </Flex>
                ) : null}
              </Flex>
            </ScrollView>
          )}
        </Flex>
        <Flex position="absolute" px="$spacing24" right={0}>
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
              shadowColor="$neutral1"
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
                  {t('common.button.send')}
                </Text>
              </Flex>
            </TouchableArea>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
})

export const HeaderRadial = memo(function HeaderRadial({
  color,
  borderRadius,
  minOpacity,
  maxOpacity,
}: {
  color: string
  borderRadius?: number
  minOpacity?: number
  maxOpacity?: number
}): JSX.Element {
  return (
    <Svg height="100%" width="100%">
      <Defs>
        <ClipPath id="clip">
          <Rect height="100%" rx={borderRadius} width="100%" />
        </ClipPath>
        <RadialGradient cy="-0.1" id="background" rx="0.8" ry="1.1">
          <Stop offset="0" stopColor={color} stopOpacity={maxOpacity ?? '0.6'} />
          <Stop offset="1" stopColor={color} stopOpacity={minOpacity ?? '0'} />
        </RadialGradient>
      </Defs>
      <Rect
        clipPath={borderRadius ? 'url(#clip)' : undefined}
        fill="url(#background)"
        height="100%"
        width="100%"
        x="0"
        y="0"
      />
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
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
})
