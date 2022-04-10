import React from 'react'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useCallback, useRef, useState } from 'react'
import styled from 'styled-components/macro'
import { css } from 'styled-components'
import { darken } from 'polished'
import { usePopper } from 'react-popper'

import { NavLink, useLocation } from 'react-router-dom'
import { BridgeMenu } from './BridgeMenu'
import { useTranslation } from 'react-i18next'

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text3};
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
  padding: 8px 12px;

  &.${activeClassName} {
    border-radius: 0px;
    font-weight: 800;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const StyledBridgeButton = styled.div<{ isActive?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text3};
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
  padding: 8px 35px;
  background: ${({ theme }) =>
    `linear-gradient(90deg, ${theme.darkTransparent2} 0%, ${theme.secondary1_10} 50%, ${theme.darkTransparent2} 100%);`};
  border: 1px solid rgba(12, 92, 146, 0.7);
  box-shadow: 0 0 5px rgba(39, 210, 234, 0.2), 0 0 7px rgba(39, 210, 234, 0.2);
  ${({ isActive }) =>
    isActive &&
    css`
      border-radius: 8px;
      color: ${({ theme }) => theme.text3};
      background-color: ${({ theme }) => theme.primaryTransparent};
    `}

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const Menu = styled.div`
  min-width: 8.125rem;
  background: ${({ theme }) => `linear-gradient(90deg, ${theme.dark0} 0%, ${theme.dark2} 50%, ${theme.dark0} 100%);`};
  box-shadow: 0 0 5px rgba(39, 210, 234, 0.2), 0 0 7px rgba(39, 210, 234, 0.2);
  border: 1px solid rgba(12, 92, 146, 0.7);
  border-radius: 8px;
  backdrop-filter: blur(4px);
  z-index: 100;
`

export function MobileMenu() {
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
  const location = useLocation()
  const { t } = useTranslation()

  return (
    <div ref={node as any}>
      <StyledBridgeButton onClick={toggle} isActive={open} ref={setReferenceElement as any}>
        {location.pathname.startsWith('/swap') ? 'Swap' : location.pathname.startsWith('/pool') ? 'Pool' : 'Farm'}
      </StyledBridgeButton>

      {open && (
        <Menu ref={setPopperElement as any} style={styles.popper} {...attributes.popper}>
          <StyledNavLink id={`swap-nav-link`} to={'/swap'}>
            {t('swap')}
          </StyledNavLink>
          <StyledNavLink
            id={`pool-nav-link`}
            to={'/pool'}
            isActive={(match, { pathname }) =>
              Boolean(match) ||
              pathname.startsWith('/add') ||
              pathname.startsWith('/remove') ||
              pathname.startsWith('/increase') ||
              pathname.startsWith('/find')
            }
          >
            {t('pool')}
          </StyledNavLink>
          <StyledNavLink
            id={`farm-nav-link`}
            to={'/farm'}
            isActive={(match, { pathname }) => Boolean(match) || pathname.startsWith('/farm')}
          >
            {t('Farm')}
          </StyledNavLink>
          <BridgeMenu />
        </Menu>
      )}
    </div>
  )
}
