import { isAndroid } from '@universe/environment'
import { Flex, Text, useIsDarkMode, imageSizes } from '@universe/mycelium'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'
import { UnitagProfilePicture } from 'wallet/src/features/unitags/UnitagProfilePicture'

export const UnitagWithProfilePicture = ({
  unitag,
  address,
  profilePictureUri,
}: {
  unitag: string
  address: Address
  profilePictureUri?: string
}): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex centered pb="$spacing36" position="relative" width="100%">
      <UnitagProfilePicture address={address} size={imageSizes.image100} unitagAvatarUri={profilePictureUri} />
      <Flex
        row
        position="absolute"
        bottom={0}
        backgroundColor="$surface1"
        borderRadius="$rounded32"
        px="$spacing12"
        py="$spacing12"
        shadowColor="$neutral3"
        // elevationAndroid is a deliberate compat exclusion (deprecated RN key); the Android
        // elevation carries through the native style instead.
        style={isAndroid ? { elevation: isDarkMode ? 1.5 : 6 } : undefined}
        shadowOpacity={0.25}
        shadowRadius="$spacing4"
        transform={[{ rotateZ: '-2deg' }]}
        zIndex="$popover"
        alignSelf="center"
      >
        <Text color="$accent1" variant="subheading1" numberOfLines={1}>
          {unitag}
          <Text color="$neutral3" variant="subheading1">
            {UNITAG_SUFFIX}
          </Text>
        </Text>
      </Flex>
    </Flex>
  )
}
