import React, { useRef } from 'react'
import {
  BookOpen,
  Code,
  Info,
  MessageCircle,
  // PieChart
} from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { ReactComponent as MenuIcon } from '../../assets/images/menu.svg'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { ApplicationModal } from '../../state/application/actions'
import { useModalOpen, useToggleModal } from '../../state/application/hooks'

import { ExternalLink } from '../../theme'
import { AirdropButton } from './AirdropButton'

export enum FlyoutAlignment {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.text1};
  }
`

export const StyledMenuButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: rgba(39, 210, 234, 0.05);
  box-shadow: 0 0 5px rgba(39, 210, 234, 0.1), 0 0 7px rgba(39, 210, 234, 0.1);
  border: 1px solid rgba(12, 92, 146, 0.7);

  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.darkTransparent};
    border: 1px solid rgba(39, 210, 234, 0.5);
  }

  svg {
    margin-top: 2px;
  }
`

export const StyledMenu = styled.div`
  backdrop-filter: blur(4px) brightness(50%) saturate(150%);
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

export const MenuFlyout = styled.span<{ flyoutAlignment?: FlyoutAlignment }>`
  backdrop-filter: blur(4px) brightness(50%) saturate(150%);
  min-width: 12.125rem;
  background-color: ${({ theme }) =>
    `linear-gradient(90deg, ${theme.dark0} 0%, ${theme.dark2} 50%, ${theme.dark0} 100%);`};
  box-shadow: 0 0 5px rgba(39, 210, 234, 0.1), 0 0 7px rgba(39, 210, 234, 0.1);
  border: 1px solid rgba(12, 92, 146, 0.7);
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  position: absolute;
  top: 3rem;
  z-index: 101;
  ${({ flyoutAlignment = FlyoutAlignment.RIGHT }) =>
    flyoutAlignment === FlyoutAlignment.RIGHT
      ? css`
          right: 0rem;
        `
      : css`
          left: 0rem;
        `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    top: -17.25rem;
    background-color: black;
  `};
`

export const MenuItem = styled(ExternalLink)`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
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

const InternalMenuItem = styled(Link)`
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

const CODE_LINK = 'https://github.com/diffusion-fi/interface'

export default function Menu() {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.MENU)
  const toggle = useToggleModal(ApplicationModal.MENU)
  useOnClickOutside(node, open ? toggle : undefined)

  return (
    // https://github.com/DefinitelyTyped/DefinitelyTyped/issues/30451
    <StyledMenu ref={node as any}>
      <StyledMenuButton onClick={toggle}>
        <StyledMenuIcon />
      </StyledMenuButton>

      {open && (
        <MenuFlyout>
          <AirdropButton />
          <MenuItem href="https://diffusion.fi/">
            <Info size={14} />
            <div>About</div>
          </MenuItem>
          <MenuItem href="https://diffusion.gitbook.io/untitled/GXx8KsOHCFNEcZgOpj0b/">
            <BookOpen size={14} />
            <div>Docs</div>
          </MenuItem>
          <MenuItem href={CODE_LINK}>
            <Code size={14} />
            <div>Code</div>
          </MenuItem>
          <MenuItem href="https://discord.gg/2Df4XDkcFC ">
            <MessageCircle size={14} />
            <div>Discord</div>
          </MenuItem>
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}

interface NewMenuProps {
  flyoutAlignment?: FlyoutAlignment
  ToggleUI?: React.FunctionComponent
  toggleElementProps?: Record<string, any>
  menuItems: {
    content: any
    link: string
    external: boolean
  }[]
}

const NewMenuFlyout = styled(MenuFlyout)`
  top: 3rem !important;
`
const NewMenuItem = styled(InternalMenuItem)`
  width: max-content;
  text-decoration: none;
`

const ExternalMenuItem = styled(MenuItem)`
  width: max-content;
  text-decoration: none;
`

export const NewMenu = ({
  flyoutAlignment = FlyoutAlignment.RIGHT,
  ToggleUI,
  menuItems,

  toggleElementProps,
  ...rest
}: NewMenuProps) => {
  const node = useRef<HTMLDivElement>()
  const open = useModalOpen(ApplicationModal.POOL_OVERVIEW_OPTIONS)
  const toggle = useToggleModal(ApplicationModal.POOL_OVERVIEW_OPTIONS)
  useOnClickOutside(node, open ? toggle : undefined)
  const ToggleElement = ToggleUI || StyledMenuIcon
  return (
    <StyledMenu ref={node as any} {...rest}>
      <ToggleElement onClick={toggle} {...toggleElementProps} />
      {open && (
        <NewMenuFlyout flyoutAlignment={flyoutAlignment}>
          {menuItems.map(({ content, link, external }, i) =>
            external ? (
              <ExternalMenuItem id="link" href={link} key={link + i}>
                {content}
              </ExternalMenuItem>
            ) : (
              <NewMenuItem id="link" to={link} key={link + i}>
                {content}
              </NewMenuItem>
            )
          )}
        </NewMenuFlyout>
      )}
    </StyledMenu>
  )
}
