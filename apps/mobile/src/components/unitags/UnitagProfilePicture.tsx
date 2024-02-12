import React from 'react'
import { Flex, useSporeColors } from 'ui/src'
import { isSVGUri } from 'utilities/src/format/urls'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { RemoteSvg } from 'wallet/src/features/images/RemoteSvg'

export function UnitagProfilePicture({
  address,
  profilePictureUri,
  size,
}: {
  address: Address
  size: number
  profilePictureUri?: string
}): JSX.Element {
  const colors = useSporeColors()

  return profilePictureUri ? (
    <Flex
      shrink
      backgroundColor="$surface1"
      borderRadius="$roundedFull"
      height={size}
      overflow="hidden"
      shadowColor="$neutral3"
      shadowOpacity={0.4}
      shadowRadius="$spacing4"
      width={size}>
      {isSVGUri(profilePictureUri) ? (
        <RemoteSvg
          backgroundColor={colors.surface1.val}
          height={size}
          imageHttpUrl={profilePictureUri}
          width={size}
        />
      ) : (
        <ImageUri resizeMode="cover" uri={profilePictureUri} />
      )}
    </Flex>
  ) : (
    <AccountIcon
      address={address}
      avatarUri={profilePictureUri}
      showBackground={true}
      size={size}
    />
  )
}
