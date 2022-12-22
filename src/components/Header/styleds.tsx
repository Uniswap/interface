import { darken } from 'polished'
import { CSSProperties, forwardRef } from 'react'
import { NavLink as BaseNavLink, NavLinkProps } from 'react-router-dom'
import styled from 'styled-components'

import { ExternalLink } from 'theme/components'

const activeClassName = 'ACTIVE'

interface Props extends NavLinkProps {
  activeClassName?: string
  activeStyle?: CSSProperties
}
// fix warning of activeClassName: https://reactrouter.com/en/6.4.5/upgrading/v5#remove-activeclassname-and-activestyle-props-from-navlink-
const NavLink = forwardRef(({ activeClassName, activeStyle, ...props }: Props, ref: any) => {
  return (
    <BaseNavLink
      ref={ref}
      {...props}
      className={({ isActive }) => [props.className, isActive ? activeClassName : null].filter(Boolean).join(' ')}
      style={({ isActive }) => ({
        ...props.style,
        ...(isActive ? activeStyle : null),
      })}
    />
  )
})

NavLink.displayName = 'NavLink'

export const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  padding: 8px 12px;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.subText};
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.primary};
  }

  :hover {
    color: ${({ theme }) => darken(0.1, theme.primary)};
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 8px 6px;
  `}
`

export const StyledNavExternalLink = styled(ExternalLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.subText};
  font-size: 1rem;
  width: fit-content;
  padding: 8px 12px;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.subText};
  }

  :hover {
    color: ${({ theme }) => darken(0.1, theme.primary)};
    text-decoration: none;
  }

  :focus {
    color: ${({ theme }) => theme.subText};
    text-decoration: none;
  }

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
      display: none;
  `}
`

export const DropdownTextAnchor = styled.div`
  display: inline-block;
  width: fit-content;
  padding: 8px 6px;
  padding-right: 0px;

  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
`
