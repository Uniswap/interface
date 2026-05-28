import { isExtensionApp, isMobileApp } from '@universe/environment'
import { memo, useMemo } from 'react'
import { Flex, getUniconColors, LinearGradient, Text, useExtractedColors, useIsDarkMode, useSporeColors } from 'ui/src'
import { Pen } from 'ui/src/components/icons'
import { borderRadii, iconSizes, imageSizes, spacing } from 'ui/src/theme'
import { DisplayNameText } from 'uniswap/src/components/accounts/DisplayNameText'
import { DisplayNameType } from 'uniswap/src/features/accounts/types'
import { shortenAddress } from 'utilities/src/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useAvatarSelectionHandler } from 'wallet/src/features/unitags/AvatarSelection'
import { extensionNftModalProps } from 'wallet/src/features/unitags/ChooseNftModal'
import { ChoosePhotoOptionsModal } from 'wallet/src/features/unitags/ChoosePhotoOptionsModal'
import { HeaderRadial, solidHeaderProps } from 'wallet/src/features/unitags/HeaderRadial'
import { UnitagProfilePicture } from 'wallet/src/features/unitags/UnitagProfilePicture'

const horizontalPadding = isExtensionApp ? '$none' : '$spacing16'

interface UnitagProfileHeaderProps {
  address: string
  unitag: string
  avatarImageUri?: string
  originalAvatarUri?: string
  setAvatarImageUri: (uri?: string) => void
}

export const UnitagProfileHeader = memo(function UnitagProfileHeader({
  address,
  unitag,
  avatarImageUri,
  originalAvatarUri,
  setAvatarImageUri,
}: UnitagProfileHeaderProps): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const colors = useSporeColors()

  const { avatarSelectionHandler, hasNFTs, showModal, closeModal } = useAvatarSelectionHandler({
    address,
    avatarImageUri,
    setAvatarImageUri,
    onOpenModal: dismissNativeKeyboard,
  })

  const { colors: avatarColors } = useExtractedColors(avatarImageUri)
  const { color: uniconColor } = getUniconColors(address, false)

  // Wait for avatar, then render avatar extracted colors or unicon colors if no avatar
  const gradientColors = useMemo(() => {
    if (avatarImageUri && !avatarColors) {
      return [colors.surface1.val, colors.surface1.val]
    } else if (avatarImageUri && avatarColors && avatarColors.base) {
      return [avatarColors.base, avatarColors.base]
    } else {
      return [uniconColor, uniconColor]
    }
  }, [avatarImageUri, avatarColors, colors.surface1.val, uniconColor])

  return (
    <>
      <Flex pt={isExtensionApp ? '$spacing48' : undefined} pb="$spacing48">
        {isMobileApp && (
          <Flex height={imageSizes.image100}>
            <Flex
              backgroundColor="$surface1"
              borderRadius="$rounded20"
              bottom={0}
              left={0}
              position="absolute"
              right={0}
              top={0}
            />
            <LinearGradient
              colors={gradientColors}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 1 }}
              style={{
                borderRadius: borderRadii.rounded20,
                flex: 1,
                opacity: 0.2,
              }}
            />
            {avatarImageUri && avatarColors?.primary ? (
              <HeaderRadial borderRadius={spacing.spacing20} color={avatarColors.primary} {...solidHeaderProps} />
            ) : null}
          </Flex>
        )}
        <Flex
          bottom={spacing.spacing16}
          cursor="pointer"
          mx={horizontalPadding}
          position="absolute"
          onPress={avatarSelectionHandler}
        >
          <Flex backgroundColor="$surface1" borderRadius="$roundedFull">
            <UnitagProfilePicture
              forcePassedAvatarUri={avatarImageUri === undefined && originalAvatarUri !== undefined}
              address={address}
              size={iconSizes.icon70}
              unitagAvatarUri={avatarImageUri}
            />
          </Flex>
          <Flex
            backgroundColor="$surface1"
            borderRadius="$roundedFull"
            bottom={-spacing.spacing2}
            p="$spacing2"
            position="absolute"
            right={-spacing.spacing2}
          >
            <Flex backgroundColor={isDarkMode ? '$neutral3' : '$neutral2'} borderRadius="$roundedFull" p={6}>
              <Pen color={isDarkMode ? '$neutral1' : '$surface1'} size="$icon.16" />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      <Flex alignItems="flex-start" gap="$spacing2" pb="$spacing16" px={horizontalPadding}>
        <DisplayNameText
          displayName={{ name: unitag, type: DisplayNameType.Unitag }}
          textProps={{ variant: 'heading3' }}
        />
        <Text color="$neutral2" variant="subheading2">
          {shortenAddress({ address })}
        </Text>
      </Flex>
      {showModal && (
        <ChoosePhotoOptionsModal
          address={address}
          hasNFTs={hasNFTs}
          setPhotoUri={setAvatarImageUri}
          showRemoveOption={!!avatarImageUri}
          nftModalProps={isExtensionApp ? extensionNftModalProps : undefined}
          onClose={closeModal}
        />
      )}
    </>
  )
})
