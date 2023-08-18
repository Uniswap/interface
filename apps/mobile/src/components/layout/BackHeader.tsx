import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React, { PropsWithChildren } from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box, Flex } from 'src/components/layout'
import { Theme } from 'ui/src/theme/restyle'

const BACK_BUTTON_SIZE = 24

type BackButtonRowProps = {
  alignment?: 'left' | 'center'
  endAdornment?: JSX.Element
  onPressBack?: () => void
} & SpacingProps<Theme> &
  SpacingShorthandProps<Theme>

export function BackHeader({
  alignment = 'center',
  children,
  endAdornment = <Box width={BACK_BUTTON_SIZE} />,
  onPressBack,
  ...spacingProps
}: PropsWithChildren<BackButtonRowProps>): JSX.Element {
  return (
    <Flex
      row
      alignItems="center"
      justifyContent={alignment === 'left' ? 'flex-start' : 'space-between'}
      sentry-label="BackHeader"
      {...spacingProps}>
      <BackButton size={BACK_BUTTON_SIZE} onPressBack={onPressBack} />
      {children}
      {endAdornment}
    </Flex>
  )
}
