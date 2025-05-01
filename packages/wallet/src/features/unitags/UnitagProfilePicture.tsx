import { Flex, useSporeColors } from 'ui/src'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useENSAvatar } from 'uniswap/src/features/ens/api'
import { isSVGUri } from 'utilities/src/format/urls'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { RemoteImage } from 'wallet/src/features/images/RemoteImage'

export function UnitagProfilePicture({
  address,
  unitagAvatarUri,
  size,
}: {
  address: Address
  size: number
  unitagAvatarUri?: string
}): JSX.Element {
  const colors = useSporeColors()
  const { data: ensAvatar } = useENSAvatar(address)

  return unitagAvatarUri ? (
    <Flex
      shrink
      backgroundColor="$surface1"
      borderColor="$surface1"
      borderRadius="$roundedFull"
      borderWidth="$spacing2"
      height={size}
      overflow="hidden"
      shadowColor="$neutral3"
      shadowOpacity={0.4}
      shadowRadius="$spacing4"
      width={size}
    >
      {isSVGUri(unitagAvatarUri) ? (
        <RemoteImage backgroundColor={colors.surface1.val} height={size} uri={unitagAvatarUri} width={size} />
      ) : (
        <ImageUri resizeMode="cover" uri={unitagAvatarUri} />
      )}
    </Flex>
  ) : (
    <AccountIcon address={address} avatarUri={ensAvatar} showBackground={true} showBorder={true} size={size} />
  )
}
