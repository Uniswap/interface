import React from 'react'
import { Unicon } from 'src/components/unicons/Unicon'
import { Flex, useSporeColors } from 'ui/src'
import { isSVGUri } from 'utilities/src/format/urls'
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
    <Flex shrink borderRadius="$roundedFull" height={size} overflow="hidden" width={size}>
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
    <Unicon address={address} size={size} />
  )
}
