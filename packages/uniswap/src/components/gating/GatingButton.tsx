import React from 'react'
import { Button, Flex } from 'ui/src'

type ButtonProps = React.ComponentProps<typeof Button>
export const GatingButton = (props: Omit<ButtonProps, 'size' | 'emphasis'>): JSX.Element => {
  return (
    <Flex row>
      <Button size="small" emphasis="secondary" {...props} />
    </Flex>
  )
}
