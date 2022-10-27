import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import Eye from 'src/assets/icons/eye.svg'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Box, Flex } from 'src/components/layout'
import { Unicon } from 'src/components/unicons/Unicon'

interface Props {
  size: number
  showViewOnlyBadge: boolean
  address: string
  avatarUri?: string | null
}

export function AccountIcon({ size, showViewOnlyBadge, address, avatarUri }: Props) {
  const theme = useAppTheme()

  const floatingEyeSize = size > 24 ? 20 : 16 // size changes in different usages
  const iconEyeSize = floatingEyeSize * 0.6 // according to design 12px and 9.6px

  return (
    <Box position="relative">
      {avatarUri ? (
        <RemoteImage borderRadius={size} height={size} uri={avatarUri} width={size} />
      ) : (
        <Unicon address={address} size={size} />
      )}
      {showViewOnlyBadge && (
        <Flex
          centered
          backgroundColor="background0"
          borderRadius="full"
          bottom={-4}
          height={floatingEyeSize}
          position="absolute"
          right={-4}
          width={floatingEyeSize}>
          <Eye color={theme.colors.textPrimary} height={iconEyeSize} width={iconEyeSize} />
        </Flex>
      )}
    </Box>
  )
}
