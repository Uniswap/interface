import React, { useCallback } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { navigate } from 'src/app/navigation/rootNavigation'
import { Flex, Image, Text, TouchableArea, TouchableAreaProps, useIsDarkMode, useIsShortMobileDevice } from 'ui/src'
import { UNITAGS_BANNER_VERTICAL_DARK, UNITAGS_BANNER_VERTICAL_LIGHT } from 'ui/src/assets'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { iconSizes } from 'ui/src/theme'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { UNITAG_SUFFIX_NO_LEADING_DOT } from 'uniswap/src/features/unitags/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens, UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useUnitagClaimHandler } from 'wallet/src/features/unitags/useUnitagClaimHandler'

const IMAGE_ASPECT_RATIO = 0.42
const IMAGE_SCREEN_WIDTH_PROPORTION = 0.18
const COMPACT_IMAGE_SCREEN_WIDTH_PROPORTION = 0.15

export function UnitagBanner({
  address,
  compact,
  entryPoint,
  onPressClaim,
}: {
  address: Address
  compact?: boolean
  entryPoint: MobileScreens.Home | MobileScreens.Settings
  onPressClaim?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { fullWidth } = useDeviceDimensions()
  const isDarkMode = useIsDarkMode()
  const isShortDevice = useIsShortMobileDevice()

  const imageWidth = compact
    ? COMPACT_IMAGE_SCREEN_WIDTH_PROPORTION * fullWidth
    : IMAGE_SCREEN_WIDTH_PROPORTION * fullWidth
  const imageHeight = imageWidth / IMAGE_ASPECT_RATIO
  const analyticsEntryPoint = entryPoint === MobileScreens.Home ? 'home' : 'settings'

  const navigateToClaim = useCallback(() => {
    navigate(MobileScreens.UnitagStack, {
      screen: UnitagScreens.ClaimUnitag,
      params: {
        entryPoint: MobileScreens.Home,
        address,
      },
    })
  }, [address])

  const navigateToIntro = useCallback(() => {
    navigate(ModalName.UnitagsIntro, {
      address,
      entryPoint: MobileScreens.Home,
    })
  }, [address])

  const { handleClaim, handleDismiss } = useUnitagClaimHandler({
    analyticsEntryPoint,
    navigateToClaim,
    navigateToIntro,
  })

  const onPressClaimNow = (): void => {
    if (onPressClaim) {
      onPressClaim()
    }
    dismissNativeKeyboard()
    handleClaim()
  }

  const baseButtonStyle: TouchableAreaProps = {
    backgroundColor: '$accent1',
    borderRadius: '$rounded20',
    justifyContent: 'center',
    height: iconSizes.icon36,
    py: '$spacing8',
    px: '$spacing12',
  }

  return (
    <Flex
      grow
      row
      alignContent="space-between"
      backgroundColor={compact ? '$surface2' : '$background'}
      borderColor="$surface3"
      borderRadius="$rounded20"
      borderWidth={compact ? undefined : '$spacing1'}
      mt="$spacing12"
      overflow="hidden"
      pl="$spacing16"
      py="$spacing12"
      shadowColor="$neutral3"
      shadowOpacity={0.4}
      shadowRadius="$spacing4"
    >
      {compact ? (
        <Flex fill row $short={{ mr: '$spacing32' }} justifyContent="space-between" onPress={onPressClaimNow}>
          <Text color="$neutral2" variant="subheading2">
            <Trans
              components={{ highlight: <Text color="$accent1" variant="buttonLabel2" /> }}
              i18nKey="unitags.banner.title.compact"
              values={{ unitagDomain: UNITAG_SUFFIX_NO_LEADING_DOT }}
            />
          </Text>
        </Flex>
      ) : (
        <Flex fill gap="$spacing16" justifyContent="space-between">
          <Flex gap="$spacing4">
            <Text variant="subheading2">
              {t('unitags.banner.title.full', {
                unitagDomain: UNITAG_SUFFIX_NO_LEADING_DOT,
              })}
            </Text>
            {!isShortDevice && (
              <Text color="$neutral2" variant="body3">
                {t('unitags.banner.subtitle')}
              </Text>
            )}
          </Flex>
          <Flex row gap="$spacing2">
            {/* TODO: replace with Button when it's extensible enough to accommodate designs */}
            <TouchableArea {...baseButtonStyle} testID={TestID.Confirm} onPress={onPressClaimNow}>
              <Text color="white" variant="buttonLabel3">
                {t('unitags.banner.button.claim')}
              </Text>
            </TouchableArea>
            <TouchableArea
              {...baseButtonStyle}
              backgroundColor="$transparent"
              testID={TestID.Cancel}
              onPress={() => handleDismiss()}
            >
              <Text color="$neutral2" variant="buttonLabel3">
                {t('common.button.later')}
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
