import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StatusBar, StyleSheet } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { BackButton } from 'src/components/buttons/BackButton'
import { Favorite } from 'src/components/icons/Favorite'
import { LongText } from 'src/components/text/LongText'
import { ProfileContextMenu } from 'src/features/externalProfile/ProfileContextMenu'
import { openModal } from 'src/features/modals/modalSlice'
import {
  Flex,
  getUniconColors,
  Image,
  LinearGradient,
  ScrollView,
  Text,
  TouchableArea,
  useExtractedColors,
  useIsDarkMode,
  useSporeColors,
} from 'ui/src'
import { ENS_LOGO } from 'ui/src/assets'
import { SendAction, XTwitter } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { DEP_accentColors, iconSizes, imageSizes, spacing, validColor } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { useENSDescription, useENSName, useENSTwitterUsername } from 'uniswap/src/features/ens/api'
import { selectWatchedAddressSet } from 'uniswap/src/features/favorites/selectors'
import { useToggleWatchedWalletCallback } from 'uniswap/src/features/favorites/useToggleWatchedWalletCallback'
import { useTestnetModeBannerHeight } from 'uniswap/src/features/settings/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'
import { openUri } from 'uniswap/src/utils/linking'
import { RecipientSelectSpeedBumps } from 'wallet/src/components/RecipientSearch/RecipientSelectSpeedBumps'
import { HeaderRadial, solidHeaderProps } from 'wallet/src/features/unitags/HeaderRadial'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'

const HEADER_GRADIENT_HEIGHT = 144
const HEADER_ICON_SIZE = 72
// prevents buttons from touching banner
const TESTNET_BANNER_MULTIPLIER = 1.1

interface ProfileHeaderProps {
  address: Address
}

export const ProfileHeader = memo(function ProfileHeader({ address }: ProfileHeaderProps): JSX.Element {
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const isDarkMode = useIsDarkMode()
  const isFavorited = useSelector(selectWatchedAddressSet).has(address)
  const [checkSpeedBumps, setCheckSpeedBumps] = useState(false)

  const displayName = useDisplayName(address, { includeUnitagSuffix: true })

  // Note that if a user has a Unitag AND ENS, this prioritizes the Unitag's metadata over the ENS metadata
  const nameToFetchENSMetadata =
    (displayName?.type === DisplayNameType.ENS || displayName?.type === DisplayNameType.Unitag) && displayName.name
      ? displayName.name
      : undefined

  // ENS avatar and avatar colors
  const { avatar, loading: avatarLoading } = useAvatar(address)
  const { data: primaryENSName } = useENSName(address)
  const { data: twitter } = useENSTwitterUsername(nameToFetchENSMetadata)
  const { data: bio } = useENSDescription(nameToFetchENSMetadata)
  const showENSName = primaryENSName && primaryENSName !== displayName?.name

  const { colors: avatarColors } = useExtractedColors(avatar)

  const hasAvatar = !!avatar && !avatarLoading

  // Unicon colors
  const { color } = getUniconColors(address, false)

  // Wait for avatar, then render avatar extracted colors or unicon colors if no avatar
  const fixedGradientColors: [string, string] = useMemo(() => {
    if (avatarLoading || (hasAvatar && !avatarColors)) {
      return [colors.surface1.val, colors.surface1.val]
    }
    if (hasAvatar && avatarColors && avatarColors.base) {
      return [avatarColors.base, avatarColors.base]
    }
    return [color, color]
  }, [avatarColors, hasAvatar, avatarLoading, colors.surface1, color])

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

  const openSendModal = useCallback(() => {
    dispatch(
      openModal({
        name: ModalName.Send,
        ...{ initialState: initialSendState },
      }),
    )
  }, [dispatch, initialSendState])

  const onPressSend = useCallback(async () => {
    setCheckSpeedBumps(true)
  }, [])

  const onPressTwitter = useCallback(async () => {
    if (twitter) {
      await openUri({ uri: `https://twitter.com/${twitter}` })
    }
  }, [twitter])

  const { t } = useTranslation()

  const testnetBannerHeight = useTestnetModeBannerHeight() * TESTNET_BANNER_MULTIPLIER

  return (
    <Flex backgroundColor="$surface1" gap="$spacing16" pt={spacing.spacing60 + testnetBannerHeight}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {/* fixed gradient at 0.2 opacity overlaid on surface1 */}
      <AnimatedFlex
        bottom={0}
        entering={FadeIn}
        height={HEADER_GRADIENT_HEIGHT + testnetBannerHeight}
        left={0}
        position="absolute"
        right={0}
        top={0}
      >
        <Flex backgroundColor="$surface1" bottom={0} left={0} position="absolute" right={0} top={0} />
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
          <HeaderRadial color={color} {...solidHeaderProps} />
        )}
      </AnimatedFlex>

      {/* header row */}
      <Flex row alignItems="center" justifyContent="space-between" mx="$spacing4" px="$spacing24">
        <Flex centered backgroundColor="$surface4" borderRadius="$roundedFull" p="$spacing4">
          <BackButton color="$neutral2" size={iconSizes.icon24} />
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
              alignItems="flex-start"
              captionTextColor="$neutral3"
              captionVariant="body3"
              direction="column"
              size={HEADER_ICON_SIZE}
              variant="heading3"
            />
            {bio ? <LongText color={colors.neutral2.val} initialDisplayedLines={2} text={bio} /> : null}
          </Flex>
          {(twitter || showENSName) && (
            <ScrollView horizontal contentContainerStyle={{ px: '$spacing24' }} showsHorizontalScrollIndicator={false}>
              <Flex row gap="$spacing16">
                {twitter ? (
                  <TouchableArea onPress={onPressTwitter}>
                    <Flex centered row gap="$spacing4">
                      <XTwitter color="$neutral1" size="$icon.16" />
                      <Text color="$neutral1" variant="buttonLabel2">
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
                    <Text color={validColor(DEP_accentColors.blue400)} variant="buttonLabel2">
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
              activeOpacity={1}
              backgroundColor="$surface1"
              borderColor="$surface3"
              borderRadius="$rounded20"
              borderWidth="$spacing1"
              height={46}
              p="$spacing12"
              shadowColor="$neutral1"
              style={styles.buttonShadow}
              testID={TestID.Favorite}
              onPress={onPressFavorite}
            >
              <Favorite isFavorited={isFavorited} size={iconSizes.icon20} />
            </TouchableArea>
            <TouchableArea
              activeOpacity={1}
              backgroundColor="$surface1"
              borderColor="$surface3"
              borderRadius="$rounded20"
              borderWidth="$spacing1"
              height={46}
              justifyContent="center"
              px="$spacing12"
              shadowColor={isDarkMode ? '$surface2' : '$neutral3'}
              style={styles.buttonShadow}
              testID={TestID.Send}
              onPress={onPressSend}
            >
              <Flex row alignItems="center" gap="$spacing8">
                <SendAction color="$neutral2" size="$icon.20" />
                <Text allowFontScaling={true} color="$neutral2" maxFontSizeMultiplier={1.2} variant="buttonLabel1">
                  {t('common.button.send')}
                </Text>
              </Flex>
            </TouchableArea>
          </Flex>
        </Flex>
      </Flex>
      <RecipientSelectSpeedBumps
        checkSpeedBumps={checkSpeedBumps}
        recipientAddress={address}
        setCheckSpeedBumps={setCheckSpeedBumps}
        onConfirm={openSendModal}
      />
    </Flex>
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
