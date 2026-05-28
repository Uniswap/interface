import { Flex, Text, useIsDarkMode } from 'ui/src'
import { imageSizes } from 'ui/src/theme'
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
        elevationAndroid={isDarkMode ? 1.5 : 6}
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
