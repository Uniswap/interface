import { Options, Placement } from '@popperjs/core'
import Portal from '@reach/portal'
import useInterval from 'lib/hooks/useInterval'
import React, { useCallback, useMemo, useState } from 'react'
import { usePopper } from 'react-popper'
import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'

const PopoverContainer = styled.div<{ show: boolean }>`
  z-index: ${Z_INDEX.popover};
  visibility: ${(props) => (props.show ? 'visible' : 'hidden')};
  opacity: ${(props) => (props.show ? 1 : 0)};
  transition: visibility 150ms linear, opacity 150ms linear;
  color: ${({ theme }) => theme.deprecated_text2};
`

const ReferenceElement = styled.div`
  display: inline-block;
`

const Arrow = styled.div`
  width: 8px;
  height: 8px;
  z-index: 9998;

  ::before {
    position: absolute;
    width: 8px;
    height: 8px;
    box-sizing: border-box;
    z-index: 9998;

    content: '';
    border: 1px solid ${({ theme }) => theme.deprecated_bg2};
    transform: rotate(45deg);
    background: ${({ theme }) => theme.deprecated_bg0};
  }

  &.arrow-top {
    bottom: -4px;
    ::before {
      border-top: none;
      border-left: none;
    }
  }

  &.arrow-bottom {
    top: -4px;
    ::before {
      border-bottom: none;
      border-right: none;
    }
  }

  &.arrow-left {
    right: -4px;

    ::before {
      border-bottom: none;
      border-left: none;
    }
  }

  &.arrow-right {
    left: -4px;
    ::before {
      border-right: none;
      border-top: none;
    }
  }
`

export interface PopoverProps {
  content: React.ReactNode
  show: boolean
  children: React.ReactNode
  placement?: Placement
}

export default function Popover({ content, show, children, placement = 'auto' }: PopoverProps) {
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null)
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null)

  const options = useMemo(
    (): Options => ({
      placement,
      strategy: 'fixed',
      modifiers: [
        { name: 'offset', options: { offset: [8, 8] } },
        { name: 'arrow', options: { element: arrowElement } },
        { name: 'preventOverflow', options: { padding: 8 } },
      ],
    }),
    [arrowElement, placement]
  )

  const { styles, update, attributes } = usePopper(referenceElement, popperElement, options)

  const updateCallback = useCallback(() => {
    update && update()
  }, [update])
  useInterval(updateCallback, show ? 100 : null)

  return (
    <>
      <ReferenceElement ref={setReferenceElement as any}>{children}</ReferenceElement>
      <Portal>
        <PopoverContainer show={show} ref={setPopperElement as any} style={styles.popper} {...attributes.popper}>
          {content}
          <Arrow
            className={`arrow-${attributes.popper?.['data-popper-placement'] ?? ''}`}
            ref={setArrowElement as any}
            style={styles.arrow}
            {...attributes.arrow}
          />
        </PopoverContainer>
      </Portal>
    </>
  )
}
