import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { usePopper } from 'react-popper'
import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`
  from {
    opacity : 0;
  }

  to {
    opacity : 1;
  }
`
const PopoverContainer = styled.div`
  position: relative;
  z-index: 9999;
  animation: ${fadeIn} 0.15s linear;
`

const ReferenceElement = styled.div`
  display: inline-block;
`

export interface PopoverProps {
  content: React.ReactNode
  showPopup: boolean
  children: React.ReactNode
}

export default function Popover({ content, showPopup, children }: PopoverProps) {
  const [referenceElement, setReferenceElement] = useState(null)
  const [popperElement, setPopperElement] = useState(null)
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'auto',
    strategy: 'fixed',
    modifiers: [{ name: 'offset', options: { offset: [6, 6] } }]
  })

  const portal = createPortal(
    showPopup && (
      <PopoverContainer ref={setPopperElement} style={styles.popper} {...attributes.popper}>
        {content}
      </PopoverContainer>
    ),
    document.getElementById('popover-container')
  )

  return (
    <>
      <ReferenceElement ref={setReferenceElement}>{children}</ReferenceElement>
      {portal}
    </>
  )
}
