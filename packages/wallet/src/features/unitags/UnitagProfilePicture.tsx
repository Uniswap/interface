import { Flex, UniversalImage, Unicon } from '@universe/mycelium'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'

export function UnitagProfilePicture({
  address,
  unitagAvatarUri,
  size,
  forcePassedAvatarUri,
}: {
  address: Address
  size: number
  unitagAvatarUri?: string
  forcePassedAvatarUri?: boolean
}): JSX.Element {
  const uniconImage = <Unicon address={address} size={size} />

  return unitagAvatarUri || forcePassedAvatarUri ? (
    <Flex
      shrink
      centered
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
      <UniversalImage
        allowLocalUri
        alt=""
        size={{ height: size, width: size }}
        uri={unitagAvatarUri}
        fallback={uniconImage}
      />
    </Flex>
  ) : (
    <AccountIcon address={address} showBackground={true} showBorder={true} size={size} />
  )
}
