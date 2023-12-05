import React, { PropsWithChildren } from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { Flex, FlexProps } from 'ui/src'

const BACK_BUTTON_SIZE = 24

type BackButtonRowProps = {
  alignment?: 'left' | 'center'
  endAdornment?: JSX.Element
  onPressBack?: () => void
} & FlexProps

export function BackHeader({
  alignment = 'center',
  children,
  endAdornment = <Flex width={BACK_BUTTON_SIZE} />,
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
