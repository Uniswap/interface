import { ComponentProps, PropsWithChildren } from 'react'
import { Flex } from 'ui/src'

const CONTAINER_MAX_WIDTH = 1200

export const ToucanContainer = ({ children, ...props }: PropsWithChildren<ComponentProps<typeof Flex>>) => {
  return (
    <Flex maxWidth={CONTAINER_MAX_WIDTH} width="100%" mx="auto" px="$spacing24" {...props}>
      {children}
    </Flex>
  )
}
