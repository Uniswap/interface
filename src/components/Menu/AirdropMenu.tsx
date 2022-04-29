import React from 'react'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useCallback, useRef, useState } from 'react'
import styled from 'styled-components/macro'
import { css } from 'styled-components'
import { darken } from 'polished'
import { usePopper } from 'react-popper'
import { AirdropButton } from './AirdropButton'

const StyledAirdropButton = styled.div<{ isActive?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text3};
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
  padding: 8px 12px;

  ${({ isActive }) =>
    isActive &&
    css`
      border-radius: 8px;
      color: ${({ theme }) => theme.text3};
      background-color: ${({ theme }) => theme.bg3};
    `}

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const Menu = styled.div`
  background: transparent;
  box-shadow: 0 0 5px rgba(39, 210, 234, 0.2), 0 0 7px rgba(39, 210, 234, 0.2);
  border: 1px solid rgba(12, 92, 146, 0.7);
  border-radius: 8px;
  backdrop-filter: blur(4px) brightness(50%) saturate(150%);
  height: auto;
  padding: 10px 10px 0px 10px;
`

export function AirdropMenu() {
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
      <StyledAirdropButton onClick={toggle} isActive={open} ref={setReferenceElement as any}>
        Claim Diffusion Airdrop
      </StyledAirdropButton>

      {open && (
        <Menu ref={setPopperElement as any} style={styles.popper} {...attributes.popper}>
          <AirdropButton />
        </Menu>
      )}
    </div>
  )
}
