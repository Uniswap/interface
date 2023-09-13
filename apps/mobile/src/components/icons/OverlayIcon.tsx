import React, { ReactNode } from 'react'
import { Flex, StackProps } from 'ui/src'

type Props = {
  icon: ReactNode
  overlay: ReactNode
} & Pick<StackProps, 'top' | 'bottom' | 'left' | 'right'>

// For overlaying icons in JSX
export default function OverlayIcon({ icon, overlay, ...props }: Props): JSX.Element {
  return (
    <>
      {icon}
      <Flex gap="$none" position="absolute" {...props}>
        {overlay}
      </Flex>
    </>
  )
}
