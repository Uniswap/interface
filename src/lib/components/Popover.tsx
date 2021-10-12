import { Options, Placement } from '@popperjs/core'
import maxSize from 'popper-max-size-modifier'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePopper } from 'react-popper'

import useInterval from '../../hooks/useInterval'
import themed, { Layer } from '../themed'

const BoundaryContext = createContext<HTMLDivElement | null>(null)

export const BoundaryProvider = BoundaryContext.Provider

const PopoverContainer = themed.div<{ show: boolean }>`
  background-color: ${({ theme }) => theme.black};
  border: 1px solid ${({ theme }) => theme.icon};
  border-radius: 8px;
  opacity: ${(props) => (props.show ? 1 : 0)};
  padding: 8px;
  transition: visibility 150ms linear, opacity 150ms linear;
  visibility: ${(props) => (props.show ? 'visible' : 'hidden')};
  z-index: ${Layer.POPOVER};
`

const ReferenceElement = themed.div`
  display: inline-block;
`

const Arrow = themed.div`
  width: 8px;
  height: 8px;
  z-index: ${Layer.POPOVER};

  ::before {
    position: absolute;
    width: 8px;
    height: 8px;

    content: '';
    border: 1px solid ${({ theme }) => theme.icon};
    transform: rotate(45deg);
    background: ${({ theme }) => theme.black};
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
  show: boolean
  children: React.ReactNode
  placement?: Placement
}

export default function Popover({ content, show, children, placement = 'auto' }: PopoverProps) {
  const boundary = useContext(BoundaryContext)
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null)
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null)

  const options = useMemo(
    (): Options => ({
      placement,
      strategy: 'absolute',
      modifiers: [
        { name: 'offset', options: { offset: [5, 5] } },
        { name: 'arrow', options: { element: arrowElement, padding: 6 } },
        { name: 'preventOverflow', options: { boundary } },
        { ...maxSize, options: { boundary, padding: 22 } },
        {
          name: 'applyMaxSize',
          enabled: true,
          phase: 'beforeWrite',
          requires: ['maxSize'],
          fn({ state }) {
            const { width } = state.modifiersData.maxSize
            state.styles.popper = {
              ...state.styles.popper,
              maxWidth: `${width}px`,
            }
          },
        },
      ],
    }),
    [arrowElement, boundary, placement]
  )

  const { styles, update, attributes } = usePopper(referenceElement, popperElement, options)

  const updateCallback = useCallback(() => {
    update && update()
  }, [update])
  useInterval(updateCallback, show ? 100 : null)

  return (
    <>
      <ReferenceElement ref={setReferenceElement as any}>{children}</ReferenceElement>
      {boundary &&
        createPortal(
          <PopoverContainer show={show} ref={setPopperElement as any} style={styles.popper} {...attributes.popper}>
            {content}
            <Arrow
              className={`arrow-${attributes.popper?.['data-popper-placement'] ?? ''}`}
              ref={setArrowElement as any}
              style={styles.arrow}
              {...attributes.arrow}
            />
          </PopoverContainer>,
          boundary
        )}
    </>
  )
}
