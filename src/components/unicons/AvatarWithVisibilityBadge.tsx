import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import Eye from 'src/assets/icons/eye.svg'
import { RemoteImage } from 'src/components/images/RemoteImage'
import { Box, Flex } from 'src/components/layout'

interface Props {
  avatarUri: string
  size: number
  showViewOnlyBadge: boolean
}

export function AvatarWithVisibilityBadge({ avatarUri, size, showViewOnlyBadge }: Props) {
  const theme = useAppTheme()
  if (!showViewOnlyBadge) {
    return <RemoteImage borderRadius={size} height={size} uri={avatarUri} width={size} />
  }

  return (
    <Box position="relative">
      <RemoteImage borderRadius={size} height={size} uri={avatarUri} width={size} />
      <Flex
        centered
        backgroundColor="background0"
        borderRadius="full"
        bottom={-4}
        height={24}
        position="absolute"
        right={-4}
        width={24}>
        <Eye color={theme.colors.textPrimary} height={12} strokeWidth={1} width={16} />
      </Flex>
    </Box>
  )
}
