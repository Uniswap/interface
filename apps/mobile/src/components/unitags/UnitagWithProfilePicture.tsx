import { UnitagProfilePicture } from 'src/components/unitags/UnitagProfilePicture'
import { Flex, Text } from 'ui/src'
import { imageSizes, spacing } from 'ui/src/theme'
import { UNITAG_SUFFIX } from 'wallet/src/features/unitags/constants'

export const UnitagWithProfilePicture = ({
  unitag,
  address,
  profilePictureUri,
}: {
  unitag: string
  address: Address
  profilePictureUri?: string
}): JSX.Element => {
  return (
    <Flex centered gap={-spacing.spacing24}>
      <UnitagProfilePicture
        address={address}
        size={imageSizes.image100}
        unitagAvatarUri={profilePictureUri}
      />
      <Flex
        row
        backgroundColor="$surface1"
        borderRadius="$rounded32"
        px="$spacing12"
        py="$spacing8"
        shadowColor="$neutral3"
        shadowOpacity={0.4}
        shadowRadius="$spacing4"
        transform={[{ rotateZ: '-2deg' }]}
        zIndex="$popover">
        <Text color="$accent1" variant="subheading1">
          {unitag}
          <Text color="$neutral3" variant="subheading1">
            {UNITAG_SUFFIX}
          </Text>
        </Text>
      </Flex>
    </Flex>
  )
}
