import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import Eye from 'src/assets/icons/eye.svg'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Box } from 'src/components/layout'
import { Unicon } from 'src/components/unicons/Unicon'

interface Props {
  size: number
  showViewOnlyBadge: boolean
  address: string
  avatarUri?: string | null
}

export function AccountIcon({ size, showViewOnlyBadge, address, avatarUri }: Props) {
  const theme = useAppTheme()
  const iconEyeSize = size * (2 / 5)

  return (
    <Box position="relative">
      {avatarUri ? (
        <RemoteImage borderRadius={size} height={size} uri={avatarUri} width={size} />
      ) : (
        <Unicon address={address} size={size} />
      )}
      {showViewOnlyBadge && (
        <Box
          alignContent="center"
          backgroundColor="background0"
          borderRadius="full"
          bottom={0}
          justifyContent="center"
          position="absolute"
          right={0}>
          <Eye color={theme.colors.textPrimary} height={iconEyeSize} width={iconEyeSize} />
        </Box>
      )}
    </Box>
  )
}
