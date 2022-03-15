import React, { ReactNode, RefObject, useRef } from 'react'
import { Placement } from '@popperjs/core'
import { useCloseModals } from '../../state/application/hooks'
import { StyledPopover, Row, View, Text, Image } from '../NetworkSwitcher/NetworkSwitcher.styles'
import { CloseIcon } from '../../theme'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'

import unsupportedNetworkHintImage1x from '../../assets/images/unsupported-network-hint.png'

interface UnsupportedNetworkPopoverProps {
  children?: ReactNode
  show: boolean
  placement?: Placement
  parentRef?: RefObject<HTMLElement>
}

export default function UnsupportedNetworkPopover({ children, show }: UnsupportedNetworkPopoverProps) {
  const closeModals = useCloseModals()
  const popoverRef = useRef(null)

  useOnClickOutside(popoverRef, show ? closeModals : undefined)

  return (
    <StyledPopover
      placement="bottom-end"
      show={show}
      content={
        <View ref={popoverRef}>
          <Row>
            <Text>Please use our network switcher and switch to a supported network.</Text>
            <CloseIcon onClick={closeModals} />
          </Row>
          <Image src={unsupportedNetworkHintImage1x} srcSet={unsupportedNetworkHintImage1x} alt="hint screenshot" />
        </View>
      }
    >
      {children}
    </StyledPopover>
  )
}
