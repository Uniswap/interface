import { darken } from 'polished'
import React, { useRef } from 'react'
import styled from 'styled-components'

import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleModal } from '../../state/application/hooks'
import { ExternalLink } from '../../theme'

const StyledNavMenu = styled('div')`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }

  @media (max-width: 320px) {
    margin: 0 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `}
`

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
`

const MenuFlyout = styled.span`
  min-width: 8.125rem;
  background-color: ${({ theme }) => theme.bg3};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 12px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 3rem;
  right: 0rem;
  z-index: 100;
`

const MenuItem = styled(ExternalLink)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.text2};
  :hover {
    color: ${({ theme }) => theme.text1};
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
  }
`

export default function BridgeMenuGroup() {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.BRIDGE)
  const toggle = useToggleModal(ApplicationModal.BRIDGE)
  useOnClickOutside(node, open ? toggle : undefined)

  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <StyledNavMenu onClick={toggle}>Bridge</StyledNavMenu>

      {open && (
        <MenuFlyout>
          <MenuItem id="link" href="https://allbridge.io/">
            Allbridge
          </MenuItem>
          <MenuItem id="link" href="https://anyswap.exchange/#/router">
            Anyswap
          </MenuItem>
          <MenuItem id="link" href="https://optics.app/">
            Optics
          </MenuItem>
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
