import React, { PropsWithChildren, ReactNode } from 'react'
import { Box, Flex } from 'src/components/layout'

type ExampleComponentProps = PropsWithChildren<{
  header: ReactNode
  success: boolean
}>

export const ExampleComponent = ({
  children,
  header,
  success,
}: ExampleComponentProps): JSX.Element => {
  return (
    <Box
      bg={success ? 'accentSuccessSoft' : 'accentCriticalSoft'}
      borderRadius="rounded12"
      p="spacing16">
      <Flex flexDirection="column" gap="spacing16">
        {header}
        {children}
      </Flex>
    </Box>
  )
}
