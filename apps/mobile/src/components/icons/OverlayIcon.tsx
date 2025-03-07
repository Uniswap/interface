import React, { ReactNode } from 'react'
import { Flex, FlexProps } from 'ui/src'

type Props = {
  icon: ReactNode
  overlay: ReactNode
} & Pick<FlexProps, 'top' | 'bottom' | 'left' | 'right'>

// For overlaying icons in JSX
export default function OverlayIcon({ icon, overlay, ...props }: Props): JSX.Element {
  return (
    <>
      {icon}
      <Flex position="absolute" {...props}>
        {overlay}
      </Flex>
    </>
  )
}
