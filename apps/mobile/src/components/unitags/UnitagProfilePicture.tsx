import React from 'react'
import { Flex, Unicon, useSporeColors } from 'ui/src'
import { spacing } from 'ui/src/theme'
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
    <Flex
      shrink
      bg="$surface1"
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
    <Flex
      bg="$surface1"
      borderRadius="$roundedFull"
      p="$spacing16"
      shadowColor="$neutral3"
      shadowOpacity={0.4}
      shadowRadius="$spacing4">
      <Unicon address={address} size={size - spacing.spacing12} />
    </Flex>
  )
}
