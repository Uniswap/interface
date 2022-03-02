import React from 'react'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useCallback, useRef, useState } from 'react'
import styled from 'styled-components/macro'
import { css } from 'styled-components'
import { darken } from 'polished'
import { usePopper } from 'react-popper'

import { MenuItem } from './index'

const StyledBridgeButton = styled.div<{ isActive?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
  padding: 8px 12px;

  ${({ isActive }) =>
    isActive &&
    css`
      border-radius: 12px;
      color: ${({ theme }) => theme.text1};
      background-color: ${({ theme }) => theme.bg3};
    `}

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const Menu = styled.div`
  min-width: 8.125rem;
  background-color: ${({ theme }) => theme.bg2};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
`

export function BridgeMenu() {
  const node = useRef<HTMLDivElement>()
  const [referenceElement, setReferenceElement] = useState(null)
  const [popperElement, setPopperElement] = useState(null)
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
    ],
  })
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen((open) => !open), [setOpen])
  useOnClickOutside(node, open ? toggle : undefined)

  return (
    <div ref={node as any}>
      <StyledBridgeButton onClick={toggle} isActive={open} ref={setReferenceElement as any}>
        Bridges
      </StyledBridgeButton>

      {open && (
        <Menu ref={setPopperElement as any} style={styles.popper} {...attributes.popper}>
          <MenuItem href="https://app.nomad.xyz/">
            <div>
              Nomad <span style={{ fontSize: '11px', textDecoration: 'none !important' }}>↗</span>
            </div>
          </MenuItem>
          <MenuItem href="https://diffusion.fi/">
            <div>
              Celer <span style={{ fontSize: '11px', textDecoration: 'none !important' }}>↗</span>
            </div>
          </MenuItem>
        </Menu>
      )}
    </div>
  )
}
