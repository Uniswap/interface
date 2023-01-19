import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React, { PropsWithChildren, ReactElement } from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box, Flex } from 'src/components/layout'
import { Theme } from 'src/styles/theme'

const BACK_BUTTON_SIZE = 24

type BackButtonRowProps = {
  alignment?: 'left' | 'center'
  endAdornment?: JSX.Element
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function BackHeader({
  alignment = 'center',
  children,
  endAdornment = <Box width={BACK_BUTTON_SIZE} />,
  ...spacingProps
}: PropsWithChildren<BackButtonRowProps>): ReactElement {
  return (
    <Flex
      row
      alignItems="center"
      justifyContent={alignment === 'left' ? 'flex-start' : 'space-between'}
      {...spacingProps}>
      <BackButton size={BACK_BUTTON_SIZE} />
      {children}
      {endAdornment}
    </Flex>
  )
}
