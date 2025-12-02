import { ComponentProps, PropsWithChildren } from 'react'
import { Flex } from 'ui/src'

const CONTAINER_WIDTH = 1200

export const ToucanContainer = ({ children, ...props }: PropsWithChildren<ComponentProps<typeof Flex>>) => {
  return (
    <Flex width={CONTAINER_WIDTH} maxWidth="100%" mx="auto" px="$spacing12" {...props}>
      {children}
    </Flex>
  )
}
