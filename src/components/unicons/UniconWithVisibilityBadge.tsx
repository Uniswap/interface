import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import Eye from 'src/assets/icons/eye.svg'
import { Box, Flex } from 'src/components/layout'
import { Unicon } from 'src/components/unicons/Unicon'

interface Props {
  address: string
  size: number
  showViewOnlyBadge: boolean
}

export function UniconWithVisibilityBadge({ address, size, showViewOnlyBadge }: Props) {
  const theme = useAppTheme()
  if (!showViewOnlyBadge) {
    return <Unicon address={address} size={size} />
  }

  return (
    <Box position="relative">
      <Unicon address={address} size={size} />
      <Flex
        centered
        backgroundColor="backgroundAction"
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
