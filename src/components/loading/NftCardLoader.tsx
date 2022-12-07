import React, { ComponentProps } from 'react'
import { useAppTheme } from 'src/app/hooks'
import { Box, Flex } from 'src/components/layout'

export function NftCardLoader({ ...props }: ComponentProps<typeof Box>) {
  const theme = useAppTheme()

  return (
    <Box flex={1} justifyContent="flex-start" m="xs" {...props}>
      <Box aspectRatio={1} backgroundColor="background3" borderRadius="md" width="100%" />
      {/* TODO(loader refactor): use the loading text component instead of boxes here. */}
      <Flex gap="none" py="xs">
        <Box height={theme.textVariants.bodyLarge.lineHeight}>
          <Box backgroundColor="background3" borderRadius="xs" height="80%" width="50%" />
        </Box>
        <Box height={theme.textVariants.bodySmall.lineHeight}>
          <Box backgroundColor="background3" borderRadius="xs" height="80%" width="80%" />
        </Box>
        <Box height={theme.textVariants.bodySmall.lineHeight}>
          <Box backgroundColor="background3" borderRadius="xs" height="80%" width="30%" />
        </Box>
      </Flex>
    </Box>
  )
}
