import { FunctionComponent, PropsWithChildren, useRef } from 'react'
import styled, { css } from 'styled-components'

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
  width: 200px;
  justify-content: center;
  align-items: center;
  position: relative;
  border: solid 1px gray;
  border-radius: 20px;
  text-align: left;
`

const MenuFlyout = styled.span<{ flyoutAlignment?: FlyoutAlignment }>`
  min-width: 196px;
  max-height: 350px;
  overflow: auto;
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid gray;
  border-radius: 20px;
  padding: 6px, 12px;
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

const MenuItem = styled.div`
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

const InternalMenuItem = styled.div`
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
    external: boolean
  }[]
  onNetworkTypeChange: (networkType: string) => void;
}

const ExternalMenuItem = styled(MenuItem)`
  width: max-content;
  text-decoration: none;
`

export const Menu = ({ modal, flyoutAlignment = FlyoutAlignment.RIGHT, ToggleUI, menuItems, onNetworkTypeChange, ...rest }: MenuProps) => {
  const node = useRef<HTMLDivElement>()
  const open = useModalIsOpen(modal)
  const toggle = useToggleModal(modal)
  useOnClickOutside(node, open ? toggle : undefined)
  const ToggleElement = ToggleUI || StyledMenuIcon

  const changeContent = (content: any) => {
    const value = content.props.children[1].props.children.props.i18nKey;
    onNetworkTypeChange(value);
  };


  return (
    <StyledMenu ref={node as any} {...rest}>
      <ToggleElement onClick={toggle} />
      {open && (
        <MenuFlyout flyoutAlignment={flyoutAlignment} onClick={toggle}>
          {menuItems.map(({ content, external }, i) =>
            external ? (
              <ExternalMenuItem key={i} onClick={() => changeContent(content)}>
                {content}
              </ExternalMenuItem>
            ) : (
              <InternalMenuItem key={i} onClick={() => changeContent(content)}>
                {content}
              </InternalMenuItem>
            )
          )}
        </MenuFlyout>
      )}
    </StyledMenu>
  )
}
