import { Placement } from '@popperjs/core'
import { transparentize } from 'polished'
import React, { MutableRefObject, useCallback, useState } from 'react'
import { usePopper } from 'react-popper'
import styled, { CSSProperties } from 'styled-components'
import useInterval from '../../hooks/useInterval'
import Portal from '@reach/portal'
import border8pxRadius from '../../assets/images/border-8px-radius.png'

const PopoverContainer = styled.div<{ show: boolean, padding?: string }>`
  z-index: 9999;

  visibility: ${props => (props.show ? 'visible' : 'hidden')};
  opacity: ${props => (props.show ? 1 : 0)};
  transition: visibility 150ms linear, opacity 150ms linear;

  padding: ${ props => (props.padding ? props.padding : "8px")};
  backdrop-filter: blur(16px);
  background-color: ${({ theme }) => theme.bg1And2};
  border: 8px solid;
  border-radius: 8px;
  border-image: url(${border8pxRadius}) 8;
  box-shadow: 0px 0px 8px ${({ theme }) => transparentize(0.84, theme.black)};
  color: ${({ theme }) => theme.purple3};
  font-size: 12px;
`

export interface PopoverProps {
  content: React.ReactNode
  show: boolean
  children: React.ReactNode
  placement?: Placement
  innerRef?: MutableRefObject<HTMLDivElement | null>
  className?: string
  offsetX?: number
  offsetY?: number
  styled?: CSSProperties
  padding?: string
}

export default function Popover({
  content,
  show,
  innerRef,
  children,
  placement = 'auto',
  className,
  offsetY = 8,
  offsetX = 0,
  styled,
  padding
}: PopoverProps) {
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null)
  const { styles, update, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    strategy: 'fixed',
    modifiers: [{ name: 'offset', options: { offset: [offsetX, offsetY] } }]
  })
  const updateCallback = useCallback(() => {
    update && update()
  }, [update])
  useInterval(updateCallback, show ? 100 : null)

  return (
    <>
      <div ref={setReferenceElement as any}>{children}</div>
      <Portal>
        <div ref={innerRef}>
          <PopoverContainer
            className={className}
            show={show}
            padding={padding}
            ref={setPopperElement as any}
            style={{ ...styles.popper, ...styled }}
            {...attributes.popper}
          >
            {content}
          </PopoverContainer>
        </div>
      </Portal>
    </>
  )
}
