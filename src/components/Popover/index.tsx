import { transparentize } from 'polished'
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { usePopper } from 'react-popper'
import styled, { keyframes } from 'styled-components'
import useInterval from '../../hooks/useInterval'

const fadeIn = keyframes`
  from {
    opacity : 0;
  }

  to {
    opacity : 1;
  }
`

const fadeOut = keyframes`
  from {
    opacity : 1;
  }

  to {
    opacity : 0;
  }
`

const PopoverContainer = styled.div<{ show: boolean }>`
  position: relative;
  z-index: 9999;

  visibility: ${props => (!props.show ? 'hidden' : 'visible')};
  animation: ${props => (!props.show ? fadeOut : fadeIn)} 150ms linear;
  transition: visibility 150ms linear;

  background: ${({ theme }) => theme.bg2};
  border: 1px solid ${({ theme }) => theme.bg3};
  box-shadow: 0 4px 8px 0 ${({ theme }) => transparentize(0.9, theme.shadow1)};
  color: ${({ theme }) => theme.text2};
  border-radius: 8px;
`

const ReferenceElement = styled.div`
  display: inline-block;
`

const Arrow = styled.div`
  position: absolute;
  width: 8px;
  height: 8px;
  z-index: 9998;

  ::before {
    position: absolute;
    width: 8px;
    height: 8px;
    z-index: 9998;

    content: '';
    border: 1px solid ${({ theme }) => theme.bg3};
    transform: rotate(45deg);
    background: ${({ theme }) => theme.bg2};
  }

  &.arrow-top {
    bottom: -5px;
    ::before {
      border-top: none;
      border-left: none;
    }
  }

  &.arrow-bottom {
    top: -5px;
    ::before {
      border-bottom: none;
      border-right: none;
    }
  }

  &.arrow-left {
    right: -5px;

    ::before {
      border-bottom: none;
      border-left: none;
    }
  }

  &.arrow-right {
    left: -5px;
    ::before {
      border-right: none;
      border-top: none;
    }
  }
`

export interface PopoverProps {
  content: React.ReactNode
  showPopup: boolean
  children: React.ReactNode
}

export default function Popover({ content, showPopup, children }: PopoverProps) {
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement>(null)
  const [arrowElement, setArrowElement] = useState<HTMLDivElement>(null)
  const { styles, update, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'auto',
    strategy: 'fixed',
    modifiers: [
      { name: 'offset', options: { offset: [8, 8] } },
      { name: 'arrow', options: { element: arrowElement } }
    ]
  })

  const portal = createPortal(
    <PopoverContainer show={showPopup} ref={setPopperElement} style={styles.popper} {...attributes.popper}>
      {content}
      <Arrow
        className={`arrow-${attributes.popper?.['data-popper-placement'] ?? ''}`}
        ref={setArrowElement}
        style={styles.arrow}
        {...attributes.arrow}
      />
    </PopoverContainer>,
    document.getElementById('popover-container')
  )

  useInterval(update, showPopup ? 100 : null)

  return (
    <>
      <ReferenceElement ref={setReferenceElement}>{children}</ReferenceElement>
      {portal}
    </>
  )
}
