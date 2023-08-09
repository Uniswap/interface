import { LinearGradient } from 'expo-linear-gradient'
import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Favorite } from 'src/components/icons/Favorite'
import { AnimatedBox, Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { useUniconColors } from 'src/components/unicons/utils'
import { ProfileContextMenu } from 'src/features/externalProfile/ProfileContextMenu'
import { useToggleWatchedWalletCallback } from 'src/features/favorites/hooks'
import { selectWatchedAddressSet } from 'src/features/favorites/selectors'
import { openModal } from 'src/features/modals/modalSlice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useExtractedColors } from 'src/utils/colors'
import SendIcon from 'ui/src/assets/icons/send-action.svg'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { useENSAvatar } from 'wallet/src/features/ens/api'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'

const HEADER_GRADIENT_HEIGHT = 137
const HEADER_ICON_SIZE = 72

interface ProfileHeaderProps {
  address: Address
}

export default function ProfileHeader({ address }: ProfileHeaderProps): JSX.Element {
  const theme = useAppTheme()
  const dispatch = useAppDispatch()
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
      return [theme.colors.DEP_background0, theme.colors.DEP_background0]
    }
    if (hasAvatar && avatarColors && avatarColors.base) {
      return [avatarColors.base, avatarColors.base]
    }
    return [uniconGradientStart, uniconGradientEnd]
  }, [
    avatarColors,
    hasAvatar,
    loading,
    theme.colors.DEP_background0,
    uniconGradientEnd,
    uniconGradientStart,
  ])

  const onPressFavorite = useToggleWatchedWalletCallback(address)

  const initialSendState = useMemo(() => {
    return {
      recipient: address,
      exactAmountToken: '',
      exactAmountUSD: '',
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
  return (
    <Flex bg="DEP_background0" gap="spacing16" pt="spacing36" px="spacing24">
      {/* fixed gradient */}
      <AnimatedBox
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
      </AnimatedBox>

      {/* header row */}
      <Flex row alignItems="center" justifyContent="space-between" mx="spacing4">
        <TouchableArea
          backgroundColor="DEP_textOnDimTertiary"
          borderRadius="roundedFull"
          opacity={0.8}
          padding="spacing8">
          <Flex centered grow height={theme.iconSizes.icon16} width={theme.iconSizes.icon16}>
            <BackButton color="DEP_white" size={theme.iconSizes.icon24} />
          </Flex>
        </TouchableArea>
        <ProfileContextMenu address={address} />
      </Flex>

      {/* button content */}
      <Flex row alignItems="flex-start" justifyContent="space-between">
        <AddressDisplay
          address={address}
          captionVariant="subheadSmall"
          contentAlign="flex-start"
          direction="column"
          showCopy={true}
          showIconBackground={true}
          size={HEADER_ICON_SIZE}
          textAlign="flex-start"
          variant="headlineSmall"
        />
        <Box position="absolute" right={0}>
          <Flex centered row gap="spacing8" mt="spacing12">
            <TouchableArea
              hapticFeedback
              activeOpacity={1}
              backgroundColor="DEP_background0"
              borderColor="DEP_backgroundOutline"
              borderRadius="rounded20"
              borderWidth={1}
              padding="spacing12"
              testID={ElementName.Favorite}
              onPress={onPressFavorite}>
              <Favorite isFavorited={isFavorited} size={iconSizes.icon20} />
            </TouchableArea>
            <TouchableArea
              hapticFeedback
              activeOpacity={1}
              backgroundColor="DEP_background0"
              borderColor="DEP_backgroundOutline"
              borderRadius="rounded20"
              borderWidth={1}
              padding="spacing12"
              testID={ElementName.Send}
              onPress={onPressSend}>
              <Flex row alignItems="center" gap="spacing8">
                <SendIcon
                  color={theme.colors.DEP_textSecondary}
                  height={theme.iconSizes.icon20}
                  width={theme.iconSizes.icon20}
                />
                <Text color="DEP_textSecondary" variant="buttonLabelMedium">
                  {t('Send')}
                </Text>
              </Flex>
            </TouchableArea>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  )
}

function _HeaderRadial({ color }: { color: string }): JSX.Element {
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
}

export const HeaderRadial = memo(_HeaderRadial)
