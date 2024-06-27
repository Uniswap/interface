import { FunctionComponent, PropsWithChildren, useRef } from 'react'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { ExternalLink } from 'theme/components'

import { ReactComponent as MenuIcon } from '../../assets/images/menu.svg'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import { useModalIsOpen, useToggleModal } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'

export enum FlyoutAlignment {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const StyledMenuIcon = styled(MenuIcon)`
  path {
    stroke: ${({ theme }) => theme.neutral1};
  }
`

const StyledMenu = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

const MenuFlyout = styled.span<{ flyoutAlignment?: FlyoutAlignment }>`
  min-width: 196px;
  max-height: 350px;
  overflow: auto;
  background-color: ${({ theme }) => theme.surface1};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 12px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  position: absolute;
  top: 3rem;
  z-index: 100;

  ${({ flyoutAlignment = FlyoutAlignment.RIGHT }) =>
    flyoutAlignment === FlyoutAlignment.RIGHT
      ? css`
          right: 0rem;
        `
      : css`
          left: 0rem;
        `};
`

const MenuItem = styled(ExternalLink)`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  padding: 0.5rem 0.5rem;
  justify-content: space-between;
  color: ${({ theme }) => theme.neutral2};
  :hover {
    color: ${({ theme }) => theme.neutral1};
    cursor: pointer;
    text-decoration: none;
  }
`

const InternalMenuItem = styled(Link)`
  flex: 1;
  padding: 0.5rem 0.5rem;
  color: ${({ theme }) => theme.neutral2};
  width: max-content;
  text-decoration: none;
  :hover {
    color: ${({ theme }) => theme.neutral1};
    cursor: pointer;
    text-decoration: none;
  }
  > svg {
    margin-right: 8px;
  }
`

interface MenuProps {
  modal: ApplicationModal
  flyoutAlignment?: FlyoutAlignment
  ToggleUI?: FunctionComponent<PropsWithChildren<unknown>>
  menuItems: {
    content: any
    link: string
    external: boolean
  }[]
}

const ExternalMenuItem = styled(MenuItem)`
  width: max-content;
  text-decoration: none;
`

export const Menu = ({ modal, flyoutAlignment = FlyoutAlignment.RIGHT, ToggleUI, menuItems, ...rest }: MenuProps) => {
  const node = useRef<HTMLDivElement>()
  const open = useModalIsOpen(modal)
  const toggle = useToggleModal(modal)
  useOnClickOutside(node, open ? toggle : undefined)
  const ToggleElement = ToggleUI || StyledMenuIcon

  return (
    <StyledMenu ref={node as any} {...rest}>
      <ToggleElement onClick={toggle} />
      {open && (
        <MenuFlyout flyoutAlignment={flyoutAlignment} onClick={toggle}>
          {menuItems.map(({ content, link, external }, i) =>
            external ? (
              <ExternalMenuItem href={link} key={i}>
                {content}
              </ExternalMenuItem>
            ) : (
              <InternalMenuItem to={link} key={i}>
                {content}
              </InternalMenuItem>
            )
          )}
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
