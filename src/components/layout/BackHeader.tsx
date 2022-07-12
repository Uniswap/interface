import React, { PropsWithChildren } from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box, Flex } from 'src/components/layout'
import { Theme } from 'src/styles/theme'

const BACK_BUTTON_SIZE = 24

type BackButtonRowProps = {
  alignment?: 'left' | 'center'
  mb?: keyof Theme['spacing']
}

export function BackHeader({
  alignment = 'center',
  mb = 'none',
  children,
}: PropsWithChildren<BackButtonRowProps>) {
  return (
    <Flex
      row
      alignItems="center"
      justifyContent={alignment === 'left' ? 'flex-start' : 'space-between'}
      mb={mb}>
      <BackButton size={BACK_BUTTON_SIZE} />
      {children}
      <Box width={BACK_BUTTON_SIZE} />
    </Flex>
  )
}
