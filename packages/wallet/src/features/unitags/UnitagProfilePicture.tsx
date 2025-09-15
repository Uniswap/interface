import { Flex, useSporeColors } from 'ui/src'
import { ImageUri } from 'uniswap/src/components/nfts/images/ImageUri'
import { RemoteImage } from 'uniswap/src/components/nfts/images/RemoteImage'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { isSVGUri } from 'utilities/src/format/urls'

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
    <AccountIcon address={address} showBackground={true} showBorder={true} size={size} />
  )
}
