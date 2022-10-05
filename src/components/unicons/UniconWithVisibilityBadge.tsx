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

  const floatingEyeSize = size > 24 ? 20 : 16 // size changes in different usages
  const iconEyeSize = floatingEyeSize * 0.6 // according to design 12px and 9.6px

  return (
    <Box position="relative">
      <Unicon address={address} size={size} />
      <Flex
        centered
        backgroundColor="backgroundBackdrop"
        borderRadius="full"
        bottom={-4}
        height={floatingEyeSize}
        position="absolute"
        right={-4}
        width={floatingEyeSize}>
        <Eye color={theme.colors.textPrimary} height={iconEyeSize} width={iconEyeSize} />
      </Flex>
    </Box>
  )
}
