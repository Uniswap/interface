import React, { PropsWithChildren } from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { Flex } from 'src/components/layout'
import { FlexProps } from 'src/components/layout/Flex'

type BackButtonRowProps = {
  onPressBack?: () => void
} & FlexProps

export const BackButtonRow = ({
  children,
  onPressBack,
  ...props
}: PropsWithChildren<BackButtonRowProps>) => (
  <Flex alignItems="center" flexDirection="row" gap="sm" mb="xl" {...props}>
    <BackButton onPressBack={onPressBack} />
    {children}
  </Flex>
)
