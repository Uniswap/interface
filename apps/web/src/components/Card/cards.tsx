import { PropsWithChildren } from 'react'
import { Flex, FlexProps } from 'ui/src'

export const Card = ({ children, ...rest }: PropsWithChildren<FlexProps>) => {
  return (
    <Flex width="100%" padding="1rem" borderRadius="$rounded12" {...rest}>
      {children}
    </Flex>
  )
}

export const DarkGrayCard = ({ children, ...rest }: PropsWithChildren<FlexProps>) => {
  return (
    <Card backgroundColor="$surface3" {...rest}>
      {children}
    </Card>
  )
}
