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
    <Box bg={success ? 'accentSuccessSoft' : 'accentCriticalSoft'} borderRadius="md" p="md">
      <Flex flexDirection="column" gap="md">
        {header}
        {children}
      </Flex>
    </Box>
  )
}
