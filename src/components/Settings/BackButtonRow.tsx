import React, { PropsWithChildren } from 'react'
import { BackButton } from 'src/components/buttons/BackButton'
import { Flex } from 'src/components/layout'

export const SettingsBackButtonRow = ({ children, ...props }: PropsWithChildren<any>) => (
  <Flex alignItems="center" flexDirection="row" gap="lg" mb="xl" {...props}>
    <BackButton size={14} />
    {children}
  </Flex>
)
