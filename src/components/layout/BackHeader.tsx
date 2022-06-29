import React, { PropsWithChildren } from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box, Flex } from 'src/components/layout'

const BACK_BUTTON_SIZE = 18

export function BackHeader({ children }: PropsWithChildren<{}>) {
  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <BackButton size={BACK_BUTTON_SIZE} />
      {children}
      <Box width={BACK_BUTTON_SIZE} />
    </Flex>
  )
}
